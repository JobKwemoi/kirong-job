// ============================================================
// ⚡ KIRONG AI — FRONTEND ENGINE V5
// 🧠 Memory + 🗂️ Chat Shelves + 📱 Mobile Swipe Drawer
// ⚡ Power Quick Actions
// 📎 File Upload
// 🎤 Voice Input
// 🎨 Image Handling
// 💾 Local Storage
// 🌍 Language
// 🌙 Theme
// ✨ Swipe from LEFT to open Chats
// ❌ No floating shelves button
// ============================================================

"use strict";


// ============================================================
// 🔌 DOM
// ============================================================

const chatBox =
    document.getElementById("chatBox");

const userInput =
    document.getElementById("userInput");

const sendBtn =
    document.getElementById("sendBtn");

const themeBtn =
    document.getElementById("themeBtn");

const thinking =
    document.getElementById("thinking");

const chatForm =
    document.getElementById("chatForm");

const languageSelect =
    document.getElementById("languageSelect");


// ============================================================
// 💾 STORAGE
// ============================================================

const STORAGE_KEY =
    "kirong_ai_chats_v3";

const ACTIVE_CHAT_KEY =
    "kirong_ai_active_chat_v3";

const THEME_KEY =
    "kirong_ai_theme_v2";


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
            .slice(2, 9)
    );

}


// ============================================================
// 🗂️ CREATE CHAT
// ============================================================

function createChat(title = "New Chat") {

    return {

        id: createId(),

        title,

        createdAt: Date.now(),

        updatedAt: Date.now(),

        history: []

    };

}


// ============================================================
// 💾 SAVE CHATS
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
            localStorage.getItem(
                STORAGE_KEY
            );

        if (saved) {

            chats =
                JSON.parse(saved);

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
            chat =>
                chat.id === savedActive
        )
    ) {

        activeChatId =
            savedActive;

    }


    if (
        !activeChatId &&
        chats.length
    ) {

        chats.sort(
            (a, b) =>
                b.updatedAt -
                a.updatedAt
        );

        activeChatId =
            chats[0].id;

    }


    if (!activeChatId) {

        const firstChat =
            createChat();

        chats.unshift(
            firstChat
        );

        activeChatId =
            firstChat.id;

        saveChats();

    }


    const active =
        getActiveChat();


    chatHistory =
        Array.isArray(
            active?.history
        )
            ? [...active.history]
            : [];

}


// ============================================================
// 🔎 GET ACTIVE CHAT
// ============================================================

function getActiveChat() {

    return chats.find(
        chat =>
            chat.id ===
            activeChatId
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
        Array.isArray(
            chatHistory
        )
            ? chatHistory.slice(-20)
            : [];


    chat.updatedAt =
        Date.now();


    saveChats();

    renderShelves();

}


// ============================================================
// 🏷️ CREATE CHAT TITLE
// ============================================================

function makeChatTitle(text) {

    const clean =
        String(text || "")
            .replace(
                /\s+/g,
                " "
            )
            .trim();


    if (!clean) {

        return "New Chat";

    }


    if (
        clean.length <= 36
    ) {

        return clean;

    }


    return (
        clean.slice(0, 33) +
        "..."
    );

}


// ============================================================
// 🏷️ AUTO TITLE
// ============================================================

function maybeSetTitle(text) {

    const chat =
        getActiveChat();

    if (!chat) return;


    if (
        chat.title ===
            "New Chat" &&
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
// 🗂️ CREATE SHELVES UI
// ============================================================

function createShelvesUI() {

    if (
        document.getElementById(
            "kirongShelves"
        )
    ) {

        return;

    }


    // --------------------------------------------------------
    // Overlay
    // --------------------------------------------------------

    const overlay =
        document.createElement(
            "div"
        );


    overlay.id =
        "kirongShelvesOverlay";


    // --------------------------------------------------------
    // Drawer
    // --------------------------------------------------------

    const shelves =
        document.createElement(
            "aside"
        );


    shelves.id =
        "kirongShelves";


    shelves.setAttribute(
        "aria-label",
        "Chat history"
    );


    shelves.innerHTML = `

        <div
            class="kirongShelvesHeader"
        >

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
            id="newChatBtn"
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


    document.body.prepend(
        overlay
    );

    document.body.prepend(
        shelves
    );


    // --------------------------------------------------------
    // New chat
    // --------------------------------------------------------

    const newChatBtn =
        document.getElementById(
            "newChatBtn"
        );


    newChatBtn?.addEventListener(
        "click",
        () => {

            createNewChat();

            closeShelves();

        }
    );


    // --------------------------------------------------------
    // Close button
    // --------------------------------------------------------

    const closeBtn =
        document.getElementById(
            "closeShelvesBtn"
        );


    closeBtn?.addEventListener(
        "click",
        closeShelves
    );


    // --------------------------------------------------------
    // Overlay close
    // --------------------------------------------------------

    overlay.addEventListener(
        "click",
        closeShelves
    );


    // --------------------------------------------------------
    // Runtime fallback styles
    // --------------------------------------------------------

    injectShelvesStyles();


    // --------------------------------------------------------
    // Render
    // --------------------------------------------------------

    renderShelves();

}


// ============================================================
// 📂 OPEN SHELVES
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


    shelves.classList.add(
        "open"
    );


    overlay?.classList.add(
        "open"
    );


    document.body.classList.add(
        "shelves-open"
    );

}


// ============================================================
// ✕ CLOSE SHELVES
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
// 📱 MOBILE SWIPE SHELVES
//
// LEFT EDGE → RIGHT
// Opens shelves.
//
// SHELVES OPEN → LEFT
// Closes shelves.
//
// NO BUTTON.
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

            if (!tracking) {

                return;

            }


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
                Math.abs(
                    endY - startY
                );


            const horizontal =
                Math.abs(deltaX) >
                deltaY;


            if (!horizontal) {

                return;

            }


            // ------------------------------------------------
            // Open shelves
            // Must begin near LEFT edge
            // ------------------------------------------------

            if (
                startX <= 55 &&
                deltaX >= 65
            ) {

                openShelves();

                return;

            }


            // ------------------------------------------------
            // Close shelves
            // ------------------------------------------------

            if (
                deltaX <= -65 &&
                document.body.classList.contains(
                    "shelves-open"
                )
            ) {

                closeShelves();

            }

        },
        {
            passive: true
        }
    );

}


// ============================================================
// 📋 RENDER CHAT SHELVES
// ============================================================

function renderShelves() {

    const list =
        document.getElementById(
            "kirongChatList"
        );


    if (!list) return;


    
