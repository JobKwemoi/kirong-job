// ====== META KIRONG AI - APP.JS + POLLINATIONS FREE NO API KEY ======
document.addEventListener('DOMContentLoaded', () => {

  const chatBox = document.getElementById('chatBox');
  const userInput = document.getElementById('userInput');
  const sendBtn = document.getElementById('sendBtn');
  const typing = document.getElementById('typing');
  const themeBtn = document.getElementById('themeBtn');
  const langSelect = document.getElementById('langSelect');
  const voiceSelect = document.getElementById('voiceSelect');
  const quickBtns = document.querySelectorAll('.quick-btn');
  const micBtn = document.getElementById('micBtn');
  const uploadBtn = document.getElementById('uploadBtn');
  const fileInput = document.getElementById('fileInput');
  const clearBtn = document.getElementById('clearBtn');
  const exportBtn = document.getElementById('exportBtn');
  const pinBtn = document.getElementById('pinBtn');
  const locationBtn = document.getElementById('locationBtn');

  let chatHistory = JSON.parse(localStorage.getItem('kirongChat')) || [];

  // 2. NIGHT MODE 🌙
  themeBtn.addEventListener('click', () => {
    document.body.classList.toggle('dark');
    themeBtn.textContent = document.body.classList.contains('dark')? '☀️' : '🌙';
    localStorage.setItem('theme', document.body.classList.contains('dark')? 'dark' : 'light');
  });
  if(localStorage.getItem('theme') === 'dark') {
    document.body.classList.add('dark');
    themeBtn.textContent = '☀️';
  }

  // 3. SEND MESSAGE
  const sendMessage = () => {
    const text = userInput.value.trim();
    if(!text) return;

    addMessage(text, 'user-message');
    userInput.value = '';
    typing.classList.remove('hidden');

    const lowerText = text.toLowerCase();
    const isImageRequest = lowerText.includes('picha') ||
                           lowerText.includes('image') ||
                           lowerText.includes('generate') ||
                           lowerText.includes('draw') ||
                           lowerText.includes('tengeneza');

    setTimeout(async () => {
      typing.classList.add('hidden');

      if(isImageRequest){
        await generateImage(text);
      } else {
        await generateText(text);
      }
    }, 800);
  }

  // 4. ADD MESSAGE
  const addMessage = (content, className) => {
    const msgDiv = document.createElement('div');
    msgDiv.classList.add('message', className);
    msgDiv.innerHTML = `<p>${content}</p>`;
    chatBox.appendChild(msgDiv);
    chatBox.scrollTop = chatBox.scrollHeight;
    chatHistory.push({text: content, className});
    localStorage.setItem('kirongChat', JSON.stringify(chatHistory));
  }

  chatHistory.forEach(msg => addMessage(msg.text, msg.className));

  // 5. AI YA TEXT - PLACEHOLDER
  const generateText = async (prompt) => {
    const replies = [
      `Nimekuelewa mkuu 🔥 Kuhusu "${prompt}"...`,
      `Swali zuri sana! ${prompt}`,
      `Acha nikufikirie mkuu... ${prompt}`
    ];
    const reply = replies[Math.floor(Math.random() * replies.length)];
    addMessage(reply, 'ai-message');
  }

  // 6. AI YA PICHA - POLLINATIONS FREE HAKUNA API KEY
  const generateImage = async (prompt) => {
    addMessage(`Ninakutengenezea picha ya: "${prompt}" 🎨 Tafadhali subiri 5sec...`, 'ai-message');

    try {
      // Safisha prompt ili iwe URL friendly
      const cleanPrompt = encodeURIComponent(prompt + ", high quality, 4k, detailed");
      const imgUrl = `https://image.pollinations.ai/prompt/${cleanPrompt}`;

      // ONDOA UJUMBE WA "SUBIRI" NA WEKA PICHA DIRECT
      const lastMsg = chatBox.lastElementChild;
      lastMsg.innerHTML = `<p>Hii hapa picha yako mkuu 👑</p><img src="${imgUrl}" alt="${prompt}">`;

    } catch(error) {
      addMessage(`Samahani mkuu 😅 Kumeharibika: ${error.message}`, 'ai-message');
    }
  }

  // 7. BUTTONS
  sendBtn.addEventListener('click', sendMessage);
  userInput.addEventListener('keypress', (e) => {
    if(e.key === 'Enter') sendMessage();
  });

  quickBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      userInput.value = btn.dataset.prompt;
      userInput.focus();
    });
  });

  // 8. SAUTI 🎤
  micBtn.addEventListener('click', () => {
    if('speechSynthesis' in window) {
      const lastAiMsg = [...document.querySelectorAll('.ai-message p')].pop();
      if(lastAiMsg) {
        const utterance = new SpeechSynthesisUtterance(lastAiMsg.innerText);
        utterance.lang = voiceSelect.value;
        speechSynthesis.speak(utterance);
        micBtn.classList.add('recording');
        setTimeout(() => micBtn.classList.remove('recording'), 2000);
      }
    }
  });

  // 9. UPLOAD 📎
  uploadBtn.addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if(file) {
      addMessage(`Umeupload: ${file.name} 📎`, 'user-message');
    }
  });

  // 10. CLEAR + EXPORT
  clearBtn.addEventListener('click', () => {
    chatBox.innerHTML = `<div class="message ai-message"><p>Chat imefutwa. Tuanze upya mkuu 💜</p></div>`;
    chatHistory = [];
    localStorage.removeItem('kirongChat');
  });

  exportBtn.addEventListener('click', () => {
    const chatText = chatHistory.map(m => m.className + ': ' + m.text).join('\n');
    const blob = new Blob([chatText], {type: 'text/plain'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'MetaKirongChat.txt'; a.click();
  });

  // 11. PIN + LOCATION
  pinBtn.addEventListener('click', () => alert('Feature ya Pin inakuja soon mkuu 📌'));
  locationBtn.addEventListener('click', () => {
    if(navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(pos => {
        addMessage(`Location yako: Lat ${pos.coords.latitude}, Lng ${pos.coords.longitude} 📍`, 'user-message');
      });
    }
  });

});
