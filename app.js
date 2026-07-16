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

  // WEKA GROQ API KEY HAPA MKUU
  const GROQ_API_KEY = "gsk_YOUR_API_KEY_HERE"; 

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

  const sendMessage = async () => {
    const text = userInput.value.trim();
    if(!text) return;

    if(text.toLowerCase().includes('my name is') || text.toLowerCase().includes('call me')) {
      userName = text.split(' ').pop();
      localStorage.setItem('kirongAIName', userName);
      document.getElementById('welcomeMsg').innerText = `Hello ${userName}! I'm Kirong AI. How can I help you today? 💜`;
    }

    addMessage(text, 'user-message');
    userInput.value = '';
    typing.classList.remove('hidden');

    const lowerText = text.toLowerCase();
    const personality = personalitySelect.value;
    const isImage = lowerText.includes('image') || lowerText.includes('generate') || lowerText.includes('picture') || lowerText.includes('draw');

    if(isImage) {
      typing.classList.add('hidden');
      generateImage(text);
    } else {
      await generateTextWithGroq(text, personality); // TUMA KWA GROQ
    }
  }

  async function generateTextWithGroq(prompt, personality) {
    try {
      let systemPrompt = `You are Kirong AI, created by Kirong Job Kwemoi. Be helpful, friendly, and professional.`;
      if(personality === 'Teacher') systemPrompt = `You are Kirong AI acting as a Teacher. Be patient and educational.`;
      if(personality === 'Hustler') systemPrompt = `You are Kirong AI acting as a Hustler. Be motivating and direct.`;
      if(personality === 'Funny') systemPrompt = `You are Kirong AI acting as Funny. Be witty and use emojis.`;

      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${GROQ_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "llama-3.1-8b-instant", // Ni fast na free
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: prompt }
          ],
          temperature: 0.7,
          max_tokens: 500
        })
      });

      const data = await response.json();
      const reply = data.choices[0].message.content;

      typing.classList.add('hidden');
      addMessage(reply, 'ai-message');

      // AUTO SPEAK
      if('speechSynthesis' in window) {
        speechSynthesis.speak(new SpeechSynthesisUtterance(reply));
      }

    } catch (error) {
      typing.classList.add('hidden');
      addMessage("Sorry, I couldn't connect to Groq. Check your API key 💜", 'ai-message');
      console.error(error);
    }
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
