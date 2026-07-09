// Motion helper — respect the user's reduced-motion preference everywhere.
function prefersReducedMotion() {
    return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

// Particles removed — a real terminal doesn't emit floating dots.
function createParticles() {}

// Terminal Intro
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

// Mobile Detection
const isMobile = window.innerWidth < 768;

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

function appendBootLine(html) {
    const el = document.createElement('div');
    el.className = 'boot-text';
    el.innerHTML = html;
    terminalBody.appendChild(el);
    scrollToBottom();
    return el;
}

// A real-feeling startup log: each task sits pending (…) then resolves (ok),
// so the waiting is visible — a shell actually doing work, not a performance.
async function bootSequence() {
    const reduce = prefersReducedMotion();

    const skipPrompt = document.getElementById('skip-prompt');
    if (skipPrompt && !reduce) skipPrompt.classList.add('visible');

    appendBootLine('<span class="dim">tarush@citadel</span> login');
    if (!reduce) await sleep(360);
    appendBootLine('<span class="dim">$</span> source ~/.zshrc');
    if (!reduce) await sleep(560);

    // Resolve a pending task line: append "…", wait, then swap to "ok".
    async function runTask(label, wait) {
        const line = appendBootLine(label + ' <span class="dim">…</span>');
        if (!reduce) await sleep(wait);
        if (introSkipped) return false;
        line.innerHTML = label + ' &nbsp;<span class="ok">ok</span>';
        scrollToBottom();
        return true;
    }

    if (!(await runTask('mounting <span class="dim">~/portfolio</span>', 560))) return;

    // Load each section as its own (mock) .sh — the five the site is built on.
    const scripts = [
        { name: 'vericare.sh', wait: 520 },
        { name: 'internships.sh', wait: 560 },
        { name: 'research.sh', wait: 600 },
        { name: 'github.sh', wait: 640 },
        { name: 'blog.sh', wait: 560 }
    ];
    for (const s of scripts) {
        if (!(await runTask('<span class="dim">$</span> ./' + s.name, s.wait))) return;
    }

    if (!(await runTask('initializing shell', 540))) return;

    if (!reduce) await sleep(420);
    if (introSkipped) return;
    appendBootLine('<span class="ok">ready.</span>');

    if (!reduce) await sleep(640);
    if (introSkipped) return;
    triggerTransition();
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

    // Auto-advance logic for desktop (10s timeout)
    if (!isMobile) {
        const thisCommandIndex = currentCommandIndex;
        setTimeout(() => {
            if (waitingForEnter && currentCommandIndex === thisCommandIndex) {
                executeCommand();
            }
        }, 10000);
    }
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
    const reduce = prefersReducedMotion();
    const container = document.querySelector('.terminal-container');
    if (container) container.style.display = 'none';

    const skipPrompt = document.getElementById('skip-prompt');
    if (skipPrompt) skipPrompt.classList.remove('visible');

    transitionOverlay.classList.add('active');
    finalMessage.classList.add('visible');

    await sleep(reduce ? 0 : 420);
    showPortfolio();
}

function scrollToBottom() {
    terminalBody.scrollTop = terminalBody.scrollHeight;
}

let introSkipped = false;

function skipIntro() {
    if (introSkipped) return;
    introSkipped = true;

    const skipPrompt = document.getElementById('skip-prompt');
    if (skipPrompt) { skipPrompt.classList.add('hidden'); skipPrompt.classList.remove('visible'); }
    if (enterPrompt) enterPrompt.classList.remove('visible');

    const container = document.querySelector('.terminal-container');
    if (container) container.style.display = 'none';

    transitionOverlay.classList.add('active');
    finalMessage.classList.add('visible');

    setTimeout(showPortfolio, prefersReducedMotion() ? 0 : 260);
}

// Intro listeners
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
    // Handle initial routing
    const path = window.location.pathname;
    let routed = false;
    let initialPage = 'home';
    
    if (path !== '/' && path !== '/index.html') {
        const parts = path.replace(/^\/+|\/+$/g, '').split('/');
        let targetPage = parts[0];
        
        // Mappings
        if (targetPage === 'aurelius') targetPage = 'aureliusgpt';
        
        // Handle sub-pages
        if (targetPage === 'podcast' && parts[1]) {
            // Handle podcast/SLUG — pass the raw slug through
            targetPage = 'podcast/' + decodeURIComponent(parts[1]);
        } else if (targetPage === 'blog' && parts[1]) {
            targetPage = 'blog/' + decodeURIComponent(parts[1]);
        }

        // Check if valid
        if (pages[targetPage] || targetPage.startsWith('podcast/') || targetPage.startsWith('blog/')) {
            routed = true;
            initialPage = targetPage;
            skipIntro();
            setTimeout(() => {
                navigateTo(targetPage, false);
                revealCurrentPage(); // deep links land on real content, not a blank page
            }, 600);
        }
    }
    
    // Set initial OG tags based on the page being loaded
    updateOpenGraphTags(initialPage);
    
    // Set initial history state so back button works correctly
    history.replaceState({ page: initialPage }, '', window.location.href);
    
    if (!routed) {
        if (prefersReducedMotion()) {
            skipIntro();
        } else {
            setTimeout(bootSequence, 300);
        }
    }
});

window.addEventListener('popstate', (event) => {
    if (event.state && event.state.page) {
        navigateTo(event.state.page, false);
        revealCurrentPage(); // back/forward shows content you've already seen
    } else {
        // Fallback or handle browser back to root
        navigateTo('home', false);
    }
});

// Portfolio Logic
const portfolioPage = document.getElementById('portfolio-page');
const bottomTerminal = document.getElementById('bottom-terminal');
const terminalInput = document.getElementById('terminal-input');
const autocompleteGhost = document.getElementById('autocomplete-ghost');
const autocompleteHint = document.getElementById('autocomplete-hint');
const suggestionText = document.getElementById('suggestion-text');
const currentPathEl = document.getElementById('current-path');
const modeToggle = document.getElementById('mode-toggle');
const toggleSwitch = document.getElementById('toggle-switch');
const themeToggle = document.getElementById('theme-toggle');
const themeToggleSwitch = document.getElementById('theme-toggle-switch');
const traditionalNav = document.getElementById('traditional-nav');
const backHomeBtn = document.getElementById('back-home-btn');
const portfolioContent = document.getElementById('portfolio-content');


let currentSuggestionIndex = 0;
let suggestionInterval = null;
let currentPage = 'home';
let terminalMode = true;
let commandHistory = [];
let terminalExpanded = false;

// Pages map
const pages = {
    'home': { path: '~', el: 'page-home' },
    'podcast': { path: '~/podcast', el: 'page-podcast' },
    'vericare': { path: '~/vericare', el: 'page-vericare' },
    'aureliusgpt': { path: '~/aureliusgpt', el: 'page-aureliusgpt' },
    'internships': { path: '~/internships', el: 'page-internships' },
    'research': { path: '~/research', el: 'page-research' },
    'ideas': { path: '~/ideas', el: 'page-ideas' },
    'blog': { path: '~/blog', el: 'page-blog' },
    'github': { path: '~/github', el: 'page-github' }
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

// Helper to generate slugs
function createSlug(title) {
    return title.toLowerCase().trim().replace(/ /g, '+');
}

// Add slugs to podcast episodes
podcastEpisodes.forEach(ep => {
    ep.slug = createSlug(ep.title);
});

function renderPodcastList() {
    const listEl = document.getElementById('podcast-list');
    if (!listEl) return;
    
    listEl.innerHTML = podcastEpisodes.map((ep, index) => `
        <div class="episode-card" onclick="navigateTo('podcast/${ep.slug}')">
            <div class="episode-number">${podcastEpisodes.length - index}</div>
            <div class="episode-info">
                <h3>${ep.title}</h3>
                <p>${ep.desc}</p>
            </div>
        </div>
    `).join('');
}

function showPodcastDetail(identifier) {
    let index = -1;
    
    // Check if identifier is index (number) or slug (string)
    if (typeof identifier === 'number') {
        index = identifier;
    } else {
        index = podcastEpisodes.findIndex(ep => ep.slug === identifier);
        // Fallback: try to find by ID if it was passed as string number
        if (index === -1 && !isNaN(parseInt(identifier))) {
            index = parseInt(identifier) - 1; // 1-based to 0-based
        }
    }

    const ep = podcastEpisodes[index];
    if (!ep) return;
    
    document.getElementById('podcast-detail-title').textContent = ep.title;
    document.getElementById('podcast-detail-desc').textContent = ep.desc;
    document.getElementById('podcast-video-frame').src = ep.url;
    document.getElementById('podcast-notes-content').textContent = ep.notes; // In real usage, this might be HTML or Markdown
    
    document.getElementById('podcast-list').style.display = 'none';
    document.getElementById('podcast-detail').style.display = 'block';
    
    currentPathEl.textContent = `~/podcast/${ep.slug}`;
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

// Privacy-friendly pageview ping — one per browser session, no cookies, no
// third-party, no PII. Owner reads totals at GET /api/visitors.
function recordVisit() {
    try {
        if (sessionStorage.getItem('visited')) return;
        sessionStorage.setItem('visited', '1');
        fetch('/api/visitors', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        }).catch(() => {});
    } catch (e) { /* storage blocked — skip silently */ }
}

// Entry choice: terminal vs. classic navigation. Shown prominently at the start
// of each session (once per session), while in terminal mode.
function showTermHint() {
    try { if (sessionStorage.getItem('termChoiceSeen')) return; } catch (e) { return; }
    const m = document.getElementById('term-modal');
    if (!m || !terminalMode) return;
    setTimeout(() => m.classList.add('visible'), prefersReducedMotion() ? 0 : 480);
}
function dismissTermModal(switchToNav) {
    const m = document.getElementById('term-modal');
    if (m) m.classList.remove('visible');
    try { sessionStorage.setItem('termChoiceSeen', '1'); } catch (e) {}
    if (switchToNav && terminalMode) toggleMode();
}
window.dismissTermModal = dismissTermModal;

function showPortfolio() {
    renderPodcastList();
    recordVisit();
    portfolioPage.classList.add('active');
    loadThemePreference();

    const reduce = prefersReducedMotion();
    requestAnimationFrame(() => {
        transitionOverlay.style.opacity = '0';
        setTimeout(() => {
            transitionOverlay.style.display = 'none';
            bottomTerminal.classList.add('active');
            modeToggle.classList.add('visible');
            themeToggle.classList.add('visible');
            if (terminalInput) terminalInput.focus({ preventScroll: true });
            startSuggestionCycle();
            showTermHint();
        }, reduce ? 0 : 300);
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
        if (terminalInput) terminalInput.focus();
        startSuggestionCycle();
        // Re-run the command reveal for the page you're on.
        if (currentPage && pages[currentPage]) {
            playPageReveal(document.getElementById(pages[currentPage].el));
        }
    } else {
        toggleSwitch.classList.add('off');
        bottomTerminal.classList.remove('active');
        traditionalNav.classList.add('active');
        portfolioContent.classList.add('navbar-mode');
        backHomeBtn.classList.remove('visible');
        document.body.classList.add('terminal-mode-off');
        // Classic nav: never hide content behind a command.
        document.querySelectorAll('.sub-page').forEach(p => p.classList.remove('reveal-armed', 'reveal-run'));
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

// Ghost + dropdown autocomplete — completes typed input against known commands.
const completions = [
    'ls', 'cat', 'clear', 'help', 'pwd', 'whoami',
    'cd vericare', 'cd internships', 'cd research', 'cd github', 'cd blog',
    'cd ideas', 'cd aureliusgpt', 'cd podcast', 'cd ~'
];

const suggestionsEl = document.getElementById('terminal-suggestions');
let suggestionItems = [];
let suggestionActive = -1;

function matchingCompletions() {
    const v = terminalInput.value.trim().toLowerCase();
    if (!v) return [];
    return completions.filter(c => c.startsWith(v) && c !== v);
}

function currentCompletion() {
    const v = terminalInput.value.trim().toLowerCase();
    if (!v) return '';
    return completions.find(c => c.startsWith(v) && c !== v) || '';
}

function updateAutocompleteGhost() {
    const v = terminalInput.value;
    const hit = currentCompletion();
    // Ghost shows the full completion; the input text overlays the typed prefix.
    if (hit && v && hit.startsWith(v.trim().toLowerCase())) {
        autocompleteGhost.textContent = v + hit.slice(v.trim().length);
        autocompleteGhost.style.opacity = '1';
    } else {
        autocompleteGhost.textContent = '';
        autocompleteGhost.style.opacity = '0';
    }
}

function renderSuggestions() {
    if (!suggestionsEl) return;
    const items = matchingCompletions();
    suggestionItems = items;
    if (!items.length) { hideSuggestions(); return; }
    if (suggestionActive >= items.length) suggestionActive = items.length - 1;
    suggestionsEl.innerHTML = items.map((c, i) =>
        `<div class="suggestion-item${i === suggestionActive ? ' active' : ''}" role="option" data-cmd="${c}">${c}</div>`
    ).join('');
    suggestionsEl.classList.add('visible');
}

function hideSuggestions() {
    suggestionActive = -1;
    suggestionItems = [];
    if (suggestionsEl) { suggestionsEl.classList.remove('visible'); suggestionsEl.innerHTML = ''; }
}

// Legacy no-op retained (called on portfolio show / mode toggle).
function startSuggestionCycle() {}

// Update Open Graph meta tags based on current page
function updateOpenGraphTags(page) {
    const ogTitle = document.getElementById('og-title');
    const ogDescription = document.getElementById('og-description');
    const ogImage = document.getElementById('og-image');
    const ogUrl = document.getElementById('og-url');
    const ogImageWidth = document.getElementById('og-image-width');
    const ogImageHeight = document.getElementById('og-image-height');
    
    const baseUrl = 'https://www.tarush.ai';
    
    // Define OG tags for each page
    const ogData = {
        'home': {
            title: 'Tarush Gupta — Builder, Founder, Developer',
            description: 'Personal citadel showcasing my work in AI, startups, and research.',
            image: `${baseUrl}/assets/logo-mark.png`,
            url: baseUrl
        },
        'aureliusgpt': {
            title: 'AureliusGPT — Small Language Models from First Principles',
            description: 'A family of SLMs pretrained from scratch on classical philosophy texts, built without shortcuts.',
            image: `${baseUrl}/assets/aurelius-thinking.jpg`,
            url: `${baseUrl}/aureliusgpt`
        },
        'podcast': {
            title: 'Neural Bridge Podcast — Bridging Generations Through AI',
            description: 'Connecting younger generations to current professionals through fascinating discussions on AI.',
            image: `${baseUrl}/assets/logo.jpg`,
            url: `${baseUrl}/podcast`
        },
        'vericare': {
            title: 'VeriCare AI — Patient Advocacy, Augmented with AI',
            description: 'The first fully AI patient advocacy engine, built to dispute, negotiate, and reduce medical bills.',
            image: `${baseUrl}/assets/logo-mark.png`,
            url: `${baseUrl}/vericare`
        },
        'research': {
            title: 'Tarush Gupta — Research',
            description: 'AI research across training & evaluation, memory systems, and small language models from first principles.',
            image: `${baseUrl}/assets/logo-mark.png`,
            url: `${baseUrl}/research`
        },
        'blog': {
            title: 'Tarush Gupta — Blog',
            description: 'Essays and technical writeups on patient advocacy and building language models from scratch.',
            image: `${baseUrl}/assets/logo-mark.png`,
            url: `${baseUrl}/blog`
        }
    };
    
    // Get data for current page or default to home
    const data = ogData[page] || ogData['home'];
    
    // Update meta tags
    if (ogTitle) ogTitle.setAttribute('content', data.title);
    if (ogDescription) ogDescription.setAttribute('content', data.description);
    if (ogImage) ogImage.setAttribute('content', data.image);
    if (ogUrl) ogUrl.setAttribute('content', data.url);
    if (ogImageWidth) ogImageWidth.setAttribute('content', '1200');
    if (ogImageHeight) ogImageHeight.setAttribute('content', '630');
    
    // Update document title as well
    document.title = data.title;
}

// Terminal reveal: in terminal mode, navigating leaves a page blank behind its
// command (e.g. `ls ~/internships`). The USER runs that command — typed into the
// terminal, or by clicking the command itself — and the content streams onto the
// page. No blanking in classic-nav mode or on pages without a command (home).
function playPageReveal(pageEl) {
    if (!pageEl) return;
    const echo = pageEl.querySelector(':scope > .cmd-echo');
    pageEl.classList.remove('reveal-armed', 'reveal-run');
    if (!echo || document.body.classList.contains('terminal-mode-off')) return;
    if (prefersReducedMotion()) return; // show content immediately
    pageEl.classList.add('reveal-armed'); // briefly show just the command…
    // …then run it automatically so content streams in. No hidden content and
    // no required keystroke — but typing `ls` still reveals instantly (below).
    setTimeout(() => {
        if (pageEl.classList.contains('reveal-armed')) {
            pageEl.classList.remove('reveal-armed');
            pageEl.classList.add('reveal-run');
        }
    }, 480);
}
function revealCurrentPage() {
    if (!currentPage || !pages[currentPage]) return;
    const el = document.getElementById(pages[currentPage].el);
    if (!el) return;
    el.classList.remove('reveal-armed');
    el.classList.add('reveal-run'); // "execute" → stream content onto the page
}
function armCurrentPage() {
    if (!currentPage || !pages[currentPage]) return;
    const el = document.getElementById(pages[currentPage].el);
    const echo = el && el.querySelector(':scope > .cmd-echo');
    if (!echo) return;
    if (document.body.classList.contains('terminal-mode-off')) return;
    el.classList.remove('reveal-run');
    void el.offsetWidth;
    el.classList.add('reveal-armed');
}
window.playPageReveal = playPageReveal;
window.revealCurrentPage = revealCurrentPage;

function navigateTo(page, updateHistory = true) {
    // Determine the URL for history
    let url = '/';
    let historyPage = page;

    // Close mobile nav if open
    const navOverlay = document.getElementById('mobile-nav-overlay');
    if (navOverlay && navOverlay.classList.contains('active')) {
        toggleMobileNav();
    }

    if (page !== 'home') {
        if (page.startsWith('podcast/')) {
            const slug = page.replace('podcast/', '');
            url = `/podcast/${slug}`;
        } else if (page.startsWith('blog/')) {
            const slug = page.replace('blog/', '');
            url = `/blog/${slug}`;
        } else {
            url = `/${page}`;
        }
    }

    // Update URL history
    if (updateHistory) {
        history.pushState({ page: page }, '', url);
    }
    
    // Update Open Graph tags for social sharing
    updateOpenGraphTags(page);

    // Handle podcast sub-pages
    if (page.startsWith('podcast/')) {
        const slug = page.replace('podcast/', '');
        navigateTo('podcast', false); // Go to main podcast page first
        setTimeout(() => showPodcastDetail(slug), 100);
        return;
    }

    // Handle blog post sub-pages
    if (page.startsWith('blog/')) {
        const slug = page.replace('blog/', '');
        navigateTo('blog', false); // Go to blog list first
        setTimeout(() => showBlogPost(slug), 100);
        return;
    }

    if (!pages[page]) return;

    // Hide podcast detail if showing
    if (typeof hidePodcastDetail === 'function') {
        hidePodcastDetail();
    }

    // Hide blog post detail if showing
    if (typeof hideBlogPost === 'function') {
        hideBlogPost();
    }

    document.querySelectorAll('.sub-page').forEach(p => { p.classList.remove('active', 'reveal-armed', 'reveal-run'); });
    const activeEl = document.getElementById(pages[page].el);
    activeEl.classList.add('active');
    if (typeof playPageReveal === 'function') playPageReveal(activeEl);

    currentPathEl.textContent = pages[page].path;
    currentPage = page;

    // Always land at the top of the new page (the window scrolls, not the
    // content div — so reset window/document scroll, not portfolio-content).
    window.scrollTo(0, 0);
    if (document.scrollingElement) document.scrollingElement.scrollTop = 0;
    // Keep the terminal ready so `ls` can be typed right after clicking (desktop).
    if (terminalInput && terminalMode && !isMobile) terminalInput.focus({ preventScroll: true });

    if (terminalInput) terminalInput.value = '';
    if (autocompleteGhost) autocompleteGhost.textContent = '';
    if (typeof hideSuggestions === 'function') hideSuggestions();

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
    
    // Start/stop the Aurelius quote cycler alongside its page
    if (page === 'aureliusgpt') {
        if (typeof initializeAureliusGPT === 'function') initializeAureliusGPT();
        if (typeof startQuoteCycle === 'function') startQuoteCycle();
    } else if (typeof stopQuoteCycle === 'function') {
        stopQuoteCycle();
    }

    // Live GitHub dashboard — fetch once, then re-render from cache.
    if (page === 'github' && typeof loadGitHub === 'function') loadGitHub();
}

// Blog post detail — the AureliusGPT technical writeup is the one on-site post.
let currentBlogPost = null;

function showBlogPost(postId) {
    if (postId !== 'aureliusgpt') return; // other posts are external links
    const listEl = document.getElementById('blog-list');
    const detailEl = document.getElementById('blog-detail');
    if (!detailEl) return;

    if (listEl) listEl.style.display = 'none';
    detailEl.classList.add('active');
    currentBlogPost = postId;

    currentPathEl.textContent = '~/blog/aureliusgpt';
    document.getElementById('portfolio-content').scrollTop = 0;
}

function hideBlogPost() {
    const listEl = document.getElementById('blog-list');
    const detailEl = document.getElementById('blog-detail');

    if (detailEl) detailEl.classList.remove('active');
    if (listEl) listEl.style.display = '';

    currentBlogPost = null;
}

window.showBlogPost = showBlogPost;
window.hideBlogPost = hideBlogPost;

function addToHistory(cmd) {
    if (cmd.trim()) {
        commandHistory.unshift(cmd);
        if (commandHistory.length > 30) commandHistory.pop();
    }
}

// Terminal transcript — command echo + optional output, shown in the panel.
let terminalLog = [];

function renderTerminalLog() {
    const el = document.getElementById('command-history');
    if (!el) return;
    el.innerHTML = terminalLog.map(e => `
        <div class="log-entry">
            <div class="log-cmd"><span class="log-dollar">$</span>&nbsp;${escapeHtml(e.cmd)}</div>
            ${e.out ? `<div class="log-out">${e.out}</div>` : ''}
        </div>`).join('');
    el.scrollTop = el.scrollHeight;
}

function pushLog(cmd, out) {
    terminalLog.push({ cmd: cmd, out: out || '' });
    if (terminalLog.length > 60) terminalLog.shift();
    renderTerminalLog();
}

function expandTerminal(open) {
    if (open && !terminalExpanded) toggleTerminalExpand();
}

// ---- Shell output: the site as a filesystem the terminal can talk back about ----
const SITE_DIRS = [
    { name: 'vericare', page: 'vericare' },
    { name: 'internships', page: 'internships' },
    { name: 'research', page: 'research' },
    { name: 'github', page: 'github' },
    { name: 'blog', page: 'blog' },
    { name: 'ideas', page: 'ideas' },
    { name: 'aureliusgpt', page: 'aureliusgpt' },
    { name: 'podcast', page: 'podcast' }
];

function lsOutput(trimmed) {
    let arg = trimmed.replace(/^(ls|ll|dir)\s*/, '').trim();
    arg = arg.replace(/^~\/?/, '').replace(/\/+$/, '').trim();

    if (!arg) {
        return `<div class="ls-grid">` +
            SITE_DIRS.map(s => `<a class="ls-item" onclick="navigateTo('${s.page}')">${s.name}/</a>`).join('') +
            `</div>`;
    }
    if (arg === 'internships' || arg === 'research') {
        const cos = arg === 'research'
            ? ['cisco', 'dyssonance', 'turing']
            : ['cisco', 'dyssonance', 'turing', 'humanx', 'ema', 'proshort'];
        return `<div class="ls-grid">` +
            cos.map(c => `<span class="ls-plain">${c}</span>`).join('') +
            `</div>`;
    }
    if (arg === 'blog') {
        return `<div class="ls-grid">` +
            `<a class="ls-item" onclick="navigateTo('blog/aureliusgpt')">aureliusgpt-writeup.md</a>` +
            `<a class="ls-item" href="https://medium.com/@vericareai/the-comprehensive-guide-to-requesting-an-itemized-bill-1b002fcb9a7b" target="_blank" rel="noopener">itemized-bill-guide.md ↗</a>` +
            `</div>`;
    }
    if (arg === 'podcast') {
        return `<span class="log-dim">${podcastEpisodes.length} episodes · </span><a class="ls-item" onclick="navigateTo('podcast')">open</a>`;
    }
    if (arg === 'ideas') {
        return `<span class="log-dim">ideas: no public entries yet</span>`;
    }
    if (arg === 'github') {
        return ghRepoOutput();
    }
    if (arg === 'vericare' || arg === 'aureliusgpt') {
        return `<a class="ls-item" onclick="navigateTo('${arg}')">${arg}/</a>`;
    }
    return `<span class="log-err">ls: ${escapeHtml(arg)}: No such directory</span>`;
}

function whoamiOutput() {
    return `<div class="log-kv"><span class="log-k">name</span>Tarush Gupta</div>` +
        `<div class="log-kv"><span class="log-k">role</span>student · founder · builder</div>` +
        `<div class="log-kv"><span class="log-k">founder</span><a class="ls-item" onclick="navigateTo('vericare')">VeriCare AI</a></div>` +
        `<div class="log-kv"><span class="log-k">research</span>Cisco · Turing · Dyssonance AI</div>` +
        `<div class="log-kv"><span class="log-k">focus</span>language models from first principles</div>`;
}

function helpOutput() {
    const rows = [
        ['cd &lt;dir&gt;', 'enter a section — cd research, cd ~'],
        ['ls [dir]', 'list sections, or a section&#39;s contents'],
        ['pwd', 'print the current path'],
        ['whoami', 'the short version'],
        ['git remote -v', 'open the GitHub profile'],
        ['gh repo list', 'list repositories'],
        ['clear', 'clear the terminal']
    ];
    return `<div class="help-grid">` +
        rows.map(r => `<span class="log-cmd-name">${r[0]}</span><span class="log-dim">${r[1]}</span>`).join('') +
        `</div>`;
}

function gitRemoteOutput() {
    return `<div>origin&nbsp;&nbsp;https://github.com/tarush-ai&nbsp;&nbsp;(fetch)</div>` +
        `<div>origin&nbsp;&nbsp;https://github.com/tarush-ai&nbsp;&nbsp;(push)</div>` +
        `<div class="log-dim">→ opening github.com/tarush-ai</div>`;
}

function ghRepoOutput() {
    return `<a class="repo-line" href="https://github.com/tarush-ai/AureliusGPT-Torch" target="_blank" rel="noopener">tarush-ai/AureliusGPT-Torch<span class="log-dim">   845K-param Stoic LM · PyTorch + SentencePiece</span></a>` +
        `<a class="repo-line" href="https://github.com/tarush-ai/AureliusGPT" target="_blank" rel="noopener">tarush-ai/AureliusGPT<span class="log-dim">   Stoic SLM from scratch · NumPy, no PyTorch</span></a>` +
        `<div class="log-dim">// on-site repo pages arrive with GitHub integration</div>`;
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

// ---- terminal command engine -----------------------------------------------
// Commands drive the SPA: `cd <section>` moves you there (blank, behind its
// command); a reveal command (ls/cat/…) streams the current section onto the
// page. Short feedback (errors, pwd, help) shows on a transient line above the
// input — there is no scrolling transcript, and no command runs on its own.
const SECTION_ALIASES = {
    vericare: 'vericare', 'vericare-ai': 'vericare',
    internships: 'internships', internship: 'internships',
    research: 'research', github: 'github', git: 'github',
    blog: 'blog', ideas: 'ideas',
    aureliusgpt: 'aureliusgpt', aurelius: 'aureliusgpt',
    podcast: 'podcast', 'neural-bridge': 'podcast', neuralbridge: 'podcast',
    home: 'home'
};
const REVEAL_CMDS = ['ls', 'll', 'dir', 'cat', 'less', 'more', 'open', 'run', 'view', 'gh', './aureliusgpt'];

function resolveSection(name) {
    if (!name) return null;
    name = name.replace(/^~\/?/, '').replace(/\/+$/, '').trim().toLowerCase();
    if (!name) return null;
    return SECTION_ALIASES[name] || (pages[name] ? name : null);
}

let termFeedbackTimer = null;
function termFeedback(html) {
    const el = document.getElementById('terminal-feedback');
    if (!el) return;
    el.innerHTML = html;
    el.classList.add('visible');
    if (termFeedbackTimer) clearTimeout(termFeedbackTimer);
    termFeedbackTimer = setTimeout(() => el.classList.remove('visible'), 3600);
}
function clearTermFeedback() {
    const el = document.getElementById('terminal-feedback');
    if (el) { el.classList.remove('visible'); el.innerHTML = ''; }
}

function handleCommand(cmd) {
    const raw = (cmd || '').trim();
    if (terminalInput) terminalInput.value = '';
    if (autocompleteGhost) autocompleteGhost.textContent = '';
    if (typeof hideSuggestions === 'function') hideSuggestions();
    if (!raw) return;
    addToHistory(raw);

    // Grouped commands run left to right — `cd vericare && ls`, `a ; b`.
    const segments = raw.split(/\s*(?:&&|;)\s*/).map(s => s.trim()).filter(Boolean);
    segments.forEach(runSingleCommand);
}

function runSingleCommand(raw) {
    const parts = raw.split(/\s+/);
    const c = parts[0].toLowerCase();
    const rest = parts.slice(1).join(' ').trim();

    if (c === 'clear') { clearTermFeedback(); armCurrentPage(); return; }
    if (c === 'help' || c === 'man' || c === '?') {
        termFeedback('<span class="tf-k">ls</span> reveal · <span class="tf-k">cd &lt;section&gt;</span> go · <span class="tf-k">cat</span> · <span class="tf-k">clear</span> · <span class="tf-k">pwd</span>  —  sections: vericare · internships · research · github · blog · ideas · aureliusgpt · podcast');
        return;
    }
    if (c === 'pwd') { termFeedback(escapeHtml(currentPathEl ? currentPathEl.textContent : '~')); return; }
    if (c === 'whoami') { navigateTo('home'); termFeedback('Tarush Gupta — student · founder · builder'); return; }

    // ----- navigation: cd moves you there (page stays blank behind its command)
    if (c === 'cd') {
        const t = rest.toLowerCase();
        if (t === '' || t === '~' || t === '..' || t === '../' || t === '~/') { navigateTo('home'); return; }
        const sec = resolveSection(t);
        if (sec === 'home') { navigateTo('home'); return; }
        if (sec) { navigateTo(sec); return; }
        termFeedback(`<span class="tf-err">cd: no such section: ${escapeHtml(rest)}</span>`);
        return;
    }

    // ----- reveal: render the current (or named) section's content on the page
    if (REVEAL_CMDS.includes(c)) {
        const sec = resolveSection(rest);
        if (sec && sec !== 'home' && sec !== currentPage) { navigateTo(sec); revealCurrentPage(); return; }
        if (currentPage === 'home') {
            termFeedback('<span class="tf-k">ls</span> reveals a section — try <span class="tf-k">cd research</span>, then <span class="tf-k">ls</span>');
            return;
        }
        revealCurrentPage();
        return;
    }

    // ----- bare section name → go there and reveal in one step
    const bare = resolveSection(c);
    if (bare === 'home') { navigateTo('home'); return; }
    if (bare) { navigateTo(bare); revealCurrentPage(); return; }

    termFeedback(`<span class="tf-err">command not found: ${escapeHtml(parts[0])}</span>`);
}

// Make toggle function global
window.toggleTerminalExpand = toggleTerminalExpand;

// Terminal input handlers — only wired if the (decorative) input exists.
terminalInput && terminalInput.addEventListener('input', () => {
    updateAutocompleteGhost();
    renderSuggestions();
});

terminalInput && terminalInput.addEventListener('blur', () => {
    // Delay so a click on a suggestion can register before the menu closes.
    setTimeout(hideSuggestions, 120);
});

if (suggestionsEl) {
    suggestionsEl.addEventListener('mousedown', (e) => {
        const item = e.target.closest('.suggestion-item');
        if (!item) return;
        e.preventDefault(); // keep the input focused
        const picked = item.dataset.cmd;
        terminalInput.value = picked;
        autocompleteGhost.textContent = '';
        hideSuggestions();
        handleCommand(picked);
    });
}

let historyIndex = -1;

terminalInput && terminalInput.addEventListener('keydown', (e) => {
    const menuOpen = suggestionItems.length > 0 && suggestionsEl && suggestionsEl.classList.contains('visible');

    if (e.key === 'Tab') {
        e.preventDefault();
        const pick = (suggestionActive >= 0 && suggestionItems[suggestionActive]) || currentCompletion();
        if (pick) {
            terminalInput.value = pick;
            autocompleteGhost.textContent = '';
            suggestionActive = -1;
            renderSuggestions();
        }
        return;
    }

    if (e.key === 'Escape') {
        hideSuggestions();
        return;
    }

    if (e.key === 'Enter') {
        historyIndex = -1;
        const val = (menuOpen && suggestionActive >= 0) ? suggestionItems[suggestionActive] : terminalInput.value;
        hideSuggestions();
        handleCommand(val);
        return;
    }

    if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (menuOpen) {
            suggestionActive = Math.min(suggestionActive + 1, suggestionItems.length - 1);
            renderSuggestions();
        } else if (historyIndex > 0) {
            historyIndex--;
            terminalInput.value = commandHistory[historyIndex] || '';
        } else {
            historyIndex = -1;
            terminalInput.value = '';
        }
        return;
    }

    if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (menuOpen) {
            suggestionActive = suggestionActive <= 0 ? suggestionItems.length - 1 : suggestionActive - 1;
            renderSuggestions();
        } else if (commandHistory.length > 0) {
            historyIndex = Math.min(historyIndex + 1, commandHistory.length - 1);
            terminalInput.value = commandHistory[historyIndex] || '';
        }
        return;
    }
});


// Make functions available globally
window.navigateTo = navigateTo;
window.toggleMode = toggleMode;

// Toggle switch event listeners
toggleSwitch.addEventListener('click', toggleMode);
themeToggleSwitch.addEventListener('click', toggleTheme);

// Theme Toggle Functions
function toggleTheme() {
    const isLightMode = document.body.classList.toggle('light-mode');
    const label = document.getElementById('theme-toggle-label');
    
    if (isLightMode) {
        label.textContent = 'Light Mode';
    } else {
        label.textContent = 'Dark Mode';
    }
    
    localStorage.setItem('theme', isLightMode ? 'light' : 'dark');
}

function loadThemePreference() {
    const savedTheme = localStorage.getItem('theme');
    const label = document.getElementById('theme-toggle-label');
    
    if (savedTheme === 'light') {
        document.body.classList.add('light-mode');
        if (label) label.textContent = 'Light Mode';
    } else {
        if (label) label.textContent = 'Dark Mode';
    }
}

// AureliusGPT Chat
// Backend handles the inference


// Quotes
const stoicQuotes = [
    "You have power over your mind—not outside events. Realize this, and you will find strength.",
    "The impediment to action advances action. What stands in the way becomes the way.",
    "Waste no more time arguing about what a good man should be. Be one.",
    "Very little is needed to make a happy life; it is all within yourself, in your way of thinking.",
    "If it is not right, do not do it. If it is not true, do not say it.",
    "The best revenge is to be unlike him who performed the injury.",
    "When you arise in the morning, think of what a precious privilege it is to be alive—to breathe, to think, to enjoy, to love.",
    "Confine yourself to the present.",
    "Everything we hear is an opinion, not a fact. Everything we see is a perspective, not the truth.",
    "The soul becomes dyed with the color of its thoughts.",
    "Accept the things to which fate binds you, and love the people with whom fate brings you together, but do so with all your heart.",
    "He who lives in harmony with himself lives in harmony with the universe.",
    "Our life is what our thoughts make it.",
    "The happiness of your life depends upon the quality of your thoughts.",
    "Dwell on the beauty of life. Watch the stars, and see yourself running with them."
];

// Get random stoic quote
function getRandomQuote() {
    return stoicQuotes[Math.floor(Math.random() * stoicQuotes.length)];
}

// Cycle the Aurelius emblem quote with a gentle cross-fade.
let quoteCycleInterval = null;
function startQuoteCycle() {
    const el = document.querySelector('.aurelius-quote');
    if (!el) return;
    stopQuoteCycle();
    el.textContent = getRandomQuote();
    if (prefersReducedMotion()) return;
    quoteCycleInterval = setInterval(() => {
        el.style.opacity = '0';
        setTimeout(() => {
            let q = getRandomQuote();
            while (q === el.textContent && stoicQuotes.length > 1) q = getRandomQuote();
            el.textContent = q;
            el.style.opacity = '1';
        }, 400);
    }, 6500);
}
function stopQuoteCycle() {
    if (quoteCycleInterval) { clearInterval(quoteCycleInterval); quoteCycleInterval = null; }
}

let isAureliusSending = false;
let conversationHistory = [];
let countdownTimer = null;
let pendingRetryMessage = null;

// Cycling autocomplete for sample prompts
const aureliusSamplePrompts = ['Death', 'Virtue', 'Accept', 'Nature'];
let currentAureliusPromptIndex = 0;
let aureliusPromptCycleInterval = null;

// Sample prompt handler
function useSamplePrompt(prompt) {
    const input = document.getElementById('aurelius-input');
    if (input) {
        input.value = prompt;
        input.focus();
    }
}

// Start cycling through sample prompts
function startAureliusPromptCycle() {
    const cyclingTextEl = document.getElementById('aurelius-cycling-prompt');
    if (!cyclingTextEl) return;
    
    // Update immediately
    updateAureliusPrompt();
    
    // Cycle every 3 seconds
    aureliusPromptCycleInterval = setInterval(() => {
        currentAureliusPromptIndex = (currentAureliusPromptIndex + 1) % aureliusSamplePrompts.length;
        updateAureliusPrompt();
    }, 3000);
}

// Update the cycling prompt with fade animation
function updateAureliusPrompt() {
    const cyclingTextEl = document.getElementById('aurelius-cycling-prompt');
    if (!cyclingTextEl) return;
    
    cyclingTextEl.style.opacity = '0';
    setTimeout(() => {
        cyclingTextEl.textContent = aureliusSamplePrompts[currentAureliusPromptIndex];
        cyclingTextEl.style.opacity = '1';
    }, 150);
}

// Stop cycling prompts
function stopAureliusPromptCycle() {
    if (aureliusPromptCycleInterval) {
        clearInterval(aureliusPromptCycleInterval);
        aureliusPromptCycleInterval = null;
    }
}

// Make it globally available
window.useSamplePrompt = useSamplePrompt;

// Aurelius is now a typographic emblem, not pictures — state no longer swaps images.
function setAureliusImage() {}

// Export functionality
function exportConversation(format) {
    if (conversationHistory.length === 0) {
        alert('No conversation to export yet. Start chatting with Aurelius first!');
        return;
    }
    
    // CLI-style TXT export
    const content = conversationHistory.map(msg => {
        const prefix = msg.role === 'user' ? '> ' : '> AURELIUS: ';
        const timestamp = new Date(msg.timestamp).toLocaleString();
        return `[${timestamp}] ${prefix}${msg.content}`;
    }).join('\n\n');
    
    const filename = 'aurelius-conversation.txt';
    const mimeType = 'text/plain';
    
    // Create and trigger download
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// Show countdown for 503 errors
function showCountdown(messagesContainer) {
    const countdownEl = document.createElement('div');
    countdownEl.className = 'aurelius-message';
    countdownEl.innerHTML = `
        <div class="message-content">
            <div class="aurelius-countdown">
                <h3>Aurelius is meditating...</h3>
                <div class="countdown-timer" id="countdown-display">30</div>
                <p style="color: var(--text-dim); font-size: 13px;">The server is starting up. Retrying automatically...</p>
            </div>
        </div>
    `;
    messagesContainer.appendChild(countdownEl);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    
    // Set image to meditating state
    setAureliusImage('meditating');
    
    let secondsLeft = 30;
    const display = document.getElementById('countdown-display');
    
    countdownTimer = setInterval(() => {
        secondsLeft--;
        if (display) {
            display.textContent = secondsLeft;
        }
        
        if (secondsLeft <= 0) {
            clearInterval(countdownTimer);
            if (countdownEl.parentNode) {
                messagesContainer.removeChild(countdownEl);
            }
            // Return to idle state
            setAureliusImage('idle');
            
                // Auto-retry the pending message
                if (pendingRetryMessage) {
                    const messageToRetry = pendingRetryMessage;
                    pendingRetryMessage = null;
                    
                    // Retry immediately without showing duplicate user message
                    sendAureliusMessageWithText(messageToRetry, true);
                }
        }
    }, 1000);
}

// Helper function that sends a message with specific text (used for auto-retry)
async function sendAureliusMessageWithText(messageText, skipUserMessage = false) {
    const messagesContainer = document.getElementById('aurelius-messages');
    const sendBtn = document.getElementById('aurelius-send-btn');
    
    if (!messageText || isAureliusSending) return;
    
    const userMessage = messageText;
    
    // Add user message to chat (unless skipping for retry)
    if (!skipUserMessage) {
        const userMessageEl = document.createElement('div');
        userMessageEl.className = 'aurelius-message user-message';
        userMessageEl.innerHTML = `
            <div class="message-content">
                <div class="message-text">${escapeHtml(userMessage)}</div>
            </div>
        `;
        messagesContainer.appendChild(userMessageEl);
        
        // Add to conversation history
        conversationHistory.push({
            role: 'user',
            content: userMessage,
            timestamp: new Date()
        });
    }
    
    // Scroll to bottom
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    
    // Set to thinking state
    setAureliusImage('thinking');
    
    // Show loading indicator
    const loadingEl = document.createElement('div');
    loadingEl.className = 'aurelius-message loading-message';
    loadingEl.innerHTML = `
        <div class="message-content">
            <div class="message-text" style="color: var(--accent-purple);">
                <span style="font-weight: 600;">> AURELIUS: </span>
                <div class="typing-indicator" style="display: inline-block;">
                    <span></span><span></span><span></span>
                </div>
            </div>
        </div>
    `;
    messagesContainer.appendChild(loadingEl);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    
    isAureliusSending = true;
    sendBtn.disabled = true;
    
    try {
        // Call backend
        const response = await fetch("/api/aurelius", {
            method: "POST",
            headers: { 
                "Content-Type": "application/json" 
            },
            body: JSON.stringify({ 
                "inputs": userMessage,
                "parameters": {
                    "max_new_tokens": 250,
                    "temperature": 0.8,
                    "top_p": 0.9,
                    "do_sample": true
                }
            })
        });
        
        // Remove loading indicator
        messagesContainer.removeChild(loadingEl);
        
        // Handle 503 error specifically
        if (response.status === 503) {
            setAureliusImage('idle');
            isAureliusSending = false;
            sendBtn.disabled = false;
            
            // Store message for auto-retry
            pendingRetryMessage = userMessage;
            
            showCountdown(messagesContainer);
            return;
        }
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `API Error: ${response.status}`);
        }
        
        const data = await response.json();
        let aureliusResponse = '';
        
        // Handle different response formats
        if (Array.isArray(data) && data[0]?.generated_text) {
            aureliusResponse = data[0].generated_text;
            // Remove the input prompt if it's repeated
            if (aureliusResponse.startsWith(userMessage)) {
                aureliusResponse = aureliusResponse.slice(userMessage.length).trim();
            }
        } else if (data.generated_text) {
            aureliusResponse = data.generated_text;
        } else {
            aureliusResponse = "The winds of wisdom are silent today. Try again, seeker.";
        }
        
        // Fix: Strip duplicate "Aurelius:" prefix from backend response (case-insensitive)
        aureliusResponse = aureliusResponse.replace(/^(aurelius:\s*)/i, '').trim();
        
        // Show eureka state
        setAureliusImage('eureka');
        
        // Add to conversation history
        conversationHistory.push({
            role: 'assistant',
            content: aureliusResponse,
            timestamp: new Date()
        });
        
        // Add Aurelius response with typewriter effect
        const aureliusMessageEl = document.createElement('div');
        aureliusMessageEl.className = 'aurelius-message aurelius-response';
        aureliusMessageEl.innerHTML = `
            <div class="message-content">
                <div class="message-text"></div>
            </div>
        `;
        messagesContainer.appendChild(aureliusMessageEl);
        
        const messageTextEl = aureliusMessageEl.querySelector('.message-text');
        await typewriterEffect(aureliusResponse, messageTextEl, 20);
        
        // Check if validator is enabled
        const validatorEnabled = document.getElementById('stoic-validator-toggle').checked;
        
        if (validatorEnabled) {
            // Call justification API
            try {
                const justificationResponse = await fetch("/api/justify", {
                    method: "POST",
                    headers: { 
                        "Content-Type": "application/json" 
                    },
                    body: JSON.stringify({ 
                        user_prompt: userMessage,
                        model_response: aureliusResponse
                    })
                });
                
                if (justificationResponse.ok) {
                    const justData = await justificationResponse.json();
                    const justification = justData.justification;
                    
                    // Parse markdown to HTML
                    const markdownHTML = marked.parse(justification);
                    
                    // Add justification message
                    const justificationEl = document.createElement('div');
                    justificationEl.className = 'aurelius-message justification-message';
                    justificationEl.innerHTML = `
                        <div class="message-content">
                            <div class="message-text">
                                <span class="justification-prefix">> JUSTIFICATION: </span>
                                <div class="markdown-content">${markdownHTML}</div>
                            </div>
                        </div>
                    `;
                    messagesContainer.appendChild(justificationEl);
                    messagesContainer.scrollTop = messagesContainer.scrollHeight;
                }
            } catch (error) {
                console.error('Justification Error:', error);
            }
        }
        
        // Return to idle state after response
        setTimeout(() => {
            setAureliusImage('idle');
        }, 2000);
        
    } catch (error) {
        console.error('AureliusGPT Error:', error);
        
        // Remove loading indicator
        if (loadingEl.parentNode) {
            messagesContainer.removeChild(loadingEl);
        }
        
        // Return to idle state
        setAureliusImage('idle');
        
        // Show error message
        const errorMessageEl = document.createElement('div');
        errorMessageEl.className = 'aurelius-message error-message';
        errorMessageEl.innerHTML = `
            <div class="message-content">
                <div class="message-text" style="color: #fca5a5;">
                    <span style="font-weight: 600;">> ERROR: </span>The oracle is temporarily silent. The server may be starting up or the token may need configuration.
                    <br><small style="opacity: 0.6;">Error: ${error.message}</small>
                </div>
            </div>
        `;
        messagesContainer.appendChild(errorMessageEl);
    } finally {
        isAureliusSending = false;
        sendBtn.disabled = false;
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
}

// Wrapper function that gets input value and calls the helper
async function sendAureliusMessage() {
    const input = document.getElementById('aurelius-input');
    const userMessage = input.value.trim();
    
    if (!userMessage || isAureliusSending) return;
    
    // Clear input
    input.value = '';
    input.style.height = 'auto';
    
    // Call the helper function with the message text
    await sendAureliusMessageWithText(userMessage);
}

// Make exportConversation globally available
window.exportConversation = exportConversation;

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Typewriter effect
async function typewriterEffect(text, element, speed = 30) {
    element.textContent = '';
    for (let i = 0; i < text.length; i++) {
        element.textContent += text.charAt(i);
        await new Promise(resolve => setTimeout(resolve, speed));
    }
}

// Particles removed for restraint.
function createAureliusParticles() {}

// Init Aurelius
function initializeAureliusGPT() {
    const aureliusInput = document.getElementById('aurelius-input');
    if (aureliusInput && !aureliusInput.dataset.initialized) {
        aureliusInput.dataset.initialized = 'true';
        
        // Textarea auto-resize
        aureliusInput.addEventListener('input', function() {
            this.style.height = 'auto';
            this.style.height = Math.min(this.scrollHeight, 120) + 'px';
            
            // Hide autocomplete when user is typing
            const autocomplete = document.getElementById('aurelius-autocomplete');
            if (autocomplete) {
                if (this.value.trim()) {
                    autocomplete.style.opacity = '0';
                    autocomplete.style.pointerEvents = 'none';
                } else {
                    autocomplete.style.opacity = '1';
                    autocomplete.style.pointerEvents = 'all';
                }
            }
        });
        
        // Enter to send, Tab to accept autocomplete
        aureliusInput.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendAureliusMessage();
            }
            
            // Tab to accept cycling prompt
            if (e.key === 'Tab' && !this.value.trim()) {
                e.preventDefault();
                const currentPrompt = aureliusSamplePrompts[currentAureliusPromptIndex];
                this.value = currentPrompt;
                this.focus();
                
                // Hide autocomplete
                const autocomplete = document.getElementById('aurelius-autocomplete');
                if (autocomplete) {
                    autocomplete.style.opacity = '0';
                    autocomplete.style.pointerEvents = 'none';
                }
            }
        });
    }
    
    // Start cycling prompts
    startAureliusPromptCycle();
    
    // Create particles
    createAureliusParticles();
}

// Global export
window.sendAureliusMessage = sendAureliusMessage;

// Keep the in-menu Dark/Terminal switches showing the current state.
function syncMenuToggles() {
    const t = document.querySelector('.mnc-switch[data-role="theme"]');
    const m = document.querySelector('.mnc-switch[data-role="mode"]');
    if (t) t.classList.toggle('on', !document.body.classList.contains('light-mode')); // dark = on
    if (m) m.classList.toggle('on', terminalMode); // terminal on = on
}
window.syncMenuToggles = syncMenuToggles;

// Mobile Navigation Toggle
function toggleMobileNav() {
    const navOverlay = document.getElementById('mobile-nav-overlay');

    if (navOverlay) {
        navOverlay.classList.toggle('active');

        if (navOverlay.classList.contains('active')) {
            document.body.style.overflow = 'hidden'; // Prevent scrolling background
            syncMenuToggles(); // reflect current Dark/Terminal state on open
        } else {
            document.body.style.overflow = '';
        }
    }
}

// Make toggleMobileNav global
window.toggleMobileNav = toggleMobileNav;

// Dismiss the mobile menu by clicking anywhere outside the links, or via Escape.
(function wireMobileNavDismiss() {
    const overlay = document.getElementById('mobile-nav-overlay');
    if (overlay) {
        overlay.addEventListener('click', (e) => {
            // Clicks on the backdrop / header gap (not a link) close the menu.
            if (e.target === overlay ||
                e.target.classList.contains('mobile-nav-links') ||
                e.target.classList.contains('mobile-nav-header')) {
                toggleMobileNav();
            }
        });
    }
    document.addEventListener('keydown', (e) => {
        if (e.key !== 'Escape') return;
        const o = document.getElementById('mobile-nav-overlay');
        if (o && o.classList.contains('active')) toggleMobileNav();
    });
})();

// ============================================================================
// GitHub dashboard — bespoke rendering of live /api/github data (profile,
// contribution calendar, recent repos). Fetched once, re-rendered from cache.
// ============================================================================
let githubData = null;
let githubFetching = false;

async function loadGitHub() {
    const host = document.getElementById('github-live');
    if (!host) return;
    if (githubData) { renderGitHub(githubData); return; }
    if (githubFetching) return;
    githubFetching = true;
    host.innerHTML = '<div class="gh-loading">fetching from github<span class="gh-dots">…</span></div>';
    try {
        const res = await fetch('/api/github');
        githubData = await res.json();
        renderGitHub(githubData);
    } catch (e) {
        host.innerHTML = '<div class="gh-error">Could not reach the GitHub API. ' +
            '<a href="https://github.com/tarush-ai" target="_blank">Open GitHub →</a></div>';
    } finally {
        githubFetching = false;
    }
}

function ghEscape(s) {
    if (s == null) return '';
    return String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
}

function ghRelTime(iso) {
    if (!iso) return '';
    const then = new Date(iso).getTime();
    if (isNaN(then)) return '';
    const secs = Math.max(1, Math.floor((Date.now() - then) / 1000));
    const units = [['year', 31536000], ['month', 2592000], ['week', 604800], ['day', 86400], ['hour', 3600], ['minute', 60]];
    for (const [name, s] of units) {
        const v = Math.floor(secs / s);
        if (v >= 1) return `${v} ${name}${v > 1 ? 's' : ''} ago`;
    }
    return 'just now';
}

function ghLevel(count) {
    if (!count) return 0;
    if (count <= 2) return 1;
    if (count <= 5) return 2;
    if (count <= 9) return 3;
    return 4;
}

function renderGitHub(data) {
    const host = document.getElementById('github-live');
    if (!host) return;
    if (!data || data.ok === false) {
        const login = (data && data.username) || 'tarush-ai';
        host.innerHTML = '<div class="gh-error">GitHub data is temporarily unavailable. ' +
            '<a href="https://github.com/' + ghEscape(login) + '" target="_blank">Open GitHub →</a></div>';
        return;
    }
    host.innerHTML = [
        renderGhProfile(data.profile),
        renderGhCalendar(data.calendar),
        renderGhRepos(data.repos, data.profile)
    ].join('');
}

// Curated, hardcoded identity block — stable and on-brand (not pulled live).
// The contribution graph and repositories below stay live from the API.
function renderGhProfile() {
    return `
    <div class="gh-profile">
        <img class="gh-avatar" src="/assets/logo-mark.png" alt="Tarush Gupta">
        <div class="gh-identity">
            <a class="gh-name" href="https://github.com/tarush-ai" target="_blank">Tarush Gupta</a>
            <span class="gh-login">@tarush-ai</span>
        </div>
        <p class="gh-bio">Building language models from first principles. AI research at <strong>Cisco</strong>, <strong>Turing</strong>, and <strong>Dyssonance AI</strong> · founder of <strong>VeriCare AI</strong>.</p>
    </div>`;
}

function renderGhCalendar(cal) {
    if (!cal) {
        return `
        <div class="gh-section">
            <div class="gh-section-title">Contributions</div>
            <div class="gh-note">Add a <code>GITHUB_TOKEN</code> to <code>.env</code> to render the contribution graph — the calendar is only exposed through GitHub's GraphQL API.</div>
        </div>`;
    }
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    let monthRow = '';
    let lastMonth = -1;
    cal.weeks.forEach(week => {
        const first = week[0];
        let label = '';
        if (first) {
            const m = new Date(first.date).getMonth();
            if (m !== lastMonth) { label = months[m]; lastMonth = m; }
        }
        monthRow += `<div class="gh-month">${label}</div>`;
    });
    let grid = '';
    cal.weeks.forEach(week => {
        const byDay = {};
        week.forEach(d => { byDay[d.weekday] = d; });
        let col = '';
        for (let wd = 0; wd < 7; wd++) {
            const d = byDay[wd];
            if (!d) { col += '<div class="gh-cell gh-empty"></div>'; continue; }
            const label = `${d.count} contribution${d.count === 1 ? '' : 's'} on ${d.date}`;
            col += `<div class="gh-cell" data-level="${ghLevel(d.count)}" title="${label}"></div>`;
        }
        grid += `<div class="gh-week">${col}</div>`;
    });
    return `
    <div class="gh-section">
        <div class="gh-section-title">${cal.total.toLocaleString()} contributions in the last year</div>
        <div class="gh-graph-scroll">
            <div class="gh-graph">
                <div class="gh-months">${monthRow}</div>
                <div class="gh-grid">${grid}</div>
            </div>
        </div>
        <div class="gh-legend">
            <span>Less</span>
            <span class="gh-cell" data-level="0"></span>
            <span class="gh-cell" data-level="1"></span>
            <span class="gh-cell" data-level="2"></span>
            <span class="gh-cell" data-level="3"></span>
            <span class="gh-cell" data-level="4"></span>
            <span>More</span>
        </div>
    </div>`;
}

function renderGhRepos(repos, profile) {
    if (!repos || !repos.length) return '';
    const cards = repos.map(r => {
        const lang = r.language && r.language.name
            ? `<span class="gh-lang"><span class="gh-lang-dot"></span>${ghEscape(r.language.name)}</span>` : '';
        const stars = r.stars ? `<span class="gh-meta-item">★ ${r.stars}</span>` : '';
        const forks = r.forks ? `<span class="gh-meta-item">⑂ ${r.forks}</span>` : '';
        const updated = r.pushedAt ? `<span class="gh-meta-item">updated ${ghRelTime(r.pushedAt)}</span>` : '';
        return `
        <a class="gh-repo" href="${ghEscape(r.url)}" target="_blank">
            <div class="gh-repo-name">${ghEscape(r.name)}</div>
            ${r.description ? `<p class="gh-repo-desc">${ghEscape(r.description)}</p>` : ''}
            <div class="gh-repo-meta">${lang}${stars}${forks}${updated}</div>
        </a>`;
    }).join('');
    const allLink = profile && profile.url
        ? `<a class="gh-all" href="${ghEscape(profile.url)}?tab=repositories" target="_blank">All repositories →</a>` : '';
    return `
    <div class="gh-section">
        <div class="gh-section-title">Recent repositories</div>
        <div class="gh-repos">${cards}</div>
        ${allLink}
    </div>`;
}

window.loadGitHub = loadGitHub;
