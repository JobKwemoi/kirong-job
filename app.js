const chatBox = document.getElementById('chat-box');
const userInput = document.getElementById('user-input');
const sendBtn = document.getElementById('send-btn');
const langSelect = document.getElementById('language-select');
const voiceSelect = document.getElementById('voice-select');
const thinking = document.getElementById('thinking');

sendBtn.addEventListener('click', sendMessage);
userInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') sendMessage();
});

document.querySelectorAll('.action-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const action = btn.dataset.action;
    const msg = userInput.value || "Help me with";
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
  thinking.classList.remove('hidden');

  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: message, language: language })
    });

    const data = await res.json();
    thinking.classList.add('hidden');
    
    if (res.ok) {
      addMessage(data.text, 'bot');
      speakText(data.text);
    } else {
      addMessage(`Error: ${data.text}`, 'bot');
    }

  } catch (error) {
    thinking.classList.add('hidden');
    addMessage(`Network Error mkuu: ${error.message}`, 'bot');
  }
}

function addMessage(text, sender) {
  const msgDiv = document.createElement('div');
  msgDiv.className = `message ${sender}`;
  msgDiv.innerText = text;
  chatBox.appendChild(msgDiv);
  chatBox.scrollTop = chatBox.scrollHeight;
}

function speakText(text) {
  if (!('speechSynthesis' in window)) return;
  speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = voiceSelect.value;
  utterance.rate = 1;
  speechSynthesis.speak(utterance);
}

// THEME TOGGLE
document.getElementById('themeBtn').addEventListener('click', () => {
  document.body.classList.toggle('dark');
  document.getElementById('themeBtn').innerText = document.body.classList.contains('dark') ? '☀️' : '🌙';
});
