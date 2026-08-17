// =====================================================
// ⚡ KIRONG AI — MEMORY + CHAT SHELVES
// Groq + OpenAI + Hugging Face backend
// =====================================================

const chatBox = document.getElementById("chatBox");
const userInput = document.getElementById("userInput");
const sendBtn = document.getElementById("sendBtn");
const themeBtn = document.getElementById("themeBtn");
const thinking = document.getElementById("thinking");
const chatForm = document.getElementById("chatForm");

const languageSelect =
  document.getElementById("languageSelect");

const STORAGE_KEY = "kirong_ai_chats_v1";
const ACTIVE_CHAT_KEY = "kirong_ai_active_chat_v1";

let chats = [];
let activeChatId = null;
let chatHistory = [];
let isSending = false;


// =====================================================
// 🧠 MEMORY ENGINE
// =====================================================

function createId() {
  return (
    Date.now().toString(36) +
    Math.random().toString(36).slice(2, 8)
  );
}


function createChat(title = "New Chat") {
  return {
    id: createId(),
    title,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    history: []
  };
}


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
      "❌ Memory save failed:",
      error
    );
  }
}


function loadChats() {
  try {
    const saved =
      localStorage.getItem(STORAGE_KEY);

    chats = saved
      ? JSON.parse(saved)
      : [];

    if (!Array.isArray(chats)) {
      chats = [];
    }
  } catch (error) {
    console.error(
      "❌ Memory load failed:",
      error
    );

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
    activeChatId =
      chats[0].id;
  }


  if (!activeChatId) {
    const firstChat =
      createChat();

    chats.unshift(firstChat);

    activeChatId =
      firstChat.id;

    saveChats();
  }


  const activeChat =
    getActiveChat();


  chatHistory =
    activeChat?.history || [];
}


function getActiveChat() {
  return chats.find(
    chat =>
      chat.id === activeChatId
  );
}


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


// =====================================================
// 🏷️ AUTO CHAT TITLE
// =====================================================

function makeChatTitle(text) {

  const clean =
    String(text || "")
      .replace(/\s+/g, " ")
      .trim();


  if (!clean) {
    return "New Chat";
  }


  if (clean.length <= 34) {
    return clean;
  }


  return (
    clean.slice(0, 31) +
    "..."
  );
}


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

    saveChats();
    renderShelves();
  }
}


// =====================================================
// 🗂️ CHAT SHELVES
// =====================================================

function createShelvesUI() {

  if (
    document.getElementById(
      "kirongShelves"
    )
  ) {
    return;
  }


  const shelves =
    document.createElement("aside");

  shelves.id =
    "kirongShelves";

  shelves.innerHTML = `
    <div class="kirongShelvesHeader">
      <strong>🧠 Chats</strong>

      <button
        id="newChatBtn"
        type="button"
        title="New Chat"
      >
        ＋
      </button>
    </div>

    <div
      id="kirongChatList"
      class="kirongChatList"
    ></div>
  `;


  document.body.prepend(
    shelves
  );


  const newChatBtn =
    document.getElementById(
      "newChatBtn"
    );


  newChatBtn?.addEventListener(
    "click",
    createNewChat
  );


  injectShelvesStyles();

  renderShelves();
}


function injectShelvesStyles() {

  if (
    document.getElementById(
      "kirongShelvesStyles"
    )
  ) {
    return;
  }


  const style =
    document.createElement("style");

  style.id =
    "kirongShelvesStyles";


  style.textContent = `
    #kirongShelves {
      position: fixed;
      top: 0;
      left: 0;
      width: 270px;
      height: 100dvh;
      z-index: 1000;

      display: flex;
      flex-direction: column;

      background: rgba(8,8,16,.96);
      border-right: 1px solid rgba(255,255,255,.08);

      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);

      color: white;
      padding: 14px;

      transform: translateX(0);
      transition: transform .25s ease;
    }

    .kirongShelvesHeader {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;

      padding: 8px 4px 14px;
      border-bottom: 1px solid rgba(255,255,255,.08);
    }

    .kirongShelvesHeader strong {
      font-size: 15px;
      letter-spacing: .2px;
    }

    #newChatBtn {
      width: 38px;
      height: 38px;

      border: 1px solid rgba(255,255,255,.1);
      border-radius: 11px;

      background: rgba(255,255,255,.06);
      color: white;

      font-size: 22px;
      cursor: pointer;
    }

    #newChatBtn:hover {
      background: rgba(139,92,246,.2);
    }

    .kirongChatList {
      flex: 1;
      overflow-y: auto;
      padding-top: 10px;
    }

    .kirongChatItem {
      width: 100%;
      display: flex;
      align-items: center;
      gap: 7px;

      margin-bottom: 5px;
      padding: 10px;

      border: 1px solid transparent;
      border-radius: 11px;

      background: transparent;
      color: rgba(255,255,255,.82);

      cursor: pointer;
      text-align: left;
    }

    .kirongChatItem:hover {
      background: rgba(255,255,255,.06);
    }

    .kirongChatItem.active {
      background: rgba(139,92,246,.14);
      border-color: rgba(139,92,246,.25);
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
      width: 28px;
      height: 28px;

      border: 0;
      border-radius: 8px;

      background: transparent;
      color: rgba(255,255,255,.45);

      cursor: pointer;
    }

    .kirongDeleteChat:hover {
      background: rgba(239,68,68,.15);
      color: white;
    }

    body.dark #kirongShelves {
      background: rgba(3,3,8,.97);
    }

    @media (min-width: 769px) {
      body {
        padding-left: 270px;
      }
    }

    @media (max-width: 768px) {
      #kirongShelves {
        width: min(290px, 84vw);
        box-shadow: 10px 0 35px rgba(0,0,0,.35);
      }

      body {
        padding-left: 0;
      }
    }
  `;


  document.head.appendChild(
    style
  );
}


function renderShelves() {

  const list =
    document.getElementById(
      "kirongChatList"
    );


  if (!list) return;


  list.innerHTML = "";


  chats
    .slice()
    .sort(
      (a, b) =>
        b.updatedAt - a.updatedAt
    )
    .forEach(chat => {

      const item =
        document.createElement(
          "div"
        );

      item.className =
        "kirongChatItem" +
        (
          chat.id === activeChatId
            ? " active"
            : ""
        );


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

      deleteBtn.textContent =
        "🗑️";

      deleteBtn.title =
        "Delete chat";


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

    });
}


// =====================================================
// ➕ NEW CHAT
// =====================================================

function createNewChat() {

  const newChat =
    createChat();

  chats.unshift(
    newChat
  );

  activeChatId =
    newChat.id;

  chatHistory = [];

  saveChats();

  renderChat();

  renderShelves();

  userInput?.focus();
}


// =====================================================
// 🔄 SWITCH CHAT
// =====================================================

function switchChat(id) {

  const chat =
    chats.find(
      item =>
        item.id === id
    );


  if (!chat) return;


  activeChatId =
    id;

  chatHistory =
    Array.isArray(chat.history)
      ? [...chat.history]
      : [];


  localStorage.setItem(
    ACTIVE_CHAT_KEY,
    activeChatId
  );


  renderChat();
  renderShelves();

  userInput?.focus();
}


// =====================================================
// 🗑️ DELETE CHAT
// =====================================================

function deleteChat(id) {

  const chat =
    chats.find(
      item =>
        item.id === id
    );


  if (!chat) return;


  const confirmed =
    window.confirm(
      `Delete "${chat.title}"?`
    );


  if (!confirmed) return;


  chats =
    chats.filter(
      item =>
        item.id !== id
    );


  if (!chats.length) {

    const replacement =
      createChat();

    chats.push(
      replacement
    );

  }


  if (
    !chats.some(
      item =>
        item.id === activeChatId
    )
  ) {

    chats.sort(
      (a, b) =>
        b.updatedAt -
        a.updatedAt
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


// =====================================================
// 🖥️ RENDER ACTIVE CHAT
// =====================================================

function renderChat() {

  if (!chatBox) return;


  chatBox.innerHTML = `
    <div class="message ai">
      <p>
        Hello 👋<br><br>
        I am <strong>Kirong AI</strong>.<br><br>
        How can I help you today?
      </p>
    </div>
  `;


  for (
    const item of chatHistory
  ) {

    if (
      !item ||
      !item.content
    ) {
      continue;
    }


    if (
      item.role === "user"
    ) {

      addMessage(
        item.content,
        "user"
      );

      continue;

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


  scrollToBottom();
}


// =====================================================
// 🧹 HTML ESCAPE
// =====================================================

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


// =====================================================
// 📝 MARKDOWN
// =====================================================

function renderMarkdown(text) {

  let content =
    escapeHTML(
      text || ""
    );


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
      /(^|[^*])\*([^*]+)\*(?!\*)/g,
      "$1<em>$2</em>"
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


// =====================================================
// 💬 ADD MESSAGE
// =====================================================

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


// =====================================================
// 🎨 ADD IMAGE
// =====================================================

function addImage(
  image,
  caption = "",
  provider = ""
) {

  if (
    !chatBox ||
    !image
  ) {
    return null;
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

    const providerText =
      document.createElement(
        "small"
      );

    providerText.textContent =
      `🎨 ${provider}`;

    providerText.style.display =
      "block";

    providerText.style.marginTop =
      "8px";

    providerText.style.opacity =
      ".65";

    message.appendChild(
      providerText
    );

  }


  const controls =
    document.createElement(
      "div"
    );


  controls.style.display =
    "flex";

  controls.style.gap =
    "10px";

  controls.style.marginTop =
    "12px";

  controls.style.flexWrap =
    "wrap";


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

  download.style.textDecoration =
    "none";


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

  return message;
}


// =====================================================
// 📜 SCROLL
// =====================================================

function scrollToBottom() {

  if (!chatBox) return;


  requestAnimationFrame(
    () => {

      chatBox.scrollTop =
        chatBox.scrollHeight;

    }
  );
}


// =====================================================
// 🧠 THINKING
// =====================================================

function showThinking() {

  if (!thinking) return;


  thinking.classList.remove(
    "hidden"
  );

  thinking.textContent =
    "Kirong AI is thinking...";

}


function hideThinking() {

  thinking?.classList.add(
    "hidden"
  );

}


// =====================================================
// 🔒 SEND STATE
// =====================================================

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

  sendBtn.style.cursor =
    state
      ? "not-allowed"
      : "pointer";
}


// =====================================================
// 🌍 LANGUAGE
// =====================================================

function getSelectedLanguage() {

  return (
    languageSelect?.value ||
    "English"
  );

}


// =====================================================
// 📡 SAFE RESPONSE
// =====================================================

async function readResponse(
  response
) {

  const type =
    response.headers.get(
      "content-type"
    ) || "";


  if (
    type.includes(
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


// =====================================================
// 🚀 SEND MESSAGE
// =====================================================

async function sendMessage() {

  if (isSending) return;

  if (!userInput) return;


  const text =
    userInput.value.trim();


  if (!text) return;


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


    if (!response.ok) {

      addMessage(
        data?.text ||
        "⚠️ Kirong AI could not process your request.",
        "ai"
      );

      return;
    }


    // =================================================
    // 🎨 IMAGE
    // =================================================

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


    // =================================================
    // 💬 TEXT
    // =================================================

    const reply =
      data?.text ||
      "⚠️ Kirong AI returned an empty response.";


    addMessage(
      reply,
      "ai"
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
        reply

    });


    trimHistory();

    maybeSetTitle(
      text
    );

    saveActiveChat();

  }


  catch (error) {

    console.error(
      "🔥 KIRONG FRONTEND ERROR:",
      error
    );


    hideThinking();


    addMessage(
      "⚠️ Connection problem. Kirong AI could not respond right now.",
      "ai"
    );

  }


  finally {

    hideThinking();

    setSendingState(
      false
    );

    userInput?.focus();

  }

}


// =====================================================
// ✂️ LIMIT HISTORY
// =====================================================

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


// =====================================================
// 📤 FORM
// =====================================================

if (chatForm) {

  chatForm.addEventListener(
    "submit",
    event => {

      event.preventDefault();

      sendMessage();

    }
  );

}


// =====================================================
// ⌨️ ENTER
// =====================================================

if (userInput) {

  userInput.addEventListener(
    "keydown",
    event => {

      if (
        event.key ===
          "Enter" &&
        !event.shiftKey
      ) {

        event.preventDefault();

        sendMessage();

      }

    }
  );

}


// =====================================================
// 🌙 THEME
// =====================================================

function loadTheme() {

  const saved =
    localStorage.getItem(
      "theme"
    );


  if (
    saved === "dark"
  ) {

    document.body.classList.add(
      "dark"
    );

    if (themeBtn) {
      themeBtn.textContent =
        "☀️";
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
        "theme",
        dark
          ? "dark"
          : "light"
      );

    }
  );

}


// =====================================================
// ⚡ QUICK ACTIONS
// =====================================================

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


          switch (action) {

            case "Image":

              userInput.value =
                "Nigeneretie picha ya ";

              break;


            case "Code":

              userInput.value =
                "Nisaidie code ya ";

              break;


            case "Explain":

              userInput.value =
                "Explain ";

              break;


            case "Write":

              userInput.value =
                "Write ";

              break;


            case "Email":

              userInput.value =
                "Write an email ";

              break;


            default:

              userInput.value =
                `${action} `;

          }


          userInput.focus();

        }
      );

    }
  );


// =====================================================
// 🗑️ CLEAR CURRENT CHAT
// =====================================================

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


// =====================================================
// 💾 EXPORT CURRENT CHAT
// =====================================================

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


      if (!messages.length) {
        return;
      }


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


// =====================================================
// 📍 LOCATION
// =====================================================

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
            `📍 Latitude: ${latitude}<br>Longitude: ${longitude}`,
            "ai"
          );


          locationBtn.disabled =
            false;

        },


        () => {

          addMessage(
            "📍 I could not access your location.",
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


// =====================================================
// 📎 FILE INPUT
// =====================================================

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


// =====================================================
// 🎤 VOICE INPUT
// =====================================================

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

      };


    recognition.onend =
      () => {

        micBtn.textContent =
          "🎤";

      };


    recognition.onerror =
      () => {

        micBtn.textContent =
          "🎤";

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
            "Speech start error:",
            error
          );

        }

      }
    );

  }

}


// =====================================================
// 🚀 BOOT MEMORY SYSTEM
// =====================================================

loadChats();

createShelvesUI();

renderChat();


// =====================================================
// 🏁 READY
// =====================================================

console.log(
  "⚡ Kirong AI Memory Layer loaded."
);

console.log(
  "🗂️ Chat Shelves: ENABLED"
);

console.log(
  "💾 Persistent chat memory: ENABLED"
);

console.log(
  "🧠 Backend history sync: ENABLED"
);

console.log(
  "🎨 Image support: ENABLED"
);

console.log(
  "🎤 Voice support: ENABLED"
);

