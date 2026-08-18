// ============================================================
// ⚡ KIRONG AI — FRONTEND ENGINE V6
// 🧠 Memory
// 🗂️ Chat Shelves
// ➕ New Chat
// 📱 Mobile Swipe Drawer
// ⚡ Quick Actions
// 📎 File Upload
// 🎤 Voice Input
// 🎨 Image Handling
// 💾 Local Storage
// 🌍 Language
// 🌙 Theme
// 📍 Location
// 💾 Export
// ============================================================

"use strict";


// ============================================================
// 🔌 DOM REFERENCES
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

const headerNewChatBtn =
    document.getElementById("headerNewChatBtn");


// ============================================================
// 💾 STORAGE KEYS
// ============================================================

const STORAGE_KEY =
    "kirong_ai_chats_v4";

const ACTIVE_CHAT_KEY =
    "kirong_ai_active_chat_v4";

const THEME_KEY =
    "kirong_ai_theme_v3";


// ============================================================
// 🧠 APPLICATION STATE
// ============================================================

let chats = [];

let activeChatId = null;

let chatHistory = [];

let isSending = false;


// ============================================================
// 🆔 CREATE UNIQUE ID
// ============================================================

function createId() {

    return (
        Date.now().toString(36) +
        "-" +
        Math.random()
            .toString(36)
            .slice(2, 10)
    );

}


// ============================================================
// 🗂️ CREATE CHAT OBJECT
// ============================================================

function createChat(
    title = "New Chat"
) {

    return {

        id:
            createId(),

        title:
            title,

        createdAt:
            Date.now(),

        updatedAt:
            Date.now(),

        history:
            []

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
        chats.length > 0
    ) {

        chats.sort(
            (a, b) =>
                (b.updatedAt || 0) -
                (a.updatedAt || 0)
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

    }


    const active =
        getActiveChat();


    chatHistory =
        Array.isArray(
            active?.history
        )
            ? [...active.history]
            : [];


    saveChats();

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
// 🏷️ AUTO TITLE CHAT
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
// 🧹 REMOVE OLD SHELVES BUTTON
// ============================================================

function removeOldShelvesButton() {

    const oldButton =
        document.getElementById(
            "kirongOpenShelvesBtn"
        );

    if (oldButton) {

        oldButton.remove();

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
    // OVERLAY
    // --------------------------------------------------------

    const overlay =
        document.createElement(
            "div"
        );


    overlay.id =
        "kirongShelvesOverlay";


    // --------------------------------------------------------
    // DRAWER
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
    // NEW CHAT
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
    // CLOSE
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
    // OVERLAY
    // --------------------------------------------------------

    overlay.addEventListener(
        "click",
        closeShelves
    );


    // --------------------------------------------------------
    // ESCAPE KEY
    // --------------------------------------------------------

    document.addEventListener(
        "keydown",
        event => {

            if (
                event.key === "Escape"
            ) {

                closeShelves();

            }

        }
    );


    // --------------------------------------------------------
    // FALLBACK CSS
    // --------------------------------------------------------

    injectShelvesStyles();


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
// 📱 MOBILE SWIPE
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

            tracking =
                true;

        },
        {
            passive: true
        }
    );


    document.addEventListener(
        "touchend",
        event => {

            if (!tracking) return;


            tracking =
                false;


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


            if (!horizontal) return;


            // LEFT EDGE → RIGHT
            if (
                startX <= 55 &&
                deltaX >= 65
            ) {

                openShelves();

                return;

            }


            // RIGHT → LEFT
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
// 📋 RENDER SHELVES
// ============================================================

function renderShelves() {

    const list =
        document.getElementById(
            "kirongChatList"
        );


    if (!list) return;


    list.innerHTML = "";


    const sortedChats =
        [...chats].sort(
            (a, b) =>
                (b.updatedAt || 0) -
                (a.updatedAt || 0)
        );


    if (!sortedChats.length) {

        list.innerHTML = `

            <div
                style="
                    padding:24px 12px;
                    text-align:center;
                    opacity:.55;
                    font-size:13px;
                "
            >
                No chats yet.
            </div>

        `;

        return;

    }


    sortedChats.forEach(
        chat => {

            const item =
                document.createElement(
                    "div"
                );


            item.className =
                "kirongChatItem";


            if (
                chat.id ===
                activeChatId
            ) {

                item.classList.add(
                    "active"
                );

            }


            const title =
                document.createElement(
                    "span"
                );


            title.className =
                "kirongChatTitle";


            title.textContent =
                chat.title ||
                "New Chat";


            const deleteBtn =
                document.createElement(
                    "button"
                );


            deleteBtn.className =
                "kirongDeleteChat";


            deleteBtn.type =
                "button";


            deleteBtn.title =
                "Delete chat";


            deleteBtn.setAttribute(
                "aria-label",
                "Delete chat"
            );


            deleteBtn.textContent =
                "🗑️";


            deleteBtn.addEventListener(
                "click",
                event => {

                    event.stopPropagation();

                    deleteChat(
                        chat.id
                    );

                }
            );


            item.appendChild(
                title
            );

            item.appendChild(
                deleteBtn
            );


            item.addEventListener(
                "click",
                () => {

                    switchChat(
                        chat.id
                    );

                }
            );


            list.appendChild(
                item
            );

        }
    );

}


// ============================================================
// ➕ CREATE NEW CHAT
// 🧠 AUTO-SAVE CURRENT CHAT FIRST
// ============================================================

function createNewChat() {

    // --------------------------------------------------------
    // SAVE CURRENT CHAT
    // --------------------------------------------------------

    const currentChat =
        getActiveChat();


    if (currentChat) {

        currentChat.history =
            Array.isArray(
                chatHistory
            )
                ? chatHistory.slice(-20)
                : [];


        // Automatic title
        if (
            currentChat.title === "New Chat" &&
            chatHistory.length > 0
        ) {

            const firstUserMessage =
                chatHistory.find(
                    item =>
                        item?.role === "user"
                );


            if (
                firstUserMessage?.content
            ) {

                currentChat.title =
                    makeChatTitle(
                        firstUserMessage.content
                    );

            }

        }


        currentChat.updatedAt =
            Date.now();

    }


    // --------------------------------------------------------
    // SAVE TO LOCAL STORAGE
    // --------------------------------------------------------

    saveChats();


    // --------------------------------------------------------
    // REFRESH SHELVES
    // --------------------------------------------------------

    renderShelves();


    // --------------------------------------------------------
    // CREATE FRESH CHAT
    // --------------------------------------------------------

    const newChat =
        createChat(
            "New Chat"
        );


    chats.unshift(
        newChat
    );


    activeChatId =
        newChat.id;


    chatHistory =
        [];


    // --------------------------------------------------------
    // SAVE ACTIVE CHAT
    // --------------------------------------------------------

    localStorage.setItem(
        ACTIVE_CHAT_KEY,
        activeChatId
    );


    saveChats();


    // --------------------------------------------------------
    // RENDER
    // --------------------------------------------------------

    renderChat();

    renderShelves();


    // --------------------------------------------------------
    // FOCUS INPUT
    // --------------------------------------------------------

    userInput?.focus();


    console.log(
        "➕ New chat created."
    );

}


// ============================================================
// 🔄 SWITCH CHAT
// ============================================================

function switchChat(id) {

    const selected =
        chats.find(
            chat =>
                chat.id === id
        );


    if (!selected) return;


    activeChatId =
        selected.id;


    chatHistory =
        Array.isArray(
            selected.history
        )
            ? [...selected.history]
            : [];


    localStorage.setItem(
        ACTIVE_CHAT_KEY,
        activeChatId
    );


    renderChat();

    renderShelves();

    closeShelves();

    userInput?.focus();

}


// ============================================================
// 🗑️ DELETE CHAT
// ============================================================

function deleteChat(id) {

    const selected =
        chats.find(
            chat =>
                chat.id === id
        );


    if (!selected) return;


    const confirmed =
        window.confirm(
            `Delete "${selected.title}"?`
        );


    if (!confirmed) return;


    chats =
        chats.filter(
            chat =>
                chat.id !== id
        );


    // --------------------------------------------------------
    // ALWAYS KEEP ONE CHAT
    // --------------------------------------------------------

    if (!chats.length) {

        const fresh =
            createChat();

        chats.push(
            fresh
        );

    }


    // --------------------------------------------------------
    // SELECT NEW ACTIVE CHAT IF NEEDED
    // --------------------------------------------------------

    if (
        !chats.some(
            chat =>
                chat.id === activeChatId
        )
    ) {

        chats.sort(
            (a, b) =>
                (b.updatedAt || 0) -
                (a.updatedAt || 0)
        );


        activeChatId =
            chats[0].id;

    }


    const active =
        getActiveChat();


    chatHistory =
        Array.isArray(
            active?.history
        )
            ? [...active.history]
            : [];


    saveChats();

    renderChat();

    renderShelves();

}


// ============================================================
// 🖥️ RENDER CURRENT CHAT
// ============================================================

function renderChat() {

    if (!chatBox) return;


    chatBox.innerHTML = `

        <div class="kirongWelcome">

            <div
                class="kirongWelcomeLogo"
                aria-hidden="true"
            >
                ⚡
            </div>

            <div class="welcomeEyebrow">

                <span></span>

                KIRONG AI CORE

                <span></span>

            </div>

            <h2>

                Hello, I'm

                <span>
                    Kirong AI
                </span>

                👋

            </h2>

            <p>

                Your intelligent AI assistant for

                <strong>coding</strong>,

                <strong>learning</strong>,

                <strong>creativity</strong>,

                <strong>business</strong>

                and everyday tasks.

            </p>

            <div class="welcomeHint">

                <span class="hintIcon">
                    ✨
                </span>

                <span>
                    What can I help you with today?
                </span>

            </div>

        </div>

    `;


    chatHistory.forEach(
        item => {

            if (
                !item ||
                !item.content
            ) {

                return;

            }


            if (
                item.role === "user"
            ) {

                addMessage(
                    item.content,
                    "user"
                );

            }


            if (
                item.role === "assistant"
            ) {

                if (
                    item.content ===
                    "[Image generated by Kirong AI]"
                ) {

                    addMessage(
                        "🎨 Image generated by Kirong AI.",
                        "ai"
                    );

                } else {

                    addMessage(
                        item.content,
                        "ai"
                    );

                }

            }

        }
    );


    scrollToBottom();

}


// ============================================================
// 🧹 ESCAPE HTML
// ============================================================

function escapeHTML(value) {

    return String(
        value ?? ""
    )
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );

}


// ============================================================
// 📝 MARKDOWN RENDERER
// ============================================================

function renderMarkdown(text) {

    let content =
        escapeHTML(
            text || ""
        );


    // Code blocks
    content =
        content.replace(
            /```([\s\S]*?)```/g,
            (_, code) =>
                `<pre><code>${code.trim()}</code></pre>`
        );


    // Inline code
    content =
        content.replace(
            /`([^`]+)`/g,
            "<code>$1</code>"
        );


    // Bold
    content =
        content.replace(
            /\*\*(.*?)\*\*/g,
            "<strong>$1</strong>"
        );


    // Headings
    content =
        content.replace(
            /^### (.*)$/gm,
            "<strong>$1</strong>"
        );


    content =
        content.replace(
            /^## (.*)$/gm,
            "<strong>$1</strong>"
        );


    content =
        content.replace(
            /^# (.*)$/gm,
            "<strong>$1</strong>"
        );


    // Bullets
    content =
        content.replace(
            /^\s*[-*]\s+(.*)$/gm,
            "• $1"
        );


    // New lines
    content =
        content.replace(
            /\n/g,
            "<br>"
        );


    return content;

}


// ============================================================
// 💬 ADD MESSAGE
// ============================================================

function addMessage(
    text,
    sender = "ai"
) {

    if (!chatBox) return null;


    const message =
        document.createElement(
            "div"
        );


    message.className =
        `message ${sender}`;


    const paragraph =
        document.createElement(
            "p"
        );


    paragraph.innerHTML =
        renderMarkdown(
            text
        );


    message.appendChild(
        paragraph
    );


    chatBox.appendChild(
        message
    );


    scrollToBottom();


    return message;

}


// ============================================================
// 🎨 ADD IMAGE
// ============================================================

function addImage(
    image,
    caption = "",
    provider = ""
) {

    if (
        !chatBox ||
        !image
    ) {

        return;

    }


    const message =
        document.createElement(
            "div"
        );


    message.className =
        "message ai";


    if (caption) {

        const paragraph =
            document.createElement(
                "p"
            );


        paragraph.innerHTML =
            renderMarkdown(
                caption
            );


        message.appendChild(
            paragraph
        );

    }


    const img =
        document.createElement(
            "img"
        );


    img.src =
        image;


    img.alt =
        "Kirong AI generated image";


    img.loading =
        "lazy";


    img.style.maxWidth =
        "100%";


    img.style.borderRadius =
        "16px";


    message.appendChild(
        img
    );


    if (provider) {

        const small =
            document.createElement(
                "small"
            );


        small.textContent =
            `🎨 ${provider}`;


        small.style.display =
            "block";


        small.style.marginTop =
            "8px";


        small.style.opacity =
            ".65";


        message.appendChild(
            small
        );

    }


    const controls =
        document.createElement(
            "div"
        );


    controls.className =
        "imageControls";


    const download =
        document.createElement(
            "a"
        );


    download.href =
        image;


    download.download =
        "KirongAI_Generated.png";


    download.textContent =
        "📥 Save Image";


    const open =
        document.createElement(
            "button"
        );


    open.type =
        "button";


    open.textContent =
        "🔍 Open";


    open.addEventListener(
        "click",
        () => {

            window.open(
                image,
                "_blank",
                "noopener,noreferrer"
            );

        }
    );


    controls.appendChild(
        download
    );

    controls.appendChild(
        open
    );


    message.appendChild(
        controls
    );


    chatBox.appendChild(
        message
    );


    scrollToBottom();

}


// ============================================================
// 📜 SCROLL TO BOTTOM
// ============================================================

function scrollToBottom() {

    if (!chatBox) return;


    requestAnimationFrame(
        () => {

            chatBox.scrollTop =
                chatBox.scrollHeight;

        }
    );

}


// ============================================================
// 🧠 THINKING
// ============================================================

function showThinking() {

    if (!thinking) return;


    thinking.classList.remove(
        "hidden"
    );


    thinking.innerHTML = `

        <div class="thinkingOrb">
            ⚡
        </div>

        <div class="thinkingContent">

            <span>
                Kirong AI is thinking
            </span>

            <div class="thinkingDots">

                <i></i>
                <i></i>
                <i></i>

            </div>

        </div>

    `;

}


function hideThinking() {

    thinking?.classList.add(
        "hidden"
    );

}


// ============================================================
// 🔒 SEND STATE
// ============================================================

function setSendingState(
    state
) {

    isSending =
        state;


    if (!sendBtn) return;


    sendBtn.disabled =
        state;


    sendBtn.style.opacity =
        state
            ? ".6"
            : "1";

}


// ============================================================
// 🌍 LANGUAGE
// ============================================================

function getSelectedLanguage() {

    return (
        languageSelect?.value ||
        "English"
    );

}


// ============================================================
// 📡 SAFE RESPONSE READER
// ============================================================

async function readResponse(
    response
) {

    const contentType =
        response.headers.get(
            "content-type"
        ) || "";


    if (
        contentType.includes(
            "application/json"
        )
    ) {

        try {

            return await response.json();

        } catch {

            return {

                type:
                    "error",

                text:
                    "Invalid JSON response from server."

            };

        }

    }


    const text =
        await response.text();


    return {

        type:
            "text",

        text:
            text ||
            "Unknown server response."

    };

}


// ============================================================
// 🚀 SEND MESSAGE
// ============================================================

async function sendMessage() {

    if (isSending) return;


    const text =
        userInput?.value.trim();


    if (!text) return;


    // --------------------------------------------------------
    // DISPLAY USER MESSAGE
    // --------------------------------------------------------

    addMessage(
        text,
        "user"
    );


    userInput.value =
        "";


    setSendingState(
        true
    );


    showThinking();


    try {

        const language =
            getSelectedLanguage();


        const response =
            await fetch(
                "/api/chat",
                {

                    method:
                        "POST",

                    headers: {

                        "Content-Type":
                            "application/json"

                    },

                    body:
                        JSON.stringify({

                            message:
                                text,

                            history:
                                chatHistory,

                            language:
                                language

                        })

                }
            );


        const data =
            await readResponse(
                response
            );


        hideThinking();


        // ----------------------------------------------------
        // SERVER ERROR
        // ----------------------------------------------------

        if (!response.ok) {

            addMessage(
                data?.text ||
                data?.error ||
                "⚠️ Kirong AI could not process your request.",
                "ai"
            );

            return;

        }


        // ----------------------------------------------------
        // IMAGE RESPONSE
        // ----------------------------------------------------

        if (
            data?.type === "image" &&
            data?.image
        ) {

            addImage(
                data.image,
                data.text ||
                "🎨 Here is your image.",
                data.provider ||
                "Image Engine"
            );


            chatHistory.push({

                role:
                    "user",

                content:
                    text

            });


            chatHistory.push({

                role:
                    "assistant",

                content:
                    "[Image generated by Kirong AI]"

            });


            trimHistory();

            maybeSetTitle(
                text
            );

            saveActiveChat();

            return;

        }


        // ----------------------------------------------------
        // TEXT RESPONSE
        // ----------------------------------------------------

        const reply =
            data?.text ||
            data?.message ||
            "⚠️ Kirong AI returned an empty response.";


        addMessage(
            reply,
            "ai"
        );


        // ----------------------------------------------------
        // SAVE CONVERSATION
        // ----------------------------------------------------

        chatHistory.push({

            role:
                "user",

            content:
                text

        });


        chatHistory.push({

            role:
                "assistant",

            content:
                reply

        });


        trimHistory();

        maybeSetTitle(
            text
        );

        saveActiveChat();

    } catch (error) {

        console.error(
            "🔥 Kirong frontend error:",
            error
        );


        hideThinking();


        addMessage(
            "⚠️ Connection problem. Kirong AI could not respond right now.",
            "ai"
        );

    } finally {

        hideThinking();

        setSendingState(
            false
        );

        userInput?.focus();

    }

}


// ============================================================
// ✂️ LIMIT HISTORY
// ============================================================

function trimHistory() {

    if (
        chatHistory.length >
        20
    ) {

        chatHistory =
            chatHistory.slice(
                -20
            );

    }

}


// ============================================================
// 📤 FORM SUBMIT
// ============================================================

if (chatForm) {

    chatForm.addEventListener(
        "submit",
        event => {

            event.preventDefault();

            sendMessage();

        }
    );

}


// ============================================================
// ⌨️ ENTER KEY
// ============================================================

if (userInput) {

    userInput.addEventListener(
        "keydown",
        event => {

            if (
                event.key === "Enter" &&
                !event.shiftKey
            ) {

                event.preventDefault();

                sendMessage();

            }

        }
    );

}


// ============================================================
// ➕ HEADER NEW CHAT
// ============================================================

if (headerNewChatBtn) {

    headerNewChatBtn.addEventListener(
        "click",
        () => {

            createNewChat();

        }
    );

}


// ============================================================
// 🌙 THEME
// ============================================================

function loadTheme() {

    const theme =
        localStorage.getItem(
            THEME_KEY
        );


    if (
        theme === "dark"
    ) {

        document.body.classList.add(
            "dark"
        );


        if (themeBtn) {

            themeBtn.textContent =
                "☀️";

        }

    } else {

        document.body.classList.remove(
            "dark"
        );


        if (themeBtn) {

            themeBtn.textContent =
                "🌙";

        }

    }

}


loadTheme();


if (themeBtn) {

    themeBtn.addEventListener(
        "click",
        () => {

            document.body.classList.toggle(
                "dark"
            );


            const dark =
                document.body.classList.contains(
                    "dark"
                );


            themeBtn.textContent =
                dark
                    ? "☀️"
                    : "🌙";


            localStorage.setItem(
                THEME_KEY,
                dark
                    ? "dark"
                    : "light"
            );

        }
    );

}


// ============================================================
// ⚡ QUICK ACTION PROMPTS
// ============================================================

const quickPrompts = {

    Code:
        "💻 Help me write clean code for ",

    Explain:
        "🧠 Explain this clearly and simply: ",

    Write:
        "✍️ Help me write ",

    Image:
        "🎨 Generate an image of ",

    Email:
        "📧 Help me write a professional email about ",

    Business:
        "💼 Give me a practical business strategy for ",

    Study:
        "📚 Teach me this topic step by step: ",

    Translate:
        "🌍 Translate this into English: ",

    Analyze:
        "📊 Analyze this and give me the key insights: ",

    Developer:
        "🧑🏽‍💻 Help me with this developer task: ",

    Ideas:
        "💡 Give me creative ideas for ",

    Summarize:
        "📝 Summarize this clearly: "

};


document
    .querySelectorAll(
        ".quickBtn"
    )
    .forEach(
        button => {

            button.addEventListener(
                "click",
                () => {

                    const action =
                        button.dataset.action;


                    const prompt =
                        quickPrompts[
                            action
                        ];


                    userInput.value =
                        prompt ||
                        `${action} `;


                    userInput.focus();


                    try {

                        userInput.setSelectionRange(
                            userInput.value.length,
                            userInput.value.length
                        );

                    } catch {}

                }
            );

        }
    );


// ============================================================
// 🗑️ CLEAR CURRENT CHAT
// ============================================================

const clearBtn =
    document.getElementById(
        "clearBtn"
    );


if (clearBtn) {

    clearBtn.addEventListener(
        "click",
        () => {

            const chat =
                getActiveChat();


            if (!chat) return;


            const confirmed =
                window.confirm(
                    "Clear this conversation?"
                );


            if (!confirmed) return;


            chatHistory = [];

            chat.history = [];

            chat.title =
                "New Chat";

            chat.updatedAt =
                Date.now();


            saveChats();

            renderChat();

            renderShelves();

            userInput?.focus();

        }
    );

}


// ============================================================
// 💾 EXPORT CURRENT CHAT
// ============================================================

const exportBtn =
    document.getElementById(
        "exportBtn"
    );


if (exportBtn) {

    exportBtn.addEventListener(
        "click",
        () => {

            if (
                !chatHistory.length
            ) {

                addMessage(
                    "📭 There is no conversation to export yet.",
                    "ai"
                );

                return;

            }


            const text =
                chatHistory
                    .map(
                        item => {

                            const role =
                                item.role === "user"
                                    ? "You"
                                    : "Kirong AI";

                            return (
                                `${role}:\n${item.content}`
                            );

                        }
                    )
                    .join(
                        "\n\n--------------------\n\n"
                    );


            const blob =
                new Blob(
                    [text],
                    {

                        type:
                            "text/plain;charset=utf-8"

                    }
                );


            const url =
                URL.createObjectURL(
                    blob
                );


            const link =
                document.createElement(
                    "a"
                );


            link.href =
                url;


            link.download =
                "KirongAI_Chat.txt";


            document.body.appendChild(
                link
            );


            link.click();


            link.remove();


            URL.revokeObjectURL(
                url
            );

        }
    );

}


// ============================================================
// 📍 LOCATION
// ============================================================

const locationBtn =
    document.getElementById(
        "locationBtn"
    );


if (locationBtn) {

    locationBtn.addEventListener(
        "click",
        () => {

            if (
                !navigator.geolocation
            ) {

                addMessage(
                    "📍 Location is not supported by this browser.",
                    "ai"
                );

                return;

            }


            locationBtn.disabled =
                true;


            addMessage(
                "📍 Getting your location...",
                "ai"
            );


            navigator.geolocation.getCurrentPosition(

                position => {

                    const latitude =
                        position.coords.latitude
                            .toFixed(4);


                    const longitude =
                        position.coords.longitude
                            .toFixed(4);


                    addMessage(
                        `📍 Location received.\nLatitude: ${latitude}\nLongitude: ${longitude}`,
                        "ai"
                    );


                    locationBtn.disabled =
                        false;

                },


                error => {

                    console.error(
                        "📍 Location error:",
                        error
                    );


                    addMessage(
                        "📍 I could not access your location. Please allow location permission and try again.",
                        "ai"
                    );


                    locationBtn.disabled =
                        false;

                },


                {

                    enableHighAccuracy:
                        true,

                    timeout:
                        10000,

                    maximumAge:
                        60000

                }

            );

        }
    );

}


// ============================================================
// 📎 FILE UPLOAD
// ============================================================

const fileInput =
    document.getElementById(
        "fileInput"
    );

const uploadBtn =
    document.getElementById(
        "uploadBtn"
    );


if (
    uploadBtn &&
    fileInput
) {

    uploadBtn.addEventListener(
        "click",
        () => {

            fileInput.click();

        }
    );


    fileInput.addEventListener(
        "change",
        () => {

            if (
                !fileInput.files ||
                !fileInput.files.length
            ) {

                return;

            }


            const file =
                fileInput.files[0];


            addMessage(
                `📎 ${file.name}`,
                "user"
            );


            addMessage(
                "📎 File selected successfully. File Intelligence will be connected next.",
                "ai"
            );


            fileInput.value =
                "";

        }
    );

}


// ============================================================
// 🎤 VOICE INPUT
// ============================================================

const micBtn =
    document.getElementById(
        "micBtn"
    );


if (
    micBtn &&
    userInput
) {

    const SpeechRecognition =
        window.SpeechRecognition ||
        window.webkitSpeechRecognition;


    if (!SpeechRecognition) {

        micBtn.addEventListener(
            "click",
            () => {

                addMessage(
                    "🎤 Voice input is not supported by this browser.",
                    "ai"
                );

            }
        );

    } else {

        const recognition =
            new SpeechRecognition();


        recognition.continuous =
            false;


        recognition.interimResults =
            false;


        recognition.onstart =
            () => {

                micBtn.textContent =
                    "🔴";


                micBtn.classList.add(
                    "recording"
                );

            };


        recognition.onend =
            () => {

                micBtn.textContent =
                    "🎤";


                micBtn.classList.remove(
                    "recording"
                );

            };


        recognition.onerror =
            error => {

                console.error(
                    "🎤 Speech error:",
                    error
                );


                micBtn.textContent =
                    "🎤";


                micBtn.classList.remove(
                    "recording"
                );

            };


        recognition.onresult =
            event => {

                const transcript =
                    event.results?.[0]?.[0]
                        ?.transcript;


                if (transcript) {

                    userInput.value =
                        transcript;

                    userInput.focus();

                }

            };


        micBtn.addEventListener(
            "click",
            () => {

                const voiceSelect =
                    document.getElementById(
                        "voiceSelect"
                    );


                recognition.lang =
                    voiceSelect?.value ||
                    "en-US";


                try {

                    recognition.start();

                } catch (error) {

                    console.error(
                        "🎤 Speech start error:",
                        error
                    );

                }

            }
        );

    }

}


// ============================================================
// 🎨 SHELVES FALLBACK CSS
// ============================================================

function injectShelvesStyles() {

    if (
        document.getElementById(
            "kirongShelvesRuntimeStyles"
        )
    ) {

        return;

    }


    const style =
        document.createElement(
            "style"
        );


    style.id =
        "kirongShelvesRuntimeStyles";


    style.textContent = `

        #kirongShelvesOverlay {

            position: fixed;

            inset: 0;

            background:
                rgba(0,0,0,.48);

            opacity: 0;

            visibility: hidden;

            pointer-events: none;

            z-index: 9998;

            transition:
                opacity .25s ease;

            backdrop-filter:
                blur(4px);

            -webkit-backdrop-filter:
                blur(4px);

        }


        #kirongShelvesOverlay.open {

            opacity: 1;

            visibility: visible;

            pointer-events: auto;

        }


        #kirongShelves {

            position: fixed;

            top: 0;

            left: 0;

            bottom: 0;

            width:
                min(330px,86vw);

            transform:
                translateX(-105%);

            transition:
                transform .35s cubic-bezier(
                    .16,
                    1,
                    .3,
                    1
                );

            z-index: 9999;

            overflow-y: auto;

            overscroll-behavior:
                contain;

            background:
                rgba(9,9,18,.96);

            border-right:
                1px solid
                rgba(255,255,255,.10);

            box-shadow:
                20px 0 60px
                rgba(0,0,0,.48);

            backdrop-filter:
                blur(24px);

            -webkit-backdrop-filter:
                blur(24px);

        }


        #kirongShelves.open {

            transform:
                translateX(0);

        }


        .kirongShelvesHeader {

            display:
                flex;

            align-items:
                center;

            justify-content:
                space-between;

            padding:
                18px;

            position:
                sticky;

            top: 0;

            z-index: 2;

            color:
                white;

            background:
                rgba(9,9,18,.88);

            border-bottom:
                1px solid
                rgba(255,255,255,.06);

            backdrop-filter:
                blur(18px);

            -webkit-backdrop-filter:
                blur(18px);

        }


        .kirongShelvesHeader strong {

            font-size:
                16px;

            letter-spacing:
                -.2px;

        }


        .kirongShelvesHeader button {

            border:
                0;

            background:
                transparent;

            color:
                #aaa;

            font-size:
                18px;

            width:
                38px;

            height:
                38px;

            border-radius:
                10px;

            cursor:
                pointer;

            transition:
                .2s ease;

        }


        .kirongShelvesHeader button:hover {

            background:
                rgba(255,255,255,.08);

            color:
                white;

        }


        .kirongNewChatBtn {

            width:
                calc(100% - 28px);

            margin:
                14px;

            height:
                44px;

            border:
                1px solid
                rgba(139,92,246,.40);

            border-radius:
                13px;

            background:
                linear-gradient(
                    135deg,
                    rgba(139,92,246,.20),
                    rgba(109,40,217,.12)
                );

            color:
                white;

            font-weight:
                750;

            cursor:
                pointer;

            transition:
                transform .18s ease,
                background .18s ease,
                border-color .18s ease;

        }


        .kirongNewChatBtn:hover {

            background:
                rgba(139,92,246,.25);

            border-color:
                rgba(167,139,250,.55);

        }


        .kirongNewChatBtn:active {

            transform:
                scale(.98);

        }


        .kirongChatList {

            padding:
                8px 12px 24px;

        }


        .kirongChatItem {

            display:
                flex;

            align-items:
                center;

            gap:
                10px;

            min-height:
                48px;

            padding:
                10px 11px;

            margin-bottom:
                6px;

            border:
                1px solid transparent;

            border-radius:
                12px;

            color:
                #cbd5e1;

            cursor:
                pointer;

            transition:
                background .2s ease,
                transform .15s ease,
                border-color .2s ease;

        }


        .kirongChatItem:hover {

            background:
                rgba(139,92,246,.11);

            border-color:
                rgba(139,92,246,.14);

        }


        .kirongChatItem:active {

            transform:
                scale(.985);

        }


        .kirongChatItem.active {

            background:
                rgba(139,92,246,.18);

            border-color:
                rgba(139,92,246,.20);

        }


        .kirongChatTitle {

            flex:
                1;

            min-width:
                0;

            overflow:
                hidden;

            text-overflow:
                ellipsis;

            white-space:
                nowrap;

            font-size:
                13px;

        }


        .kirongDeleteChat {

            border:
                0;

            background:
                transparent;

            cursor:
                pointer;

            opacity:
                .55;

            border-radius:
                8px;

            padding:
                6px;

            transition:
                .2s ease;

        }


        .kirongDeleteChat:hover {

            opacity:
                1;

            background:
                rgba(255,255,255,.06);

        }


        .imageControls {

            display:
                flex;

            gap:
                10px;

            margin-top:
                12px;

            flex-wrap:
                wrap;

        }


        .imageControls a,
        .imageControls button {

            padding:
                8px 12px;

            border-radius:
                10px;

            border:
                1px solid
                rgba(255,255,255,.10);

            background:
                rgba(255,255,255,.05);

            color:
                white;

            cursor:
                pointer;

            text-decoration:
                none;

        }


        .imageControls a:hover,
        .imageControls button:hover {

            background:
                rgba(255,255,255,.10);

        }


        #micBtn.recording {

            animation:
                kirongPulse 1s infinite;

        }


        @keyframes kirongPulse {

            50% {

                transform:
                    scale(1.08);

                box-shadow:
                    0 0 0 8px
                    rgba(239,68,68,.10);

            }

        }


        @media (max-width:600px) {

            #kirongShelves {

                width:
                    min(320px,88vw);

            }

        }


        body.dark #kirongShelves {

            background:
                rgba(8,8,15,.97);

        }

    `;


    document.head.appendChild(
        style
    );

}


// ============================================================
// 🚀 STARTUP
// ============================================================

loadChats();

createShelvesUI();

enableSwipeShelves();

removeOldShelvesButton();

renderChat();


// ============================================================
// 🏁 KIRONG AI READY
// ============================================================

console.log(
    "⚡ Kirong AI Frontend V6 loaded"
);

console.log(
    "🧠 Memory: ON"
);

console.log(
    "🗂️ Chat Shelves: ON"
);

console.log(
    "➕ Header New Chat: ON"
);

console.log(
    "💾 Auto-save before new chat: ON"
);

console.log(
    "👆 Swipe Shelves: ON"
);

console.log(
    "📱 Mobile Drawer: ON"
);

console.log(
    "⚡ Quick Actions: ON"
);

console.log(
    "📎 File Upload: ON"
);

console.log(
    "🎨 Image Handling: ON"
);

console.log(
    "🎤 Voice: ON"
);

console.log(
    "📍 Location: ON"
);

console.log(
    "💾 Local Persistence: ON"
);

console.log(
    "🚀 Kirong AI ready."
);
