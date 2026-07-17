const userInput = document.getElementById('userInput');
const sendBtn = document.getElementById('sendBtn');
const chatBox = document.getElementById('chatBox');
const typing = document.getElementById('typing');
const themeBtn = document.getElementById('themeBtn');
const micBtn = document.getElementById('micBtn');
const uploadBtn = document.getElementById('uploadBtn');
const fileInput = document.getElementById('fileInput');
const quickBtns = document.querySelectorAll('.quick-btn');
const voiceSelect = document.getElementById('voiceSelect');
const exportBtn = document.getElementById('exportBtn');
const langSelect = document.getElementById('langSelect');
const clearBtn = document.getElementById('clearBtn');
const locationBtn = document.getElementById('locationBtn');

let isRecording = false;
let recognition;
let uploadedFile = null;
const GROQ_API_KEY = "GROQ_API_KEY=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



"; // WEKA KEY YAKO

(function(){ emailjs.init("Lf6crGOOwC-GmgF5x"); })();

const langNames = { en: "English", sw: "Kiswahili", fr: "French", hi: "Hindi", es: "Spanish" }

function addMessage(text, type){
  const div = document.createElement('div');
  div.classList.add('message', type + '-message');
  div.innerHTML = `<p>${text}</p>`;
  chatBox.appendChild(div);
  chatBox.scrollTop = chatBox.scrollHeight;
  localStorage.setItem('kirongAI_history', chatBox.innerHTML);
}

async function sendMessage() {
  const message = userInput.value.trim();
  if(!message &&!uploadedFile) return;

  const emailMatch = message.match(/[\w.]+@[\w.]+\.\w+/);
  if(message.toLowerCase().includes('send email') && emailMatch){
    await emailjs.send("service_flo123", "template_shyvb2c", { to_email: emailMatch[0], subject: "KirongAI", message: message });
    addMessage(`Email imetumwa kwa ${emailMatch[0]} bro 🔥`, 'ai');
    userInput.value = ''; return;
  }

  addMessage(message, 'user');
  userInput.value = '';
  typing.classList.remove('hidden');

  const selectedLang = langSelect? langSelect.value : 'en';
  const systemPrompt = `You are KirongAI, created by Kirong Job Kwemoi. Respond ONLY in ${langNames[selectedLang]}. Be friendly, use emojis. CRITICAL: Never say the word "emoji". Speak naturally. Use Sheng for Kiswahili.`;

  try {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "Authorization": `Bearer ${GROQ_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: "llama-3.1-8b-instant", messages: [{role:"system",content:systemPrompt},{role:"user",content:message}] })
    });
    const data = await res.json();
    typing.classList.add('hidden');

    const aiReply = data.choices[0].message.content;
    if(aiReply.startsWith('IMAGE:')){
      const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(aiReply.replace('IMAGE:', ''))}`;
      addMessage(`<p>Here is your image:</p><img src="${imageUrl}" style="max-width:100%;border-radius:12px;"/>`, 'ai');
      speak("Here is your image");
    } else {
      addMessage(aiReply, 'ai');
      speak(aiReply);
    }
  } catch(err) {
    typing.classList.add('hidden');
    addMessage(`Error: ${err.message}`, 'ai');
  }
}

function speak(text) {
  if(!voiceSelect) return;
  window.speechSynthesis.cancel();
  const speech = new SpeechSynthesisUtterance(text.replace(/emoji/gi, ''));
  speech.lang = voiceSelect.value;
  speech.rate = 0.9;
  window.speechSynthesis.speak(speech);
}

// EVENT LISTENERS ZOTE
sendBtn.addEventListener('click', sendMessage);
userInput.addEventListener('keypress', (e) => { if(e.key === 'Enter') sendMessage(); });
quickBtns.forEach(btn => { btn.addEventListener('click', () => { userInput.value = btn.dataset.prompt; sendMessage(); }); });
uploadBtn.addEventListener('click', () => fileInput.click());
fileInput.addEventListener('change', (e) => { uploadedFile = e.target.files[0]; if(uploadedFile) addMessage(`📎 Uploaded: ${uploadedFile.name}`, 'user'); });
themeBtn.addEventListener('click', () => { document.body.classList.toggle('dark'); themeBtn.textContent = document.body.classList.contains('dark')? '☀️' : '🌙'; });
if(clearBtn){ clearBtn.addEventListener('click', () => { localStorage.removeItem('kirongAI_history'); chatBox.innerHTML = ''; }); }
if(locationBtn){ locationBtn.addEventListener('click', () => { navigator.geolocation.getCurrentPosition(pos => { addMessage(`<a href="https://www.google.com/maps?q=${pos.coords.latitude},${pos.coords.longitude}" target="_blank">Open Maps 📍</a>`, 'ai'); }); }); }

// MIC
if (micBtn && ('webkitSpeechRecognition' in window)) {
  recognition = new webkitSpeechRecognition();
  recognition.onresult = (e) => { userInput.value = e.results[0][0].transcript; sendMessage(); };
  recognition.onend = () => { isRecording = false; micBtn.classList.remove('recording'); };
  micBtn.addEventListener('click', () => {
    recognition.lang = voiceSelect? voiceSelect.value : 'en-US';
    if(!isRecording){ recognition.start(); isRecording = true; micBtn.classList.add('recording'); } else { recognition.stop(); }
  });
}

// LOAD CHAT
window.addEventListener('load', () => {
  const savedChat = localStorage.getItem('kirongAI_history');
  if(savedChat) chatBox.innerHTML = savedChat;
});
