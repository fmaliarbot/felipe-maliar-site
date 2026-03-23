document.documentElement.classList.add('js');

const reveals = document.querySelectorAll('.reveal');

if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12 }
  );

  reveals.forEach((element) => observer.observe(element));
} else {
  reveals.forEach((element) => element.classList.add('is-visible'));
}

const agentData = {
  lemon: {
    name: 'Lemon Intel',
    option: 'Lemon Intel — Market intelligence',
    scope: 'Focus: lemon derivatives, pricing signals, competitor moves, and market context.',
    useCase: 'PRICES / COMPETITORS / MARKET SHIFTS',
    description:
      'A lightweight interface to interact with project-specific agents, ask questions, and inspect the logic behind the work. This preview is designed for insights around the citrus market, not actions.',
    prompts: [
      'What are the latest pricing signals?',
      'Which competitors are most active right now?',
      'Summarize recent market movements.'
    ],
    responses: {
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
    name: 'Miner Intel',
    option: 'Miner Intel — Mining reporting',
    scope: 'Focus: mining markets, executive reporting, operational signals, and competitor monitoring.',
    useCase: 'REPORTING / SIGNALS / MARKET CHANGES',
    description:
      'A lightweight interface to interact with project-specific agents, ask questions, and inspect the logic behind the work. This preview is designed for mining market insights, not actions.',
    prompts: [
      'What matters most for the executive report this week?',
      'Summarize the latest market changes.',
      'Which operational signals deserve attention?'
    ],
    responses: {
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
    name: 'GDS Net Agent',
    option: 'GDS Net Agent — Commercial execution',
    scope: 'Focus: commercial execution, retail intelligence, workflow bottlenecks, and operational improvement.',
    useCase: 'EXECUTION / WORKFLOWS / RETAIL INTELLIGENCE',
    description:
      'A lightweight interface to interact with project-specific agents, ask questions, and inspect the logic behind the work. This preview is designed for workflow and execution insights, not actions.',
    prompts: [
      'What matters most in commercial execution right now?',
      'Summarize current workflow bottlenecks.',
      'What should leadership focus on next?'
    ],
    responses: {
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
  },
};

const agentSelect = document.getElementById('agent-select');
const agentScope = document.getElementById('agent-scope');
const agentUseCase = document.getElementById('agent-use-case');
const agentDescription = document.getElementById('agent-description');
const chatPrompt = document.getElementById('chat-prompt');
const starterPrompts = document.getElementById('starter-prompts');
const conversation = document.getElementById('conversation');
const metaAgent = document.getElementById('meta-agent');
const metaStatus = document.getElementById('meta-status');
const sendButton = document.getElementById('chat-send');

let currentAgent = 'lemon';
let selectedPrompt = '';
let conversationTurn = 0;
const agentUsage = {
  lemon: 0,
  miner: 0,
  gds: 0,
};
const MAX_AGENT_TURNS = 3;

function isAgentLimited(agentKey) {
  return agentUsage[agentKey] >= MAX_AGENT_TURNS;
}

function setSelectedPrompt(promptText = '') {
  selectedPrompt = promptText;

  if (isAgentLimited(currentAgent)) {
    chatPrompt.textContent = 'Preview limit reached for this agent. Select another agent to continue.';
    chatPrompt.classList.add('is-empty');
    metaStatus.textContent = 'LIMIT REACHED';
    sendButton.disabled = true;
    return;
  }

  if (!promptText) {
    chatPrompt.textContent = 'Select a starter prompt to preview the interaction.';
    chatPrompt.classList.add('is-empty');
    metaStatus.textContent = 'IDLE';
    sendButton.disabled = true;
    return;
  }

  chatPrompt.textContent = promptText;
  chatPrompt.classList.remove('is-empty');
  metaStatus.textContent = 'PREVIEW';
  sendButton.disabled = false;
}

function resetConversation(agentKey) {
  const agent = agentData[agentKey];
  conversationTurn = 0;
  conversation.innerHTML = `
    <div class="bubble bubble-dark">
      How can I help you today? I can answer questions within the scope of ${agent.name}.
    </div>
  `;
}

function appendTurn(agentKey, promptText) {
  const agent = agentData[agentKey];
  const responseData = agent.responses[promptText];
  if (!responseData || isAgentLimited(agentKey)) return;

  conversationTurn += 1;
  agentUsage[agentKey] += 1;
  const thinkingId = `thinking-${conversationTurn}`;

  conversation.insertAdjacentHTML(
    'beforeend',
    `
      <div class="bubble bubble-accent">${promptText}</div>
      <div class="bubble bubble-dark dimmed" id="${thinkingId}">
        ${responseData.thinking}
      </div>
    `
  );

  metaStatus.textContent = 'THINKING';
  renderStarterPrompts(agentKey);
  setSelectedPrompt('');
  conversation.scrollTop = conversation.scrollHeight;

  setTimeout(() => {
    const thinkingBubble = document.getElementById(thinkingId);
    if (thinkingBubble) {
      thinkingBubble.remove();
    }

    conversation.insertAdjacentHTML(
      'beforeend',
      `
        <div class="bubble bubble-dark subtle-response">
          ${responseData.answer}
        </div>
      `
    );

    if (isAgentLimited(agentKey)) {
      metaStatus.textContent = 'LIMIT REACHED';
      conversation.insertAdjacentHTML(
        'beforeend',
        `
          <div class="bubble bubble-dark limit-note">
            Preview limit reached for ${agent.name}. Select another agent to continue.
          </div>
        `
      );
      renderStarterPrompts(agentKey);
      setSelectedPrompt('');
    } else {
      metaStatus.textContent = 'PREVIEW';
    }

    conversation.scrollTop = conversation.scrollHeight;
  }, 2200);
}

function renderStarterPrompts(agentKey) {
  const agent = agentData[agentKey];
  const limited = isAgentLimited(agentKey);
  starterPrompts.innerHTML = '';
  agent.prompts.forEach((prompt) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'starter-prompt';
    button.textContent = prompt;
    button.disabled = limited;
    button.addEventListener('click', () => {
      if (isAgentLimited(agentKey)) return;
      setSelectedPrompt(prompt);
      appendTurn(agentKey, prompt);
    });
    starterPrompts.appendChild(button);
  });
}

function renderAgent(agentKey) {
  const agent = agentData[agentKey];
  currentAgent = agentKey;
  agentScope.textContent = agent.scope;
  agentUseCase.textContent = agent.useCase;
  agentDescription.textContent = agent.description;
  metaAgent.textContent = agent.name;
  renderStarterPrompts(agentKey);
  resetConversation(agentKey);

  if (isAgentLimited(agentKey)) {
    setSelectedPrompt('');
    conversation.insertAdjacentHTML(
      'beforeend',
      `
        <div class="bubble bubble-dark limit-note">
          Preview limit reached for ${agent.name}. Select another agent to continue.
        </div>
      `
    );
  } else {
    setSelectedPrompt('');
  }
}

Object.entries(agentData).forEach(([key, agent]) => {
  const option = document.createElement('option');
  option.value = key;
  option.textContent = agent.option;
  agentSelect.appendChild(option);
});

agentSelect.addEventListener('change', (event) => {
  renderAgent(event.target.value);
});

sendButton.addEventListener('click', () => {
  if (!selectedPrompt) return;
  appendTurn(currentAgent, selectedPrompt);
});

renderAgent(currentAgent);
