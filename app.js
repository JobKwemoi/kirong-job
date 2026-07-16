document.addEventListener('DOMContentLoaded', () => {
  const chatBox = document.getElementById('chatBox');
  const userInput = document.getElementById('userInput');
  const sendBtn = document.getElementById('sendBtn');
  const typing = document.getElementById('typing');
  const personalitySelect = document.getElementById('personalitySelect');
  const micBtn = document.getElementById('micBtn');
  const uploadBtn = document.getElementById('uploadBtn');
  const fileInput = document.getElementById('fileInput');
  const pdfBtn = document.getElementById('pdfBtn');
  const pinBtn = document.getElementById('pinBtn');
  const locationBtn = document.getElementById('locationBtn');
  const clearBtn = document.getElementById('clearBtn');
  const exportBtn = document.getElementById('exportBtn');
  const themeBtn = document.getElementById('themeBtn');
  const quickBtns = document.querySelectorAll('.quick-btn');

  let chatHistory = JSON.parse(localStorage.getItem('kirongAIChat')) || [];
  let favorites = JSON.parse(localStorage.getItem('kirongAIFav')) || [];
  let userName = localStorage.getItem('kirongAIName') || 'Boss';

  document.getElementById('welcomeMsg').innerText = `Hello ${userName}! I'm Kirong AI. How can I help you today? 💜`;

  if(localStorage.getItem('theme') === 'dark') {
    document.body.classList.add('dark');
    themeBtn.textContent = '☀️';
  }
  themeBtn.addEventListener('click', () => {
    document.body.classList.toggle('dark');
    themeBtn.textContent = document.body.classList.contains('dark')? '☀️' : '🌙';
    localStorage.setItem('theme', document.body.classList.contains('dark')? 'dark' : 'light');
  });

  chatHistory.forEach(msg => addMessage(msg.text, msg.className, true));

  const sendMessage = () => {
    const text = userInput.value.trim();
    if(!text) return;

    if(text.toLowerCase().includes('my name is') || text.toLowerCase().includes('call me')) {
      userName = text.split(' ').pop();
      localStorage.setItem('kirongAIName', userName);
      document.getElementById('welcomeMsg').innerText = `Hello ${userName}! I'm Kirong AI. How can I help you today? 💜`;
    }

    addMessage(text, 'user-message');
    userInput.value = '';
    typing.classList.remove('hidden'); // ONGEZA HII

    const lowerText = text.toLowerCase();
    const personality = personalitySelect.value;
    const isImage = lowerText.includes('image') || lowerText.includes('generate') || lowerText.includes('picture') || lowerText.includes('draw');

    setTimeout(() => {
      typing.classList.add('hidden'); // FICHA TYPING
      if(isImage) {
        generateImage(text);
      } else {
        generateText(text, personality); // HII NDIO ILIKUWA HAIFANYI
      }
    }, 1200); // ONGEZA KWA 1.2s ili ionekane inafikiria
  }

  function addMessage(content, className, noSave=false) {
    const msgDiv = document.createElement('div');
    msgDiv.classList.add('message', className);
    let saveBtn = className === 'ai-message'? `<button class="save-btn" onclick="saveFavorite('${content.replace(/'/g, "\\'")}')">⭐ Save</button>` : '';
    msgDiv.innerHTML = `<p>${content}</p>${saveBtn}`;
    chatBox.appendChild(msgDiv);
    chatBox.scrollTop = chatBox.scrollHeight;
    if(!noSave){
      chatHistory.push({text: content, className});
      localStorage.setItem('kirongAIChat', JSON.stringify(chatHistory));
    }
  }

  function generateText(prompt, personality){
    const reply = getAIResponse(prompt, personality, userName);
    addMessage(reply, 'ai-message');

    // AUTO SPEAK
    if('speechSynthesis' in window) {
      speechSynthesis.speak(new SpeechSynthesisUtterance(reply));
    }
  }

  function generateImage(prompt){
    addMessage(`Creating image: "${prompt}"...`, 'ai-message');
    const imgUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)},4:3?width=600&height=450`;
    setTimeout(() => {
      chatBox.lastElementChild.innerHTML = `<p>Here you go 👑</p><img src="${imgUrl}" onerror="this.parentElement.innerHTML='<p>Failed to generate image. Try again.</p>'">`;
    }, 1000);
  }

  window.saveFavorite = (text) => {
    if(!favorites.includes(text)){ favorites.push(text); localStorage.setItem('kirongAIFav', JSON.stringify(favorites)); alert('Saved to Favorites 💜'); }
  }

  sendBtn.addEventListener('click', sendMessage);
  userInput.addEventListener('keypress', (e) => { if(e.key === 'Enter') sendMessage(); });
  quickBtns.forEach(btn => btn.addEventListener('click', () => { userInput.value = btn.dataset.prompt + ' '; userInput.focus(); }));

  micBtn.addEventListener('click', () => {
    const lastAi = [...document.querySelectorAll('.ai-message p')].pop();
    if(lastAi && 'speechSynthesis' in window) speechSynthesis.speak(new SpeechSynthesisUtterance(lastAi.innerText));
  });

  uploadBtn.addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', (e) => { if(e.target.files[0]) addMessage(`Uploaded: ${e.target.files[0].name}`, 'user-message'); });
  pdfBtn.addEventListener('click', () => window.print());
  pinBtn.addEventListener('click', () => alert(`Favorites:\n${favorites.join('\n- ') || 'None yet'}`));
  locationBtn.addEventListener('click', () => navigator.geolocation?.getCurrentPosition(pos => addMessage(`Location: ${pos.coords.latitude.toFixed(2)}, ${pos.coords.longitude.toFixed(2)}`, 'user-message')));
  clearBtn.addEventListener('click', () => { chatBox.innerHTML = `<p id="welcomeMsg">Hello ${userName}! I'm Kirong AI. How can I help you today? 💜</p>`; chatHistory = []; localStorage.removeItem('kirongAIChat'); });
  exportBtn.addEventListener('click', () => {
    const blob = new Blob([chatHistory.map(m => m.text).join('\n')], {type: 'text/plain'});
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'KirongAI_Chat.txt'; a.click();
  });
});
