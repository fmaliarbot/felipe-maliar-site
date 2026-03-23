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
    response:
      'Early signal: pricing remains firm, with tighter availability shaping near-term negotiations and keeping buyers cautious.',
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
    response:
      'Current priority: condense operational noise into executive-level reporting, with emphasis on market change, risk, and material movement.',
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
    response:
      'Main signal: execution quality improves when reporting and field feedback close the loop faster, especially around retail visibility and follow-up actions.',
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

function setSelectedPrompt(promptText = '') {
  selectedPrompt = promptText;
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

function renderConversation(agentKey, promptText) {
  const agent = agentData[agentKey];
  conversation.innerHTML = `
    <div class="bubble bubble-dark">
      How can I help you today? I can answer questions about this project.
    </div>
    <div class="bubble bubble-accent">${promptText}</div>
    <div class="bubble bubble-dark dimmed">
      Analyzing scoped context and preview data...
    </div>
    <div class="bubble bubble-dark subtle-response">
      ${agent.response}
    </div>
  `;
}

function renderStarterPrompts(agentKey) {
  const agent = agentData[agentKey];
  starterPrompts.innerHTML = '';
  agent.prompts.forEach((prompt) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'starter-prompt';
    button.textContent = prompt;
    button.addEventListener('click', () => {
      setSelectedPrompt(prompt);
      renderConversation(agentKey, prompt);
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
  setSelectedPrompt('');
  conversation.innerHTML = `
    <div class="bubble bubble-dark">
      Select a starter prompt to preview how this agent would respond within its scope.
    </div>
  `;
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
  renderConversation(currentAgent, selectedPrompt);
});

renderAgent(currentAgent);
