/* ============================================
   PARTICLES
   ============================================ */
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

/* ============================================
   TERMINAL INTRO SEQUENCE
   ============================================ */
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

/* ============================================
   PORTFOLIO PAGE LOGIC
   ============================================ */
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
    { cmd: 'cd ideas', label: 'cd ideas' },
    { cmd: 'cd github', label: 'cd github' }
];

let currentSuggestionIndex = 0;
let suggestionInterval = null;
let currentPage = 'home';
let terminalMode = true;
let currentInternship = null;
let commandHistory = [];
let terminalExpanded = false;

// Pages mapping
const pages = {
    'home': { path: '~', el: 'page-home' },
    'podcast': { path: '~/podcast', el: 'page-podcast' },
    'vericare': { path: '~/vericare', el: 'page-vericare' },
    'internships': { path: '~/internships', el: 'page-internships' },
    'ideas': { path: '~/ideas', el: 'page-ideas' },
    'github': { path: '~/github', el: 'page-github' }
};

// Internship data
const internships = {
    'turing': {
        company: 'Turing',
        role: 'AI Training & Evaluation',
        period: '2025',
        description: 'Built datasourcing and post training workflows for a frontier lab on their SOTA AI model.',
        details: `
            <ul>
                <li>Built datasourcing and post training workflows for a frontier lab on their SOTA AI model.</li>
                <li>Proposed and executed product and engineering features for a client project.</li>
                <li>Built automation infrastructure for the executive team.</li>
                <li>Reported to CEO.</li>
            </ul>
        `,
        tags: ['AI', 'Machine Learning', 'NLP'],
        contact: {
            email: 'tarushgs@gmail.com',
            cc: 'tarush.gupta@turing.com',
            subject: 'Turing: '
        }
    },
    'humanx': {
        company: 'HumanX',
        role: 'Engineering Intern',
        period: '2024',
        description: 'HumanX is a venture-backed cross-vertical gathering of the most influential people in AI.',
        details: `
            <ul>
                <li>HumanX is a venture-backed cross-vertical gathering of the most influential people in AI, in March of 2025.</li>
                <li>Building a comprehensive competitive strategy by conducting analysis and coordinating speaker logistics.</li>
                <li>Reporting to Marketing, Speaker Outreach, and the CEO.</li>
            </ul>
        `,
        tags: ['AI', 'Product', 'Engineering'],
        contact: {
            email: 'tarushgs@gmail.com',
            subject: 'HumanX: '
        }
    },
    'ema': {
        company: 'Ema Unlimited',
        role: 'Software Engineering',
        period: '2024',
        description: 'Ema is an AI “employee” which turns intricate workflows into a chat, boosting company-wide productivity.',
        details: `
            <ul>
                <li>Ema is an AI “employee” which turns intricate workflows into a chat, boosting company-wide productivity.</li>
                <li>Deeply analyzed a specific vertical and identified pain points requiring AI innovation.</li>
                <li>Reporting directly to the CEO.</li>
            </ul>
        `,
        tags: ['AI', 'Enterprise', 'Automation'],
        contact: {
            email: 'tarushgs@gmail.com',
            subject: 'Ema: '
        }
    },
    'proshort': {
        company: 'Proshort',
        role: 'Engineering Intern',
        period: '2023',
        description: 'Proshort is a short-form video generation platform for enterprises.',
        details: `
            <ul>
                <li>Proshort is a short-form video generation platform for enterprises.</li>
                <li>Created competitive strategy, market positioning and feature roadmap, working for the head of product.</li>
                <li>Earned special recommendation from the CEO, who is currently executing the proposed roadmap.</li>
            </ul>
        `,
        tags: ['Video', 'Content', 'Tech'],
        contact: {
            email: 'tarushgs@gmail.com',
            subject: 'Proshort: '
        }
    }
};

// Podcast Data
const podcastEpisodes = [
    {
        title: "Gemini 3 Pro: The Next Sea Change in LLM Models",
        desc: "An analysis of Google’s Gemini 3 Pro and what it signals about the future of foundation models.",
        url: "https://www.youtube.com/embed/ZkO8OKDhTuM",
        notes: "An analysis of Google’s Gemini 3 Pro and what it signals about the future of foundation models."
    },
    {
        title: "Monetization in AI: The Future of LLMs and Profitability",
        desc: "An exploration of how large language models transition from research breakthroughs to viable businesses.",
        url: "https://www.youtube.com/embed/Rp5HDpas2r8",
        notes: "An exploration of how large language models transition from research breakthroughs to viable businesses."
    },
    {
        title: "3 AI Trends That Will Change Everything in 2025",
        desc: "An overview of the most important technical and economic shifts shaping AI’s near future.",
        url: "https://www.youtube.com/embed/9uHFm48cDrI",
        notes: "An overview of the most important technical and economic shifts shaping AI’s near future."
    },
    {
        title: "Intelligence, In Motion: The Next Leap for AI and Robotics (Mahesh Krishnamurthi)",
        desc: "A discussion with Mahesh Krishnamurthi, cofounder and CEO of Vayu Robotics, on embodied intelligence, robotics, and AI in physical systems.",
        url: "https://www.youtube.com/embed/IUuQySu6wPs",
        notes: "A discussion with Mahesh Krishnamurthi, cofounder and CEO of Vayu Robotics, on embodied intelligence, robotics, and AI in physical systems."
    },
    {
        title: "Are We Living in Sci-Fi Already? Analyzing the Progress of AI Superintelligence",
        desc: "A grounded look at how close current AI systems are to science-fiction-level intelligence.",
        url: "https://www.youtube.com/embed/Q1rRuLJfy9M",
        notes: "A grounded look at how close current AI systems are to science-fiction-level intelligence."
    },
    {
        title: "This Week in AI: June 2nd to June 8th, 2025",
        desc: "A roundup of the most important AI news and research updates from the week.",
        url: "https://www.youtube.com/embed/C6f_KVbVZx8",
        notes: "A roundup of the most important AI news and research updates from the week."
    },
    {
        title: "Crypto/GenAI: Your Next ID Card (Kirthiga Reddy)",
        desc: "A conversation with Kirthiga Reddy, Facebook India's first employee and cofounder and CEO of Verix, on decentralized identity, cryptography, and AI-powered verification systems.",
        url: "https://www.youtube.com/embed/psZzUWlR85o",
        notes: "A conversation with Kirthiga Reddy, Facebook India's first employee and cofounder and CEO of Verix, on decentralized identity, cryptography, and AI-powered verification systems."
    },
    {
        title: "Prompt Engineering 101: Knowing Your Topic",
        desc: "A foundational guide on how intent, structure, and context shape prompt effectiveness.",
        url: "https://www.youtube.com/embed/onVrd6PEJXE",
        notes: "A foundational guide on how intent, structure, and context shape prompt effectiveness."
    },
    {
        title: "MCP is crazy",
        desc: "A deep dive into Model Context Protocols and why they change how AI systems interact with tools.",
        url: "https://www.youtube.com/embed/vFnC0M960xM",
        notes: "A deep dive into Model Context Protocols and why they change how AI systems interact with tools."
    },
    {
        title: "Will AI Take Our Jobs?",
        desc: "An analysis of automation, labor displacement, and how AI reshapes employment.",
        url: "https://www.youtube.com/embed/s_yQIp66s_0",
        notes: "An analysis of automation, labor displacement, and how AI reshapes employment."
    },
    {
        title: "Five HOTTEST AI Startups! 🔥",
        desc: "A breakdown of emerging AI startups, including Manus, Composio, Turing, Loveable, and Sesame, and why they matter in the current ecosystem.",
        url: "https://www.youtube.com/embed/pJ3sovgTbbY",
        notes: "A breakdown of emerging AI startups, including Manus, Composio, Turing, Loveable, and Sesame, and why they matter in the current ecosystem."
    },
    {
        title: "FOR BEGINNERS: EVERYTHING in AI over 6 weeks in 15 minutes",
        desc: "A fast, structured overview of modern AI concepts for complete beginners.",
        url: "https://www.youtube.com/embed/bCI0KQAvlUw",
        notes: "A fast, structured overview of modern AI concepts for complete beginners."
    },
    {
        title: "How AI Can Slash the Defense Budget (Yogesh Kumar)",
        desc: "A discussion with Yogesh Kumar, the ex Director of HAL and man behind India's first light combat aircraft, on how AI systems can reduce inefficiencies and costs in large-scale defense operations.",
        url: "https://www.youtube.com/embed/7EnsPFIgvX4",
        notes: "A discussion with Yogesh Kumar, the ex Director of HAL and man behind India's first light combat aircraft, on how AI systems can reduce inefficiencies and costs in large-scale defense operations."
    },
    {
        title: "How to 1000x Your Sales Insights Through Short Form Content (Gaurav Mishra)",
        desc: "A conversation with Gaurav Mishra, founder and CEO of ProShort, on using short-form content and AI to dramatically improve sales intelligence and distribution.",
        url: "https://www.youtube.com/embed/0BihMbhJNcM",
        notes: "A conversation with Gaurav Mishra, founder and CEO of ProShort, on using short-form content and AI to dramatically improve sales intelligence and distribution."
    },
    {
        title: "Welcome to Neural Bridge!",
        desc: "An introduction to Neural Bridge and its mission to connect cutting-edge AI research with real-world impact.",
        url: "https://www.youtube.com/embed/Wd5EESuc_cg",
        notes: "An introduction to Neural Bridge and its mission to connect cutting-edge AI research with real-world impact."
    }
];

function renderPodcastList() {
    const listEl = document.getElementById('podcast-list');
    if (!listEl) return;
    
    listEl.innerHTML = podcastEpisodes.map((ep, index) => `
        <div class="episode-card" onclick="showPodcastDetail(${index})">
            <div class="episode-number">${podcastEpisodes.length - index}</div>
            <div class="episode-info">
                <h3>${ep.title}</h3>
                <p>${ep.desc}</p>
            </div>
        </div>
    `).join('');
}

function showPodcastDetail(index) {
    const ep = podcastEpisodes[index];
    if (!ep) return;
    
    document.getElementById('podcast-detail-title').textContent = ep.title;
    document.getElementById('podcast-detail-desc').textContent = ep.desc;
    document.getElementById('podcast-video-frame').src = ep.url;
    document.getElementById('podcast-notes-content').textContent = ep.notes; // In real usage, this might be HTML or Markdown
    
    document.getElementById('podcast-list').style.display = 'none';
    document.getElementById('podcast-detail').style.display = 'block';
    
    currentPathEl.textContent = `~/podcast/${index + 1}`;
    document.getElementById('portfolio-content').scrollTop = 0;
}

function hidePodcastDetail() {
    document.getElementById('podcast-detail').style.display = 'none';
    document.getElementById('podcast-video-frame').src = ""; // Stop video
    document.getElementById('podcast-list').style.display = 'flex';
    
    currentPathEl.textContent = '~/podcast';
}

window.showPodcastDetail = showPodcastDetail;
window.hidePodcastDetail = hidePodcastDetail;

function showPortfolio() {
    createParticles('portfolio-particles', 30);
    renderPodcastList();
    
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
        document.body.classList.remove('terminal-mode-off');
        terminalInput.focus();
        startSuggestionCycle();
    } else {
        toggleSwitch.classList.add('off');
        bottomTerminal.classList.remove('active');
        traditionalNav.classList.add('active');
        portfolioContent.classList.add('navbar-mode');
        backHomeBtn.classList.remove('visible');
        document.body.classList.add('terminal-mode-off');
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
    
    // Handle idea sub-pages
    if (page.startsWith('idea-')) {
        const ideaId = page.replace('idea-', '');
        navigateTo('ideas');
        setTimeout(() => showIdeaDetail(ideaId), 100);
        return;
    }
    
    if (!pages[page]) return;
    
    // Hide internship detail if showing
    hideInternshipDetail();
    
    // Hide idea detail if showing
    if (typeof hideIdeaDetail === 'function') {
        hideIdeaDetail();
    }
    
    // Hide podcast detail if showing
    if (typeof hidePodcastDetail === 'function') {
        hidePodcastDetail();
    }
    
    document.querySelectorAll('.sub-page').forEach(p => p.classList.remove('active'));
    document.getElementById(pages[page].el).classList.add('active');
    
    currentPathEl.textContent = pages[page].path;
    currentPage = page;
    
    document.getElementById('portfolio-content').scrollTop = 0;
    
    terminalInput.value = '';
    autocompleteGhost.textContent = '';
    
    updateBackButton();
    updateNavbar();

    // Handle VeriCare video autoplay only when on that page
    const vericareVideo = document.getElementById('vericare-video');
    if (page === 'vericare' && vericareVideo) {
        if (!vericareVideo.getAttribute('src')) {
            vericareVideo.src = vericareVideo.getAttribute('data-src');
        }
    } else if (vericareVideo) {
        // Optional: Stop video when navigating away to save resources/bandwidth
        // vericareVideo.src = ""; 
    }
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
    
    // Generate contact button HTML
    let contactBtnHtml = '';
    if (data.contact) {
        let mailto = `mailto:${data.contact.email}?subject=${encodeURIComponent(data.contact.subject)}`;
        if (data.contact.cc) {
            mailto += `&cc=${data.contact.cc}`;
        }
        contactBtnHtml = `
            <div style="text-align: center; margin-top: 40px;">
                <a href="${mailto}" class="github-link" style="border-color: rgba(244, 114, 182, 0.3); background: rgba(244, 114, 182, 0.1); color: var(--accent-pink);">
                    Contact: (${data.company} Specific)
                </a>
            </div>
        `;
    }
    
    contentEl.innerHTML = `
        <p>${data.description}</p>
        <h2>About the Role</h2>
        <div style="line-height: 1.6; color: var(--text-dim);">${data.details}</div>
        <div class="internship-tags" style="margin-top: 24px;">
            ${data.tags.map(tag => `<span class="internship-tag">${tag}</span>`).join('')}
        </div>
        ${contactBtnHtml}
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

function addToHistory(cmd) {
    if (cmd.trim()) {
        commandHistory.unshift(cmd);
        if (commandHistory.length > 20) commandHistory.pop();
        updateHistoryDisplay();
    }
}

function updateHistoryDisplay() {
    const historyEl = document.getElementById('command-history');
    if (!historyEl) return;
    
    historyEl.innerHTML = commandHistory.map(cmd => 
        `<div class="history-item"><span style="color: var(--accent-green);">$</span> ${cmd}</div>`
    ).join('');
}

function toggleTerminalExpand() {
    terminalExpanded = !terminalExpanded;
    const terminal = document.getElementById('bottom-terminal');
    const expandBtn = document.getElementById('expand-terminal-btn');
    
    if (terminalExpanded) {
        terminal.classList.add('expanded');
        expandBtn.textContent = '▼';
    } else {
        terminal.classList.remove('expanded');
        expandBtn.textContent = '▲';
    }
}

function handleCommand(cmd) {
    const trimmed = cmd.trim().toLowerCase();
    
    // Add to history
    addToHistory(cmd);
    
    // Clear input after command
    terminalInput.value = '';
    autocompleteGhost.textContent = '';
    
    // cd commands
    if (trimmed.startsWith('cd ')) {
        const target = trimmed.slice(3).trim();
        
        // Handle paths with slashes (e.g., internships/turing)
        const parts = target.split('/').filter(p => p && p !== '~');
        
        if (target === '~' || target === '..' || target === '../' || target === '') {
            if (currentInternship) {
                hideInternshipDetail();
                currentPathEl.textContent = '~/internships';
            } else if (currentIdea) {
                hideIdeaDetail();
            } else if (document.getElementById('podcast-detail').style.display === 'block') {
                hidePodcastDetail();
            } else {
                navigateTo('home');
            }
        } else if (parts.length === 2 && parts[0] === 'internships') {
            // Handle cd internships/company
            const company = parts[1];
            if (['turing', 'humanx', 'ema', 'proshort'].includes(company)) {
                navigateTo('internships');
                setTimeout(() => navigateTo('internship-' + company), 100);
            }
        } else if (target === 'podcast' || target === '~/podcast') {
            navigateTo('podcast');
        } else if (target === 'vericare' || target === '~/vericare' || target === 'vericare-ai') {
            navigateTo('vericare');
        } else if (target === 'internships' || target === '~/internships') {
            navigateTo('internships');
        } else if (target === 'ideas' || target === '~/ideas') {
            navigateTo('ideas');
        } else if (target === 'github' || target === '~/github') {
            navigateTo('github');
        } else if (target === 'home' || target === '~/home') {
            navigateTo('home');
        }
        // Internship sub-navigation (direct)
        else if (target === 'turing' || target === 'internships/turing') {
            navigateTo('internship-turing');
        } else if (target === 'humanx' || target === 'internships/humanx') {
            navigateTo('internship-humanx');
        } else if (target === 'ema' || target === 'ema-unlimited' || target === 'internships/ema') {
            navigateTo('internship-ema');
        } else if (target === 'proshort' || target === 'internships/proshort') {
            navigateTo('internship-proshort');
        }
    }
    
    if (trimmed === 'clear') {
        commandHistory = [];
        updateHistoryDisplay();
    }
    
    if (trimmed === 'history') {
        if (!terminalExpanded) toggleTerminalExpand();
    }
}

// Make toggle function global
window.toggleTerminalExpand = toggleTerminalExpand;

// Terminal input handlers
terminalInput.addEventListener('input', () => {
    updateAutocompleteGhost();
    
    if (terminalInput.value) {
        autocompleteHint.classList.remove('visible');
    } else {
        autocompleteHint.classList.add('visible');
    }
});

let historyIndex = -1;

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
        historyIndex = -1;
        handleCommand(terminalInput.value);
    }
    
    if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (commandHistory.length > 0) {
            historyIndex = Math.min(historyIndex + 1, commandHistory.length - 1);
            terminalInput.value = commandHistory[historyIndex] || '';
        }
    }
    if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (historyIndex > 0) {
            historyIndex--;
            terminalInput.value = commandHistory[historyIndex] || '';
        } else {
            historyIndex = -1;
            terminalInput.value = '';
        }
    }
});

// Ideas data
const ideas = {
    'resume-tailor': {
        title: 'AI-Powered Resume Tailor',
        status: 'available',
        summary: 'Automatically customize resumes for specific job postings using LLMs. Match keywords, rephrase experience, and optimize for ATS systems.',
        tags: ['AI', 'HR Tech', 'SaaS'],
        details: `
            <h2>The Problem</h2>
            <p>Job seekers spend hours tailoring resumes for each application. Most don't do it well, leading to ATS rejections and missed opportunities.</p>
            
            <h2>The Solution</h2>
            <p>An AI tool that analyzes job postings and automatically rewrites resume bullet points to match keywords, tone, and requirements while keeping the content authentic.</p>
            
            <h2>Key Features</h2>
            <ul>
                <li>Paste job posting URL → get tailored resume</li>
                <li>ATS compatibility scoring</li>
                <li>Keyword gap analysis</li>
                <li>Multiple export formats</li>
            </ul>
            
            <h2>Market Opportunity</h2>
            <p>$500M+ resume builder market. Differentiation through AI-first approach and job-specific optimization.</p>
            
            <h2>Technical Approach</h2>
            <p>GPT-4 for rewriting, custom fine-tuning on successful resumes, integration with job boards for automated posting analysis.</p>
        `
    },
    'meeting-cost': {
        title: 'Meeting Cost Calculator',
        status: 'available',
        summary: 'Chrome extension that shows real-time cost of meetings based on attendees\' estimated salaries. Make meetings more intentional.',
        tags: ['Productivity', 'Extension'],
        details: `
            <h2>The Problem</h2>
            <p>Companies waste millions on unnecessary meetings. Most people don't realize a 1-hour meeting with 10 people costs $500-2000 in salary alone.</p>
            
            <h2>The Solution</h2>
            <p>A Chrome extension that integrates with Google Calendar and shows real-time meeting costs based on attendee roles and estimated compensation.</p>
            
            <h2>Key Features</h2>
            <ul>
                <li>Real-time cost ticker during meetings</li>
                <li>Weekly/monthly meeting cost reports</li>
                <li>ROI tracking for recurring meetings</li>
                <li>Suggested attendee optimization</li>
            </ul>
            
            <h2>Monetization</h2>
            <p>Freemium model. Free for individuals, paid for teams with analytics dashboard.</p>
            
            <h2>Go-to-Market</h2>
            <p>Product Hunt launch, LinkedIn viral content about meeting costs, target productivity-focused companies.</p>
        `
    },
    'scholarship-matcher': {
        title: 'Scholarship Matching Engine',
        status: 'available',
        summary: 'AI that matches students with scholarships they\'re actually eligible for. No more scrolling through thousands of irrelevant listings.',
        tags: ['EdTech', 'AI', 'Matching'],
        details: `
            <h2>The Problem</h2>
            <p>$100M+ in scholarships go unclaimed yearly. Students can't find relevant opportunities among thousands of listings with complex eligibility criteria.</p>
            
            <h2>The Solution</h2>
            <p>AI-powered matching that understands student profiles and scholarship requirements to surface only relevant, high-probability matches.</p>
            
            <h2>Key Features</h2>
            <ul>
                <li>One-time profile creation</li>
                <li>Smart matching algorithm</li>
                <li>Deadline tracking and reminders</li>
                <li>Application status tracking</li>
                <li>Essay assistance integration</li>
            </ul>
            
            <h2>Data Strategy</h2>
            <p>Scrape and structure scholarship databases, build relationships with scholarship providers for direct listings.</p>
            
            <h2>Revenue Model</h2>
            <p>Free for students. Revenue from premium features, institutional partnerships, and scholarship provider listings.</p>
        `
    },
    'founder-accountability': {
        title: 'Founder Accountability App',
        status: 'available',
        summary: 'Daily check-ins for solo founders. Share progress, get matched with accountability partners, prevent burnout through community.',
        tags: ['Community', 'Startups'],
        details: `
            <h2>The Problem</h2>
            <p>Solo founding is lonely. 72% of founders report mental health struggles. Accountability partners help but are hard to find and maintain.</p>
            
            <h2>The Solution</h2>
            <p>Structured daily check-ins with AI-matched accountability partners at similar stages. Focus on consistency over perfection.</p>
            
            <h2>Key Features</h2>
            <ul>
                <li>2-minute daily check-ins</li>
                <li>AI matching based on stage, industry, timezone</li>
                <li>Streak tracking and gentle nudges</li>
                <li>Weekly video calls with partner</li>
                <li>Anonymous founder community</li>
            </ul>
            
            <h2>Differentiation</h2>
            <p>Not another Slack community. Structured, async-first, focused on action over discussion.</p>
            
            <h2>Growth Strategy</h2>
            <p>Partner with accelerators, indie hacker communities, founder Twitter.</p>
        `
    },
    'teen-events': {
        title: 'Local Event Discovery for Teens',
        status: 'available',
        summary: 'Curated events, workshops, and opportunities specifically for high schoolers. Filter by interest, free/paid, and location.',
        tags: ['Consumer', 'Gen Z', 'Local'],
        details: `
            <h2>The Problem</h2>
            <p>Teens are bored and disconnected. Great local opportunities exist but are scattered across school emails, community boards, and random websites.</p>
            
            <h2>The Solution</h2>
            <p>A curated discovery platform specifically for high schoolers to find local events, workshops, volunteer opportunities, and competitions.</p>
            
            <h2>Key Features</h2>
            <ul>
                <li>Interest-based filtering</li>
                <li>Free/paid filters for accessibility</li>
                <li>Friend activity and group planning</li>
                <li>Resume/college app integration</li>
                <li>Parent approval workflows</li>
            </ul>
            
            <h2>Content Strategy</h2>
            <p>Partner with local organizations, schools, and libraries. User submissions with verification.</p>
            
            <h2>Monetization</h2>
            <p>Featured listings for event organizers, premium features for power users.</p>
        `
    },
    'oss-matcher': {
        title: 'Open Source Contribution Matcher',
        status: 'available',
        summary: 'Match developers with open source projects that need their specific skills. Lower the barrier to first contributions.',
        tags: ['Developer Tools', 'Open Source'],
        details: `
            <h2>The Problem</h2>
            <p>Developers want to contribute to open source but don't know where to start. Maintainers need help but can't find contributors with the right skills.</p>
            
            <h2>The Solution</h2>
            <p>A matching platform that analyzes developer skills from GitHub and matches them with "good first issues" they're uniquely qualified to solve.</p>
            
            <h2>Key Features</h2>
            <ul>
                <li>GitHub skill analysis</li>
                <li>Personalized issue recommendations</li>
                <li>Difficulty and time estimates</li>
                <li>Mentorship matching for complex issues</li>
                <li>Contribution tracking and portfolio</li>
            </ul>
            
            <h2>Technical Approach</h2>
            <p>GitHub API for skill inference, NLP on issue descriptions, collaborative filtering for recommendations.</p>
            
            <h2>Community Building</h2>
            <p>Partner with major OSS projects, sponsor Hacktoberfest, integrate with GitHub Sponsors.</p>
        `
    }
};

let currentIdea = null;

function showIdeaDetail(ideaId) {
    const data = ideas[ideaId];
    if (!data) return;
    
    currentIdea = ideaId;
    
    const detailEl = document.getElementById('idea-detail');
    const listEl = document.getElementById('ideas-list');
    
    // Update detail content
    document.getElementById('idea-detail-title').textContent = data.title;
    document.getElementById('idea-detail-summary').textContent = data.summary;
    document.getElementById('idea-detail-tags').innerHTML = data.tags.map(tag => 
        `<span class="idea-tag">${tag}</span>`
    ).join('');
    document.getElementById('idea-detail-content').innerHTML = data.details;
    
    // Update email links
    const emailSubject = encodeURIComponent(`Idea: ${data.title}`);
    document.getElementById('idea-unlock-btn').href = `mailto:tarushgs@gmail.com?subject=${emailSubject}&body=Hi Tarush,%0A%0AI'm interested in building "${data.title}". I'd love to discuss this idea further.%0A%0A[Tell me about yourself and your background]`;
    
    // Show detail, hide list
    listEl.style.display = 'none';
    detailEl.classList.add('active');
    
    currentPathEl.textContent = `~/ideas/${ideaId}`;
    document.getElementById('portfolio-content').scrollTop = 0;
}

function hideIdeaDetail() {
    const detailEl = document.getElementById('idea-detail');
    const listEl = document.getElementById('ideas-list');
    
    if (detailEl) detailEl.classList.remove('active');
    if (listEl) listEl.style.display = 'block';
    
    currentIdea = null;
    currentPathEl.textContent = '~/ideas';
}

function goBackFromIdea() {
    hideIdeaDetail();
}

// Make functions available globally
window.navigateTo = navigateTo;
window.toggleMode = toggleMode;
window.showIdeaDetail = showIdeaDetail;
window.hideIdeaDetail = hideIdeaDetail;
window.goBackFromIdea = goBackFromIdea;

// Toggle switch event listener
toggleSwitch.addEventListener('click', toggleMode);
