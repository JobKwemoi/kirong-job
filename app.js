/* ============================================================
   👑 KIRONG AI — FRONTEND ENGINE V9.1 MANSION (polished)
   - Royal Tabs (Chat/Projects/Tools/History)
   - 4-Second Smart Guidelines
   - Clear + Export System
   - Persistent Memory
   - File attach UI + copy-code wiring (fixed)
============================================================ */
"use strict";

const API_ENDPOINT = "/api/chat";
const MAX_HISTORY_ITEMS = 20;
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const MAX_STORED_CHATS = 50;
const MAX_STORED_MESSAGES = 50;

const WHATSAPP_NUMBER = "254792442670";
const WHATSAPP_BACKUP_NUMBER = "254736232188";
const WHATSAPP_MESSAGE = "Hello Kirong Job Kwemoi 👑, I came from Kirong AI and I would like to talk to you directly.";

const STORAGE_KEYS = {
  chats: "kirong_ai_chats_v8",
  activeChat: "kirong_ai_active_chat_v8",
  theme: "kirong_ai_theme_v8",
  language: "kirong_ai_language_v8",
  voice: "kirong_ai_voice_v8",
  visited: "kirong_visited",
  userId: "kirong_ai_user_id_v1"
};

/* DOM - NEW MANSION IDS */
const chatBox = document.getElementById("chatBox");
const userInput = document.getElementById("userInput");
const sendBtn = document.getElementById("sendBtn");
const newChatBtn = document.getElementById("newChatBtn");
const clearChatBtn = document.getElementById("clearChatBtn");
const exportChatBtn = document.getElementById("exportChatBtn");
const clearHistoryBtn = document.getElementById("clearHistoryBtn");
const exportHistoryBtn = document.getElementById("exportHistoryBtn");
const clearToolsBtn = document.getElementById("clearToolsBtn");
const exportToolsBtn = document.getElementById("exportToolsBtn");
const thinking = document.getElementById("thinking");
const fileInput = document.getElementById("fileInput");
const attachBtn = document.getElementById("attachBtn");
const filePreview = document.getElementById("filePreview");
const newProjectBtn = document.getElementById("newProjectBtn");
const micBtn = document.getElementById("micBtn");
const voiceReplyBtn = document.getElementById("voiceReplyBtn");
const imageModeBtn = document.getElementById("imageModeBtn");
const planBadge = document.getElementById("planBadge");

let messages = [];
let selectedFile = null;
let isSending = false;
let currentChatId = null;
let recognition = null;
let isListening = false;
let speechVoices = [];
let voiceRepliesEnabled = loadJSON(STORAGE_KEYS.voice, false);

/* ========== STORAGE ========== */
function loadJSON(k,f){try{const r=localStorage.getItem(k);return r?JSON.parse(r):f}catch{return f}}
function saveJSON(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch{}}
function createChatId(){return "chat_"+Date.now()+"_"+Math.random().toString(36).slice(2,8)}
function createChatTitle(t){const c=String(t||"").replace(/\s+/g," ").trim();return c?c.length>42?c.slice(0,42)+"...":c:"New Chat"}

/* ========== STABLE PER-DEVICE USER ID ==========
   Previously nothing was sent to the backend to identify a user,
   so everyone shared the "anonymous" account — meaning everyone's
   Projects (and usage/billing) would have collided. This generates
   one persistent ID per browser and reuses it on every request. */
function getDeviceUserId(){
  let id = localStorage.getItem(STORAGE_KEYS.userId);
  if(!id){
    id = (crypto.randomUUID ? crypto.randomUUID() : "user_"+Date.now()+"_"+Math.random().toString(36).slice(2,10));
    localStorage.setItem(STORAGE_KEYS.userId, id);
  }
  return id;
}

/* ========== TABS SYSTEM ========== */
function initTabs(){
  document.querySelectorAll('.tabBtn').forEach(btn=>{
    btn.addEventListener('click',()=>{
      const tab = btn.dataset.tab;
      document.querySelectorAll('.tabBtn').forEach(b=>{b.classList.remove('active');b.setAttribute('aria-selected','false')});
      document.querySelectorAll('.tabContent').forEach(s=>s.classList.remove('active'));
      btn.classList.add('active');btn.setAttribute('aria-selected','true');
      document.getElementById(tab+'Tab')?.classList.add('active');
      if(tab==='projects') renderProjectsGrid();
    });
  });
}

/* ========== 4-SECOND ROYAL GUIDELINE ========== */
function initRoyalGuidelines(){
  const grid = document.querySelector('.quickGrid');
  const welcome = document.getElementById('kirongWelcome');
  if(!grid) return;
  const hasVisited = localStorage.getItem(STORAGE_KEYS.visited);
  
  if(!hasVisited){
    grid.classList.add('show');
    let timer = setTimeout(()=>{
      if(!grid.dataset.used){
        grid.classList.add('hide');
        setTimeout(()=>{welcome?.classList.add('hideWelcome')}, 500);
        localStorage.setItem(STORAGE_KEYS.visited,'true');
      }
    }, 4000);

    grid.addEventListener('mouseenter',()=>clearTimeout(timer));
    grid.addEventListener('mouseleave',()=>{
      timer=setTimeout(()=>{
        if(!grid.dataset.used){grid.classList.add('hide');localStorage.setItem(STORAGE_KEYS.visited,'true')}
      },2000);
    });

    grid.querySelectorAll('.qBtn').forEach(btn=>{
      btn.addEventListener('click',()=>{
        grid.dataset.used='true';
        grid.classList.add('hide');
        localStorage.setItem(STORAGE_KEYS.visited,'true');
        if(userInput){userInput.value=btn.dataset.prompt; sendMessage();}
      });
    });
  }else{
    // Returning user - show briefly then hide
    grid.classList.add('hide');
    if(welcome && document.getElementById('chatBox').children.length>1) welcome.style.display='none';
  }
}

/* ========== HELPERS ========== */
function escapeHTML(v){const d=document.createElement("div");d.textContent=String(v??"");return d.innerHTML}
function renderMarkdown(t){
  let h=escapeHTML(t);
  h=h.replace(/```([\s\S]*?)```/g,(_,c)=>`<div class="codeWrapper"><button class="copyCodeBtn" data-copy="${encodeURIComponent(c.trim())}">📋 Copy</button><pre class="codeBlock"><code>${c.trim()}</code></pre></div>`);
  h=h.replace(/`([^`]+)`/g,"<code>$1</code>");h=h.replace(/\*\*(.*?)\*\*/g,"<strong>$1</strong>");h=h.replace(/\*(.*?)\*/g,"<em>$1</em>");
  h=h.replace(/^### (.*)$/gm,"<h4>$1</h4>");h=h.replace(/^## (.*)$/gm,"<h3>$1</h3>");h=h.replace(/^# (.*)$/gm,"<h2>$1</h2>");
  h=h.replace(/^[-•] (.*)$/gm,"<li>$1</li>");h=h.replace(/(https?:\/\/[^\s<]+)/g,'<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>');h=h.replace(/\n/g,"<br>");return h;
}
function showToast(m){
  let t=document.getElementById("kirongToast");if(!t){t=document.createElement("div");t.id="kirongToast";t.className="kirongToast";document.body.appendChild(t)}
  t.textContent=m;t.classList.add("show");clearTimeout(t._timeout);t._timeout=setTimeout(()=>t.classList.remove("show"),2200);
}
async function copyText(text){
  try{await navigator.clipboard.writeText(String(text||""));showToast("📋 Copied!");return true}
  catch{try{const a=document.createElement("textarea");a.value=String(text||"");a.style.position="fixed";a.style.opacity="0";document.body.appendChild(a);a.select();document.execCommand("copy");a.remove();showToast("📋 Copied!");return true}catch{showToast("⚠️ Copy failed");return false}}
}

/* ========== CHAT UI ========== */
function isUserNearBottom(){if(!chatBox) return true;return (chatBox.scrollHeight-chatBox.scrollTop-chatBox.clientHeight)<=120}
function scrollToBottom(f=false){if(!chatBox) return;if(!f&&!isUserNearBottom()) return;requestAnimationFrame(()=>chatBox.scrollTo({top:chatBox.scrollHeight,behavior:"smooth"}))}
function setThinking(a){if(thinking) thinking.classList.toggle("hidden",!a);if(a) scrollToBottom()}
function setSendingState(a){isSending=a;if(sendBtn){sendBtn.disabled=a;sendBtn.style.opacity=a?"0.6":""}if(userInput) userInput.disabled=a}

function addMessage(role,text,opt={}){
  if(!chatBox) return null;
  const auto=isUserNearBottom();
  const m=document.createElement("div");m.className=`message ${role}-message`;
  const b=document.createElement("div");b.className="messageBubble";
  if(opt.file){const fc=document.createElement("div");fc.className="attachedFile";fc.innerHTML=`<span>📎</span><span>${escapeHTML(opt.file)}</span>`;b.appendChild(fc)}
  if(text){
    const c=document.createElement("div");c.className="messageContent";c.innerHTML=role==="assistant"?renderMarkdown(text):escapeHTML(text).replace(/\n/g,"<br>");b.appendChild(c);
    if(role==="assistant"){
      const cb=document.createElement("button");cb.className="copyMessageBtn";cb.textContent="📋 Copy";cb.onclick=()=>copyText(text);b.appendChild(cb);
      if("speechSynthesis" in window){
        const sb=document.createElement("button");sb.className="speakMessageBtn";sb.textContent="🔊 Listen";sb.onclick=()=>speakText(text,sb);b.appendChild(sb);
      }
    }
  }
  m.appendChild(b);chatBox.appendChild(m);if(auto) scrollToBottom();return m;
}
function addImageMessage(text,image,provider="",prompt=""){
  if(!chatBox||!image) return null;
  const auto=isUserNearBottom();
  const m=document.createElement("div");m.className="message assistant-message";
  const b=document.createElement("div");b.className="messageBubble imageMessage";
  if(text){const i=document.createElement("div");i.className="messageContent";i.innerHTML=renderMarkdown(text);b.appendChild(i)}
  const img=document.createElement("img");img.src=image;img.alt=prompt||"Generated";img.className="generatedImage";img.onclick=()=>window.open(image,"_blank");b.appendChild(img);
  const act=document.createElement("div");act.className="imageActions";
  const dl=document.createElement("button");dl.textContent="⬇️ Save";dl.onclick=()=>{const a=document.createElement("a");a.href=image;a.download=`kirong-${Date.now()}.png`;a.click();showToast("🖼️ Saved")};act.appendChild(dl);
  const cp=document.createElement("button");cp.textContent="📋 Copy";cp.onclick=()=>copyText(image);act.appendChild(cp);b.appendChild(act);
  m.appendChild(b);chatBox.appendChild(m);if(auto) scrollToBottom();return m;
}

/* ========== COPY-CODE BUTTON WIRING (was previously unwired) ==========
   renderMarkdown() builds .copyCodeBtn buttons via innerHTML, so they
   never get a direct .onclick. A single delegated listener on chatBox
   catches clicks on any of them, including ones restored from history. */
if(chatBox){
  chatBox.addEventListener("click", e=>{
    const btn = e.target.closest(".copyCodeBtn");
    if(!btn) return;
    copyText(decodeURIComponent(btn.dataset.copy || ""));
  });
}

/* ========== FILE ATTACH UI ========== */
function renderFilePreview(){
  if(!filePreview) return;
  if(!selectedFile){
    filePreview.innerHTML="";
    filePreview.classList.add("hidden");
    return;
  }
  filePreview.classList.remove("hidden");
  filePreview.innerHTML = `<span class="fileChip">📎 ${escapeHTML(selectedFile.name)}<button type="button" id="removeFileBtn" aria-label="Remove attached file">✕</button></span>`;
  document.getElementById("removeFileBtn")?.addEventListener("click", ()=>{
    selectedFile = null;
    if(fileInput) fileInput.value = "";
    renderFilePreview();
  });
}

/* ========== VOICE INPUT (speech-to-text) ========== */
const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;

function initSpeechRecognition(){
  if(!SpeechRecognitionAPI){
    // Browser doesn't support it (e.g. desktop Firefox) — hide the mic
    // instead of showing a button that silently does nothing.
    if(micBtn) micBtn.style.display="none";
    return;
  }
  recognition = new SpeechRecognitionAPI();
  recognition.continuous = false;
  recognition.interimResults = true;
  recognition.lang = "en-US";

  recognition.onresult = (e)=>{
    let transcript = "";
    for(let i=0;i<e.results.length;i++){
      transcript += e.results[i][0].transcript;
    }
    if(userInput) userInput.value = transcript;
  };

  recognition.onerror = (e)=>{
    isListening = false;
    micBtn?.classList.remove("listening");
    if(e.error === "not-allowed" || e.error === "service-not-allowed"){
      showToast("⚠️ Microphone access denied");
    }else if(e.error !== "no-speech" && e.error !== "aborted"){
      showToast("⚠️ Voice input error, try again");
    }
  };

  recognition.onend = ()=>{
    isListening = false;
    micBtn?.classList.remove("listening");
  };
}

function toggleListening(){
  if(!recognition) return;
  if(isListening){
    recognition.stop();
    isListening = false;
    micBtn?.classList.remove("listening");
    return;
  }
  try{
    recognition.start();
    isListening = true;
    micBtn?.classList.add("listening");
  }catch{
    // start() throws if already running — ignore, state stays consistent
  }
}

if(micBtn) micBtn.addEventListener("click", toggleListening);

/* ========== VOICE OUTPUT (text-to-speech) ========== */
function loadSpeechVoices(){
  if(!("speechSynthesis" in window)) return;
  speechVoices = window.speechSynthesis.getVoices();
}
if("speechSynthesis" in window){
  loadSpeechVoices();
  window.speechSynthesis.onvoiceschanged = loadSpeechVoices;
}

function stripMarkdownForSpeech(text){
  return String(text||"")
    .replace(/```[\s\S]*?```/g,"code block, see chat for details.")
    .replace(/`([^`]+)`/g,"$1")
    .replace(/\*\*(.*?)\*\*/g,"$1")
    .replace(/\*(.*?)\*/g,"$1")
    .replace(/^#+\s*/gm,"")
    .replace(/https?:\/\/\S+/g,"a link")
    .trim();
}

function speakText(text, btn){
  if(!("speechSynthesis" in window)){
    showToast("⚠️ Voice output not supported on this device");
    return;
  }
  const synth = window.speechSynthesis;

  // If this exact button is already speaking, stop it (toggle off).
  if(btn && btn.classList.contains("speaking")){
    synth.cancel();
    btn.classList.remove("speaking");
    btn.textContent = "🔊 Listen";
    return;
  }

  synth.cancel(); // stop any other utterance first
  document.querySelectorAll(".speakMessageBtn.speaking").forEach(b=>{b.classList.remove("speaking");b.textContent="🔊 Listen"});

  const utterance = new SpeechSynthesisUtterance(stripMarkdownForSpeech(text));
  const preferred = speechVoices.find(v=>/en-/i.test(v.lang));
  if(preferred) utterance.voice = preferred;
  utterance.rate = 1;

  if(btn){
    btn.classList.add("speaking");
    btn.textContent = "⏸️ Stop";
    utterance.onend = ()=>{btn.classList.remove("speaking");btn.textContent="🔊 Listen"};
    utterance.onerror = ()=>{btn.classList.remove("speaking");btn.textContent="🔊 Listen"};
  }

  synth.speak(utterance);
}

/* ========== AUTO VOICE REPLIES (toggle in header) ========== */
function updateVoiceReplyBtn(){
  if(!voiceReplyBtn) return;
  voiceReplyBtn.textContent = voiceRepliesEnabled ? "🔊" : "🔇";
  voiceReplyBtn.classList.toggle("active", voiceRepliesEnabled);
  voiceReplyBtn.setAttribute("aria-pressed", String(voiceRepliesEnabled));
  voiceReplyBtn.title = voiceRepliesEnabled ? "Voice replies: ON" : "Voice replies: OFF";
}
if(voiceReplyBtn){
  updateVoiceReplyBtn();
  voiceReplyBtn.addEventListener("click", ()=>{
    voiceRepliesEnabled = !voiceRepliesEnabled;
    saveJSON(STORAGE_KEYS.voice, voiceRepliesEnabled);
    updateVoiceReplyBtn();
    if(!voiceRepliesEnabled && "speechSynthesis" in window) window.speechSynthesis.cancel();
    showToast(voiceRepliesEnabled ? "🔊 Voice replies on" : "🔇 Voice replies off");
  });
}

if(attachBtn) attachBtn.addEventListener("click", ()=>fileInput?.click());
if(fileInput) fileInput.addEventListener("change", ()=>{
  const f = fileInput.files?.[0];
  if(!f) return;
  if(f.size > MAX_FILE_SIZE){
    showToast("⚠️ File too large (max 10MB)");
    fileInput.value = "";
    return;
  }
  selectedFile = f;
  renderFilePreview();
  showToast(`📎 ${f.name} attached`);
});

/* ========== HISTORY & SAVE ========== */
function addToHistory(role,content,meta={}){
  if(!content&&!meta.image) return;
  messages.push({id:createChatId(),role,content:String(content||""),image:meta.image||null,imagePrompt:meta.imagePrompt||null,provider:meta.provider||null,file:meta.file||null,timestamp:Date.now()});
  if(messages.length>MAX_STORED_MESSAGES) messages=messages.slice(-MAX_STORED_MESSAGES);
  saveCurrentChat();
}
function saveCurrentChat(){
  if(!currentChatId){currentChatId=createChatId();localStorage.setItem(STORAGE_KEYS.activeChat,currentChatId)}
  const chats=loadJSON(STORAGE_KEYS.chats,[]);
  const first=messages.find(i=>i.role==="user"&&i.content);
  const data={id:currentChatId,title:createChatTitle(first?.content),messages:messages.slice(-MAX_STORED_MESSAGES),updatedAt:Date.now()};
  const idx=chats.findIndex(c=>c.id===currentChatId);
  if(idx>=0) chats[idx]=data;else chats.unshift(data);
  chats.sort((a,b)=>(b.updatedAt||0)-(a.updatedAt||0));
  saveJSON(STORAGE_KEYS.chats,chats.slice(0,MAX_STORED_CHATS));
  renderHistoryList();
}
function restoreChat(){
  const chats=loadJSON(STORAGE_KEYS.chats,[]);
  const active=localStorage.getItem(STORAGE_KEYS.activeChat);
  if(!active){currentChatId=createChatId();return}
  const chat=chats.find(i=>i.id===active);
  if(!chat){currentChatId=createChatId();return}
  currentChatId=chat.id;
  messages=Array.isArray(chat.messages)?chat.messages.filter(i=>i&& (i.role==="user"||i.role==="assistant")).slice(-MAX_STORED_MESSAGES):[];
  if(chatBox){chatBox.innerHTML=""; const w=document.createElement("div");w.id="kirongWelcome";w.innerHTML=document.querySelector("#kirongWelcome")?.innerHTML||""; if(messages.length===0) chatBox.appendChild(w); }
  messages.forEach(i=>{if(i.image) addImageMessage(i.content,i.image,i.provider,i.imagePrompt);else addMessage(i.role,i.content,i.file?{file:i.file}:{})});
  scrollToBottom(true);renderHistoryList();
}
function renderHistoryList(){
  const list=document.getElementById("historyList");
  if(!list) return;
  const chats=loadJSON(STORAGE_KEYS.chats,[]);
  if(chats.length===0){list.innerHTML='<p class="emptyText">No conversations yet. Start chatting!</p>';return}
  list.innerHTML="";
  chats.slice(0,30).forEach(chat=>{
    const d=document.createElement("div");d.className="historyItem"+(chat.id===currentChatId?" active":"");
    d.innerHTML=`<div><b>${escapeHTML(chat.title)}</b><small>${new Date(chat.updatedAt).toLocaleDateString()}</small></div><button aria-label="Open chat">↗️</button>`;
    d.onclick=()=>openChat(chat.id);
    list.appendChild(d);
  });
}
function openChat(id){
  const chats=loadJSON(STORAGE_KEYS.chats,[]);
  const chat=chats.find(i=>i.id===id);if(!chat) return;
  currentChatId=chat.id;localStorage.setItem(STORAGE_KEYS.activeChat,id);
  messages=Array.isArray(chat.messages)?chat.messages.slice(-MAX_STORED_MESSAGES):[];
  if(chatBox){chatBox.innerHTML=""; messages.forEach(i=>{if(i.image) addImageMessage(i.content,i.image,i.provider,i.imagePrompt);else addMessage(i.role,i.content,i.file?{file:i.file}:{})});}
  scrollToBottom(true);renderHistoryList();document.querySelector('.tabBtn[data-tab="chat"]')?.click();showToast("💬 Chat opened");
}
function startNewChat(){
  if(messages.length) saveCurrentChat();
  messages=[];selectedFile=null;currentChatId=createChatId();localStorage.setItem(STORAGE_KEYS.activeChat,currentChatId);
  if(fileInput) fileInput.value="";
  renderFilePreview();
  if(chatBox){
    chatBox.innerHTML=`<div class="kirongWelcome" id="kirongWelcome"><div class="kirongWelcomeLogo"><img src="/icon-192.png" alt="Kirong AI"></div><div class="welcomeEyebrow"><span></span>KIRONG AI CORE<span></span></div><h2>Welcome, <span>Kings & Queens!</span> 👑</h2><p>Hello 👋 I'm <strong>Kirong AI</strong>, your intelligent assistant for <strong>coding, writing, business</strong> and everyday tasks.<br><br>What can I help you with today?</p><div class="quickGrid"><button class="qBtn" data-prompt="Build me a modern portfolio website">💻 Build Website</button><button class="qBtn" data-prompt="Give me 3 business ideas with 10k in Kenya">💡 10K Biz Idea</button><button class="qBtn" data-prompt="Write me a professional CV for a software developer">📄 Pro CV</button><button class="qBtn" data-prompt="Explain Python like I'm 12 years old">📚 Learn Fast</button></div></div>`;
    initRoyalGuidelines();
  }
  renderHistoryList();showToast("＋ New chat");
}

/* ========== SEND ========== */
function buildFormData(message){
  const fd=new FormData();fd.append("message",message);fd.append("language","English");
  fd.append("history",JSON.stringify(messages.filter(i=>i&&(i.role==="user"||i.role==="assistant")&&typeof i.content==="string").slice(-MAX_HISTORY_ITEMS).map(i=>({role:i.role,content:i.content}))));
  if(selectedFile) fd.append("file",selectedFile,selectedFile.name);
  return fd;
}
async function sendMessage(){
  if(isSending) return;
  const message=String(userInput?.value||"").trim();
  if(!message&&!selectedFile) return;
  const visible=message||`Please analyze file: ${selectedFile?.name}`;
  if(!currentChatId){currentChatId=createChatId();localStorage.setItem(STORAGE_KEYS.activeChat,currentChatId)}
  document.getElementById("kirongWelcome")?.classList.add("hideWelcome");
  addMessage("user",message,selectedFile?{file:selectedFile.name}:{});
  addToHistory("user",visible,selectedFile?{file:selectedFile.name}:{});
  if(userInput) userInput.value="";
  setSendingState(true);setThinking(true);
  try{
    const fd=buildFormData(visible);
    const res=await fetch(API_ENDPOINT,{method:"POST",body:fd,headers:{Accept:"application/json","X-Kirong-User-Id":getDeviceUserId()},cache:"no-store"});
    const ct=res.headers.get("content-type")||"";
    let data;if(ct.includes("application/json")) data=await res.json();else throw new Error(await res.text());
    if(!res.ok||data?.type==="error") throw new Error(data?.text||`Server ${res.status}`);
    if(data?.type==="image"&&data?.image){
      addImageMessage(data.text||"🎨 Here is your image!",data.image,data.provider||"",data.prompt||visible);
      addToHistory("assistant",data.text||"Generated image",{image:data.image,imagePrompt:data.prompt||visible,provider:data.provider});
    }else{
      const ans=String(data?.text||data?.message||"No response");
      addMessage("assistant",ans);addToHistory("assistant",ans);
      if(voiceRepliesEnabled) speakText(ans, chatBox?.querySelector(".message.assistant-message:last-child .speakMessageBtn"));
    }
    selectedFile=null;if(fileInput) fileInput.value="";renderFilePreview();saveCurrentChat();
  }catch(e){
    addMessage("assistant",`⚠️ ${e.message||"Connection error, try again."}`);addToHistory("assistant",`Error: ${e.message}`);
  }finally{setThinking(false);setSendingState(false);userInput?.focus()}
}

/* ========== CLEAR + EXPORT ========== */
function exportChatFile(){
  if(messages.length===0){showToast("No chat to export");return}
  const lines=messages.map(i=>`${i.role==="user"?"You":"Kirong AI"}:\n${i.content}${i.image?`\n[Image: ${i.imagePrompt}]`:""}`).join("\n\n");
  const blob=new Blob([`KIRONG AI CHAT EXPORT\n====================\n\n${lines}`],{type:"text/plain"});const url=URL.createObjectURL(blob);
  const a=document.createElement("a");a.href=url;a.download=`kirong-chat-${Date.now()}.txt`;a.click();URL.revokeObjectURL(url);showToast("💾 Exported!");
}
if(clearChatBtn) clearChatBtn.addEventListener("click",()=>{if(confirm("Clear this conversation?")) startNewChat()});
if(exportChatBtn) exportChatBtn.addEventListener("click",exportChatFile);
if(clearHistoryBtn) clearHistoryBtn.addEventListener("click",()=>{if(confirm("Clear ALL history?")){localStorage.removeItem(STORAGE_KEYS.chats);localStorage.removeItem(STORAGE_KEYS.activeChat);startNewChat();renderHistoryList();showToast("🗑️ History cleared")}});
if(exportHistoryBtn) exportHistoryBtn.addEventListener("click",()=>{const chats=loadJSON(STORAGE_KEYS.chats,[]);if(!chats.length){showToast("No history");return}const blob=new Blob([JSON.stringify(chats,null,2)],{type:"application/json"});const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download=`kirong-history-${Date.now()}.json`;a.click();URL.revokeObjectURL(url)});

/* ========== PROJECTS (Phase 2 — real backend, Vercel Blob) ========== */
const PROJECTS_ENDPOINT = "/api/projects";
const projectsGrid = document.getElementById("projectsGrid");

/* ---- lightweight modal (also reusable for future features) ---- */
function openModal(innerHTML){
  closeModal();
  const overlay = document.createElement("div");
  overlay.className = "modalOverlay";
  overlay.id = "kirongModalOverlay";
  overlay.innerHTML = `<div class="modalBox">${innerHTML}</div>`;
  overlay.addEventListener("click", e=>{ if(e.target===overlay) closeModal(); });
  document.body.appendChild(overlay);
}
function closeModal(){
  document.getElementById("kirongModalOverlay")?.remove();
}

/* ---- helpers ---- */
function timeAgo(iso){
  if(!iso) return "just now";
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff/60000);
  if(mins<1) return "just now";
  if(mins<60) return `${mins}m ago`;
  const hrs = Math.floor(mins/60);
  if(hrs<24) return `${hrs}h ago`;
  const days = Math.floor(hrs/24);
  if(days<30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}
const PROJECT_ICONS = {website:"🌐",cv:"📄",business:"💼",code:"💻",note:"📝"};

/* ---- API calls ---- */
async function apiFetchProjects(){
  const res = await fetch(`${PROJECTS_ENDPOINT}?userId=${encodeURIComponent(getDeviceUserId())}`,{
    headers:{ "X-Kirong-User-Id": getDeviceUserId(), Accept:"application/json" },
    cache:"no-store"
  });
  const data = await res.json().catch(()=>({}));
  if(!res.ok || !data.ok) throw new Error(data?.error || `Server ${res.status}`);
  return Array.isArray(data.projects) ? data.projects : [];
}
async function apiCreateProject({title,type,content}){
  const res = await fetch(PROJECTS_ENDPOINT,{
    method:"POST",
    headers:{ "Content-Type":"application/json", "X-Kirong-User-Id": getDeviceUserId() },
    body: JSON.stringify({ userId:getDeviceUserId(), title, type, content })
  });
  const data = await res.json().catch(()=>({}));
  if(!res.ok || !data.ok) throw new Error(data?.error || `Server ${res.status}`);
  return data.project;
}
async function apiUpdateProject({id,title,content,type}){
  const res = await fetch(PROJECTS_ENDPOINT,{
    method:"PUT",
    headers:{ "Content-Type":"application/json", "X-Kirong-User-Id": getDeviceUserId() },
    body: JSON.stringify({ userId:getDeviceUserId(), id, title, content, type })
  });
  const data = await res.json().catch(()=>({}));
  if(!res.ok || !data.ok) throw new Error(data?.error || `Server ${res.status}`);
  return data.project;
}
async function apiDeleteProject(id){
  const res = await fetch(`${PROJECTS_ENDPOINT}?id=${encodeURIComponent(id)}&userId=${encodeURIComponent(getDeviceUserId())}`,{
    method:"DELETE",
    headers:{ "X-Kirong-User-Id": getDeviceUserId() }
  });
  const data = await res.json().catch(()=>({}));
  if(!res.ok || !data.ok) throw new Error(data?.error || `Server ${res.status}`);
}

/* ---- rendering ---- */
function renderProjectCard(project){
  const icon = PROJECT_ICONS[project.type] || "📝";
  const d = document.createElement("div");
  d.className = "projectCard";
  d.innerHTML = `<span>${icon}</span><h3>${escapeHTML(project.title)}</h3><p>Updated ${timeAgo(project.updatedAt)}</p>`;
  d.addEventListener("click", ()=>openProjectDetail(project));
  return d;
}

async function renderProjectsGrid(){
  if(!projectsGrid) return;
  projectsGrid.innerHTML = `<div class="projectCard new" id="newProjectCard"><span>＋</span><h3>New Project</h3><p>Start something royal</p></div>`;
  document.getElementById("newProjectCard")?.addEventListener("click", openNewProjectModal);

  try{
    const projects = await apiFetchProjects();
    if(projects.length===0){
      const empty = document.createElement("p");
      empty.className = "emptyText";
      empty.textContent = "No projects yet. Create your first one!";
      projectsGrid.appendChild(empty);
      return;
    }
    projects.forEach(p=>projectsGrid.appendChild(renderProjectCard(p)));
  }catch(e){
    const err = document.createElement("p");
    err.className = "emptyText";
    err.textContent = `⚠️ Could not load projects: ${e.message}`;
    projectsGrid.appendChild(err);
  }
}

/* ---- create dialog ---- */
function openNewProjectModal(){
  openModal(`
    <h3>✨ New Project</h3>
    <div class="modalField"><label>Title</label><input type="text" id="newProjTitle" placeholder="e.g. My Portfolio Site" maxlength="120" /></div>
    <div class="modalField"><label>Type</label>
      <select id="newProjType">
        <option value="website">🌐 Website</option>
        <option value="cv">📄 CV</option>
        <option value="business">💼 Business Plan</option>
        <option value="code">💻 Code Project</option>
        <option value="note">📝 Note</option>
      </select>
    </div>
    <div class="modalActions">
      <button id="modalCancelBtn">Cancel</button>
      <button class="primaryBtn" id="modalCreateBtn">Create</button>
    </div>
  `);
  document.getElementById("newProjTitle")?.focus();
  document.getElementById("modalCancelBtn")?.addEventListener("click", closeModal);
  document.getElementById("modalCreateBtn")?.addEventListener("click", async ()=>{
    const title = document.getElementById("newProjTitle")?.value.trim();
    const type = document.getElementById("newProjType")?.value || "note";
    if(!title){ showToast("⚠️ Give your project a title"); return; }
    try{
      await apiCreateProject({title, type, content:""});
      closeModal();
      showToast("✨ Project created!");
      renderProjectsGrid();
    }catch(e){
      showToast(`⚠️ ${e.message}`);
    }
  });
}

/* ---- view / edit dialog ---- */
function openProjectDetail(project){
  openModal(`
    <h3>${PROJECT_ICONS[project.type]||"📝"} ${escapeHTML(project.title)}</h3>
    <div class="modalField"><label>Title</label><input type="text" id="editProjTitle" value="${escapeHTML(project.title)}" maxlength="120" /></div>
    <div class="modalField"><label>Content</label><textarea id="editProjContent" placeholder="Project content, notes, code, draft text...">${escapeHTML(project.content||"")}</textarea></div>
    <div class="modalActions">
      <button class="dangerBtn" id="modalDeleteBtn">🗑️ Delete</button>
      <button id="modalSendChatBtn">💬 Discuss in Chat</button>
      <button class="primaryBtn" id="modalSaveBtn">💾 Save</button>
    </div>
  `);

  document.getElementById("modalSendChatBtn")?.addEventListener("click", ()=>{
    closeModal();
    document.querySelector('.tabBtn[data-tab="chat"]')?.click();
    if(userInput){
      const content = document.getElementById("editProjContent")?.value ?? project.content ?? "";
      userInput.value = `Here is my project "${project.title}":\n\n${content}\n\nHelp me improve it.`;
      userInput.focus();
    }
  });

  document.getElementById("modalDeleteBtn")?.addEventListener("click", async ()=>{
    if(!confirm("Delete this project? This can't be undone.")) return;
    try{
      await apiDeleteProject(project.id);
      closeModal();
      showToast("🗑️ Project deleted");
      renderProjectsGrid();
    }catch(e){ showToast(`⚠️ ${e.message}`); }
  });

  document.getElementById("modalSaveBtn")?.addEventListener("click", async ()=>{
    const title = document.getElementById("editProjTitle")?.value.trim();
    const content = document.getElementById("editProjContent")?.value ?? "";
    if(!title){ showToast("⚠️ Title can't be empty"); return; }
    try{
      await apiUpdateProject({id:project.id, title, content, type:project.type});
      closeModal();
      showToast("💾 Project saved");
      renderProjectsGrid();
    }catch(e){ showToast(`⚠️ ${e.message}`); }
  });
}

/* ---- wiring: header "+ New" button and tab switch ---- */
if(newProjectBtn) newProjectBtn.addEventListener("click", openNewProjectModal);

/* ========== IMAGE GENERATION MODE (scaffolded — Phase 3) ==========
   Backend has no image provider wired yet, so this is a safe
   placeholder: it does NOT change how sendMessage() behaves.
   When Phase 3 lands, this becomes a real mode toggle. */
if(imageModeBtn) imageModeBtn.addEventListener("click",()=>{
  showToast("🎨 Image generation launching soon, bro!");
});

/* ========== PRO / M-PESA UPGRADE (scaffolded — Phase 4) ==========
   No payment flow exists yet. Safe placeholder for now. */
if(planBadge) planBadge.addEventListener("click",()=>{
  showToast("👑 Pro + M-Pesa upgrade coming soon!");
});

/* ========== EVENTS ========== */
if(sendBtn) sendBtn.addEventListener("click",sendMessage);
if(userInput) userInput.addEventListener("keydown",e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();sendMessage()}});
if(newChatBtn) newChatBtn.addEventListener("click",startNewChat);
document.querySelectorAll('.qa').forEach(b=>b.addEventListener('click',()=>{if(userInput){userInput.value=(b.dataset.prompt||"")+"";userInput.focus()}}));

/* ========== INIT ========== */
function init(){
  initTabs();
  restoreChat();
  renderHistoryList();
  initRoyalGuidelines();
  renderFilePreview();
  initSpeechRecognition();
  console.log("⚡ KIRONG AI V9.3 MANSION READY - Tabs + Guidelines + Export + File Attach + Copy-Code + Voice + Projects");
}
if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",init);else init();
