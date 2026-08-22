/* ============================================================
   ⚡ KIRONG AI — FRONTEND ENGINE V8.1
   ------------------------------------------------------------
   UPDATED:
   👑 CTO WhatsApp connection
   📜 Smart conversation scrolling
   ➕ Chat shelf toggle
   🧠 Persistent conversation memory
   🎨 Persistent generated-image memory
   🎤 Voice input
   🔊 Voice output
   📋 Copy buttons + toast notifications
   ＋ Chat shelves / new chats
   💬 WhatsApp CTO connection
   🌍 Language persistence
   🌙 Theme persistence
   📎 File uploads
   💾 LocalStorage persistence
   🛡️ Safe rendering
   🔄 Automatic chat restoration
   ============================================================ */

"use strict";


/* ============================================================
   ⚙️ CONFIGURATION
============================================================ */

const API_ENDPOINT = "/api/chat";

const MAX_HISTORY_ITEMS = 20;

const MAX_FILE_SIZE =
  10 * 1024 * 1024;

const MAX_STORED_CHATS = 50;

const MAX_STORED_MESSAGES = 50;


/* ============================================================
   👑 CTO WHATSAPP
============================================================ */

/*
 * Primary CTO WhatsApp
 *
 * Format:
 * country code + number
 * no +
 * no spaces
 */

const WHATSAPP_NUMBER =
  "254792442670";


/*
 * Backup WhatsApp
 *
 * Reserved for future use.
 */

const WHATSAPP_BACKUP_NUMBER =
  "254736232188";


const WHATSAPP_MESSAGE =
  "Hello Kirong Job Kwemoi 👑, I came from Kirong AI and I would like to talk to you directly.";


/* ============================================================
   💾 STORAGE KEYS
============================================================ */

const STORAGE_KEYS = {

  chats:
    "kirong_ai_chats_v8",

  activeChat:
    "kirong_ai_active_chat_v8",

  theme:
    "kirong_ai_theme_v8",

  language:
    "kirong_ai_language_v8",

  voice:
    "kirong_ai_voice_v8"

};


/* ============================================================
   🧩 DOM
============================================================ */

const chatBox =
  document.getElementById("chatBox");

const chatForm =
  document.getElementById("chatForm");

const userInput =
  document.getElementById("userInput");

const sendBtn =
  document.getElementById("sendBtn");

const micBtn =
  document.getElementById("micBtn");

const uploadBtn =
  document.getElementById("uploadBtn");

const fileInput =
  document.getElementById("fileInput");

const themeBtn =
  document.getElementById("themeBtn");

const languageSelect =
  document.getElementById("languageSelect");

const voiceSelect =
  document.getElementById("voiceSelect");

const thinking =
  document.getElementById("thinking");

const clearBtn =
  document.getElementById("clearBtn");

const exportBtn =
  document.getElementById("exportBtn");

const locationBtn =
  document.getElementById("locationBtn");

const newChatBtn =
  document.getElementById("newChatBtn");


/* ============================================================
   🧠 STATE
============================================================ */

let messages = [];

let selectedFile = null;

let isSending = false;

let recognition = null;

let isListening = false;

let speechVoices = [];

let currentChatId = null;


/* ============================================================
   📚 CHAT SHELF STATE
============================================================ */

let chatShelfOpen = false;


/* ============================================================
   🛡️ REQUIRED ELEMENT CHECK
============================================================ */

if (
  !chatBox ||
  !chatForm ||
  !userInput
) {

  console.error(
    "❌ Kirong AI: Required HTML elements are missing."
  );

}


/* ============================================================
   💾 STORAGE HELPERS
============================================================ */

function loadJSON(
  key,
  fallback
) {

  try {

    const raw =
      localStorage.getItem(key);

    if (!raw) {
      return fallback;
    }

    return JSON.parse(raw);

  }

  catch (error) {

    console.warn(
      `⚠️ Storage read failed: ${key}`,
      error
    );

    return fallback;

  }

}


function saveJSON(
  key,
  value
) {

  try {

    localStorage.setItem(
      key,
      JSON.stringify(value)
    );

  }

  catch (error) {

    console.warn(
      `⚠️ Storage save failed: ${key}`,
      error
    );

  }

}


/* ============================================================
   🆔 CHAT ID
============================================================ */

function createChatId() {

  return (
    "chat_" +
    Date.now() +
    "_" +
    Math.random()
      .toString(36)
      .slice(2, 8)
  );

}


/* ============================================================
   📝 CHAT TITLE
============================================================ */

function createChatTitle(
  text
) {

  const clean =
    String(text || "")
      .replace(/\s+/g, " ")
      .trim();


  if (!clean) {

    return "New Chat";

  }


  return (
    clean.length > 42
      ? clean.slice(0, 42) + "..."
      : clean
  );

}


/* ============================================================
   🌍 LANGUAGE
============================================================ */

function getLanguage() {

  return (
    languageSelect?.value ||
    "English"
  ).trim();

}


function restoreLanguage() {

  if (!languageSelect) {
    return;
  }


  const saved =
    localStorage.getItem(
      STORAGE_KEYS.language
    );


  if (!saved) {
    return;
  }


  const option =
    Array.from(
      languageSelect.options
    ).find(
      item =>
        item.value === saved
    );


  if (option) {

    languageSelect.value =
      saved;

  }

}


if (languageSelect) {

  languageSelect.addEventListener(
    "change",
    () => {

      localStorage.setItem(
        STORAGE_KEYS.language,
        languageSelect.value
      );

      if (recognition) {

        recognition.lang =
          getSpeechLanguage();

      }

    }
  );

}


/* ============================================================
   🎨 THEME
============================================================ */

function applyTheme(
  theme
) {

  const isLight =
    theme === "light";


  document.body.classList.toggle(
    "light-theme",
    isLight
  );


  if (themeBtn) {

    themeBtn.textContent =
      isLight
        ? "☀️"
        : "🌙";

  }


  localStorage.setItem(
    STORAGE_KEYS.theme,
    isLight
      ? "light"
      : "dark"
  );

}


function restoreTheme() {

  const saved =
    localStorage.getItem(
      STORAGE_KEYS.theme
    );


  applyTheme(
    saved === "light"
      ? "light"
      : "dark"
  );

}


if (themeBtn) {

  themeBtn.addEventListener(
    "click",
    () => {

      const light =
        document.body.classList.contains(
          "light-theme"
        );


      applyTheme(
        light
          ? "dark"
          : "light"
      );

    }
  );

}


/* ============================================================
   🧹 ESCAPE HTML
============================================================ */

function escapeHTML(
  value
) {

  const div =
    document.createElement("div");


  div.textContent =
    String(value ?? "");


  return div.innerHTML;

}


/* ============================================================
   📝 MARKDOWN RENDERER
============================================================ */

function renderMarkdown(
  text
) {

  let html =
    escapeHTML(text);


  /*
   * Code blocks
   */

  html =
    html.replace(
      /```([\s\S]*?)```/g,
      (_, code) => {

        const cleanCode =
          code.trim();

        return `
          <div class="codeWrapper">

            <button
              type="button"
              class="copyCodeBtn"
              data-copy="${encodeURIComponent(cleanCode)}"
            >
              📋 Copy
            </button>

            <pre class="codeBlock"><code>${cleanCode}</code></pre>

          </div>
        `;

      }
    );


  /*
   * Inline code
   */

  html =
    html.replace(
      /`([^`]+)`/g,
      "<code>$1</code>"
    );


  /*
   * Bold
   */

  html =
    html.replace(
      /\*\*(.*?)\*\*/g,
      "<strong>$1</strong>"
    );


  /*
   * Italic
   */

  html =
    html.replace(
      /\*(.*?)\*/g,
      "<em>$1</em>"
    );


  /*
   * Headings
   */

  html =
    html.replace(
      /^### (.*)$/gm,
      "<h4>$1</h4>"
    );


  html =
    html.replace(
      /^## (.*)$/gm,
      "<h3>$1</h3>"
    );


  html =
    html.replace(
      /^# (.*)$/gm,
      "<h2>$1</h2>"
    );


  /*
   * Bullet lists
   */

  html =
    html.replace(
      /^[-•] (.*)$/gm,
      "<li>$1</li>"
    );


  /*
   * Links
   */

  html =
    html.replace(
      /(https?:\/\/[^\s<]+)/g,
      '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>'
    );


  /*
   * New lines
   */

  html =
    html.replace(
      /\n/g,
      "<br>"
    );


  return html;

}


/* ============================================================
   🔔 TOAST
============================================================ */

function showToast(
  message
) {

  let toast =
    document.getElementById(
      "kirongToast"
    );


  if (!toast) {

    toast =
      document.createElement(
        "div"
      );

    toast.id =
      "kirongToast";

    toast.className =
      "kirongToast";

    document.body.appendChild(
      toast
    );

  }


  toast.textContent =
    message;


  toast.classList.add(
    "show"
  );


  clearTimeout(
    toast._timeout
  );


  toast._timeout =
    setTimeout(
      () => {

        toast.classList.remove(
          "show"
        );

      },
      2200
    );

}


/* ============================================================
   📋 COPY TEXT
============================================================ */

async function copyText(
  text
) {

  try {

    await navigator.clipboard.writeText(
      String(text || "")
    );


    showToast(
      "📋 Copied!"
    );


    return true;

  }

  catch (error) {

    console.warn(
      "Clipboard API failed:",
      error
    );


    try {

      const textarea =
        document.createElement(
          "textarea"
        );


      textarea.value =
        String(text || "");


      textarea.style.position =
        "fixed";

      textarea.style.opacity =
        "0";


      document.body.appendChild(
        textarea
      );


      textarea.select();

      document.execCommand(
        "copy"
      );


      textarea.remove();


      showToast(
        "📋 Copied!"
      );


      return true;

    }

    catch (fallbackError) {

      console.error(
        "Copy failed:",
        fallbackError
      );


      showToast(
        "⚠️ Copy failed"
      );


      return false;

    }

  }

}


/* ============================================================
   💬 MESSAGE UI
============================================================ */

function addMessage(
  role,
  text,
  options = {}
) {

  if (!chatBox) {
    return null;
  }


  /*
   * Remember whether user was already at bottom.
   * This prevents jumping while reviewing history.
   */

  const shouldAutoScroll =
    isUserNearBottom();


  const message =
    document.createElement(
      "div"
    );


  message.className =
    `message ${role}-message`;


  const bubble =
    document.createElement(
      "div"
    );


  bubble.className =
    "messageBubble";


  /*
   * File card
   */

  if (options.file) {

    const fileCard =
      document.createElement(
        "div"
      );


    fileCard.className =
      "attachedFile";


    fileCard.innerHTML = `
      <span class="fileIcon">📎</span>

      <span class="fileName">
        ${escapeHTML(options.file)}
      </span>
    `;


    bubble.appendChild(
      fileCard
    );

  }


  /*
   * Text
   */

  if (text) {

    const content =
      document.createElement(
        "div"
      );


    content.className =
      "messageContent";


    if (
      role === "assistant"
    ) {

      content.innerHTML =
        renderMarkdown(text);

    }

    else {

      content.textContent =
        text;

    }


    bubble.appendChild(
      content
    );


    /*
     * Copy assistant response
     */

    if (
      role === "assistant"
    ) {

      const copyBtn =
        document.createElement(
          "button"
        );


      copyBtn.type =
        "button";


      copyBtn.className =
        "copyMessageBtn";


      copyBtn.textContent =
        "📋 Copy";


      copyBtn.addEventListener(
        "click",
        () => {

          copyText(text);

        }
      );


      bubble.appendChild(
        copyBtn
      );

    }

  }


  message.appendChild(
    bubble
  );


  chatBox.appendChild(
    message
  );


  /*
   * Smart scroll.
   */

  if (shouldAutoScroll) {

    scrollToBottom();

  }


  return message;

}


/* ============================================================
   🎨 IMAGE MESSAGE
============================================================ */

function addImageMessage(
  text,
  image,
  provider = "",
  prompt = ""
) {

  if (
    !chatBox ||
    !image
  ) {

    return null;

  }


  const shouldAutoScroll =
    isUserNearBottom();


  const message =
    document.createElement(
      "div"
    );


  message.className =
    "message assistant-message";


  const bubble =
    document.createElement(
      "div"
    );


  bubble.className =
    "messageBubble imageMessage";


  /*
   * Intro
   */

  if (text) {

    const intro =
      document.createElement(
        "div"
      );


    intro.className =
      "messageContent";


    intro.innerHTML =
      renderMarkdown(text);


    bubble.appendChild(
      intro
    );

  }


  /*
   * Image
   */

  const imageElement =
    document.createElement(
      "img"
    );


  imageElement.src =
    image;


  imageElement.alt =
    prompt ||
    "Generated by Kirong AI";


  imageElement.loading =
    "lazy";


  imageElement.className =
    "generatedImage";


  imageElement.addEventListener(
    "click",
    () => {

      window.open(
        imageElement.src,
        "_blank",
        "noopener,noreferrer"
      );

    }
  );


  bubble.appendChild(
    imageElement
  );


  /*
   * Actions
   */

  const actions =
    document.createElement(
      "div"
    );


  actions.className =
    "imageActions";


  /*
   * Download
   */

  const downloadBtn =
    document.createElement(
      "button"
    );


  downloadBtn.type =
    "button";


  downloadBtn.textContent =
    "⬇️ Save Image";


  downloadBtn.addEventListener(
    "click",
    () => {

      const link =
        document.createElement(
          "a"
        );


      link.href =
        image;


      link.download =
        `kirong-ai-image-${Date.now()}.png`;


      document.body.appendChild(
        link
      );


      link.click();


      link.remove();


      showToast(
        "🖼️ Image saved"
      );

    }
  );


  actions.appendChild(
    downloadBtn
  );


  /*
   * Copy image reference
   */

  const copyImageBtn =
    document.createElement(
      "button"
    );


  copyImageBtn.type =
    "button";


  copyImageBtn.textContent =
    "📋 Copy Image";


  copyImageBtn.addEventListener(
    "click",
    () => {

      copyText(image);

    }
  );


  actions.appendChild(
    copyImageBtn
  );


  bubble.appendChild(
    actions
  );


  /*
   * Provider
   */

  if (provider) {

    const providerText =
      document.createElement(
        "small"
      );


    providerText.className =
      "imageProvider";


    providerText.textContent =
      provider;


    bubble.appendChild(
      providerText
    );

  }


  message.appendChild(
    bubble
  );


  chatBox.appendChild(
    message
  );


  if (shouldAutoScroll) {

    scrollToBottom();

  }


  return message;

}


/* ============================================================
   📜 SMART SCROLL
============================================================ */

function isUserNearBottom() {

  if (!chatBox) {
    return true;
  }


  const threshold =
    120;


  return (
    chatBox.scrollHeight -
    chatBox.scrollTop -
    chatBox.clientHeight
  ) <= threshold;

}


function scrollToBottom(
  force = false
) {

  if (!chatBox) {
    return;
  }


  /*
   * Do not interrupt a user who is reviewing
   * previous messages.
   */

  if (
    !force &&
    !isUserNearBottom()
  ) {

    return;

  }


  requestAnimationFrame(
    () => {

      chatBox.scrollTo({

        top:
          chatBox.scrollHeight,

        behavior:
          "smooth"

      });

    }
  );

}


/* ============================================================
   🧠 THINKING
============================================================ */

function setThinking(
  active
) {

  if (!thinking) {
    return;
  }


  thinking.classList.toggle(
    "hidden",
    !active
  );


  if (active) {

    scrollToBottom();

  }

}


/* ============================================================
   🔒 SENDING STATE
============================================================ */

function setSendingState(
  active
) {

  isSending =
    active;


  if (sendBtn) {

    sendBtn.disabled =
      active;


    sendBtn.style.opacity =
      active
        ? "0.6"
        : "";

  }


  if (userInput) {

    userInput.disabled =
      active;

  }

}


/* ============================================================
   📎 FILE VALIDATION
============================================================ */

function validateFile(
  file
) {

  if (!file) {
    return false;
  }


  if (
    file.size >
    MAX_FILE_SIZE
  ) {

    showToast(
      "📎 File is larger than 10MB"
    );


    return false;

  }


  return true;

}


/* ============================================================
   📎 FILE SELECTION
============================================================ */

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

      const file =
        fileInput.files?.[0];


      if (!file) {
        return;
      }


      if (
        !validateFile(file)
      ) {

        fileInput.value =
          "";

        selectedFile =
          null;

        return;

      }


      selectedFile =
        file;


      addMessage(
        "user",
        "📎 File selected successfully.",
        {
          file:
            file.name
        }
      );


      showToast(
        `📎 ${file.name} ready`
      );


      console.log(
        "📎 FILE READY:",
        {
          name:
            file.name,

          size:
            file.size,

          type:
            file.type
        }
      );

    }
  );

}


/* ============================================================
   📦 FORM DATA
============================================================ */

function buildFormData(
  message
) {

  const formData =
    new FormData();


  formData.append(
    "message",
    message
  );


  formData.append(
    "language",
    getLanguage()
  );


  /*
   * Send only useful text history.
   */

  formData.append(
    "history",
    JSON.stringify(
      messages
        .filter(
          item =>
            item &&
            (
              item.role === "user" ||
              item.role === "assistant"
            ) &&
            typeof item.content === "string"
        )
        .slice(
          -MAX_HISTORY_ITEMS
        )
        .map(
          item => ({

            role:
              item.role,

            content:
              item.content

          })
        )
    )
  );


  if (selectedFile) {

    formData.append(
      "file",
      selectedFile,
      selectedFile.name
    );

  }


  return formData;

}


/* ============================================================
   🧠 ADD HISTORY
============================================================ */

function addToHistory(
  role,
  content,
  metadata = {}
) {

  if (
    !content &&
    !metadata.image
  ) {

    return;

  }


  messages.push({

    id:
      createChatId(),

    role,

    content:
      String(content || ""),

    image:
      metadata.image ||
      null,

    imagePrompt:
      metadata.imagePrompt ||
      null,

    provider:
      metadata.provider ||
      null,

    file:
      metadata.file ||
      null,

    timestamp:
      Date.now()

  });


  if (
    messages.length >
    MAX_STORED_MESSAGES
  ) {

    messages =
      messages.slice(
        -MAX_STORED_MESSAGES
      );

  }


  saveCurrentChat();

}


/* ============================================================
   💾 SAVE CURRENT CHAT
============================================================ */

function saveCurrentChat() {

  if (
    !currentChatId
  ) {

    currentChatId =
      createChatId();


    localStorage.setItem(
      STORAGE_KEYS.activeChat,
      currentChatId
    );

  }


  const chats =
    loadJSON(
      STORAGE_KEYS.chats,
      []
    );


  const firstUserMessage =
    messages.find(
      item =>
        item.role === "user" &&
        item.content
    );


  const title =
    createChatTitle(
      firstUserMessage?.content
    );


  const chatData = {

    id:
      currentChatId,

    title,

    messages:
      messages.slice(
        -MAX_STORED_MESSAGES
      ),

    updatedAt:
      Date.now()

  };


  const existingIndex =
    chats.findIndex(
      chat =>
        chat.id === currentChatId
    );


  if (
    existingIndex >= 0
  ) {

    chats[existingIndex] =
      chatData;

  }

  else {

    chats.unshift(
      chatData
    );

  }


  chats.sort(
    (a, b) =>
      (b.updatedAt || 0) -
      (a.updatedAt || 0)
  );


  saveJSON(
    STORAGE_KEYS.chats,
    chats.slice(
      0,
      MAX_STORED_CHATS
    )
  );


  renderChatShelves();

}


/* ============================================================
   📂 RESTORE CHAT
============================================================ */

function restoreChat() {

  const chats =
    loadJSON(
      STORAGE_KEYS.chats,
      []
    );


  const activeId =
    localStorage.getItem(
      STORAGE_KEYS.activeChat
    );


  if (!activeId) {

    currentChatId =
      createChatId();

    return;

  }


  const chat =
    chats.find(
      item =>
        item.id === activeId
    );


  if (!chat) {

    currentChatId =
      createChatId();

    return;

  }


  currentChatId =
    chat.id;


  messages =
    Array.isArray(
      chat.messages
    )
      ? chat.messages
          .filter(
            item =>
              item &&
              (
                item.role === "user" ||
                item.role === "assistant"
              )
          )
          .slice(
            -MAX_STORED_MESSAGES
          )
      : [];


  if (!chatBox) {
    return;
  }


  chatBox.innerHTML =
    "";


  messages.forEach(
    item => {

      if (item.image) {

        addImageMessage(
          item.content ||
            "🎨 Here is your image!",
          item.image,
          item.provider ||
            "",
          item.imagePrompt ||
            ""
        );

        return;

      }


      addMessage(
        item.role,
        item.content,
        item.file
          ? {
              file:
                item.file
            }
          : {}
      );

    }
  );


  scrollToBottom(
    true
  );


  renderChatShelves();

}


/* ============================================================
   ➕ NEW CHAT
============================================================ */

function startNewChat() {

  if (
    messages.length
  ) {

    saveCurrentChat();

  }


  messages =
    [];


  selectedFile =
    null;


  currentChatId =
    createChatId();


  localStorage.setItem(
    STORAGE_KEYS.activeChat,
    currentChatId
  );


  if (fileInput) {

    fileInput.value =
      "";

  }


  if (chatBox) {

    chatBox.innerHTML = `

      <div class="welcomeMessage">

        <div class="welcomeIcon">
          ⚡
        </div>

        <h2>
          Hello 👋
        </h2>

        <h3>
          I’m Kirong AI.
        </h3>

        <p>
          Your intelligent assistant for
          <strong>
            coding, learning, creativity,
            business and everyday tasks.
          </strong>
        </p>

        <span class="welcomeHint">
          What can I help you with today?
        </span>

      </div>

    `;

  }


  renderChatShelves();


  closeChatShelf();


  showToast(
    "＋ New chat"
  );

}


/* ============================================================
   📚 CHAT SHELF
============================================================ */

function getChatShelfContainer() {

  return (
    document.getElementById(
      "chatShelves"
    ) ||
    document.querySelector(
      ".chatShelves"
    )
  );

}


/* ============================================================
   ➕ HEADER SHELF TOGGLE
============================================================ */

function openChatShelf() {

  const container =
    getChatShelfContainer();


  if (!container) {

    /*
     * If the HTML doesn't have a shelf yet,
     * create one dynamically.
     */

    createDynamicChatShelf();

    return;

  }


  chatShelfOpen =
    true;


  container.classList.add(
    "open"
  );


  container.setAttribute(
    "aria-hidden",
    "false"
  );


  renderChatShelves();

}


function closeChatShelf() {

  const container =
    getChatShelfContainer();


  if (!container) {
    return;
  }


  chatShelfOpen =
    false;


  container.classList.remove(
    "open"
  );


  container.setAttribute(
    "aria-hidden",
    "true"
  );

}


function toggleChatShelf() {

  if (chatShelfOpen) {

    closeChatShelf();

  }

  else {

    openChatShelf();

  }

}


/* ============================================================
   🧩 DYNAMIC SHELF
============================================================ */

function createDynamicChatShelf() {

  if (
    document.getElementById(
      "chatShelves"
    )
  ) {

    return;

  }


  const container =
    document.createElement(
      "aside"
    );


  container.id =
    "chatShelves";


  container.className =
    "chatShelves open";


  container.setAttribute(
    "aria-hidden",
    "false"
  );


  document.body.appendChild(
    container
  );


  chatShelfOpen =
    true;


  renderChatShelves();

}


/* ============================================================
   📚 RENDER CHAT SHELVES
============================================================ */

function renderChatShelves() {

  const container =
    getChatShelfContainer();


  if (!container) {
    return;
  }


  const chats =
    loadJSON(
      STORAGE_KEYS.chats,
      []
    );


  container.innerHTML =
    "";


  /*
   * Shelf header
   */

  const header =
    document.createElement(
      "div"
    );


  header.className =
    "chatShelfHeader";


  header.innerHTML = `
    <strong>💬 Your Chats</strong>
  `;


  const closeBtn =
    document.createElement(
      "button"
    );


  closeBtn.type =
    "button";


  closeBtn.className =
    "closeShelfBtn";


  closeBtn.textContent =
    "×";


  closeBtn.setAttribute(
    "aria-label",
    "Close chats"
  );


  closeBtn.addEventListener(
    "click",
    closeChatShelf
  );


  header.appendChild(
    closeBtn
  );


  container.appendChild(
    header
  );


  /*
   * New chat
   */

  const newChat =
    document.createElement(
      "button"
    );


  newChat.type =
    "button";


  newChat.className =
    "newChatShelf";


  newChat.innerHTML =
    "＋ New Chat";


  newChat.addEventListener(
    "click",
    startNewChat
  );


  container.appendChild(
    newChat
  );


  if (
    chats.length === 0
  ) {

    const empty =
      document.createElement(
        "div"
      );


    empty.className =
      "emptyChatShelf";


    empty.textContent =
      "No saved chats yet.";


    container.appendChild(
      empty
    );


    return;

  }


  const heading =
    document.createElement(
      "div"
    );


  heading.className =
    "chatShelfHeading";


  heading.textContent =
    "Recent Chats";


  container.appendChild(
    heading
  );


  chats
    .slice(
      0,
      30
    )
    .forEach(
      chat => {

        const item =
          document.createElement(
            "button"
          );


        item.type =
          "button";


        item.className =
          "chatShelfItem";


        if (
          chat.id === currentChatId
        ) {

          item.classList.add(
            "active"
          );

        }


        item.textContent =
          chat.title ||
          "New Chat";


        item.title =
          chat.title ||
          "New Chat";


        item.addEventListener(
          "click",
          () => {

            openChat(
              chat.id
            );

            closeChatShelf();

          }
        );


        container.appendChild(
          item
        );

      }
    );

}


/* ============================================================
   📂 OPEN SAVED CHAT
============================================================ */

function openChat(
  chatId
) {

  const chats =
    loadJSON(
      STORAGE_KEYS.chats,
      []
    );


  const chat =
    chats.find(
      item =>
        item.id === chatId
    );


  if (!chat) {
    return;
  }


  currentChatId =
    chat.id;


  localStorage.setItem(
    STORAGE_KEYS.activeChat,
    chat.id
  );


  messages =
    Array.isArray(
      chat.messages
    )
      ? chat.messages.slice(
          -MAX_STORED_MESSAGES
        )
      : [];


  if (chatBox) {

    chatBox.innerHTML =
      "";

  }


  messages.forEach(
    item => {

      if (item.image) {

        addImageMessage(
          item.content,
          item.image,
          item.provider ||
            "",
          item.imagePrompt ||
            ""
        );

      }

      else {

        addMessage(
          item.role,
          item.content,
          item.file
            ? {
                file:
                  item.file
              }
            : {}
        );

      }

    }
  );


  scrollToBottom(
    true
  );


  renderChatShelves();


  showToast(
    "💬 Chat opened"
  );

}


/* ============================================================
   👑 WHATSAPP — TALK TO CTO
============================================================ */

function openWhatsApp() {

  const number =
    String(
      WHATSAPP_NUMBER || ""
    )
      .replace(
        /\D/g,
        ""
      );


  /*
   * Validate the configured number.
   */

  if (
    !number ||
    number === "2547XXXXXXXX" ||
    number.length < 10
  ) {

    showToast(
      "⚠️ CTO WhatsApp number is not configured."
    );

    return;

  }


  const url =
    `https://wa.me/${number}?text=${encodeURIComponent(
      WHATSAPP_MESSAGE
    )}`;


  window.open(
    url,
    "_blank",
    "noopener,noreferrer"
  );

}


/*
 * Static HTML button:
 *
 * id="whatsappBtn"
 *
 * OR:
 *
 * class="whatsappBtn"
 */

const whatsappBtn =
  document.getElementById(
    "whatsappBtn"
  ) ||
  document.querySelector(
    ".whatsappBtn"
  );


if (whatsappBtn) {

  whatsappBtn.addEventListener(
    "click",
    openWhatsApp
  );

}


/* ============================================================
   👑 DYNAMIC CTO CTA
============================================================ */

function showBossCTA() {

  if (
    !chatBox
  ) {

    return;

  }


  if (
    document.getElementById(
      "bossCTA"
    )
  ) {

    return;

  }


  const wrapper =
    document.createElement(
      "div"
    );


  wrapper.id =
    "bossCTA";


  wrapper.className =
    "bossCTA";


  wrapper.innerHTML = `

    <div class="bossCTAContent">

      <strong>
        👑 Want to work directly with the CTO?
      </strong>

      <span>
        Talk directly with Kirong Job Kwemoi on WhatsApp.
      </span>

      <button
        type="button"
        id="dynamicWhatsAppBtn"
      >
        💬 Talk to CTO
      </button>

    </div>

  `;


  chatBox.appendChild(
    wrapper
  );


  document
    .getElementById(
      "dynamicWhatsAppBtn"
    )
    ?.addEventListener(
      "click",
      openWhatsApp
    );


  scrollToBottom();

}


/* ============================================================
   🔊 TEXT TO SPEECH
============================================================ */

function loadSpeechVoices() {

  if (
    !("speechSynthesis" in window)
  ) {

    return;

  }


  speechVoices =
    window.speechSynthesis.getVoices();

}


if (
  "speechSynthesis" in window
) {

  loadSpeechVoices();


  window.speechSynthesis
    .addEventListener(
      "voiceschanged",
      loadSpeechVoices
    );

}


function getSpeechLanguage() {

  const language =
    getLanguage()
      .toLowerCase();


  if (
    language.includes(
      "swahili"
    ) ||
    language.includes(
      "kiswahili"
    )
  ) {

    return "sw-KE";

  }


  if (
    language.includes(
      "french"
    )
  ) {

    return "fr-FR";

  }


  if (
    language.includes(
      "spanish"
    )
  ) {

    return "es-ES";

  }


  if (
    language.includes(
      "hindi"
    )
  ) {

    return "hi-IN";

  }


  return "en-US";

}


function cleanSpeechText(
  text
) {

  return String(
    text || ""
  )
    .replace(
      /```[\s\S]*?```/g,
      "Code omitted."
    )
    .replace(
      /[*_#`]/g,
      ""
    )
    .replace(
      /\s+/g,
      " "
    )
    .trim();

}


function speakText(
  text
) {

  if (
    !("speechSynthesis" in window)
  ) {

    showToast(
      "🔊 Voice output is not supported"
    );

    return;

  }


  const clean =
    cleanSpeechText(
      text
    );


  if (!clean) {
    return;
  }


  window.speechSynthesis.cancel();


  const utterance =
    new SpeechSynthesisUtterance(
      clean
    );


  utterance.lang =
    getSpeechLanguage();


  const selectedVoice =
    voiceSelect?.value;


  if (
    selectedVoice &&
    speechVoices.length
  ) {

    const voice =
      speechVoices.find(
        item =>
          item.name ===
          selectedVoice
      );


    if (voice) {

      utterance.voice =
        voice;

    }

  }


  utterance.rate =
    1;


  utterance.pitch =
    1;


  window.speechSynthesis.speak(
    utterance
  );

}


/* ============================================================
   🎤 VOICE INPUT
============================================================ */

function setupVoiceInput() {

  const SpeechRecognition =
    window.SpeechRecognition ||
    window.webkitSpeechRecognition;


  if (
    !SpeechRecognition
  ) {

    if (micBtn) {

      micBtn.addEventListener(
        "click",
        () => {

          showToast(
            "🎤 Voice input is not supported by this browser."
          );

        }
      );

    }


    return;

  }


  recognition =
    new SpeechRecognition();


  recognition.continuous =
    false;


  recognition.interimResults =
    false;


  recognition.lang =
    getSpeechLanguage();


  recognition.onstart =
    () => {

      isListening =
        true;


      if (micBtn) {

        micBtn.textContent =
          "🔴";

      }


      showToast(
        "🎤 I'm listening..."
      );

    };


  recognition.onresult =
    event => {

      const transcript =
        event
          .results?.[0]?.[0]
          ?.transcript
          ?.trim();


      if (
        transcript &&
        userInput
      ) {

        userInput.value =
          transcript;


        userInput.focus();

      }

    };


  recognition.onerror =
    error => {

      console.warn(
        "🎤 Speech recognition:",
        error
      );


      showToast(
        "🎤 I didn't catch that. Try again."
      );

    };


  recognition.onend =
    () => {

      isListening =
        false;


      if (micBtn) {

        micBtn.textContent =
          "🎤";

      }

    };


  if (micBtn) {

    micBtn.addEventListener(
      "click",
      () => {

        if (
          isListening
        ) {

          recognition.stop();

          return;

        }


        recognition.lang =
          getSpeechLanguage();


        try {

          recognition.start();

        }

        catch (error) {

          console.warn(
            "🎤 Recognition start failed:",
            error
          );

        }

      }
    );

  }

}


setupVoiceInput();


/* ============================================================
   🎤 VOICE SELECT
============================================================ */

if (voiceSelect) {

  const savedVoice =
    localStorage.getItem(
      STORAGE_KEYS.voice
    );


  if (savedVoice) {

    const option =
      Array.from(
        voiceSelect.options
      ).find(
        item =>
          item.value ===
          savedVoice
      );


    if (option) {

      voiceSelect.value =
        savedVoice;

    }

  }


  voiceSelect.addEventListener(
    "change",
    () => {

      localStorage.setItem(
        STORAGE_KEYS.voice,
        voiceSelect.value
      );


      if (recognition) {

        recognition.lang =
          getSpeechLanguage();

      }

    }
  );

}


/* ============================================================
   📍 LOCATION
============================================================ */

if (locationBtn) {

  locationBtn.addEventListener(
    "click",
    () => {

      if (
        !navigator.geolocation
      ) {

        showToast(
          "📍 Location is not supported"
        );

        return;

      }


      locationBtn.disabled =
        true;


      locationBtn.textContent =
        "⏳";


      navigator.geolocation.getCurrentPosition(

        position => {

          const latitude =
            position.coords.latitude;


          const longitude =
            position.coords.longitude;


          if (userInput) {

            userInput.value =
              `My location is approximately latitude ${latitude}, longitude ${longitude}. Help me understand or use this location.`;


            userInput.focus();

          }


          locationBtn.disabled =
            false;


          locationBtn.textContent =
            "📍";

        },


        error => {

          console.warn(
            "📍 Location error:",
            error
          );


          showToast(
            "📍 Could not access your location"
          );


          locationBtn.disabled =
            false;


          locationBtn.textContent =
            "📍";

        },


        {

          enableHighAccuracy:
            false,

          timeout:
            10000,

          maximumAge:
            60000

        }

      );

    }
  );

}


/* ============================================================
   🚀 SEND MESSAGE
============================================================ */

async function sendMessage() {

  if (isSending) {
    return;
  }


  const message =
    String(
      userInput?.value ||
      ""
    ).trim();


  /*
   * Allow file-only requests.
   */

  if (
    !message &&
    !selectedFile
  ) {

    return;

  }


  const visibleMessage =
    message ||
    `Please analyze the uploaded file: ${selectedFile?.name || "file"}`;


  /*
   * Make sure a chat exists.
   */

  if (!currentChatId) {

    currentChatId =
      createChatId();


    localStorage.setItem(
      STORAGE_KEYS.activeChat,
      currentChatId
    );

  }


  /*
   * User UI
   */

  addMessage(
    "user",
    message,
    selectedFile
      ? {
          file:
            selectedFile.name
        }
      : {}
  );


  /*
   * User history
   */

  addToHistory(
    "user",
    visibleMessage,
    selectedFile
      ? {
          file:
            selectedFile.name
        }
      : {}
  );


  if (userInput) {

    userInput.value =
      "";

  }


  setSendingState(
    true
  );


  setThinking(
    true
  );


  try {

    const formData =
      buildFormData(
        visibleMessage
      );


    console.log(
      "🚀 KIRONG AI REQUEST:",
      {
        endpoint:
          API_ENDPOINT,

        language:
          getLanguage(),

        file:
          selectedFile?.name ||
          null

      }
    );


    const response =
      await fetch(
        API_ENDPOINT,
        {

          method:
            "POST",

          body:
            formData,

          headers: {

            Accept:
              "application/json"

          },

          cache:
            "no-store"

        }
      );


    const contentType =
      response.headers.get(
        "content-type"
      ) || "";


    let data;


    if (
      contentType.includes(
        "application/json"
      )
    ) {

      data =
        await response.json();

    }

    else {

      const raw =
        await response.text();


      throw new Error(
        raw ||
        `Server returned HTTP ${response.status}`
      );

    }


    console.log(
      "📥 KIRONG AI RESPONSE:",
      data
    );


    if (
      !response.ok ||
      data?.type === "error"
    ) {

      throw new Error(
        data?.text ||
        `Server error ${response.status}`
      );

    }


    /* ========================================================
       🎨 IMAGE
    ======================================================== */

    if (
      data?.type === "image" &&
      data?.image
    ) {

      addImageMessage(
        data.text ||
          "🎨 Here is your image!",
        data.image,
        data.provider ||
          "",
        data.prompt ||
          visibleMessage
      );


      addToHistory(
        "assistant",
        data.text ||
          "Generated an image.",
        {

          image:
            data.image,

          imagePrompt:
            data.prompt ||
            visibleMessage,

          provider:
            data.provider ||
            "Hugging Face"

        }
      );


      if (data.text) {

        speakText(
          data.text
        );

      }

    }


    /* ========================================================
       💬 TEXT
    ======================================================== */

    else {

      const answer =
        String(
          data?.text ||
          data?.message ||
          "I received your message, but no response text was returned."
        );


      addMessage(
        "assistant",
        answer
      );


      addToHistory(
        "assistant",
        answer
      );


      speakText(
        answer
      );


      /*
       * Detect strong hiring/contact intent.
       */

      const lower =
        answer.toLowerCase();


      if (
        lower.includes("whatsapp") ||
        lower.includes("contact the developer") ||
        lower.includes("talk to the developer") ||
        lower.includes("work with kirong") ||
        lower.includes("hire kirong") ||
        lower.includes("contact kirong") ||
        lower.includes("talk to cto") ||
        lower.includes("contact the cto")
      ) {

        showBossCTA();

      }

    }


    /*
     * File already sent.
     */

    selectedFile =
      null;


    if (fileInput) {

      fileInput.value =
        "";

    }


    /*
     * Save after response.
     */

    saveCurrentChat();

  }

  catch (error) {

    console.error(
      "🔥 KIRONG AI REQUEST ERROR:",
      error
    );


    const friendly =
      getFriendlyError(
        error
      );


    addMessage(
      "assistant",
      friendly
    );


    addToHistory(
      "assistant",
      friendly
    );

  }

  finally {

    setThinking(
      false
    );


    setSendingState(
      false
    );


    if (userInput) {

      userInput.focus();

    }

  }

}


/* ============================================================
   🛡️ FRIENDLY ERRORS
============================================================ */

function getFriendlyError(
  error
) {

  const text =
    String(
      error?.message ||
      ""
    ).trim();


  if (
    text.includes(
      "Failed to fetch"
    )
  ) {

    return `
⚠️ **Connection error**

Kirong AI could not reach the server.

Please check:

- Vercel deployment
- /api/chat
- environment variables
- internet connection

Then try again.
`;

  }


  if (
    text.includes("413") ||
    text.toLowerCase()
      .includes("too large")
  ) {

    return `
📎 **File too large**

Please upload a file smaller than 10MB.
`;

  }


  if (
    text.includes("405")
  ) {

    return `
⚠️ **API method error**

The /api/chat endpoint is not accepting this request method.
`;

  }


  if (
    text.includes("500")
  ) {

    return `
🔥 **Kirong AI server error**

The request reached the backend, but the AI engine returned an error.

Check the Vercel Function logs for the exact provider error.
`;

  }


  return `
⚠️ **Kirong AI could not complete that request.**

${text || "Please try again."}
`;

}


/* ============================================================
   ⚡ FORM
============================================================ */

if (chatForm) {

  chatForm.addEventListener(
    "submit",
    event => {

      event.preventDefault();

      sendMessage();

    }
  );

}


/* ============================================================
   ⌨️ ENTER
============================================================ */

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


/* ============================================================
   ➕ HEADER CHAT BUTTON
============================================================ */

if (newChatBtn) {

  newChatBtn.addEventListener(
    "click",
    toggleChatShelf
  );

}


/* ============================================================
   🧠 QUICK ACTIONS
============================================================ */

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
            button.dataset.action ||
            button.textContent.trim();


          const prompts = {

            Code:
              "Help me with coding. What are you building?",

            Explain:
              "Explain something to me clearly and practically.",

            Write:
              "Help me write something. What should we create?",

            Image:
              "Generate an image of ",

            Email:
              "Help me write an email.",

            Business:
              "Help me with a business idea or strategy.",

            Study:
              "Help me study. What topic should we work on?",

            Translate:
              "Translate this text for me: ",

            Analyze:
              "Analyze this information for me.",

            Developer:
              "Help me diagnose a development problem.",

            Ideas:
              "Give me creative ideas for ",

            Summarize:
              "Summarize this for me: "

          };


          const prompt =
            prompts[action] ||
            "";


          if (userInput) {

            userInput.value =
              prompt;


            userInput.focus();

          }

        }
      );

    }
  );


/* ============================================================
   🗑️ CLEAR CHAT
============================================================ */

if (clearBtn) {

  clearBtn.addEventListener(
    "click",
    () => {

      const confirmed =
        window.confirm(
          "Clear this conversation?"
        );


      if (!confirmed) {
        return;
      }


      startNewChat();

    }
  );

}


/* ============================================================
   💾 EXPORT
============================================================ */

if (exportBtn) {

  exportBtn.addEventListener(
    "click",
    () => {

      if (
        messages.length === 0
      ) {

        showToast(
          "There is no conversation to export."
        );


        return;

      }


      const lines =
        messages.map(
          item => {

            const role =
              item.role === "user"
                ? "You"
                : "Kirong AI";


            let output =
              `${role}:\n${item.content}`;


            if (
              item.image
            ) {

              output +=
                `\n[Generated image: ${item.imagePrompt || "image"}]`;

            }


            return output;

          }
        );


      const content =
        [

          "KIRONG AI V8 CHAT EXPORT",

          "========================",

          "",

          ...lines

        ].join(
          "\n\n"
        );


      const blob =
        new Blob(
          [content],
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
        `kirong-ai-chat-${Date.now()}.txt`;


      document.body.appendChild(
        link
      );


      link.click();


      link.remove();


      URL.revokeObjectURL(
        url
      );


      showToast(
        "💾 Chat exported"
      );

    }
  );

}


/* ============================================================
   📋 GLOBAL COPY BUTTONS
============================================================ */

document.addEventListener(
  "click",
  event => {

    const button =
      event.target.closest(
        ".copyCodeBtn"
      );


    if (!button) {
      return;
    }


    const encoded =
      button.dataset.copy ||
      "";


    let text;


    try {

      text =
        decodeURIComponent(
          encoded
        );

    }

    catch {

      text =
        encoded;

    }


    copyText(
      text
    );

  }
);


/* ============================================================
   🧹 MIGRATE OLD V7 STORAGE
============================================================ */

function migrateOldStorage() {

  const v8Chats =
    loadJSON(
      STORAGE_KEYS.chats,
      []
    );


  if (
    v8Chats.length > 0
  ) {

    return;

  }


  const oldChats =
    loadJSON(
      "kirong_ai_chats_v7",
      []
    );


  if (
    !Array.isArray(oldChats) ||
    oldChats.length === 0
  ) {

    return;

  }


  const migrated =
    oldChats
      .filter(
        chat =>
          chat &&
          chat.id
      )
      .map(
        chat => ({

          id:
            chat.id,

          title:
            chat.title ||
            "Previous Chat",

          messages:
            Array.isArray(
              chat.messages
            )
              ? chat.messages
                  .filter(
                    item =>
                      item &&
                      (
                        item.role === "user" ||
                        item.role === "assistant"
                      ) &&
                      typeof item.content === "string"
                  )
                  .map(
                    item => ({

                      id:
                        createChatId(),

                      role:
                        item.role,

                      content:
                        item.content,

                      image:
                        null,

                      imagePrompt:
                        null,

                      provider:
                        null,

                      file:
                        null,

                      timestamp:
                        Date.now()

                    })
                  )
              : [],

          updatedAt:
            chat.updatedAt ||
            Date.now()

        })
      );


  if (
    migrated.length
  ) {

    saveJSON(
      STORAGE_KEYS.chats,
      migrated
    );


    showToast(
      "🧠 Previous chats restored"
    );

  }

}


/* ============================================================
   🚀 INITIALIZATION
============================================================ */

function initializeKirongAI() {

  migrateOldStorage();

  restoreTheme();

  restoreLanguage();

  restoreChat();

  renderChatShelves();


  console.log(
    "⚡ KIRONG AI V8.1 FRONTEND READY"
  );


  console.log(
    "🔗 API:",
    API_ENDPOINT
  );


  console.log(
    "🧠 Persistent memory:",
    "ON"
  );


  console.log(
    "🎨 Image memory:",
    "ON"
  );


  console.log(
    "📜 Smart scrolling:",
    "ON"
  );


  console.log(
    "➕ Chat shelf:",
    "ON"
  );


  console.log(
    "🎤 Voice input:",
    recognition
      ? "ON"
      : "Browser dependent"
  );


  console.log(
    "🔊 Voice output:",
    "ON"
  );


  console.log(
    "📋 Copy system:",
    "ON"
  );


  console.log(
    "👑 CTO WhatsApp:",
    whatsappBtn
      ? "ON"
      : "Dynamic CTA available"
  );


  console.log(
    "📱 CTO primary:",
    WHATSAPP_NUMBER
  );

}


/* ============================================================
   🚀 START
============================================================ */

if (
  document.readyState ===
  "loading"
) {

  document.addEventListener(
    "DOMContentLoaded",
    initializeKirongAI
  );

}

else {

  initializeKirongAI();

}

