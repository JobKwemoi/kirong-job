// ====== KIRONG JOB AI - PRO FIXED ======
document.addEventListener('DOMContentLoaded', () => {

  const chatBox = document.getElementById('chatBox');
  const userInput = document.getElementById('userInput');
  const sendBtn = document.getElementById('sendBtn');
  const typing = document.getElementById('typing') || createTyping();
  const personalitySelect = document.getElementById('personalitySelect');
  const micBtn = document.getElementById('micBtn');
  const uploadBtn = document.getElementById('uploadBtn');
  const fileInput = document.getElementById('fileInput') || createFileInput();
  const pdfBtn = document.getElementById('pdfBtn');
  const pinBtn = document.getElementById('pinBtn');
  const locationBtn = document.getElementById('locationBtn');
  const clearBtn = document.getElementById('clearBtn');
  const exportBtn = document.getElementById('exportBtn');

  let chatHistory = JSON.parse(localStorage.getItem('kirongChat')) || [];
  let favorites = JSON.parse(localStorage.getItem('kirongFav')) || [];
  let userName = localStorage.getItem('kirongName') || 'Mkuu';

  // HELPER: TENGENEZA TYPING KAMA HAKUPO
  function createTyping(){
    const div = document.createElement('div');
    div.id = 'typing';
    div.className = 'hidden';
    div.innerHTML = 'Kirong anaandika...';
    chatBox.parentElement.insertBefore(div, chatBox.nextSibling);
    return div;
  }
  function createFileInput(){
    const input = document.createElement('input');
    input.type = 'file';
    input.id = 'fileInput';
    input.style.display = 'none';
    document.body.appendChild(input);
    return input;
  }

  // LOAD CHAT YA ZAMANI
  chatHistory.forEach(msg => addMessage(msg.text, msg.className, true));

  // 1. SEND MESSAGE - HII NDIO ILIKUWA IMEVUNJIKA
  const sendMessage = () => {
    const text = userInput.value.trim();
    if(!text) return;

    // KUMBUKA JINA
    if(text.toLowerCase().includes('my name is') || text.toLowerCase().includes('naito')) {
      userName = text.split(' ').pop();
      localStorage.setItem('kirongName', userName);
    }

    addMessage(text, 'user-message');
    userInput.value = '';
    typing.classList.remove('hidden');

    const lowerText = text.toLowerCase();
    const tone = detectTone(text);
    const personality = personalitySelect? personalitySelect.value : 'Normal';

    const isImageRequest = lowerText.includes('picha') || lowerText.includes('image') || lowerText.includes('tengeneza') || lowerText.includes('draw');
    const isSearchRequest = lowerText.includes('habari') || lowerText.includes('news') || lowerText.includes('bei') || lowerText.includes('price');
    const isDebateRequest = lowerText.includes('debate') || lowerText.includes('hoja') || lowerText.includes('vs');

    setTimeout(() => {
      typing.classList.add('hidden');
      if(isImageRequest) generateImage(text);
      else if(isSearchRequest) searchGoogle(text);
      else if(isDebateRequest) generateDebate(text);
      else generateText(text, tone, personality);
    }, 800);
  }

  // 2. DETECT TONE
  const detectTone = (text) => {
    if(text.includes('😂') || text.includes('lol')) return 'funny';
    if(text.includes('explain') || text.includes('code')) return 'serious';
    return 'neutral';
  }

  // 3. ADD MESSAGE
  function addMessage(content, className, noSave=false) {
    const msgDiv = document.createElement('div');
    msgDiv.classList.add('message', className);

    let saveBtn = '';
    if(!noSave && className === 'ai-message') {
      saveBtn = <button class="save-btn" onclick="saveFavorite('${content.replace(/'/g, "\\'")}')">⭐ Save</button>;
    }
    msgDiv.innerHTML = <p>${content}</p>${saveBtn};
    chatBox.appendChild(msgDiv);
    chatBox.scrollTop = chatBox.scrollHeight;

    if(!noSave){
      chatHistory.push({text: content, className});
      localStorage.setItem('kirongChat', JSON.stringify(chatHistory));
    }
  }

  // 4. GENERATE TEXT
  function generateText(prompt, tone, personality){
    let prefix = personality === 'Teacher'? Mwalimu ${userName}: : personality === 'Hustler'? Mkuu ${userName} let's go: : '';
    let reply = ${prefix} Kuhusu "${prompt}" - ${tone === 'funny'? 'acha nikwambie 😂' : 'hii hapa breakdown'};
    addMessage(reply, 'ai-message');
  }

  // 5. GENERATE IMAGE - NDOGO 4:3
  function generateImage(prompt){
    addMessage(Niko nazo ${userName} 🎨 Ninapika: "${prompt}"..., 'ai-message');
    const cleanPrompt = encodeURIComponent(prompt + ", high quality, 4:3 aspect ratio");
    const imgUrl = https://image.pollinations.ai/prompt/${cleanPrompt}?width=600&height=450;
    const lastMsg = chatBox.lastElementChild;
    lastMsg.innerHTML = <p>Hii hapa 👑</p><img src="${imgUrl}" alt="${prompt}">;
  }

  // 6. SEARCH
  function searchGoogle(prompt){
    addMessage(Nakutafutia: "${prompt}" 🌍, 'ai-message');
    setTimeout(() => addMessage(Matokeo ya "${prompt}":\n1. Info ya leo\n2. Bei ya sasa\nNote: Unganisha API ${userName}, 'ai-message'), 1200);
  }

  // 7. DEBATE
  function generateDebate(prompt){
    const topic = prompt.replace(/debate|hoja|vs/gi, "").trim();
    addMessage(Debate 🥊 Topic: ${topic} \n${userName} sema yako kwanza!, 'ai-message');
  }

  // 8. SAVE FAVORITE
  window.saveFavorite = (text) => {
    if(!favorites.includes(text)){
      favorites.push(text);
      localStorage.setItem('kirongFav', JSON.stringify(favorites));
      alert('Imehifadhiwa 💜');
    }
  }

  // 9. BUTTON EVENTS - ZOTE ZIKO CHINI
  if(sendBtn) sendBtn.addEventListener('click', sendMessage);
  if(userInput) userInput.addEventListener('keypress', (e) => { if(e.key === 'Enter') sendMessage(); });

  if(micBtn) micBtn.addEventListener('click', () => {
    const lastAiMsg = [...document.querySelectorAll('.ai-message p')].pop();
    if(lastAiMsg && 'speechSynthesis' in window){
      const utterance = new SpeechSynthesisUtterance(lastAiMsg.innerText.replace(/[\p{Emoji}]/gu, ""));
      speechSynthesis.speak(utterance);
    }
  });

  if(uploadBtn) uploadBtn.addEventListener('click', () => fileInput.click());
  if(fileInput) fileInput.addEventListener('change', (e) => {
    if(e.target.files[0]) addMessage(Umeupload: ${e.target.files[0].name} 📎, 'user-message');
  });

  if(pdfBtn) pdfBtn.addEventListener('click', () => window.print());
  if(pinBtn) pinBtn.addEventListener('click', () => alert(Favorites:\n${favorites.join('\n- ') || 'Hakuna bado'}));
  if(locationBtn) locationBtn.addEventListener('click', () => {
    navigator.geolocation?.getCurrentPosition(pos => {
      addMessage(Location: ${pos.coords.latitude.toFixed(2)}, ${pos.coords.longitude.toFixed(2)} 📍, 'user-message');
    });
  });
  if(clearBtn) clearBtn.addEventListener('click', () => {
    chatBox.innerHTML = ''; chatHistory = []; localStorage.removeItem('kirongChat');
  });
  if(exportBtn) exportBtn.addEventListener('click', () => {
    const blob = new Blob([chatHistory.map(m => m.text).join('\n')], {type: 'text/plain'});
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = 'KirongChat.txt'; a.click();
  });

});
