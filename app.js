
/* ============================================================
   ⚡ KIRONG AI — FRONTEND ENGINE V7.0
   ------------------------------------------------------------
   Compatible with:
   - index.html
   - /api/chat
   - formidable file uploads
   - Groq
   - OpenAI
   - Hugging Face
   - PDF / DOCX / TXT / JS / HTML / CSS / JSON / CSV / MD
   - Image responses
   - Chat history
   - Language selection
   - Voice input
   - Theme
   - Export
   - Clear chat
   ============================================================ */

"use strict";

/* ============================================================
   ⚙️ CONFIGURATION
   ============================================================ */

const API_ENDPOINT = "/api/chat";

const MAX_HISTORY_ITEMS = 20;
const MAX_FILE_SIZE = 10 * 1024 * 1024;

const STORAGE_KEYS = {
  chats: "kirong_ai_chats_v7",
  activeChat: "kirong_ai_active_chat_v7",
  theme: "kirong_ai_theme_v7",
  language: "kirong_ai_language_v7"
};


/* ============================================================
   🧩 DOM
   ============================================================ */

const chatBox = document.getElementById("chatBox");
const chatForm = document.getElementById("chatForm");
const userInput = document.getElementById("userInput");

const sendBtn = document.getElementById("sendBtn");
const micBtn = document.getElementById("micBtn");

const uploadBtn = document.getElementById("uploadBtn");
const fileInput = document.getElementById("fileInput");

const themeBtn = document.getElementById("themeBtn");
const languageSelect = document.getElementById("languageSelect");
const voiceSelect = document.getElementById("voiceSelect");

const thinking = document.getElementById("thinking");

const clearBtn = document.getElementById("clearBtn");
const exportBtn = document.getElementById("exportBtn");

const locationBtn = document.getElementById("locationBtn");


/* ============================================================
   🛡️ SAFETY CHECK
   ============================================================ */

if (!chatBox || !chatForm || !userInput) {
  console.error("❌ Kirong AI: Required HTML elements are missing.");
}


/* ============================================================
   🧠 STATE
   ============================================================ */

let messages = [];

let selectedFile = null;

let isSending = false;

let recognition = null;

let isListening = false;


/* ============================================================
   💾 STORAGE HELPERS
   ============================================================ */

function loadJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);

    if (!raw) {
      return fallback;
    }

    return JSON.parse(raw);

  } catch (error) {
    console.warn(`⚠️ Could not read ${key}:`, error);
    return fallback;
  }
}


function saveJSON(key, value) {
  try {
    localStorage.setItem(
      key,
      JSON.stringify(value)
    );

  } catch (error) {
    console.warn(`⚠️ Could not save ${key}:`, error);
  }
}


/* ============================================================
   🌍 LANGUAGE
   ============================================================ */

function getLanguage() {

  if (!languageSelect) {
    return "English";
  }

  return (
    languageSelect.value ||
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
      item => item.value === saved
    );

  if (option) {
    languageSelect.value = saved;
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

    }
  );

}


/* ============================================================
   🎨 THEME
   ============================================================ */

function applyTheme(theme) {

  if (theme === "light") {

    document.body.classList.add(
      "light-theme"
    );

    if (themeBtn) {
      themeBtn.textContent = "☀️";
    }

  } else {

    document.body.classList.remove(
      "light-theme"
    );

    if (themeBtn) {
      themeBtn.textContent = "🌙";
    }

  }

  localStorage.setItem(
    STORAGE_KEYS.theme,
    theme
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
   🧹 TEXT ESCAPING
   ============================================================ */

function escapeHTML(value) {

  const div =
    document.createElement("div");

  div.textContent =
    String(value ?? "");

  return div.innerHTML;
}


/* ============================================================
   📝 SIMPLE MARKDOWN RENDERER
   ============================================================ */

function renderMarkdown(text) {

  let html =
    escapeHTML(text);


  /* Code blocks */

  html =
    html.replace(
      /```([\s\S]*?)```/g,
      (_, code) => {

        return `
          <pre class="codeBlock">
            <code>${code.trim()}</code>
          </pre>
        `;

      }
    );


  /* Inline code */

  html =
    html.replace(
      /`([^`]+)`/g,
      "<code>$1</code>"
    );


  /* Bold */

  html =
    html.replace(
      /\*\*(.*?)\*\*/g,
      "<strong>$1</strong>"
    );


  /* Italic */

  html =
    html.replace(
      /\*(.*?)\*/g,
      "<em>$1</em>"
    );


  /* Headings */

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


  /* Lists */

  html =
    html.replace(
      /^[-•] (.*)$/gm,
      "<li>$1</li>"
    );


  /* New lines */

  html =
    html.replace(
      /\n/g,
      "<br>"
    );


  return html;
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
    return;
  }


  const message =
    document.createElement("div");

  message.className =
    `message ${role}-message`;


  const bubble =
    document.createElement("div");

  bubble.className =
    "messageBubble";


  if (options.file) {

    const fileCard =
      document.createElement("div");

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


  if (text) {

    const content =
      document.createElement("div");

    content.className =
      "messageContent";


    if (role === "assistant") {

      content.innerHTML =
        renderMarkdown(text);

    } else {

      content.textContent =
        text;

    }


    bubble.appendChild(
      content
    );

  }


  message.appendChild(
    bubble
  );


  chatBox.appendChild(
    message
  );


  scrollToBottom();


  return message;
}


/* ============================================================
   🎨 IMAGE RESPONSE
   ============================================================ */

function addImageMessage(
  text,
  image,
  provider = ""
) {

  if (!chatBox || !image) {
    return;
  }


  const message =
    document.createElement("div");

  message.className =
    "message assistant-message";


  const bubble =
    document.createElement("div");

  bubble.className =
    "messageBubble imageMessage";


  if (text) {

    const intro =
      document.createElement("div");

    intro.className =
      "messageContent";

    intro.innerHTML =
      renderMarkdown(text);

    bubble.appendChild(
      intro
    );

  }


  const imageElement =
    document.createElement("img");

  imageElement.src =
    image;

  imageElement.alt =
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
        "_blank"
      );

    }
  );


  bubble.appendChild(
    imageElement
  );


  if (provider) {

    const providerText =
      document.createElement("small");

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


  scrollToBottom();
}


/* ============================================================
   ⬇️ SCROLL
   ============================================================ */

function scrollToBottom() {

  if (!chatBox) {
    return;
  }

  requestAnimationFrame(
    () => {

      chatBox.scrollTop =
        chatBox.scrollHeight;

    }
  );
}


/* ============================================================
   🧠 THINKING
   ============================================================ */

function setThinking(active) {

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
   🔒 BUTTON STATE
   ============================================================ */

function setSendingState(active) {

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

function validateFile(file) {

  if (!file) {
    return false;
  }


  if (
    file.size >
    MAX_FILE_SIZE
  ) {

    alert(
      "📎 File is too large. Maximum size is 10MB."
    );

    return false;
  }


  return true;
}


/* ============================================================
   📎 FILE SELECTION
   ============================================================ */

if (uploadBtn && fileInput) {

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


      if (!validateFile(file)) {

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
   📦 BUILD FORM DATA
   IMPORTANT:
   DO NOT SEND JSON WHEN A FILE IS PRESENT.
   formidable EXPECTS multipart/form-data.
   ============================================================ */

function buildFormData(message) {

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


  formData.append(
    "history",
    JSON.stringify(
      messages
        .slice(-MAX_HISTORY_ITEMS)
        .map(item => ({
          role:
            item.role,

          content:
            item.content
        }))
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
   🧠 HISTORY
   ============================================================ */

function addToHistory(
  role,
  content
) {

  if (!content) {
    return;
  }


  messages.push({

    role,

    content:
      String(content)

  });


  if (
    messages.length >
    MAX_HISTORY_ITEMS
  ) {

    messages =
      messages.slice(
        -MAX_HISTORY_ITEMS
      );

  }


  saveCurrentChat();
}


/* ============================================================
   💾 CHAT STORAGE
   ============================================================ */

function saveCurrentChat() {

  const chats =
    loadJSON(
      STORAGE_KEYS.chats,
      []
    );


  const activeId =
    localStorage.getItem(
      STORAGE_KEYS.activeChat
    ) ||
    `chat_${Date.now()}`;


  localStorage.setItem(
    STORAGE_KEYS.activeChat,
    activeId
  );


  const existingIndex =
    chats.findIndex(
      chat =>
        chat.id === activeId
    );


  const chatData = {

    id:
      activeId,

    title:
      messages[0]?.content
        ?.slice(0, 40)
        ||
      "New Chat",

    messages:
      messages.slice(
        -MAX_HISTORY_ITEMS
      ),

    updatedAt:
      Date.now()

  };


  if (
    existingIndex >= 0
  ) {

    chats[existingIndex] =
      chatData;

  } else {

    chats.unshift(
      chatData
    );

  }


  saveJSON(
    STORAGE_KEYS.chats,
    chats.slice(0, 30)
  );
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
    return;
  }


  const chat =
    chats.find(
      item =>
        item.id === activeId
    );


  if (!chat) {
    return;
  }


  if (
    !Array.isArray(
      chat.messages
    )
  ) {
    return;
  }


  messages =
    chat.messages
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
      );


  if (
    messages.length === 0
  ) {
    return;
  }


  if (chatBox) {

    chatBox.innerHTML =
      "";

  }


  messages.forEach(
    item => {

      addMessage(
        item.role,
        item.content
      );

    }
  );

}


/* ============================================================
   🆕 NEW CHAT
   ============================================================ */

function startNewChat() {

  messages =
    [];

  selectedFile =
    null;


  if (fileInput) {
    fileInput.value =
      "";
  }


  localStorage.removeItem(
    STORAGE_KEYS.activeChat
  );


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
   * Allow file-only submission.
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
   * Save user message BEFORE sending.
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


  addToHistory(
    "user",
    visibleMessage
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

    /*
     * IMPORTANT:
     * FormData is used for every request.
     * This makes file uploads work with formidable.
     */

    const formData =
      buildFormData(
        visibleMessage
      );


    console.log(
      "🚀 Sending to:",
      API_ENDPOINT
    );


    console.log(
      "📦 FormData:",
      {
        message:
          visibleMessage,

        language:
          getLanguage(),

        file:
          selectedFile
            ? selectedFile.name
            : null
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
            "Accept":
              "application/json"
          },

          cache:
            "no-store"
        }
      );


    /*
     * Read response safely.
     */

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

    } else {

      const raw =
        await response.text();

      throw new Error(
        raw ||
        `Server returned HTTP ${response.status}`
      );

    }


    console.log(
      "📥 Kirong AI response:",
      data
    );


    /*
     * Backend error.
     */

    if (
      !response.ok ||
      data?.type === "error"
    ) {

      throw new Error(
        data?.text ||
        `Server error ${response.status}`
      );

    }


    /*
     * IMAGE RESPONSE
     */

    if (
      data?.type === "image" &&
      data?.image
    ) {

      addImageMessage(
        data.text ||
          "🎨 Here is your image!",
        data.image,
        data.provider
      );


      /*
       * Keep history textual.
       */

      addToHistory(
        "assistant",
        data.text ||
          "Generated an image."
      );


    } else {

      /*
       * NORMAL TEXT RESPONSE
       */

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

    }


    /*
     * File has now been sent.
     * Clear it so it is not accidentally
     * uploaded again.
     */

    selectedFile =
      null;


    if (fileInput) {

      fileInput.value =
        "";

    }


  } catch (error) {

    console.error(
      "🔥 KIRONG AI REQUEST ERROR:",
      error
    );


    const message =
      getFriendlyError(
        error
      );


    addMessage(
      "assistant",
      message
    );


    addToHistory(
      "assistant",
      message
    );


  } finally {

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

function getFriendlyError(error) {

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
- `/api/chat`
- environment variables
- internet connection

Then try again.
`;

  }


  if (
    text.includes(
      "413"
    ) ||
    text.toLowerCase().includes(
      "too large"
    )
  ) {

    return `
📎 **File too large**

Please upload a file smaller than 10MB.
`;

  }


  if (
    text.includes(
      "405"
    )
  ) {

    return `
⚠️ **API method error**

The `/api/chat` endpoint is not accepting this request method.
`;

  }


  if (
    text.includes(
      "500"
    )
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
   ⚡ FORM SUBMIT
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
   ⌨️ ENTER KEY
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

          alert(
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
    voiceSelect?.value ||
    "en-US";


  recognition.onstart =
    () => {

      isListening =
        true;

      if (micBtn) {

        micBtn.textContent =
          "🔴";

      }

    };


  recognition.onresult =
    event => {

      const transcript =
        event
          .results?.[0]?.[0]?.transcript
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

        if (isListening) {

          recognition.stop();

          return;

        }


        recognition.lang =
          voiceSelect?.value ||
          "en-US";


        try {

          recognition.start();

        } catch (error) {

          console.warn(
            "🎤 Could not start microphone:",
            error
          );

        }

      }
    );

  }

}


setupVoiceInput();


/* ============================================================
   🎤 VOICE LANGUAGE CHANGE
   ============================================================ */

if (voiceSelect) {

  voiceSelect.addEventListener(
    "change",
    () => {

      if (recognition) {

        recognition.lang =
          voiceSelect.value ||
          "en-US";

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

        alert(
          "📍 Location is not supported by this browser."
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


          alert(
            "📍 Could not access your location."
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
   💾 EXPORT CHAT
   ============================================================ */

if (exportBtn) {

  exportBtn.addEventListener(
    "click",
    () => {

      if (
        messages.length === 0
      ) {

        alert(
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


            return `${role}:\n${item.content}`;

          }
        );


      const content =
        [
          "KIRONG AI CHAT EXPORT",
          "======================",
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

    }
  );

}


/* ============================================================
   🧠 INITIALIZATION
   ============================================================ */

function initializeKirongAI() {

  restoreTheme();

  restoreLanguage();

  restoreChat();


  console.log(
    "⚡ KIRONG AI V7.0 FRONTEND READY"
  );

  console.log(
    "🔗 API:",
    API_ENDPOINT
  );

  console.log(
    "📎 File upload:",
    "FormData → formidable"
  );

  console.log(
    "🌍 Language:",
    getLanguage()
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

} else {

  initializeKirongAI();

}

