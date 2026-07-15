// ====== META KIRONG AI - PRO EDITION V2 ======
document.addEventListener('DOMContentLoaded', () => {

  const chatBox = document.getElementById('chatBox');
  const userInput = document.getElementById('userInput');
  const sendBtn = document.getElementById('sendBtn');
  const typing = document.getElementById('typing');
  const themeBtn = document.getElementById('themeBtn');
  const personalitySelect = document.getElementById('personalitySelect');
  const voiceSelect = document.getElementById('voiceSelect');
  const quickBtns = document.querySelectorAll('.quick-btn');
  const micBtn = document.getElementById('micBtn');
  const uploadBtn = document.getElementById('uploadBtn');
  const fileInput = document.getElementById('fileInput');
  const clearBtn = document.getElementById('clearBtn');
  const exportBtn = document.getElementById('exportBtn');
  const pdfBtn = document.getElementById('pdfBtn');
  const pinBtn = document.getElementById('pinBtn');
  const locationBtn = document.getElementById('locationBtn');

  let chatHistory = JSON.parse(localStorage.getItem('kirongChat')) || [];
  let favorites = JSON.parse(localStorage.getItem('kirongFav')) || [];
  let userName = localStorage.getItem('kirongName') || 'Mkuu';

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

  // 2. DETECT TONE + PERSONALITY 🎭
  const getPersonality = () => personalitySelect.value;
  const detectTone = (text) => {
    const funnyWords = ['lol', '😂', 'haha', 'joke', 'cheza'];
    const seriousWords = ['help', 'explain', 'serious', 'code', 'business', 'work'];
    if(funnyWords.some(w => text.toLowerCase().includes(w))) return 'funny';
    if(seriousWords.some(w => text.toLowerCase().includes(w))) return 'serious';
    return 'neutral';
  }

  // 3. SEND MESSAGE
  const sendMessage = () => {
    const text = userInput.value.trim();
    if(!text) return;

    // MEMORY: KUMBUKA JINA
    if(text.toLowerCase().includes('my name is') || text.toLowerCase().includes('naito')) {
      userName = text.split(' ').pop();
      localStorage.setItem('kirongName', userName);
    }

    addMessage(text, 'user-message', true);
    userInput.value = '';
    typing.classList.remove('hidden');

    const lowerText = text.toLowerCase();
    const tone = detectTone(text);
    const personality = getPersonality();
    const isImageRequest = lowerText.includes('picha') || lowerText.includes('image') || lowerText.includes('tengeneza') || lowerText.includes('draw');
    const isSearchRequest = lowerText.includes('habari') || lowerText.includes('news') || lowerText.includes('bei') || lowerText.includes('price');
    const isDebateRequest = lowerText.includes('debate') || lowerText.includes('hoja') || lowerText.includes('vs');

    setTimeout(async () => {
      typing.classList.add('hidden');

      if(isImageRequest) await generateImage(text);
      else if(isSearchRequest) await searchGoogle(text);
      else if(isDebateRequest) await generateDebate(text);
      else await generateText(text, tone, personality);
    }, 900);
  }

  // 4. ADD MESSAGE + SAVE BUTTON ⭐
  const addMessage = (content, className, isUser = false) => {
    const msgDiv = document.createElement('div');
    msgDiv.classList.add('message', className);

    let saveBtn = '';
    if(!isUser) {
      saveBtn = `<button class="save-btn" onclick="saveFavorite('${content.replace(/'/g, "\\'")}')">⭐ Save</button>`;
    }
    msgDiv.innerHTML = `<p>${content}</p>${saveBtn}`;
    chatBox.appendChild(msgDiv);
    chatBox.scrollTop = chatBox.scrollHeight;
    chatHistory.push({text: content, className});
    localStorage.setItem('kirongChat', JSON.stringify(chatHistory));
  }

  chatHistory.forEach(msg => addMessage(msg.text, msg.className));

  // 5. SAVE FAVORITE ⭐
  window.saveFavorite = (text) => {
    if(!favorites.includes(text)){
      favorites.push(text);
      localStorage.setItem('kirongFav', JSON.stringify(favorites));
      alert(`Imehifadhiwa kwenye Favorites 💜`);
    }
  }

  // 6. AI YA TEXT - INAADAPT PERSONALITY
  const generateText = async (prompt, tone, personality) => {
    let reply = "";
    let prefix = "";
    if(personality === 'Teacher') prefix = `As your teacher ${userName}:`;
    if(personality === 'Hustler') prefix = `Let's get it ${userName}:`;
    if(personality === 'Funny') prefix = `Aisee ${userName} 😂`;

    if(tone === 'serious') reply = `${prefix} I understand. Regarding "${prompt}" - here's the breakdown:`;
    else if(tone === 'funny') reply = `${prefix} Kuhusu "${prompt}"... acha nikwambie ukweli mtupu 🔥`;
    else reply = `${prefix} Nimekupata 💜 Kuhusu "${prompt}"...`;

    addMessage(reply, 'ai-message');
  }

  // 7. GOOGLE SEARCH 🌍 - MOCK
  const searchGoogle = async (prompt) => {
    addMessage(`Ninakutafutia: "${prompt}" 🌍 Subiri...`, 'ai-message');
    setTimeout(() => {
      addMessage(`Matokeo ya "${prompt}":\n1. Habari ya hivi punde\n2. Bei ya leo\nNote: Unganisha API key ya Tavily ili ipate data halisi ${userName}`, 'ai-message');
    }, 1500);
  }

  // 8. DEBATE MODE
  const generateDebate = async (prompt) => {
    const topic = prompt.replace(/debate|hoja|vs/gi, "").trim();
    addMessage(`Debate time 🥊 Topic: ${topic} \n${userName} wewe sema yako kwanza. Mimi niko upande mwingine 😤`, 'ai-message');
  }

  // 9. AI YA PICHA - POLLINATIONS FIXED RATIO 16:9
  const generateImage = async (prompt) => {
    addMessage(`Niko nazo ${userName} 🎨 Ninapika picha ya: "${prompt}"...`, 'ai-message');
    const cleanPrompt = encodeURIComponent(prompt + ", high quality, detailed, 16:9 aspect ratio, vibrant");
    const imgUrl = `https://image.pollinations.ai/prompt/${cleanPrompt}?width=800&height=450`;
    const lastMsg = chatBox.lastElementChild;
    lastMsg.innerHTML = `<p>Hii hapa masterpiece yako 👑</p><img src="${imgUrl}" alt="${prompt}" loading="lazy">`;
  }

  // 10. BUTTONS
  sendBtn.addEventListener('click', sendMessage);
  userInput.addEventListener('keypress', (e) => { if(e.key === 'Enter') sendMessage(); });
  quickBtns.forEach(btn => { btn.addEventListener('click', () => { userInput.value = btn.dataset.prompt; sendMessage(); }); });

  // 11. SAUTI 🎤 - BILA EMOJIS
  micBtn.addEventListener('click', () => {
    if('speechSynthesis' in window) {
      const lastAiMsg = [...document.querySelectorAll('.ai-message p')].pop();
      if(lastAiMsg) {
        let textToSpeak = lastAiMsg.innerText.replace(/[\p{Emoji}]/gu, "");
        const utterance = new SpeechSynthesisUtterance(textToSpeak);
        utterance.lang = 'en-US';
        utterance.rate = 1.0;
        speechSynthesis.speak(utterance);
        micBtn.classList.add('recording');
        setTimeout(() => micBtn.classList.remove('recording'), 2000);
      }
    }
  });

  // 12. UPLOAD 📎
  uploadBtn.addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if(file) addMessage(`Umeupload: ${file.name} 📎`, 'user-message', true);
  });

  // 13. CLEAR + EXPORT + PDF 📄
  clearBtn.addEventListener('click', () => {
    chatBox.innerHTML = `<div class="message ai-message"><p>Chat imefutwa. Tuanze upya ${userName} 💜</p></div>`;
    chatHistory = []; localStorage.removeItem('kirongChat');
  });

  exportBtn.addEventListener('click', () => {
    const chatText = chatHistory.map(m => m.className + ': ' + m.text).join('\n');
    const blob = new Blob([chatText], {type: 'text/plain'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'MetaKirongChat.txt'; a.click();
  });

  pdfBtn.addEventListener('click', () => {
    window.print();
  });

  // 14. PIN + LOCATION
  pinBtn.addEventListener('click', () => {
    alert(`Favorites zako:\n${favorites.join('\n- ') || 'Hakuna bado ⭐'}`);
  });
  locationBtn.addEventListener('click', () => {
    if(navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(pos => {
        addMessage(`Location: Lat ${pos.coords.latitude.toFixed(2)}, Lng ${pos.coords.longitude.toFixed(2)} 📍`, 'user-message', true);
      });
    }
  });

});
