const GROQ_URL = "/api/chat";

let currentVoice = 'male';
let stats = JSON.parse(localStorage.getItem('kirongAI_stats')) || {msg:0, img:0};

const chatBox = document.getElementById('chatBox');
const userInput = document.getElementById('userInput');
const sendBtn = document.getElementById('sendBtn');
const voiceSelect = document.getElementById('voiceSelect');
const themeBtn = document.getElementById('themeBtn');
const typing = document.getElementById('typing');
const micBtn = document.getElementById('micBtn');
const uploadBtn = document.getElementById('uploadBtn');
const fileInput = document.getElementById('fileInput');
const locationBtn = document.getElementById('locationBtn');
const clearBtn = document.getElementById('clearBtn');
const exportBtn = document.getElementById('exportBtn');
const quickBtns = document.querySelectorAll('.quick-btn');

// THEME
if(localStorage.getItem('theme') === 'dark') {
  document.body.classList.add('dark');
  themeBtn.textContent = '☀️';
}
themeBtn.addEventListener('click', () => {
  document.body.classList.toggle('dark');
  themeBtn.textContent = document.body.classList.contains('dark')? '☀️' : '🌙';
  localStorage.setItem('theme', document.body.classList.contains('dark')? 'dark' : 'light');
});

async function getGroqResponse(prompt) {
    const res = await fetch(GROQ_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            model: "llama-3.1-70b-versatile",
            messages: [{ role: "user", content: prompt }],
            temperature: 0.7
        })
    });
    const data = await res.json();
    return data.choices[0].message.content;
}

function speak(text) {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = voiceSelect.value;
    utterance.rate = 1;
    speechSynthesis.speak(utterance);
}

let debateActive = false; let debateTurn = 0;
async function startDebate(topic) {
    debateActive = true; debateTurn = 0;
    chatBox.innerHTML += `<div class="message ai-message"><p>🎭 <b>DEBATE MODE ON</b><br>Topic: ${topic}</p></div>`;
    setTimeout(() => ai1Speaks(topic), 1000);
}
async function ai1Speaks(topic) {
    if (!debateActive) return; currentVoice = 'male';
    const prompt = `You are "Kirong Male AI". Debate this: ${topic}. Give 1 strong point in 2 sentences. Be confident.`;
    const reply = await getGroqResponse(prompt);
    chatBox.innerHTML += `<div class="message user-message" style="background:linear-gradient(135deg,#4facfe,#00f2fe);"><b>👨 Male AI:</b><br>${reply}</div>`;
    speak(reply); chatBox.scrollTop = chatBox.scrollHeight;
    setTimeout(() => ai2Speaks(topic), 2000);
}
async function ai2Speaks(topic) {
    if (!debateActive) return; currentVoice = 'female';
    const prompt = `You are "Kirong Female AI". Debate this: ${topic}. Reply to last point and give 1 counter point in 2 sentences.`;
    const reply = await getGroqResponse(prompt);
    chatBox.innerHTML += `<div class="message ai-message" style="background:linear-gradient(135deg,#fa709a,#fee140); color:#333;"><b>👩 Female AI:</b><br>${reply}</div>`;
    speak(reply); chatBox.scrollTop = chatBox.scrollHeight;
    debateTurn++; if(debateTurn < 3) setTimeout(() => ai1Speaks(topic), 2000); else debateActive = false;
}

function generateImage(prompt) {
    stats.img++; localStorage.setItem('kirongAI_stats', JSON.stringify(stats));
    const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt + ', 4k, high detail')}`;
    chatBox.innerHTML += `<div class="message ai-message"><p>Here is your image:</p><img src="${imageUrl}" /><a href="${imageUrl}" target="_blank" download><button style="margin-top:10px; padding:8px 16px; border:none; border-radius:12px; background:#667eea; color:white; cursor:pointer;">📥 Download</button></a></div>`;
    chatBox.scrollTop = chatBox.scrollHeight;
}

async function handleSend() {
    const text = userInput.value.trim(); if(!text) return;
    userInput.value = ""; chatBox.innerHTML += `<div class="message user-message">${text}</div>`;
    typing.classList.remove('hidden');

    let shouldCount = true;
    if(text.toLowerCase().startsWith("debate:")){
        typing.classList.add('hidden');
        startDebate(text.replace("debate:", "").trim()); shouldCount = false;
    }
    else if(text.toLowerCase().startsWith("create image of")){
        typing.classList.add('hidden');
        generateImage(text.replace("create image of","")); shouldCount = false;
    }
    else {
        const reply = await getGroqResponse(text);
        typing.classList.add('hidden');
        chatBox.innerHTML += `<div class="message ai-message">${reply}</div>`;
        speak(reply);
    }
    if(shouldCount){ stats.msg++; localStorage.setItem('kirongAI_stats', JSON.stringify(stats)); }
    chatBox.scrollTop = chatBox.scrollHeight;
}

sendBtn.onclick = handleSend;
userInput.addEventListener('keypress', e => { if(e.key === 'Enter') handleSend(); });
quickBtns.forEach(btn => { btn.onclick = () => { userInput.value = btn.dataset.prompt; userInput.focus(); } });
micBtn.addEventListener('click', () => {
    const lastAi = [...document.querySelectorAll('.ai-message p')].pop();
    if(lastAi) speak(lastAi.innerText);
});
uploadBtn.addEventListener('click', () => fileInput.click());
fileInput.addEventListener('change', (e) => { if(e.target.files[0]) chatBox.innerHTML += `<div class="message user-message">📎 Uploaded: ${e.target.files[0].name}</div>`; });
locationBtn.addEventListener('click', () => navigator.geolocation?.getCurrentPosition(pos => chatBox.innerHTML += `<div class="message user-message">📍 Location: ${pos.coords.latitude.toFixed(2)}, ${pos.coords.longitude.toFixed(2)}</div>`));
clearBtn.addEventListener('click', () => { chatBox.innerHTML = `<div class="message ai-message"><p>Hello! I am Kirong Job Kwemoi 🔥<br>Ask me anything</p></div>`; });
exportBtn.addEventListener('click', () => {
    const messages = [...document.querySelectorAll('.message')].map(m => m.innerText).join('\n\n');
    const blob = new Blob([messages], {type: 'text/plain'});
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'KirongAI_Chat.txt'; a.click();
});
