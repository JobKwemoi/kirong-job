const $ = id => document.getElementById(id);
const chatBox = $('chatBox'), userInput = $('userInput'), sendBtn = $('sendBtn'), typing = $('typing');
const themeBtn = $('themeBtn'), micBtn = $('micBtn'), uploadBtn = $('uploadBtn'), fileInput = $('fileInput');
const quickBtns = document.querySelectorAll('.quick-btn'), voiceSelect = $('voiceSelect');
const exportBtn = $('exportBtn'), langSelect = $('langSelect'), clearBtn = $('clearBtn'), locationBtn = $('locationBtn'), pinBtn = $('pinBtn');

let isRecording = false, recognition, uploadedFile = null;
(function(){ if(window.emailjs) emailjs.init("Lf6crGOOwC-GmgF5x"); })();

const langNames = { en: "English", sw: "Kiswahili", fr: "French", hi: "Hindi", es: "Spanish" }

// 1. Ongeza message
function addMessage(text, type){
  const div = document.createElement('div');
  div.classList.add('message', type + '-message');
  div.innerHTML = `<p>${text}</p>`;
  chatBox.appendChild(div);
  chatBox.scrollTop = chatBox.scrollHeight;
  localStorage.setItem('kirongAI_history', chatBox.innerHTML);
}

// 2. Generate Image
function generateImage(prompt) {
    const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt + ', 8k, ultra detailed, cinematic, purple glow')}`;
    addMessage(`<p>Here is your image mkuu 🔥:</p><img src="${imageUrl}" />`, 'ai');
    speak(`Here is the image of ${prompt}`);
}

// 3. TTS - Sauti
function speak(text) {
  if(!voiceSelect ||!window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const speech = new SpeechSynthesisUtterance(text.replace(/emoji/gi, ''));
  speech.lang = voiceSelect.value;
  speech.rate = 0.9;
  speech.pitch = 1.1;
  window.speechSynthesis.speak(speech);
}

// 4. Tuma message kwa /api/chat
async function sendMessage() {
  const message = userInput.value.trim();
  if(!message &&!uploadedFile) return;

  // EMAIL FEATURE
  const emailMatch = message.match(/[\w.]+@[\w.]+\.\w+/);
  if(message.toLowerCase().includes('send email') && emailMatch){
    addMessage(`Sending email to ${emailMatch[0]}... 📧`, 'ai');
    try {
      await emailjs.send("service_flo123", "template_shyvb2c", {
        to_email: emailMatch[0],
        subject: "From Meta Kirong AI",
        message
      });
      addMessage(`Email imetumwa kwa ${emailMatch[0]} 🔥`, 'ai');
    }
    catch (e) { addMessage("Email imefail mkuu: " + e.text, 'ai'); }
    userInput.value = '';
    return;
  }

  // Onyesha user message
  addMessage(uploadedFile? `[File: ${uploadedFile.name}] ${message}` : message, 'user');
  userInput.value = '';
  if(typing) typing.classList.remove('hidden');

  const selectedLang = langSelect? langSelect.value : 'en';
  const formData = new FormData();
  formData.append('message', message);
  formData.append('language', langNames[selectedLang]);
  if(uploadedFile) formData.append('file', uploadedFile);

  try {
    const res = await fetch('/api/chat', { method: 'POST', body: formData });
    const data = await res.json();
    if(typing) typing.classList.add('hidden');
    uploadedFile = null;
    fileInput.value = '';

    // Kama ni image
    if(data.text.startsWith('IMAGE:')) generateImage(data.text.replace('IMAGE:', '').trim());
    else {
      addMessage(data.text, 'ai');
      speak(data.text);
    }
  } catch(err) {
    if(typing) typing.classList.add('hidden');
    addMessage(`Error: ${err.message}`, 'ai');
  }
}

// 5. QUICK BUTTONS
quickBtns.forEach(btn => btn.addEventListener('click', () => {
  userInput.value = btn.dataset.prompt;
  sendMessage();
}));

// 6. UPLOAD FILE
uploadBtn.addEventListener('click', () => fileInput.click());
fileInput.addEventListener('change', e => {
  uploadedFile = e.target.files[0];
  if(uploadedFile) addMessage(`📎 Uploaded: ${uploadedFile.name}`, 'user');
});

// 7. THEME TOGGLE
themeBtn.addEventListener('click', () => {
  document.body.classList.toggle('dark');
  localStorage.setItem('theme', document.body.classList.contains('dark')? 'dark' : 'light');
  themeBtn.textContent = document.body.classList.contains('dark')? '☀️' : '🌙';
});

// 8. CLEAR CHAT
clearBtn.addEventListener('click', () => {
  if(confirm("Clear all chat history?")) {
    localStorage.removeItem('kirongAI_history');
    chatBox.innerHTML = `<div class="message ai-message"><p>Chat imeclear mkuu. Meta Kirong ako ready kukusaidia 🔥</p></div>`;
  }
});

// 9. EXPORT CHAT
exportBtn.addEventListener('click', () => {
  const chatText = chatBox.innerText;
  const blob = new Blob([chatText], {type: 'text/plain'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'MetaKirongAI_Chat.txt';
  a.click();
});

// 10. LOCATION
locationBtn.addEventListener('click', () => {
  addMessage("Getting your location... 📍", 'ai');
  navigator.geolocation.getCurrentPosition(
    pos => {
      const mapUrl = `https://www.google.com/maps?q=${pos.coords.latitude},${pos.coords.longitude}`;
      addMessage(`Got you mkuu! <a href="${mapUrl}" target="_blank" style="color:#a855f7; text-decoration:underline;">Open in Google Maps</a>`, 'ai');
    },
    () => addMessage("Could not get location 😭", 'ai')
  );
});

// 11. PIN BUTTON
pinBtn.addEventListener('click', () => {
  addMessage("Pinned! Meta Kirong anakukumbuka mkuu 👑", 'ai');
  pinBtn.style.background = "rgba(250, 204, 21, 0.6)";
  pinBtn.style.boxShadow = "0 0 25px rgba(250,204,21,0.8)";
  setTimeout(() => {
    pinBtn.style.background = "rgba(250, 204, 21, 0.25)";
    pinBtn.style.boxShadow = "0 0 15px rgba(250,204,21,0.3)";
  }, 1200);
});

// 12. MIC / SPEECH TO TEXT
if ('webkitSpeechRecognition' in window) {
  recognition = new webkitSpeechRecognition();
  recognition.continuous = false;
  recognition.onresult = e => {
    userInput.value = e.results[0][0].transcript;
    sendMessage();
  };
  recognition.onend = () => {
    isRecording = false;
    micBtn.classList.remove('recording');
  };
  micBtn.addEventListener('click', () => {
    recognition.lang = voiceSelect.value;
    if(!isRecording){
      recognition.start();
      isRecording = true;
      micBtn.classList.add('recording');
    }
    else {
      recognition.stop();
    }
  });
} else {
  micBtn.style.display = 'none';
}

// 13. ENTER KEY
userInput.addEventListener('keypress', e => {
  if(e.key === 'Enter' &&!e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
});

// 14. LOAD SAVED HISTORY + THEME
window.addEventListener('load', () => {
  if(localStorage.getItem('theme') === 'dark'){
    document.body.classList.add('dark');
    themeBtn.textContent = '☀️';
  }
  const saved = localStorage.getItem('kirongAI_history');
  if(saved) chatBox.innerHTML = saved;
});

console.log("Meta Kirong AI Universal Loaded Successfully 🌍🔥💜");