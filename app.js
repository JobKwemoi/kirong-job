// ====== META KIRONG AI - APP.JS FINAL FIX ======
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

  // 1. NIGHT MODE 🌙
  themeBtn.addEventListener('click', () => {
    document.body.classList.toggle('dark');
    themeBtn.textContent = document.body.classList.contains('dark')? '☀️' : '🌙';
    localStorage.setItem('theme', document.body.classList.contains('dark')? 'dark' : 'light');
  });
  if(localStorage.getItem('theme') === 'dark') {
    document.body.classList.add('dark');
    themeBtn.textContent = '☀️';
  }

  // 2. SEND MESSAGE
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

  // 3. ADD MESSAGE
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

  // 4. AI YA TEXT - ZOTE BUTTONS ZIFANYE KAZI SASA
  const generateText = async (prompt) => {
    let reply = "";
    
    if(prompt.startsWith("Write me code")) reply = `Sawa mkuu 💻 Hii hapa code:\n\`\`\`js\nconsole.log("Hello Meta Kirong")\n\`\`\``;
    else if(prompt.startsWith("Explain")) reply = `Acha nikufafanulie mkuu 🧠 ${prompt.replace("Explain this like I am 5:", "")}`;
    else if(prompt.startsWith("Write me a")) reply = `Nakuandikia mkuu ✍️ ${prompt.replace("Write me a", "")}`;
    else if(prompt.startsWith("Draft an email")) reply = `Hii hapa email mkuu 📧\nSubject: ${prompt}\n\nDear Sir/Madam,`;
    else reply = `Nimekuelewa mkuu 🔥 Kuhusu: "${prompt}"`;
    
    addMessage(reply, 'ai-message');
  }

  // 5. AI YA PICHA - POLLINATIONS
  const generateImage = async (prompt) => {
    addMessage(`Ninakutengenezea picha ya: "${prompt}" 🎨 Subiri 5sec...`, 'ai-message');
    const cleanPrompt = encodeURIComponent(prompt + ", high quality, 4k, detailed");
    const imgUrl = `https://image.pollinations.ai/prompt/${cleanPrompt}`;
    const lastMsg = chatBox.lastElementChild;
    lastMsg.innerHTML = `<p>Hii hapa picha yako mkuu 👑</p><img src="${imgUrl}" alt="${prompt}">`;
  }

  // 6. BUTTONS ZOTE ZITUME DIRECT
  sendBtn.addEventListener('click', sendMessage);
  userInput.addEventListener('keypress', (e) => {
    if(e.key === 'Enter') sendMessage();
  });

  quickBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      userInput.value = btn.dataset.prompt;
      sendMessage(); // TUMA DIRECT BADALA YA KUWEKA TU
    });
  });

  // 7. SAUTI - ISOME ENGLISH NA IONDOE EMOJIS 🎤
  micBtn.addEventListener('click', () => {
    if('speechSynthesis' in window) {
      const lastAiMsg = [...document.querySelectorAll('.ai-message p')].pop();
      if(lastAiMsg) {
        let textToSpeak = lastAiMsg.innerText;
        // ONDOA EMOJIS
        textToSpeak = textToSpeak.replace(/[\p{Emoji}]/gu, "");
        
        const utterance = new SpeechSynthesisUtterance(textToSpeak);
        utterance.lang = 'en-US'; // LAZIMA ISOME KIINGEREZA
        utterance.rate = 1;
        speechSynthesis.speak(utterance);
        micBtn.classList.add('recording');
        setTimeout(() => micBtn.classList.remove('recording'), 2000);
      }
    }
  });

  // 8. UPLOAD 📎
  uploadBtn.addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if(file) {
      addMessage(`Umeupload: ${file.name} 📎`, 'user-message');
    }
  });

  // 9. CLEAR + EXPORT
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

  // 10. PIN + LOCATION
  pinBtn.addEventListener('click', () => {
    addMessage("Nimekupin chat hii 📌", 'ai-message');
  });
  locationBtn.addEventListener('click', () => {
    if(navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(pos => {
        addMessage(`Location yako: Lat ${pos.coords.latitude}, Lng ${pos.coords.longitude} 📍`, 'user-message');
      });
    }
  });

});
