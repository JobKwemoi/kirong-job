// ============================================================
// ⚡ KIRONG AI — FRONTEND ENGINE V6
// 🧠 Persistent Memory
// 🗂️ Chat Shelves
// ➕ Header Plus = OPEN SHELF
// 🆕 New Chat = ONLY INSIDE SHELF
// 📱 Mobile Swipe Drawer
// ⚡ Quick Actions
// 📎 File Upload
// 🎤 Voice Input
// 🌍 Language
// 🌙 Theme
// 💾 Export
// 📍 Location
// 🎨 Image Handling
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

// IMPORTANT:
// Header ＋ button opens SHELF.
// It does NOT create a new chat.
const openChatsBtn = document.getElementById("newChatBtn");


// ============================================================
// 💾 STORAGE KEYS
// ============================================================

const STORAGE_KEY = "kirong_ai_chats_v4";
const ACTIVE_CHAT_KEY = "kirong_ai_active_chat_v4";
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

    return (
        Date.now().toString(36) +
        Math.random()
            .toString(36)
            .slice(2, 10)
    );

}


// ============================================================
// 🗂️ CREATE CHAT OBJECT
// ============================================================

function createChat(title = "New Chat") {

    const now = Date.now();

    return {

        id: createId(),

        title: title,

        createdAt: now,

        updatedAt: now,

        history: []

    };

}


// ============================================================
// 💾 SAVE ALL CHATS
// ============================================================

function saveChats() {

    try {

        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(chats)
        );

        if (activeChatId) {

            localStorage.setItem(
                ACTIVE_CHAT_KEY,
                activeChatId
            );

        }

    } catch (error) {

        console.error(
            "❌ Kirong memory save failed:",
            error
        );

    }

}


// ============================================================
// 📥 LOAD CHATS
// ============================================================

function loadChats() {

    try {

        const saved =
            localStorage.getItem(STORAGE_KEY);

        if (saved) {

            chats = JSON.parse(saved);

        }

    } catch (error) {

        console.error(
            "❌ Kirong memory load failed:",
            error
        );

        chats = [];

    }


    if (!Array.isArray(chats)) {

        chats = [];

    }


    const savedActive =
        localStorage.getItem(
            ACTIVE_CHAT_KEY
        );


    if (
        savedActive &&
        chats.some(
            chat => chat.id === savedActive
        )
    ) {

        activeChatId = savedActive;

    }


    // If no active chat exists,
    // use the newest one.
    if (
        !activeChatId &&
        chats.length
    ) {

        chats.sort(
            (a, b) =>
                (b.updatedAt || 0) -
                (a.updatedAt || 0)
        );

        activeChatId = chats[0].id;

    }


    // First ever launch.
    if (!activeChatId) {

        const firstChat =
            createChat();

        chats.unshift(firstChat);

        activeChatId =
            firstChat.id;

        saveChats();

    }


    const active =
        getActiveChat();


    chatHistory =
        Array.isArray(active?.history)
            ? [...active.history]
            : [];

}


// ============================================================
// 🔎 GET ACTIVE CHAT
// ============================================================

function getActiveChat() {

    return chats.find(
        chat =>
            chat.id === activeChatId
    );

}


// ============================================================
// 💾 SAVE ACTIVE CHAT
// ============================================================

function saveActiveChat() {

    const chat =
        getActiveChat();

    if (!chat) return;


    chat.history =
        Array.isArray(chatHistory)
            ? chatHistory.slice(-20)
            : [];


    chat.updatedAt =
        Date.now();


    saveChats();

    renderShelves();

}


// ============================================================
// 🏷️ MAKE CHAT TITLE
// ============================================================

function makeChatTitle(text) {

    const clean =
        String(text || "")
            .replace(/\s+/g, " ")
            .trim();


    if (!clean) {

        return "New Chat";

    }


    if (clean.length <= 36) {

        return clean;

    }


    return (
        clean.slice(0, 33) +
        "..."
    );

}


// ============================================================
// 🏷️ AUTO CHAT TITLE
// ============================================================

function maybeSetTitle(text) {

    const chat =
        getActiveChat();

    if (!chat) return;


    if (
        chat.title === "New Chat" &&
        chatHistory.length <= 2
    ) {

        chat.title =
            makeChatTitle(text);

        chat.updatedAt =
            Date.now();

        saveChats();

        renderShelves();

    }

}


// ============================================================
// 🧠 SHELVES UI
// ============================================================

function createShelvesUI() {

    if (
        document.getElementById(
            "kirongShelves"
        )
    ) {

        return;

    }


    // ========================================================
    // 🌑 OVERLAY
    // ========================================================

    const overlay =
        document.createElement("div");

    overlay.id =
        "kirongShelvesOverlay";


    // ========================================================
    // 🗂️ SHELF DRAWER
    // ========================================================

    const shelves =
        document.createElement("aside");

    shelves.id =
        "kirongShelves";

    shelves.setAttribute(
        "aria-label",
        "Chat history"
    );


    shelves.innerHTML = `

        <div class="kirongShelvesHeader">

            <strong>
                🧠 Chats
            </strong>

            <button
                id="closeShelvesBtn"
                type="button"
                aria-label="Close chats"
                title="Close"
            >
                ✕
            </button>

        </div>


        <button
            id="shelfNewChatBtn"
            class="kirongNewChatBtn"
            type="button"
        >
            ＋ New Chat
        </button>


        <div
            id="kirongChatList"
            class="kirongChatList"
        ></div>

    `;


    document.body.prepend(overlay);
    document.body.prepend(shelves);


    // ========================================================
    // 🆕 NEW CHAT INSIDE SHELF
    // ========================================================

    const shelfNewChatBtn =
        document.getElementById(
            "shelfNewChatBtn"
        );


    shelfNewChatBtn?.addEventListener(
        "click",
        () => {

            createNewChat();

            closeShelves();

        }
    );


    // ========================================================
    // ❌ CLOSE
    // ========================================================

    const closeBtn =
        document.getElementById(
            "closeShelvesBtn"
        );


    closeBtn?.addEventListener(
        "click",
        closeShelves
    );


    // ========================================================
    // 🌑 OVERLAY CLOSE
    // ========================================================

    overlay.addEventListener(
        "click",
        closeShelves
    );


    // ========================================================
    // 🎨 FALLBACK SHELF CSS
    // ========================================================

    injectShelvesStyles();


    renderShelves();

}


// ============================================================
// ➕ HEADER PLUS → OPEN SHELF
// ============================================================

function setupHeaderShelfButton() {

    if (!openChatsBtn) {

        console.warn(
            "⚠️ Header chats button not found."
        );

        return;

    }


    // Remove any old listener by cloning.
    const freshButton =
        openChatsBtn.cloneNode(true);


    openChatsBtn.replaceWith(
        freshButton
    );


    freshButton.addEventListener(
        "click",
        event => {

            event.preventDefault();

            event.stopPropagation();

            openShelves();

        }
    );


    freshButton.setAttribute(
        "aria-label",
        "Open chats"
    );


    freshButton.setAttribute(
        "title",
        "Open chats"
    );

}


// ============================================================
// 📂 OPEN SHELF
// ============================================================

function openShelves() {

    const shelves =
        document.getElementById(
            "kirongShelves"
        );


    const overlay =
        document.getElementById(
            "kirongShelvesOverlay"
        );


    if (!shelves) return;


    renderShelves();


    shelves.classList.add("open");

    overlay?.classList.add("open");

    document.body.classList.add(
        "shelves-open"
    );

}


// ============================================================
// ❌ CLOSE SHELF
// ============================================================

function closeShelves() {

    const shelves =
        document.getElementById(
            "kirongShelves"
        );


    const overlay =
        document.getElementById(
            "kirongShelvesOverlay"
        );


    shelves?.classList.remove(
        "open"
    );

    overlay?.classList.remove(
        "open"
    );

    document.body.classList.remove(
        "shelves-open"
    );

}


// ============================================================
// 📱 SWIPE SHELF
// ============================================================

function enableSwipeShelves() {

    let startX = 0;
    let startY = 0;
    let tracking = false;


    document.addEventListener(
        "touchstart",
        event => {

            if (
                !event.touches ||
                !event.touches.length
            ) {

                return;

            }


            const touch =
                event.touches[0];


            startX =
                touch.clientX;

            startY =
                touch.clientY;

            tracking = true;

        },
        {
            passive: true
        }
    );


    document.addEventListener(
        "touchend",
        event => {

            if (!tracking) return;

            tracking = false;


            if (
                !event.changedTouches ||
                !event.changedTouches.length
            ) {

                return;

            }


            const touch =
                event.changedTouches[0];


            const endX =
                touch.clientX;

            const endY =
                touch.clientY;


            const deltaX =
                endX - startX;


            const deltaY =
                Math.abs(endY - startY);


            const horizontal =
                Math.abs(deltaX) >
                deltaY;


            if (!horizontal) return;


            // LEFT EDGE → RIGHT
            if (
                startX <= 55 &&
                deltaX >= 65
            ) {

                openShelves();

                return;

            }


            // SHELF → LEFT
            if (
                deltaX <= -65 &&
                document.body.classList.contains(
                    "shelves-open"
                )
            
