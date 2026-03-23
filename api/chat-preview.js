const crypto = require('crypto');

const SECRET = process.env.PREVIEW_STATE_SECRET || 'dev-only-change-me';
const COOKIE_NAME = 'preview_state';
const SESSION_COOKIE = 'preview_session_id';
const MAX_AGENT_TURNS = 3;

const agentData = {
  lemon: {
    prompts: {
      'What are the latest pricing signals?': {
        thinking: 'Analyzing pricing signals and near-term market positioning...',
        answer: 'Early signal: pricing remains firm, with tighter availability shaping near-term negotiations and keeping buyers cautious.'
      },
      'Which competitors are most active right now?': {
        thinking: 'Reviewing competitor mentions, activity, and recent market movement...',
        answer: 'The most active competitors are the ones pushing visibility around supply consistency and pricing discipline, which suggests a more defensive competitive posture than outright expansion.'
      },
      'Summarize recent market movements.': {
        thinking: 'Condensing recent market movement into an executive snapshot...',
        answer: 'Recent movement suggests a market driven by cautious buyers, tighter supply signals, and selective competitive pressure rather than broad price weakness.'
      }
    }
  },
  miner: {
    prompts: {
      'What matters most for the executive report this week?': {
        thinking: 'Prioritizing the highest-signal items for executive reporting...',
        answer: 'This week the executive report should prioritize risk exposure, relevant market movement, and any operational developments that materially affect planning or profitability.'
      },
      'Summarize the latest market changes.': {
        thinking: 'Reviewing current market changes across mining indicators...',
        answer: 'The latest changes point to a mix of cautious market sentiment, selective movement in key inputs, and a stronger need for concise reporting rather than raw information overload.'
      },
      'Which operational signals deserve attention?': {
        thinking: 'Filtering operational indicators for executive-level relevance...',
        answer: 'The most important operational signals are the ones tied to execution risk, cost pressure, and changes that could alter reporting priorities over the next cycle.'
      }
    }
  },
  gds: {
    prompts: {
      'What matters most in commercial execution right now?': {
        thinking: 'Reviewing execution priorities and field-to-management signal gaps...',
        answer: 'What matters most is tightening the loop between field execution, reporting visibility, and follow-up actions so teams can react faster to what is actually happening in stores.'
      },
      'Summarize current workflow bottlenecks.': {
        thinking: 'Identifying workflow bottlenecks across reporting and execution layers...',
        answer: 'The main bottlenecks usually appear where reporting is delayed, execution data is fragmented, or accountability between teams is not clearly translated into action.'
      },
      'What should leadership focus on next?': {
        thinking: 'Translating current execution signals into leadership priorities...',
        answer: 'Leadership should focus next on improving visibility, shortening decision cycles, and making sure execution insights become operational changes instead of static reporting.'
      }
    }
  }
};

function parseCookies(header = '') {
  return Object.fromEntries(
    header.split(';').map(part => part.trim()).filter(Boolean).map(part => {
      const idx = part.indexOf('=');
      return [part.slice(0, idx), decodeURIComponent(part.slice(idx + 1))];
    })
  );
}

function sign(value) {
  return crypto.createHmac('sha256', SECRET).update(value).digest('hex');
}

function encodeState(state) {
  const raw = Buffer.from(JSON.stringify(state)).toString('base64url');
  return `${raw}.${sign(raw)}`;
}

function decodeState(cookieValue) {
  if (!cookieValue || !cookieValue.includes('.')) return { usage: { lemon: 0, miner: 0, gds: 0 } };
  const [raw, sig] = cookieValue.split('.');
  if (sign(raw) !== sig) return { usage: { lemon: 0, miner: 0, gds: 0 } };
  try {
    return JSON.parse(Buffer.from(raw, 'base64url').toString('utf8'));
  } catch {
    return { usage: { lemon: 0, miner: 0, gds: 0 } };
  }
}

function createSessionId() {
  return crypto.randomUUID();
}

module.exports = async (req, res) => {
  const cookies = parseCookies(req.headers.cookie);
  const sessionId = cookies[SESSION_COOKIE] || createSessionId();
  const state = decodeState(cookies[COOKIE_NAME]);
  const usage = { lemon: 0, miner: 0, gds: 0, ...(state.usage || {}) };

  if (req.method === 'GET') {
    res.setHeader('Set-Cookie', [
      `${SESSION_COOKIE}=${sessionId}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=2592000`,
      `${COOKIE_NAME}=${encodeURIComponent(encodeState({ usage }))}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=2592000`
    ]);
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ ok: true, usage, limit: MAX_AGENT_TURNS }));
    return;
  }

  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ ok: false, error: 'method_not_allowed' }));
    return;
  }

  const { agent, prompt } = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});

  if (!agentData[agent] || !agentData[agent].prompts[prompt]) {
    res.statusCode = 400;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ ok: false, error: 'invalid_agent_or_prompt' }));
    return;
  }

  if (usage[agent] >= MAX_AGENT_TURNS) {
    res.setHeader('Set-Cookie', [
      `${SESSION_COOKIE}=${sessionId}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=2592000`,
      `${COOKIE_NAME}=${encodeURIComponent(encodeState({ usage }))}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=2592000`
    ]);
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({
      ok: false,
      blocked: true,
      reason: 'limit_reached',
      usage: { count: usage[agent], limit: MAX_AGENT_TURNS, remaining: 0 }
    }));
    return;
  }

  usage[agent] += 1;
  const responseData = agentData[agent].prompts[prompt];

  res.setHeader('Set-Cookie', [
    `${SESSION_COOKIE}=${sessionId}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=2592000`,
    `${COOKIE_NAME}=${encodeURIComponent(encodeState({ usage }))}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=2592000`
  ]);
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify({
    ok: true,
    agent,
    thinking: responseData.thinking,
    answer: responseData.answer,
    usage: {
      count: usage[agent],
      limit: MAX_AGENT_TURNS,
      remaining: Math.max(0, MAX_AGENT_TURNS - usage[agent])
    }
  }));
};
