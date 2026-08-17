// ============================================================
// ⚡ KIRONG AI — FRONTEND ENGINE V4
// 🧠 Memory + 🗂️ Chat Shelves + 📱 Mobile Drawer
// ⚡ Quick Actions + 📎 Files + 🎤 Voice
// 💾 Local Storage + 🌍 Language + 🌙 Theme
// ✨ Swipe from left to open Chats
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


// ============================================================
// 💾 STORAGE
// ============================================================

const STORAGE_KEY = "kirong_ai_chats_v3";
const ACTIVE_CHAT_KEY = "kirong_ai_active_chat_v3";
const THEME_KEY = "kirong_ai_theme_v2";


// ============================================================
// 🧠 STATE
// ============================================================

let chats = [];
let activeChatId = null;
let chatHistory = [];
let isSending = false;


// ============================================================
// 🆔 ID
// ============================================================

function createId() {

    return (
        Date.now().toString(36) +
        Math.random().toString(36).slice(2, 9)
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

        const saved = localStorage.getItem(
            STORAGE_KEY
        );

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


    if (!activeChatId && chats.length) {

        chats.sort(
            (a, b) =>
                b.updatedAt - a.updatedAt
        );

        activeChatId = chats[0].id;

    }


    if (!activeChatId) {

        const firstChat = createChat();

        chats.unshift(firstChat);

        activeChatId = firstChat.id;

        saveChats();

    }


    const active = getActiveChat();


    chatHistory =
        Array.isArray(active?.history)
            ? [...active.history]
            : [];

}


// ============================================================
// 🔎 ACTIVE CHAT
// ============================================================

function getActiveChat() {

    return chats.find(
        chat => chat.id === activeChatId
    );

}


// ============================================================
// 💾 SAVE ACTIVE CHAT
// ============================================================

function saveActiveChat() {

    const chat = getActiveChat();

    if (!chat) return;


    chat.history =
        Array.isArray(chatHistory)
            ? chatHistory.slice(-20)
            : [];


    chat.updatedAt = Date.now();

    saveChats();

    renderShelves();

}


// ============================================================
// 🏷️ TITLE
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


    return clean.slice(0, 33) + "...";

}


// ============================================================
// 🏷️ AUTO TITLE
// ============================================================

function maybeSetTitle(text) {

    const chat = getActiveChat();

    if (!chat) return;


    if (
        chat.title === "New Chat" &&
        chatHistory.length <= 2
    ) {

        chat.title = makeChatTitle(text);

        chat.updatedAt = Date.now();

        saveChats();

        renderShelves();

    }

}


// ============================================================
// 🗂️ SHELVES UI
// ============================================================

function createShelvesUI() {

    if (
        document.getElementById(
            "kirongShelves"
        )
    ) {

        return;

    }


    const overlay =
        document.createElement("div");

    overlay.id =
        "kirongShelvesOverlay";


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


    document.body.prepend(overlay);

    document.body.prepend(shelves);


    const newChatBtn =
        document.getElementById(
            "newChatBtn"
        );


    const closeBtn =
        document.getElementById(
            "closeShelvesBtn"
        );


    newChatBtn?.addEventListener(
        "click",
        () => {

            createNewChat();

            closeShelves();

        }
    );


    closeBtn?.addEventListener(
        "click",
        closeShelves
    );


    overlay.addEventListener(
        "click",
        closeShelves
    );


    injectShelvesStyles();

    createChatMenuButton();

    renderShelves();

}


// ============================================================
// ☰ CHAT BUTTON
// ============================================================

function createChatMenuButton() {

    if (
        document.getElementById(
            "kirongOpenShelvesBtn"
        )
    ) {

        return;

    }


    const button =
        document.createElement("button");


    button.id =
        "kirongOpenShelvesBtn";


    button.type = "button";

    button.innerHTML = "☰";

    button.title = "Open chats";

    button.setAttribute(
        "aria-label",
        "Open chats"
    );


    document.body.appendChild(button);


    button.addEventListener(
        "click",
        openShelves
    );

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


    shelves.classList.add("open");

    overlay?.classList.add("open");

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


    shelves?.classList.remove("open");

    overlay?.classList.remove("open");

    document.body.classList.remove(
        "shelves-open"
    );

}


// ============================================================
// 📱 MOBILE SWIPE GESTURE
// Swipe from LEFT → RIGHT = open shelves
// Swipe drawer RIGHT → LEFT = close
// ============================================================

function enableSwipeShelves() {

    let startX = 0;
    let startY = 0;

    let tracking = false;


    document.addEventListener(
        "touchstart",
        event => {

            if (!event.touches?.length) {
                return;
            }


            const touch =
                event.touches[0];


            startX = touch.clientX;

            startY = touch.clientY;

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


            if (!event.changedTouches?.length) {
                return;
            }


            const touch =
                event.changedTouches[0];


            const endX = touch.clientX;

            const endY = touch.clientY;


            const deltaX =
                endX - startX;

            const deltaY =
                Math.abs(endY - startY);


            const isHorizontal =
                Math.abs(deltaX) > deltaY;


            if (!isHorizontal) {
                return;
            }


            // Open drawer
            if (
                startX < 45 &&
                deltaX > 65
            ) {

                openShelves();

                return;

            }


            // Close drawer
            if (
                deltaX < -65 &&
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
                b.updatedAt - a.updatedAt
        );


    sortedChats.forEach(chat => {

        const item =
            document.createElement("div");


        item.className =
            "kirongChatItem";


        if (chat.id === activeChatId) {

            item.classList.add("active");

        }


        const title =
            document.createElement("span");


        title.className =
            "kirongChatTitle";


        title.textContent =
            chat.title || "New Chat";


        const deleteBtn =
            document.createElement("button");


        deleteBtn.className =
            "kirongDeleteChat";


        deleteBtn.type = "button";

        deleteBtn.title = "Delete chat";

        deleteBtn.textContent = "🗑️";


        deleteBtn.addEventListener(
            "click",
            event => {

                event.stopPropagation();

                deleteChat(chat.id);

            }
        );


        item.appendChild(title);

        item.appendChild(deleteBtn);


        item.addEventListener(
            "click",
            () => {

                switchChat(chat.id);

            }
        );


        list.appendChild(item);

    });

}


// ============================================================
// ➕ NEW CHAT
// ============================================================

function createNewChat() {

    const newChat =
        createChat();


    chats.unshift(newChat);

    activeChatId =
        newChat.id;

    chatHistory = [];


    saveChats();

    renderChat();

    renderShelves();


    userInput?.focus();

}


// ============================================================
// 🔄 SWITCH CHAT
// ============================================================

function switchChat(id) {

    const selected =
        chats.find(
            chat => chat.id === id
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
            chat => chat.id === id
        );


    if (!selected) return;


    const confirmed =
        window.confirm(
            `Delete "${selected.title}"?`
        );


    if (!confirmed) return;


    chats =
        chats.filter(
            chat => chat.id !== id
        );


    if (!chats.length) {

        const fresh =
            createChat();

        chats.push(fresh);

    }


    if (
        !chats.some(
            chat => chat.id === activeChatId
        )
    ) {

        chats.sort(
            (a, b) =>
                b.updatedAt - a.updatedAt
        );

        activeChatId =
            chats[0].id;

    }


    const active =
        getActiveChat();


    chatHistory =
        active?.history || [];


    saveChats();

    renderChat();

    renderShelves();

}


// ============================================================
// 🖥️ RENDER CHAT
// ============================================================

function renderChat() {

    if (!chatBox) return;


    chatBox.innerHTML = `

        <div class="message ai">

            <p>

                ⚡ Hello 👋

                <br><br>

                <strong>
                    I’m Kirong AI.
                </strong>

                <br>

                Your intelligent assistant for
                <strong>
                    coding, learning, creativity,
                    business and everyday tasks.
                </strong>

                <br><br>

                What can I help you with today?

            </p>

        </div>

    `;


    chatHistory.forEach(item => {

        if (
            !item ||
            !item.content
        ) {

            return;

        }


        if (item.role === "user") {

            addMessage(
                item.content,
                "user"
            );

        }


        if (item.role === "assistant") {

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

    });


    scrollToBottom();

}


// ============================================================
// 🧹 ESCAPE HTML
// ============================================================

function escapeHTML(value) {

    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}


// ============================================================
// 📝 MARKDOWN
// ============================================================

function renderMarkdown(text) {

    let content =
        escapeHTML(text || "");


    content =
        content.replace(
            /```([\s\S]*?)```/g,
            (_, code) =>
                `<pre><code>${code.trim()}</code></pre>`
        );


    content =
        content.replace(
            /`([^`]+)`/g,
            "<code>$1</code>"
        );


    content =
        content.replace(
            /\*\*(.*?)\*\*/g,
            "<strong>$1</strong>"
        );


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


    content =
        content.replace(
            /^\s*[-*]\s+(.*)$/gm,
            "• $1"
        );


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
        document.createElement("div");


    message.className =
        `message ${sender}`;


    const paragraph =
        document.createElement("p");


    paragraph.innerHTML =
        renderMarkdown(text);


    message.appendChild(paragraph);

    chatBox.appendChild(message);


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
        document.createElement("div");


    message.className =
        "message ai";


    if (caption) {

        const paragraph =
            document.createElement("p");


        paragraph.innerHTML =
            renderMarkdown(caption);


        message.appendChild(paragraph);

    }


    const img =
        document.createElement("img");


    img.src = image;

    img.alt =
        "Kirong AI generated image";

    img.loading = "lazy";


    message.appendChild(img);


    if (provider) {

        const small =
            document.createElement("small");


        small.textContent =
            `🎨 ${provider}`;


        small.style.display = "block";

        small.style.marginTop = "8px";

        small.style.opacity = ".65";


        message.appendChild(small);

    }


    const controls =
        document.createElement("div");


    controls.className =
        "imageControls";


    const download =
        document.createElement("a");


    download.href = image;

    download.download =
        "KirongAI_Generated.png";

    download.textContent =
        "📥 Save Image";

    download.style.textDecoration =
        "none";


    const open =
        document.createElement("button");


    open.type = "button";

    open.textContent = "🔍 Open";


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


    controls.appendChild(download);

    controls.appendChild(open);

    message.appendChild(controls);


    chatBox.appendChild(message);


    scrollToBottom();

}


// ============================================================
// 📜 SCROLL
// ============================================================

function scrollToBottom() {

    if (!chatBox) return;


    requestAnimationFrame(() => {

        chatBox.scrollTop =
            chatBox.scrollHeight;

    });

}


// ============================================================
// 🧠 THINKING
// ============================================================

function showThinking() {

    if (!thinking) return;


    thinking.classList.remove("hidden");

    thinking.textContent =
        "Kirong AI is thinking...";

}


function hideThinking() {

    thinking?.classList.add("hidden");

}


// ============================================================
// 🔒 SEND STATE
// ============================================================

function setSendingState(state) {

    isSending = state;


    if (!sendBtn) return;


    sendBtn.disabled = state;

    sendBtn.style.opacity =
        state ? ".6" : "1";

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
// 📡 SAFE RESPONSE
// ============================================================

async function readResponse(response) {

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

                type: "error",

                text:
                    "Invalid response from server."

            };

        }

    }


    const text =
        await response.text();


    return {

        type: "text",

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


    addMessage(
        text,
        "user"
    );


    userInput.value = "";


    setSendingState(true);

    showThinking();


    try {

        const language =
            getSelectedLanguage();


        const response =
            await fetch(
                "/api/chat",
                {

                    method: "POST",

                    headers: {

                        "Content-Type":
                            "application/json"

                    },

                    body:
                        JSON.stringify({

                            message: text,

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


        if (!response.ok) {

            addMessage(
                data?.text ||
                "⚠️ Kirong AI could not process your request.",
                "ai"
            );

            return;

        }


        // ====================================================
        // 🎨 IMAGE
        // ====================================================

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

                role: "user",

                content: text

            });


            chatHistory.push({

                role: "assistant",

                content:
                    "[Image generated by Kirong AI]"

            });


            trimHistory();

            maybeSetTitle(text);

            saveActiveChat();

            return;

        }


        // ====================================================
        // 💬 TEXT
        // ====================================================

        const reply =
            data?.text ||
            "⚠️ Kirong AI returned an empty response.";


        addMessage(
            reply,
            "ai"
        );


        chatHistory.push({

            role: "user",

            content: text

        });


        chatHistory.push({

            role: "assistant",

            content: reply

        });


        trimHistory();

        maybeSetTitle(text);

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

        setSendingState(false);

        userInput?.focus();

    }

}


// ============================================================
// ✂️ HISTORY LIMIT
// ============================================================

function trimHistory() {

    if (chatHistory.length > 20) {

        chatHistory =
            chatHistory.slice(-20);

    }

}


// ============================================================
// 📤 FORM
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
// ⌨️ ENTER
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
// 🌙 THEME
// ============================================================

function loadTheme() {

    const theme =
        localStorage.getItem(
            THEME_KEY
        );


    if (theme === "dark") {

        document.body.classList.add("dark");


        if (themeBtn) {

            themeBtn.textContent = "☀️";

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
// ⚡ POWER QUICK ACTIONS
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
        "🧑🏽‍💻 Help me debug this code: ",

    Ideas:
        "💡 Give me creative ideas for ",

    Summarize:
        "📝 Summarize this clearly: "

};


document
    .querySelectorAll(".quickBtn")
    .forEach(button => {

        button.addEventListener(
            "click",
            () => {

                const action =
                    button.dataset.action;


                const prompt =
                    quickPrompts[action];


                userInput.value =
                    prompt ||
                    `${action} `;


                userInput.focus();


                // Put cursor at end
                try {

                    userInput.setSelectionRange(
                        userInput.value.length,
                        userInput.value.length
                    );

                } catch {}

            }
        );

    });


// ============================================================
// 🗑️ CLEAR CHAT
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


            chatHistory = [];

            chat.history = [];

            chat.title = "New Chat";

            chat.updatedAt = Date.now();


            saveChats();

            renderChat();

            renderShelves();

            userInput?.focus();

        }
    );

}


// ============================================================
// 💾 EXPORT CHAT
// ============================================================

const exportBtn =
    document.getElementById(
        "exportBtn"
    );


if (exportBtn) {

    exportBtn.addEventListener(
        "click",
        () => {

            const messages =
                Array.from(
                    document.querySelectorAll(
                        "#chatBox .message"
                    )
                );


            if (!messages.length) return;


            const text =
                messages
                    .map(
                        message =>
                            message.innerText.trim()
                    )
                    .filter(Boolean)
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
                URL.createObjectURL(blob);


            const link =
                document.createElement("a");


            link.href = url;

            link.download =
                "KirongAI_Chat.txt";


            document.body.appendChild(link);

            link.click();

            link.remove();


            URL.revokeObjectURL(url);

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

            if (!navigator.geolocation) {

                addMessage(
                    "📍 Location is not supported by this browser.",
                    "ai"
                );

                return;

            }


            locationBtn.disabled = true;


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


                    locationBtn.disabled = false;

                },


                () => {

                    addMessage(
                        "📍 I could not access your location.",
                        "ai"
                    );


                    locationBtn.disabled = false;

                },


                {

                    enableHighAccuracy: true,

                    timeout: 10000,

                    maximumAge: 60000

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


            fileInput.value = "";

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


        recognition.continuous = false;

        recognition.interimResults = false;


        recognition.onstart = () => {

            micBtn.textContent = "🔴";

            micBtn.classList.add(
                "recording"
            );

        };


        recognition.onend = () => {

            micBtn.textContent = "🎤";

            micBtn.classList.remove(
                "recording"
            );

        };


        recognition.onerror = error => {

            console.error(
                "🎤 Speech error:",
                error
            );


            micBtn.textContent = "🎤";

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
// Only used if shelves CSS is missing
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
        document.createElement("style");


    style.id =
        "kirongShelvesRuntimeStyles";


    style.textContent = `

        #kirongShelvesOverlay {
            position: fixed;
            inset: 0;
            background: rgba(0,0,0,.45);
            opacity: 0;
            visibility: hidden;
            pointer-events: none;
            z-index: 9998;
            transition: opacity .25s ease;
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
            width: min(330px, 86vw);
            transform: translateX(-105%);
            transition: transform .3s cubic-bezier(.2,.8,.2,1);
            z-index: 9999;
            overflow-y: auto;
            background: #090912;
            border-right: 1px solid rgba(255,255,255,.1);
            box-shadow: 20px 0 60px rgba(0,0,0,.45);
        }

        #kirongShelves.open {
            transform: translateX(0);
        }

        #kirongOpenShelvesBtn {
            position: fixed;
            left: 12px;
            bottom: 90px;
            width: 48px;
            height: 48px;
            border: 1px solid rgba(255,255,255,.12);
            border-radius: 15px;
            background: rgba(15,15,28,.94);
            color: white;
            font-size: 21px;
            z-index: 9997;
            cursor: pointer;
            box-shadow: 0 10px 30px rgba(0,0,0,.35);
        }

        .kirongShelvesHeader {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 18px;
            color: white;
        }

        .kirongShelvesHeader button {
            border: 0;
            background: transparent;
            color: #aaa;
            font-size: 18px;
            cursor: pointer;
        }

        .kirongNewChatBtn {
            width: calc(100% - 28px);
            margin: 0 14px 14px;
            height: 44px;
            border: 1px solid rgba(139,92,246,.4);
            border-radius: 13px;
            background: rgba(139,92,246,.14);
            color: white;
            font-weight: 700;
            cursor: pointer;
        }

        .kirongChatList {
            padding: 8px 12px 20px;
        }

        .kirongChatItem {
            display: flex;
            align-items: center;
            gap: 10px;
            min-height: 48px;
            padding: 10px 11px;
            margin-bottom: 6px;
            border-radius: 12px;
            color: #cbd5e1;
            cursor: pointer;
            transition: background .2s ease;
        }

        .kirongChatItem:hover,
        .kirongChatItem.active {
            background: rgba(139,92,246,.14);
        }

        .kirongChatTitle {
            flex: 1;
            min-width: 0;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            font-size: 13px;
        }

        .kirongDeleteChat {
            border: 0;
            background: transparent;
            cursor: pointer;
            opacity: .55;
        }

        .kirongDeleteChat:hover {
            opacity: 1;
        }

        .imageControls {
            display: flex;
            gap: 10px;
            margin-top: 12px;
            flex-wrap: wrap;
        }

        .imageControls a,
        .imageControls button {
            padding: 8px 12px;
            border-radius: 10px;
            border: 1px solid rgba(255,255,255,.1);
            background: rgba(255,255,255,.05);
            color: white;
            cursor: pointer;
        }

        #micBtn.recording {
            animation: kirongPulse 1s infinite;
        }

        @keyframes kirongPulse {
            50% {
                transform: scale(1.08);
                box-shadow: 0 0 0 8px rgba(239,68,68,.1);
            }
        }

    `;


    document.head.appendChild(style);

}


// ============================================================
// 🚀 STARTUP
// ============================================================

loadChats();

createShelvesUI();

enableSwipeShelves();

renderChat();


// ============================================================
// 🏁 READY
// ============================================================

console.log(
    "⚡ Kirong AI frontend V4 loaded"
);

console.log(
    "🧠 Memory: ON"
);

console.log(
    "🗂️ Chat Shelves: ON"
);

console.log(
    "👆 Swipe Shelves: ON"
);

console.log(
    "📱 Mobile Drawer: ON"
);

console.log(
    "⚡ Power Quick Actions: ON"
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
    "💾 Local Persistence: ON"
);
