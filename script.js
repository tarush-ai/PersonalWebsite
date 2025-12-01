// ============================================
// PARTICLES
// ============================================
function createParticles(containerId, count = 50) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    for (let i = 0; i < count; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.style.left = Math.random() * 100 + '%';
        particle.style.animationDelay = Math.random() * 15 + 's';
        particle.style.animationDuration = (10 + Math.random() * 10) + 's';
        container.appendChild(particle);
    }
}

// Create initial particles
createParticles('particles', 50);

// ============================================
// TERMINAL INTRO SEQUENCE
// ============================================
const commands = [
    {
        prompt: { user: 'tarushgupta', host: "tarush's_macbook_pro", path: '~' },
        command: 'python who_is_tarush',
        cmdParts: [
            { text: 'python', class: 'cmd-name' },
            { text: ' who_is_tarush', class: 'cmd-arg' }
        ],
        output: '> 17. student. founder. builder. working on the only citadel he can control.',
        outputClass: 'highlight'
    },
    {
        prompt: { user: 'tarushgupta', host: "tarush's_macbook_pro", path: '~' },
        command: 'cd portfolio_v3',
        cmdParts: [
            { text: 'cd', class: 'cmd-name' },
            { text: ' portfolio_v3', class: 'cmd-arg' }
        ],
        output: null
    },
    {
        prompt: { user: 'tarushgupta', host: "tarush's_macbook_pro", path: 'portfolio_v3' },
        command: 'code .',
        cmdParts: [
            { text: 'code', class: 'cmd-name' },
            { text: ' .', class: 'cmd-arg' }
        ],
        output: null,
        isLast: true
    }
];

const terminalBody = document.getElementById('terminal-body');
const enterPrompt = document.getElementById('enter-prompt');
const transitionOverlay = document.getElementById('transition-overlay');
const loadingProgress = document.getElementById('loading-progress');
const finalMessage = document.getElementById('final-message');

let currentCommandIndex = 0;
let isTyping = false;
let waitingForEnter = false;
let currentLine = null;
let currentCursor = null;

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function createPromptHTML(promptData) {
    return `<span class="user">${promptData.user}</span><span class="at">@</span><span class="host">${promptData.host}</span><span class="colon">:</span><span class="path">${promptData.path}</span><span class="dollar">$</span>`;
}

async function bootSequence() {
    const bootMessages = [
        'Initializing system...',
        'Loading kernel modules...',
        'Establishing secure connection...',
        'Authentication successful.',
        ''
    ];

    for (const msg of bootMessages) {
        if (msg) {
            const bootLine = document.createElement('div');
            bootLine.className = 'boot-text';
            bootLine.textContent = '> ' + msg;
            bootLine.style.animationDelay = '0s';
            terminalBody.appendChild(bootLine);
            await sleep(200);
        }
    }

    // ASCII art
    const towerLines = [
        '  ═══╦═══                                                        ═══╦═══  ',
        '    ║║║    ████████╗ █████╗ ██████╗ ██╗   ██╗███████╗██╗  ██╗      ║║║    ',
        '    ║║║    ╚══██╔══╝██╔══██╗██╔══██╗██║   ██║██╔════╝██║  ██║      ║║║    ',
        '    ║║║       ██║   ███████║██████╔╝██║   ██║███████╗███████║      ║║║    ',
        '    ║║║       ██║   ██╔══██║██╔══██╗██║   ██║╚════██║██╔══██║      ║║║    ',
        '    ║║║       ██║   ██║  ██║██║  ██║╚██████╔╝███████║██║  ██║      ║║║    ',
        '    ║║║       ╚═╝   ╚═╝  ╚═╝╚═╝  ╚═╝ ╚═════╝ ╚══════╝╚═╝  ╚═╝      ║║║    ',
        '  ══╩═╩══                                                        ══╩═╩══  '
    ];

    const asciiArt = document.createElement('pre');
    asciiArt.className = 'ascii-art';
    terminalBody.appendChild(asciiArt);

    for (let i = 0; i < towerLines.length; i++) {
        const line = document.createElement('div');
        line.className = 'ascii-line';
        line.textContent = towerLines[i];
        line.style.animationDelay = (i * 0.1) + 's';
        asciiArt.appendChild(line);
        await sleep(100);
    }

    await sleep(400);

    const spacer = document.createElement('div');
    spacer.style.height = '20px';
    terminalBody.appendChild(spacer);

    startNextCommand();
}

async function typeCommand(cmdParts, commandSpan) {
    isTyping = true;
    
    for (const part of cmdParts) {
        const partSpan = document.createElement('span');
        partSpan.className = part.class;
        
        for (const char of part.text) {
            partSpan.textContent += char;
            commandSpan.appendChild(partSpan);
            if (currentCursor && currentCursor.parentNode) {
                currentCursor.parentNode.removeChild(currentCursor);
            }
            commandSpan.appendChild(currentCursor);
            await sleep(50 + Math.random() * 50);
        }
    }
    
    isTyping = false;
    waitingForEnter = true;
    enterPrompt.classList.add('visible');
}

async function startNextCommand() {
    if (currentCommandIndex >= commands.length) return;

    const cmd = commands[currentCommandIndex];
    
    currentLine = document.createElement('div');
    currentLine.className = 'terminal-line';
    
    const promptSpan = document.createElement('span');
    promptSpan.className = 'prompt';
    promptSpan.innerHTML = createPromptHTML(cmd.prompt);
    
    const commandSpan = document.createElement('span');
    commandSpan.className = 'command';
    
    currentCursor = document.createElement('span');
    currentCursor.className = 'cursor';
    
    currentLine.appendChild(promptSpan);
    currentLine.appendChild(commandSpan);
    commandSpan.appendChild(currentCursor);
    
    terminalBody.appendChild(currentLine);
    scrollToBottom();
    
    await sleep(500);
    await typeCommand(cmd.cmdParts, commandSpan);
}

async function executeCommand() {
    if (!waitingForEnter) return;
    
    waitingForEnter = false;
    enterPrompt.classList.remove('visible');
    
    if (currentCursor && currentCursor.parentNode) {
        currentCursor.parentNode.removeChild(currentCursor);
    }
    
    const cmd = commands[currentCommandIndex];
    
    if (cmd.output) {
        await sleep(300);
        const outputDiv = document.createElement('div');
        outputDiv.className = 'output' + (cmd.outputClass ? ' ' + cmd.outputClass : '');
        outputDiv.textContent = cmd.output;
        terminalBody.appendChild(outputDiv);
        scrollToBottom();
    }
    
    if (cmd.isLast) {
        await sleep(500);
        triggerTransition();
        return;
    }
    
    currentCommandIndex++;
    await sleep(600);
    startNextCommand();
}

async function triggerTransition() {
    transitionOverlay.classList.add('active');
    document.querySelector('.terminal-container').style.display = 'none';
    
    for (let i = 0; i <= 100; i += 2) {
        loadingProgress.style.width = i + '%';
        await sleep(30);
    }
    
    await sleep(500);
    finalMessage.classList.add('visible');
    
    await sleep(1000);
    showPortfolio();
}

function scrollToBottom() {
    terminalBody.scrollTop = terminalBody.scrollHeight;
}

let introSkipped = false;

function skipIntro() {
    if (introSkipped) return;
    introSkipped = true;
    
    // Hide skip prompt
    const skipPrompt = document.getElementById('skip-prompt');
    if (skipPrompt) skipPrompt.classList.add('hidden');
    
    // Hide enter prompt
    enterPrompt.classList.remove('visible');
    
    // Hide terminal
    document.querySelector('.terminal-container').style.display = 'none';
    
    // Show transition briefly then portfolio
    transitionOverlay.classList.add('active');
    loadingProgress.style.width = '100%';
    finalMessage.classList.add('visible');
    
    setTimeout(() => {
        showPortfolio();
    }, 500);
}

// Event listeners for terminal intro
document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && waitingForEnter) {
        executeCommand();
    }
    if (e.key === 'Tab' && !introSkipped) {
        e.preventDefault();
        skipIntro();
    }
});

document.addEventListener('touchstart', () => {
    if (waitingForEnter) {
        executeCommand();
    }
});

window.addEventListener('load', () => {
    setTimeout(bootSequence, 500);
});

// ============================================
// PORTFOLIO PAGE LOGIC
// ============================================
const portfolioPage = document.getElementById('portfolio-page');
const bottomTerminal = document.getElementById('bottom-terminal');
const terminalInput = document.getElementById('terminal-input');
const autocompleteGhost = document.getElementById('autocomplete-ghost');
const autocompleteHint = document.getElementById('autocomplete-hint');
const suggestionText = document.getElementById('suggestion-text');
const currentPathEl = document.getElementById('current-path');
const modeToggle = document.getElementById('mode-toggle');
const toggleSwitch = document.getElementById('toggle-switch');
const traditionalNav = document.getElementById('traditional-nav');
const backHomeBtn = document.getElementById('back-home-btn');
const portfolioContent = document.getElementById('portfolio-content');

// Navigation suggestions
const suggestions = [
    { cmd: 'cd podcast', label: 'cd podcast' },
    { cmd: 'cd vericare', label: 'cd vericare' },
    { cmd: 'cd internships', label: 'cd internships' },
    { cmd: 'cd github', label: 'cd github' }
];

let currentSuggestionIndex = 0;
let suggestionInterval = null;
let currentPage = 'home';
let terminalMode = true;
let currentInternship = null;

// Pages mapping
const pages = {
    'home': { path: '~', el: 'page-home' },
    'podcast': { path: '~/podcast', el: 'page-podcast' },
    'vericare': { path: '~/vericare', el: 'page-vericare' },
    'internships': { path: '~/internships', el: 'page-internships' },
    'github': { path: '~/github', el: 'page-github' }
};

// Internship data
const internships = {
    'turing': {
        company: 'Turing',
        role: 'AI Training & Evaluation',
        period: '2024',
        description: 'Working on AI model training and evaluation for cutting-edge language models.',
        details: 'More details coming soon...',
        tags: ['AI', 'Machine Learning', 'NLP']
    },
    'humanx': {
        company: 'HumanX',
        role: 'Engineering Intern',
        period: '2024',
        description: 'Building human-centered AI solutions and products.',
        details: 'More details coming soon...',
        tags: ['AI', 'Product', 'Engineering']
    },
    'ema': {
        company: 'Ema Unlimited',
        role: 'Software Engineering',
        period: '2024',
        description: 'Contributing to the development of enterprise AI assistants.',
        details: 'More details coming soon...',
        tags: ['AI', 'Enterprise', 'Automation']
    },
    'proshort': {
        company: 'Proshort',
        role: 'Engineering Intern',
        period: '2024',
        description: 'Working on short-form video technology and content creation tools.',
        details: 'More details coming soon...',
        tags: ['Video', 'Content', 'Tech']
    }
};

function showPortfolio() {
    createParticles('portfolio-particles', 30);
    
    portfolioPage.classList.add('active');
    
    requestAnimationFrame(() => {
        transitionOverlay.style.opacity = '0';
        
        setTimeout(() => {
            transitionOverlay.style.display = 'none';
            
            setTimeout(() => {
                bottomTerminal.classList.add('active');
                modeToggle.classList.add('visible');
                terminalInput.focus();
                startSuggestionCycle();
            }, 300);
        }, 800);
    });
}

function toggleMode() {
    terminalMode = !terminalMode;
    
    if (terminalMode) {
        toggleSwitch.classList.remove('off');
        bottomTerminal.classList.add('active');
        traditionalNav.classList.remove('active');
        portfolioContent.classList.remove('navbar-mode');
        backHomeBtn.classList.toggle('visible', currentPage !== 'home');
        terminalInput.focus();
        startSuggestionCycle();
    } else {
        toggleSwitch.classList.add('off');
        bottomTerminal.classList.remove('active');
        traditionalNav.classList.add('active');
        portfolioContent.classList.add('navbar-mode');
        backHomeBtn.classList.remove('visible');
        if (suggestionInterval) {
            clearInterval(suggestionInterval);
        }
    }
}

function updateBackButton() {
    if (terminalMode && currentPage !== 'home') {
        backHomeBtn.classList.add('visible');
    } else {
        backHomeBtn.classList.remove('visible');
    }
}

function updateNavbar() {
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
        if (link.dataset.page === currentPage) {
            link.classList.add('active');
        }
    });
}

function startSuggestionCycle() {
    updateSuggestion();
    autocompleteHint.classList.add('visible');
    
    suggestionInterval = setInterval(() => {
        currentSuggestionIndex = (currentSuggestionIndex + 1) % suggestions.length;
        updateSuggestion();
    }, 5000);
}

function updateSuggestion() {
    const suggestion = suggestions[currentSuggestionIndex];
    suggestionText.textContent = suggestion.label;
    
    suggestionText.style.opacity = '0';
    setTimeout(() => {
        suggestionText.style.opacity = '1';
    }, 150);
}

function updateAutocompleteGhost() {
    const inputValue = terminalInput.value;
    const suggestion = suggestions[currentSuggestionIndex].cmd;
    
    if (inputValue && suggestion.startsWith(inputValue) && inputValue !== suggestion) {
        autocompleteGhost.textContent = suggestion;
        autocompleteGhost.style.opacity = '0.3';
    } else {
        autocompleteGhost.textContent = '';
    }
}

function navigateTo(page) {
    // Handle internship sub-pages
    if (page.startsWith('internship-')) {
        const internshipId = page.replace('internship-', '');
        showInternshipDetail(internshipId);
        return;
    }
    
    if (!pages[page]) return;
    
    // Hide internship detail if showing
    hideInternshipDetail();
    
    document.querySelectorAll('.sub-page').forEach(p => p.classList.remove('active'));
    document.getElementById(pages[page].el).classList.add('active');
    
    currentPathEl.textContent = pages[page].path;
    currentPage = page;
    
    document.getElementById('portfolio-content').scrollTop = 0;
    
    terminalInput.value = '';
    autocompleteGhost.textContent = '';
    
    updateBackButton();
    updateNavbar();
}

function showInternshipDetail(internshipId) {
    const data = internships[internshipId];
    if (!data) return;
    
    currentInternship = internshipId;
    
    // Update detail content
    const detailEl = document.getElementById('internship-detail');
    const headerEl = detailEl.querySelector('.internship-detail-header');
    const contentEl = detailEl.querySelector('.internship-detail-content');
    
    headerEl.innerHTML = `
        <h1>${data.company}</h1>
        <p class="role">${data.role} • ${data.period}</p>
    `;
    
    contentEl.innerHTML = `
        <p>${data.description}</p>
        <h2>About the Role</h2>
        <p>${data.details}</p>
        <div class="internship-tags" style="margin-top: 24px;">
            ${data.tags.map(tag => `<span class="internship-tag">${tag}</span>`).join('')}
        </div>
    `;
    
    // Show detail, hide list
    document.getElementById('internships-list').style.display = 'none';
    detailEl.classList.add('active');
    
    currentPathEl.textContent = `~/internships/${internshipId}`;
    document.getElementById('portfolio-content').scrollTop = 0;
}

function hideInternshipDetail() {
    const detailEl = document.getElementById('internship-detail');
    const listEl = document.getElementById('internships-list');
    
    if (detailEl) detailEl.classList.remove('active');
    if (listEl) listEl.style.display = 'block';
    
    currentInternship = null;
}

function handleCommand(cmd) {
    const trimmed = cmd.trim().toLowerCase();
    
    // cd commands
    if (trimmed.startsWith('cd ')) {
        const target = trimmed.slice(3).trim();
        
        if (target === '~' || target === '..' || target === '../' || target === '') {
            if (currentInternship) {
                hideInternshipDetail();
                currentPathEl.textContent = '~/internships';
            } else {
                navigateTo('home');
            }
        } else if (target === 'podcast' || target === '~/podcast') {
            navigateTo('podcast');
        } else if (target === 'vericare' || target === '~/vericare' || target === 'vericare-ai') {
            navigateTo('vericare');
        } else if (target === 'internships' || target === '~/internships') {
            navigateTo('internships');
        } else if (target === 'github' || target === '~/github') {
            navigateTo('github');
        } else if (target === 'home' || target === '~/home') {
            navigateTo('home');
        }
        // Internship sub-navigation
        else if (target === 'turing') {
            navigateTo('internship-turing');
        } else if (target === 'humanx') {
            navigateTo('internship-humanx');
        } else if (target === 'ema' || target === 'ema-unlimited') {
            navigateTo('internship-ema');
        } else if (target === 'proshort') {
            navigateTo('internship-proshort');
        }
    }
    
    if (trimmed === 'clear') {
        terminalInput.value = '';
    }
}

// Terminal input handlers
terminalInput.addEventListener('input', () => {
    updateAutocompleteGhost();
    
    if (terminalInput.value) {
        autocompleteHint.classList.remove('visible');
    } else {
        autocompleteHint.classList.add('visible');
    }
});

terminalInput.addEventListener('keydown', (e) => {
    if (e.key === 'Tab') {
        e.preventDefault();
        const suggestion = suggestions[currentSuggestionIndex].cmd;
        if (terminalInput.value === '' || suggestion.startsWith(terminalInput.value)) {
            terminalInput.value = suggestion;
            autocompleteGhost.textContent = '';
        }
    }
    
    if (e.key === 'Enter') {
        handleCommand(terminalInput.value);
    }
    
    if (e.key === 'ArrowUp') {
        e.preventDefault();
        currentSuggestionIndex = (currentSuggestionIndex - 1 + suggestions.length) % suggestions.length;
        updateSuggestion();
    }
    if (e.key === 'ArrowDown') {
        e.preventDefault();
        currentSuggestionIndex = (currentSuggestionIndex + 1) % suggestions.length;
        updateSuggestion();
    }
});

// Make functions available globally
window.navigateTo = navigateTo;
window.toggleMode = toggleMode;

// Toggle switch event listener
toggleSwitch.addEventListener('click', toggleMode);

