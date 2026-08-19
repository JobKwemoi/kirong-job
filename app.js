// ============================================================
// ⚡ KIRONG AI — FRONTEND ENGINE V6.1 PREMIUM
// 🧠 Persistent Memory + Copy + Retry + Typing
// 🗂️ Chat Shelves + Neon Glass UI
// ============================================================

"use strict";

// ============================================================
// 🔌 DOM
// ============================================================
const chatBox = document.getElementById("chatBox");
const userInput = document.getElementById("userInput");
const sendBtn = document.getElementById("sendBtn");
const themeBtn = document.getElementById("themeBtn");
const thinking = document.getElementById("thinking");
const chatForm = document.getElementById("chatForm");
const languageSelect = document.getElementById("languageSelect");
const openChatsBtn = document.getElementById("newChatBtn");

// ============================================================
// 💾 STORAGE KEYS
// ============================================================
const STORAGE_KEY = "kirong_ai_chats_v6";
const ACTIVE_CHAT_KEY = "kirong_ai_active_chat_v6";
const THEME_KEY = "kirong_ai_theme_v3";

// ============================================================
// 🧠 STATE
// ============================================================
let chats = [];
let activeChatId = null;
let chatHistory = [];
let isSending = false;

// ============================================================
// 🆔 ID GENERATOR
// ============================================================
function createId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
}

// ============================================================
// 🗂️ CREATE CHAT OBJECT
// ============================================================
function createChat(title = "New Chat") {
    return {
        id: createId(),
        title: title,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        history: []
    };
}

// ============================================================
// 💾 SAVE ALL CHATS
// ============================================================
function saveChats() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(chats));
        if (activeChatId) localStorage.setItem(ACTIVE_CHAT_KEY, activeChatId);
    } catch (error) {
        console.error("❌ Kirong memory save failed:", error);
    }
}

// ============================================================
// 📥 LOAD CHATS
// ============================================================
function loadChats() {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) chats = JSON.parse(saved);
    } catch (error) {
        console.error("❌ Kirong memory load failed:", error);
        chats = [];
    }
    if (!Array.isArray(chats)) chats = [];

    const savedActive = localStorage.getItem(ACTIVE_CHAT_KEY);
    if (savedActive && chats.some(chat => chat.id === savedActive)) {
        activeChatId = savedActive;
    }
    if (!activeChatId && chats.length) {
        chats.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
        activeChatId = chats[0].id;
    }
    if (!activeChatId) {
        const firstChat = createChat();
        chats.unshift(firstChat);
        activeChatId = firstChat.id;
        saveChats();
    }
    const active = getActiveChat();
    chatHistory = Array.isArray(active?.history)? [...active.history] : [];
}

// ============================================================
// 🔎 GET ACTIVE CHAT
// ============================================================
function getActiveChat() {
    return chats.find(chat => chat.id === activeChatId);
}

// ============================================================
// 💾 SAVE ACTIVE CHAT
// ============================================================
function saveActiveChat() {
    const chat = getActiveChat();
    if (!chat) return;
    chat.history = Array.isArray(chatHistory)? chatHistory.slice(-20) : [];
    chat.updatedAt = Date.now();
    saveChats();
    renderShelves();
}

// ============================================================
// 🏷️ MAKE CHAT TITLE
// ============================================================
function makeChatTitle(text) {
    const clean = String(text || "").replace(/\s+/g, " ").trim();
    if (!clean) return "New Chat";
    return clean.length <= 36? clean : clean.slice(0, 33) + "...";
}

function maybeSetTitle(text) {
    const chat = getActiveChat();
    if (!chat) return;
    if (chat.title === "New Chat" && chatHistory.length <= 2) {
        chat.title = makeChatTitle(text);
        chat.updatedAt = Date.now();
        saveChats();
        renderShelves();
    }
}

// ============================================================
// 🧠 SHELVES UI
// ============================================================
function createShelvesUI() {
    if (document.getElementById("kirongShelves")) return;

    const overlay = document.createElement("div");
    overlay.id = "kirongShelvesOverlay";

    const shelves = document.createElement("aside");
    shelves.id = "kirongShelves";
    shelves.setAttribute("aria-label", "Chat history");

    shelves.innerHTML = `
        <div class="kirongShelvesHeader">
            <strong>🧠 Chats</strong>
            <button id="closeShelvesBtn" type="button" aria-label="Close chats">✕</button>
        </div>
        <button id="shelfNewChatBtn" class="kirongNewChatBtn" type="button">＋ New Chat</button>
        <div id="kirongChatList" class="kirongChatList"></div>
    `;
    document.body.prepend(overlay);
    document.body.prepend(shelves);

    document.getElementById("shelfNewChatBtn")?.addEventListener("click", () => { createNewChat(); closeShelves(); });
    document.getElementById("closeShelvesBtn")?.addEventListener("click", closeShelves);
    overlay.addEventListener("click", closeShelves);
    injectShelvesStyles();
    renderShelves();
}

function setupHeaderShelfButton() {
    if (!openChatsBtn) return;
    const freshButton = openChatsBtn.cloneNode(true);
    openChatsBtn.replaceWith(freshButton);
    freshButton.addEventListener("click", e => { e.preventDefault(); e.stopPropagation(); openShelves(); });
}

function openShelves() {
    document.getElementById("kirongShelves")?.classList.add("open");
    document.getElementById("kirongShelvesOverlay")?.classList.add("open");
    document.body.classList.add("shelves-open");
    renderShelves();
}

function closeShelves() {
    document.getElementById("kirongShelves")?.classList.remove("open");
    document.getElementById("kirongShelvesOverlay")?.classList.remove("open");
    document.body.classList.remove("shelves-open");
}

function enableSwipeShelves() {
    let startX = 0, startY = 0, tracking = false;
    document.addEventListener("touchstart", e => {
        if (!e.touches?.length) return;
        startX = e.touches[0].clientX; startY = e.touches[0].clientY; tracking = true;
    }, { passive: true });
    document.addEventListener("touchend", e => {
        if (!tracking ||!e.changedTouches?.length) return;
        tracking = false;
        const endX = e.changedTouches[0].clientX; const endY = e.changedTouches[0].clientY;
        const deltaX = endX - startX; const deltaY = Math.abs(endY - startY);
        if (Math.abs(deltaX) > deltaY) {
            if (startX <= 55 && deltaX >= 65) openShelves();
            if (deltaX <= -65 && document.body.classList.contains("shelves-open")) closeShelves();
        }
    }, { passive: true });
}

// ============================================================
// 📋 RENDER SHELVES
// ============================================================
function renderShelves() {
    const list = document.getElementById("kirongChatList");
    if (!list) return;
    list.innerHTML = "";
    const sortedChats = [...chats].sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));

    if (!sortedChats.length) {
        list.innerHTML = `<div class="kirongEmptyChats">No conversations yet.</div>`;
        return;
    }
    sortedChats.forEach(chat => {
        const item = document.createElement("div");
        item.className = "kirongChatItem" + (chat.id === activeChatId? " active" : "");
        item.innerHTML = `
            <span class="kirongChatIcon">💬</span>
            <span class="kirongChatTitle">${chat.title || "New Chat"}</span>
            <button class="kirongDeleteChat" type="button">🗑️</button>
        `;
        item.addEventListener("click", () => switchChat(chat.id));
        item.querySelector(".kirongDeleteChat").addEventListener("click", e => { e.stopPropagation(); deleteChat(chat.id); });
        list.appendChild(item);
    });
}

// ============================================================
// ➕ CREATE NEW CHAT
// ============================================================
function createNewChat() {
    const newChat = createChat();
    chats.unshift(newChat);
    activeChatId = newChat.id;
    chatHistory = [];
    saveChats(); renderChat(); renderShelves();
    userInput?.focus();
}

// ============================================================
// 🔄 SWITCH CHAT
// ============================================================
function switchChat(id) {
    const selected = chats.find(chat => chat.id === id);
    if (!selected) return;
    activeChatId = selected.id;
    chatHistory = Array.isArray(selected.history)? [...selected.history] : [];
    localStorage.setItem(ACTIVE_CHAT_KEY, activeChatId);
    renderChat(); renderShelves(); closeShelves();
    userInput?.focus();
}

// ============================================================
// 🗑️ DELETE CHAT
// ============================================================
function deleteChat(id) {
    const selected = chats.find(chat => chat.id === id);
    if (!selected ||!window.confirm(`Delete "${selected.title || "New Chat"}"?`)) return;
    chats = chats.filter(chat => chat.id!== id);
    if (!chats.length) chats.push(createChat());
    if (!chats.some(chat => chat.id === activeChatId)) {
        chats.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
        activeChatId = chats[0].id;
    }
    const active = getActiveChat();
    chatHistory = Array.isArray(active?.history)? [...active.history] : [];
    saveChats(); renderChat(); renderShelves();
}

// ============================================================
// 🖥️ RENDER CHAT
// ============================================================
function renderChat() {
    if (!chatBox) return;
    chatBox.innerHTML = "";
    if (!chatHistory.length) {
        chatBox.innerHTML = `
            <div class="kirongWelcome">
                <div class="kirongWelcomeLogo">⚡</div>
                <div class="welcomeEyebrow"><span></span>KIRONG AI CORE<span></span></div>
                <h2>Hello, I'm <span>Kirong AI</span> 👋</h2>
                <p>Your intelligent AI assistant for <strong>coding</strong>, <strong>learning</strong>, <strong>creativity</strong></p>
                <div class="welcomeChips">
                    <button onclick="quickFill('Explain ')">🧠 Explain</button>
                    <button onclick="quickFill('Write code for ')">💻 Code</button>
                    <button onclick="quickFill('Generate image of ')">🎨 Image</button>
                </div>
            </div>
        `;
    }
    chatHistory.forEach(item => {
        if (!item?.content) return;
        if (item.role === "user") addMessage(item.content, "user");
        if (item.role === "assistant") addMessage(item.content, "ai");
    });
    scrollToBottom();
}

function quickFill(text) { userInput.value = text; userInput.focus(); }

// ============================================================
// 🧹 HELPERS
// ============================================================
function escapeHTML(value) { return String(value?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }

function renderMarkdown(text) {
    let content = escapeHTML(text || "");
    content = content.replace(/```([\s\S]*?)```/g, (_, code) => `<pre><code>${code.trim()}</code></pre>`);
    content = content.replace(/`([^`]+)`/g, "<code>$1</code>");
    content = content.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
    content = content.replace(/\n/g, "<br>");
    return content;
}

// ============================================================
// 💬 ADD MESSAGE + COPY BUTTON
// ============================================================
function addMessage(text, sender = "ai", isError = false) {
    if (!chatBox) return null;
    const message = document.createElement("div");
    message.className = `message ${sender} ${isError? 'error' : ''}`;

    const paragraph = document.createElement("p");
    paragraph.innerHTML = renderMarkdown(text);
    message.appendChild(paragraph);

    if (sender === "ai" &&!isError) {
        const copyBtn = document.createElement("button");
        copyBtn.className = "kirongCopyBtn";
        copyBtn.innerHTML = "📋";
        copyBtn.onclick = () => {
            navigator.clipboard.writeText(text);
            copyBtn.innerHTML = "✅";
            setTimeout(() => copyBtn.innerHTML = "📋", 1500);
        };
        message.appendChild(copyBtn);
    }
    if (isError) {
        const retryBtn = document.createElement("button");
        retryBtn.className = "kirongRetryBtn";
        retryBtn.innerHTML = "🔄 Retry";
        retryBtn.onclick = () => sendMessage();
        message.appendChild(retryBtn);
    }
    chatBox.appendChild(message);
    scrollToBottom();
    return message;
}

// ============================================================
// 🎨 ADD IMAGE
// ============================================================
function addImage(image, caption = "", provider = "") {
    if (!chatBox ||!image) return;
    const message = document.createElement("div");
    message.className = "message ai";
    if (caption) message.innerHTML += `<p>${renderMarkdown(caption)}</p>`;
    message.innerHTML += `<img src="${image}" alt="Kirong AI generated image" loading="lazy">`;
    if (provider) message.innerHTML += `<small>🎨 ${provider}</small>`;
    message.innerHTML += `<div class="imageControls"><a href="${image}" download="KirongAI.png">📥 Save</a><button onclick="window.open('${image}')">🔍 Open</button></div>`;
    chatBox.appendChild(message);
    scrollToBottom();
}

// ============================================================
// 📜 SCROLL + THINKING
// ============================================================
function scrollToBottom() { requestAnimationFrame(() => { chatBox.scrollTop = chatBox.scrollHeight; }); }
function showThinking() { thinking?.classList.remove("hidden"); thinking.innerHTML = `<div class="kirongTyping"><span></span><span></span><span></span></div> Kirong AI is thinking...`; }
function hideThinking() { thinking?.classList.add("hidden"); }
function setSendingState(state) { isSending = state; if (sendBtn) { sendBtn.disabled = state; sendBtn.style.opacity = state? ".6" : "1"; } }

// ============================================================
// 🌍 LANGUAGE
// ============================================================
function getSelectedLanguage() { return languageSelect?.value || "English"; }

// ============================================================
// 🚀 SEND MESSAGE
// ============================================================
async function sendMessage() {
    if (isSending) return;
    const text = userInput?.value.trim();
    if (!text) return;
    addMessage(text, "user");
    userInput.value = "";
    setSendingState(true); showThinking();
    try {
        const response = await fetch("/api/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message: text, history: chatHistory, language: getSelectedLanguage() })
        });
        const data = await response.json();
        hideThinking();
        if (!response.ok) { addMessage(data?.text || "⚠️ Error", "ai", true); return; }

        if (data?.type === "image" && data?.image) {
            addImage(data.image, data.text, data.provider);
            chatHistory.push({ role: "user", content: text });
            chatHistory.push({ role: "assistant", content: "[Image generated by Kirong AI]" });
        } else {
            const reply = data?.text || "⚠️ Empty response.";
            addMessage(reply, "ai");
            chatHistory.push({ role: "user", content: text });
            chatHistory.push({ role: "assistant", content: reply });
        }
        if (chatHistory.length > 20) chatHistory = chatHistory.slice(-20);
        maybeSetTitle(text); saveActiveChat();
    } catch (error) {
        hideThinking();
        addMessage("⚠️ Connection problem. Try again.", "ai", true);
    } finally {
        setSendingState(false); userInput?.focus();
    }
}

// ============================================================
// 📤 EVENTS + THEME + QUICK ACTIONS + FILE + VOICE + LOCATION + EXPORT + CLEAR
// ============================================================
chatForm?.addEventListener("submit", e => { e.preventDefault(); sendMessage(); });
userInput?.addEventListener("keydown", e => { if (e.key === "Enter" &&!e.shiftKey) { e.preventDefault(); sendMessage(); } });

function loadTheme() { if (localStorage.getItem(THEME_KEY) === "dark") { document.body.classList.add("dark"); themeBtn && (themeBtn.textContent = "☀️"); } }
loadTheme();
themeBtn?.addEventListener("click", () => {
    document.body.classList.toggle("dark");
    const dark = document.body.classList.contains("dark");
    themeBtn.textContent = dark? "☀️" : "🌙";
    localStorage.setItem(THEME_KEY, dark? "dark" : "light");
});

const quickPrompts = { Code: "💻 Help me write code for ", Explain: "🧠 Explain: ", Write: "✍️ Help me write ", Image: "🎨 Generate image of " };
document.querySelectorAll(".quickBtn").forEach(btn => {
    btn.addEventListener("click", () => { userInput.value = quickPrompts[btn.dataset.action] || ""; userInput.focus(); });
});

document.getElementById("clearBtn")?.addEventListener("click", () => {
    if (!window.confirm("Clear this conversation?")) return;
    chatHistory = []; const chat = getActiveChat(); if (chat) { chat.history = []; chat.title = "New Chat"; }
    saveChats(); renderChat(); renderShelves();
});

document.getElementById("exportBtn")?.addEventListener("click", () => {
    const messages = Array.from(document.querySelectorAll("#chatBox.message")).map(m => m.innerText).join("\n\n--------------------\n\n");
    const blob = new Blob([messages], { type: "text/plain" });
    const url = URL.createObjectURL(blob); const a = document.createElement("a");
    a.href = url; a.download = "KirongAI_Chat.txt"; a.click(); URL.revokeObjectURL(url);
});

// ============================================================
// 🎨 SHELF + PREMIUM CSS INJECTION
// ============================================================
function injectShelvesStyles() {
    if (document.getElementById("kirongShelvesRuntimeStyles")) return;
    const style = document.createElement("style");
    style.id = "kirongShelvesRuntimeStyles";
    style.textContent = `
        #kirongShelvesOverlay{position:fixed;inset:0;background:rgba(0,0,0,.6);opacity:0;visibility:hidden;pointer-events:none;z-index:9998;transition:opacity.3s;backdrop-filter:blur(8px)}
        #kirongShelvesOverlay.open{opacity:1;visibility:visible;pointer-events:auto}
        #kirongShelves{position:fixed;top:0;left:0;bottom:0;width:min(360px,90vw);transform:translateX(-105%);transition:transform.4s var(--ease);z-index:9999;overflow-y:auto;background:rgba(10,8,18,.85);border-right:1px solid var(--border);backdrop-filter:blur(30px)}
        #kirongShelves.open{transform:translateX(0)}
       .kirongShelvesHeader{display:flex;align-items:center;justify-content:space-between;padding:18px;border-bottom:1px solid var(--border)}
       .kirongNewChatBtn{width:calc(100% - 28px);height:46px;margin:15px 14px;border:1px solid rgba(139,92,246,.45);border-radius:14px;background:linear-gradient(135deg,rgba(139,92,246,.22),rgba(109,40,217,.12));color:#fff;font-weight:800;cursor:pointer}
       .kirongChatItem{display:flex;align-items:center;gap:10px;padding:12px 14px;margin:6px 12px;border-radius:14px;cursor:pointer;border:1px solid transparent}
       .kirongChatItem:hover{background:var(--surface-hover)}.kirongChatItem.active{background:rgba(139,92,246,.18);border-color:var(--primary)}
       .kirongCopyBtn{position:absolute;top:10px;right:10px;background:var(--surface);border:1px solid var(--border);border-radius:8px;padding:5px 8px;cursor:pointer;opacity:0;transition:opacity.2s}
       .message:hover.kirongCopyBtn{opacity:1}.kirongRetryBtn{margin-top:10px;padding:7px 12px;background:rgba(239,68,68,.15);border:1px solid var(--danger);color:var(--danger);border-radius:8px;cursor:pointer}
       .kirongTyping{display:inline-flex;gap:4px}.kirongTyping span{width:7px;height:7px;border-radius:50%;background:var(--primary);animation:bounce 1.4s infinite}
       .kirongTyping span:nth-child(2){animation-delay:.2s}.kirongTyping span:nth-child(3){animation-delay:.4s}
        @keyframes bounce{0%,80%,100%{transform:scale(0)}40%{transform:scale(1)}}
       .message{position:relative;animation:fadeInUp.3s var(--ease)} @keyframes fadeInUp{from{opacity:0;transform:translateY(10px)}to{opacity:1}}
       .welcomeChips{display:flex;gap:8px;margin-top:18px;flex-wrap:wrap;justify-content:center}
       .welcomeChips button{padding:9px 14px;border:1px solid rgba(139,92,246,.35);background:var(--surface);color:var(--text-soft);border-radius:22px;cursor:pointer;font-weight:600}
       .welcomeChips button:hover{background:var(--surface-hover);border-color:var(--primary)}
    `;
    document.head.appendChild(style);
}

// ============================================================
// 🚀 STARTUP
// ============================================================
function initKirongAI() {
    loadChats(); createShelvesUI(); setupHeaderShelfButton(); enableSwipeShelves(); renderChat();
    console.log("⚡ Kirong AI V6.1 PREMIUM Loaded");
}
document.readyState === "loading"? document.addEventListener("DOMContentLoaded", initKirongAI) : initKirongAI();
