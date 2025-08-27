// ----------------- CHAT -----------------
const chatMessages = document.getElementById('chat-messages');
const userInput = document.getElementById('user-input');
const sendBtn = document.getElementById('send-btn');
const typingIndicator = document.getElementById('typing-indicator');

// Add message
function addMessage(text, sender) {
    const msg = document.createElement('div');
    msg.classList.add('chat-message', sender);
    msg.textContent = text;
    chatMessages.appendChild(msg);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Send message
function sendMessage() {
    const text = userInput.value.trim();
    if (!text) return;

    addMessage(text, 'user');
    userInput.value = '';

    typingIndicator.classList.remove('hidden');

    setTimeout(() => {
        typingIndicator.classList.add('hidden');
        addMessage("This is a placeholder AI reply. Later we’ll hook me up to OpenAI or your backend.", 'ai');
    }, 1500);
}

sendBtn.addEventListener('click', sendMessage);
userInput.addEventListener('keypress', e => {
    if (e.key === 'Enter') sendMessage();
});

// Example question click
document.querySelectorAll('.example-questions li').forEach(item => {
    item.addEventListener('click', () => {
        userInput.value = item.textContent;
        sendMessage();
    });
});

// ----------------- HAMBURGER -----------------
const hamburger = document.getElementById('hamburger');
const navMenu = document.getElementById('nav-menu');

function toggleMenu() {
    navMenu.classList.toggle('show');
    hamburger.classList.toggle('active');
    document.body.classList.toggle('menu-open');
}

hamburger.addEventListener('click', toggleMenu);

// Close menu on link click
document.querySelectorAll('#nav-menu a').forEach(link => {
    link.addEventListener('click', () => {
        if(window.innerWidth <= 768){
            navMenu.classList.remove('show');
            hamburger.classList.remove('active');
            document.body.classList.remove('menu-open');
        }
    });
});

// Close menu if clicked outside
document.body.addEventListener('click', (e)=>{
    if(document.body.classList.contains('menu-open')){
        if(!navMenu.contains(e.target) && !hamburger.contains(e.target)){
            navMenu.classList.remove('show');
            hamburger.classList.remove('active');
            document.body.classList.remove('menu-open');
        }
    }
});
