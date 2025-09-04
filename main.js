/* main.js — Enter Spain interactive script (refreshed) */
(() => {
    // Elements
    const hamburger = document.getElementById('hamburger');
    const navMenu = document.getElementById('nav-menu');

    const openChatBtn = document.getElementById('openChatBtn');
    const chatSection = document.getElementById('chat');
    const chatMessages = document.getElementById('chat-messages');
    const userInput = document.getElementById('user-input');
    const sendBtn = document.getElementById('send-btn');
    const typingIndicator = document.getElementById('typing-indicator');
    const clearChatBtn = document.getElementById('clear-chat');
    const toggleDemoBtn = document.getElementById('toggle-demo');
    const demoStateEl = document.getElementById('demo-state');
    const settingsModal = document.getElementById('settingsModal');
    const settingsForm = document.getElementById('settingsForm');
    const apiEndpointEl = document.getElementById('api-endpoint');
    const apiTokenEl = document.getElementById('api-token');
    const exampleQs = document.querySelectorAll('.example-questions li');
    const yearEl = document.getElementById('year');
    const tabButtons = document.querySelectorAll('.tab');
    const tabPanels = document.querySelectorAll('.tab-panel');

    // Utilities
    const STORAGE_KEY = 'enter-spain-thread-v1';
    const SETTINGS_KEY = 'enter-spain-settings-v1';
    const DEMO_KEY = 'enter-spain-demo-v1';

    function loadSettings(){
        try{
            return JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}');
        }catch(e){ return {}; }
    }
    function saveSettings(s){ localStorage.setItem(SETTINGS_KEY, JSON.stringify(s || {})); }

    let settings = loadSettings();
    if (settings.endpoint) apiEndpointEl.value = settings.endpoint;
    if (settings.token) apiTokenEl.value = settings.token;

    // Demo mode
    function getDemo(){ try { return JSON.parse(localStorage.getItem(DEMO_KEY)); } catch { return true; } }
    function setDemo(v){ localStorage.setItem(DEMO_KEY, JSON.stringify(!!v)); demoStateEl.textContent = v ? 'On' : 'Off'; }
    if (typeof getDemo() === 'undefined' || getDemo() === null) setDemo(true);
    else setDemo(getDemo());

    // Thread (messages)
    function loadThread(){ try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); } catch { return []; } }
    function saveThread(t){ localStorage.setItem(STORAGE_KEY, JSON.stringify(t)); }

    let thread = loadThread();

    // Render messages
    function createMsgEl(role, text){
        const div = document.createElement('div');
        div.className = 'chat-message ' + (role === 'ai' ? 'ai' : 'user');
        div.innerHTML = text.split('\n').map(escapeHtml).join('<br/>'); // preserve line breaks
        return div;
    }
    function escapeHtml(s){
        return s.replace(/&/g, '&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    }

    function renderThread(){
        chatMessages.innerHTML = '';
        thread.forEach(m => chatMessages.appendChild(createMsgEl(m.role, m.content)));
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    // Ensure initial welcome
    function ensureWelcome(){
        if (thread.length === 0){
            thread.push({role:'ai', content:'¡Hola! I\'m your Enter Spain AI Agent. Ask me anything about moving to Spain.'});
            saveThread(thread);
        }
        renderThread();
    }

    // Typing indicator
    function showTyping(){
        typingIndicator.classList.remove('hidden');
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
    function hideTyping(){
        typingIndicator.classList.add('hidden');
    }

    // Demo responder
    function demoAnswer(q){
        const lower = q.toLowerCase();
        if (lower.includes('digital nomad') || lower.includes('nomad')) {
            return `Quick Digital Nomad Visa overview:\n\n• Eligibility: remote work and sufficient income.\n• Typical income guideline: around €2,500–€3,000/month (varies).\n• Documents: passport, application, proof of income, health insurance, background check, bank statements.\n• Apply at Spanish consulate or in-country (timing may vary).\n\nTell me your country of residence and I can tailor the checklist.`;
        }
        if (lower.includes('empadron') || lower.includes('padron')) {
            return `Empadronamiento (padrón): register your address at the local town hall (ayuntamiento). Book an appointment, bring ID and proof of address (rental contract or landlord declaration). It's often required for healthcare, schools and some registrations.`;
        }
        if (lower.includes('bank') || lower.includes('account')) {
            return `Opening a bank account in Spain: options include banks that onboard non-residents online, or local branches that request NIE/padron. Bring passport, proof of address and sometimes a employment/contract or proof of funds.`;
        }
        if (lower.includes('health')) {
            return `Private health insurance: required for many visa types. Look for comprehensive coverage with low/no waiting periods and repatriation.`;
        }
        return `Got it. Tell me your goal (for example: "get DNV from Mexico City", "open a bank account in Barcelona") and I'll map the steps and documents you need.`;
    }

    // Send flow
    async function sendMessage(){
        const text = userInput.value.trim();
        if (!text) return;
        thread.push({role:'user', content:text});
        saveThread(thread);
        renderThread();
        userInput.value = '';
        showTyping();

        try {
            const isDemo = getDemo();
            if (isDemo){
                await delay(700 + Math.random()*500);
                hideTyping();
                thread.push({role:'ai', content: demoAnswer(text)});
                saveThread(thread);
                renderThread();
                return;
            }

            const endpoint = (apiEndpointEl.value || settings.endpoint || '').trim();
            if (!endpoint){
                hideTyping();
                thread.push({role:'ai', content:'No API endpoint configured. Open Settings and add your serverless proxy endpoint.'});
                saveThread(thread); renderThread(); return;
            }

            const payload = { messages: thread, metadata:{source:'enterspain-web', t:Date.now()} };
            const res = await fetch(endpoint, {
                method:'POST',
                headers: Object.assign({'Content-Type':'application/json'}, settings.token ? {'Authorization': settings.token} : {}),
                body: JSON.stringify(payload)
            });
            if (!res.ok){
                hideTyping();
                thread.push({role:'ai', content:`API error: ${res.status} ${res.statusText}`});
                saveThread(thread); renderThread(); return;
            }
            const data = await res.json();
            hideTyping();
            const reply = data.reply || data.answer || (typeof data === 'string' ? data : JSON.stringify(data).slice(0,800));
            thread.push({role:'ai', content: reply});
            saveThread(thread); renderThread();

        } catch (err){
            console.error(err);
            hideTyping();
            thread.push({role:'ai', content:'Network error while contacting the API. Please try again or enable Demo Mode.'});
            saveThread(thread); renderThread();
        }
    }

    function delay(ms){ return new Promise(r => setTimeout(r, ms)); }

    // Events
    sendBtn.addEventListener('click', sendMessage);
    userInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') { e.preventDefault(); sendMessage(); } });

    exampleQs.forEach(item => {
        item.addEventListener('click', () => {
            userInput.value = item.textContent;
            sendMessage();
        });
    });

    clearChatBtn.addEventListener('click', () => {
        if (!confirm('Clear this conversation?')) return;
        thread = [];
        saveThread(thread);
        ensureWelcome();
    });

    toggleDemoBtn.addEventListener('click', () => {
        const now = !getDemo();
        setDemo(now);
    });

    // Settings modal
    document.getElementById('open-settings').addEventListener('click', ()=> settingsModal.showModal());
    settingsForm.addEventListener('submit', (e) => {
        e.preventDefault();
        settings.endpoint = apiEndpointEl.value.trim();
        settings.token = apiTokenEl.value.trim();
        saveSettings(settings);
        settingsModal.close();
        alert('Settings saved locally in your browser.');
    });

    // Tabs
    tabButtons.forEach(btn => btn.addEventListener('click', (e) => {
        tabButtons.forEach(b => b.classList.remove('active'));
        tabPanels.forEach(p => p.classList.remove('active'));
        e.currentTarget.classList.add('active');
        document.getElementById(e.currentTarget.dataset.target).classList.add('active');
    }));

    // Hamburger menu
    function toggleMenu(){
        navMenu.classList.toggle('show');
        hamburger.classList.toggle('active');
        document.body.classList.toggle('menu-open');
    }
    hamburger.addEventListener('click', toggleMenu);
    hamburger.addEventListener('keypress', (e)=> { if (e.key === 'Enter') toggleMenu(); });

    document.querySelectorAll('#nav-menu a').forEach(a => a.addEventListener('click', () => {
        if (navMenu.classList.contains('show')) toggleMenu();
    }));

    // Open chat button scroll
    openChatBtn.addEventListener('click', () => {
        chatSection.scrollIntoView({behavior:'smooth', block:'start'});
        userInput.focus();
    });

    // Year
    yearEl.textContent = new Date().getFullYear();

    // Init
    ensureWelcome();

    // Escape key closes modal/menu
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape'){
            if (navMenu.classList.contains('show')) toggleMenu();
            if (settingsModal.open) settingsModal.close();
        }
    });
})();
