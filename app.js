const chatBox = document.getElementById('chat-box');
const userInput = document.getElementById('user-input');
const sendBtn = document.getElementById('send-btn');
const langSelect = document.getElementById('language-select');
const voiceSelect = document.getElementById('voice-select');

let messages = [];

// Tuma message ukibonyeza Enter au Send
sendBtn.addEventListener('click', sendMessage);
userInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') sendMessage();
});

// BUTTONS ZA CODE, IMAGE, EXPLAIN
document.querySelectorAll('.action-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const action = btn.dataset.action;
    const msg = userInput.value || "Explain this";
    userInput.value = `${action}: ${msg}`;
    sendMessage();
  });
});

async function sendMessage() {
  const message = userInput.value.trim();
  if (!message) return;

  const language = langSelect.value;
  addMessage(message, 'user');
  userInput.value = '';
  
  addMessage('Meta Kirong AI is thinking...', 'bot', true);

  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }, // MUHIMU SANA
      body: JSON.stringify({ message: message, language: language })
    });

    const data = await res.json();
    removeThinking();
    
    if (res.ok) {
      addMessage(data.text, 'bot');
      speakText(data.text); // Sauti
    } else {
      addMessage(`Error: ${data.text}`, 'bot');
    }

  } catch (error) {
    removeThinking();
    addMessage(`Network Error mkuu: ${error.message}`, 'bot');
  }
}

function addMessage(text, sender, isThinking = false) {
  const msgDiv = document.createElement('div');
  msgDiv.className = `message ${sender}`;
  if(isThinking) msgDiv.id = 'thinking';
  msgDiv.innerText = text; // Tumia innerText ili isionyeshe "undefined"
  chatBox.appendChild(msgDiv);
  chatBox.scrollTop = chatBox.scrollHeight;
  messages.push({role: sender, content: text});
}

function removeThinking() {
  const thinking = document.getElementById('thinking');
  if (thinking) thinking.remove();
}

// SAUTI
function speakText(text) {
  if (!('speechSynthesis' in window)) return;
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = voiceSelect.value === 'Swahili' ? 'sw-KE' : 'en-US';
  utterance.rate = 1;
  speechSynthesis.speak(utterance);
}

// LOCATION
if (navigator.geolocation) {
  navigator.geolocation.getCurrentPosition(() => {
    console.log("Location got");
  }, () => {
    addMessage("Could not get location", "bot");
  });
}
