// =====================================================
// ⚡ KIRONG AI v4.0
// Stable Frontend Controller
// Groq + OpenAI + Pollinations Image Support
// =====================================================


// =====================================================
// 🔗 DOM ELEMENTS
// =====================================================

const chatBox = document.getElementById("chatBox");
const userInput = document.getElementById("userInput");
const sendBtn = document.getElementById("sendBtn");
const themeBtn = document.getElementById("themeBtn");
const thinking = document.getElementById("thinking");
const chatForm = document.getElementById("chatForm");

let chatHistory = [];
let isSending = false;


// =====================================================
// 🧹 ESCAPE HTML
// =====================================================

function escapeHTML(value) {

  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}


// =====================================================
// 📝 BASIC MARKDOWN RENDERER
// =====================================================

function renderMarkdown(text) {

  let content =
    escapeHTML(text || "");


  // ---------------------------------------------------
  // CODE BLOCKS
  // ---------------------------------------------------

  content = content.replace(
    /```([\s\S]*?)```/g,
    (_, code) => {

      return `
        <pre><code>${code.trim()}</code></pre>
      `;

    }
  );


  // ---------------------------------------------------
  // INLINE CODE
  // ---------------------------------------------------

  content = content.replace(
    /`([^`]+)`/g,
    "<code>$1</code>"
  );


  // ---------------------------------------------------
  // BOLD
  // ---------------------------------------------------

  content = content.replace(
    /\*\*(.*?)\*\*/g,
    "<strong>$1</strong>"
  );


  // ---------------------------------------------------
  // ITALIC
  // ---------------------------------------------------

  content = content.replace(
    /(^|[^*])\*([^*]+)\*(?!\*)/g,
    "$1<em>$2</em>"
  );


  // ---------------------------------------------------
  // HEADINGS
  // ---------------------------------------------------

  content = content.replace(
    /^### (.*)$/gm,
    "<strong>$1</strong>"
  );

  content = content.replace(
    /^## (.*)$/gm,
    "<strong>$1</strong>"
  );

  content = content.replace(
    /^# (.*)$/gm,
    "<strong>$1</strong>"
  );


  // ---------------------------------------------------
  // BULLET POINTS
  // ---------------------------------------------------

  content = content.replace(
    /^\s*[-*]\s+(.*)$/gm,
    "• $1"
  );


  // ---------------------------------------------------
  // LINE BREAKS
  // ---------------------------------------------------

  content = content.replace(
    /\n/g,
    "<br>"
  );


  return content;
}


// =====================================================
// 💬 ADD MESSAGE
// =====================================================

function addMessage(text, sender = "ai") {

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


// =====================================================
// 📜 SCROLL CHAT
// =====================================================

function scrollToBottom() {

  if (!chatBox) return;


  requestAnimationFrame(() => {

    chatBox.scrollTop =
      chatBox.scrollHeight;

  });

}


// =====================================================
// 🎨 ADD GENERATED IMAGE
// =====================================================

function addImage(
  image,
  caption = "",
  provider = ""
) {

  if (!chatBox || !image) {

    console.error(
      "❌ Cannot display image."
    );

    return null;

  }


  const message =
    document.createElement("div");

  message.className =
    "message ai";


  // ---------------------------------------------------
  // CAPTION
  // ---------------------------------------------------

  if (caption) {

    const paragraph =
      document.createElement("p");

    paragraph.innerHTML =
      renderMarkdown(caption);

    message.appendChild(
      paragraph
    );

  }


  // ---------------------------------------------------
  // IMAGE
  // ---------------------------------------------------

  const img =
    document.createElement("img");


  img.src = image;

  img.alt =
    "Kirong AI generated image";

  img.loading =
    "lazy";


  img.onerror = () => {

    console.error(
      "❌ Image failed to render."
    );

    img.alt =
      "Image could not be displayed.";

  };


  message.appendChild(img);


  // ---------------------------------------------------
  // PROVIDER INFO
  // ---------------------------------------------------

  if (provider) {

    const providerText =
      document.createElement("small");

    providerText.textContent =
      `🎨 ${provider}`;

    providerText.style.display =
      "block";

    providerText.style.marginTop =
      "8px";

    providerText.style.opacity =
      "0.65";

    message.appendChild(
      providerText
    );

  }


  // ---------------------------------------------------
  // CONTROLS
  // ---------------------------------------------------

  const controls =
    document.createElement("div");


  controls.style.display =
    "flex";

  controls.style.gap =
    "10px";

  controls.style.marginTop =
    "12px";

  controls.style.flexWrap =
    "wrap";


  // ---------------------------------------------------
  // SAVE BUTTON
  // ---------------------------------------------------

  const downloadLink =
    document.createElement("a");


  downloadLink.href =
    image;

  downloadLink.download =
    "KirongAI_Generated.png";

  downloadLink.style.textDecoration =
    "none";


  const downloadButton =
    document.createElement("button");


  downloadButton.type =
    "button";

  downloadButton.textContent =
    "📥 Save Image";


  downloadButton.style.padding =
    "10px 15px";

  downloadButton.style.border =
    "none";

  downloadButton.style.borderRadius =
    "12px";

  downloadButton.style.cursor =
    "pointer";


  downloadLink.appendChild(
    downloadButton
  );


  // ---------------------------------------------------
  // OPEN BUTTON
  // ---------------------------------------------------

  const openButton =
    document.createElement("button");


  openButton.type =
    "button";

  openButton.textContent =
    "🔍 Open";


  openButton.style.padding =
    "10px 15px";

  openButton.style.border =
    "none";

  openButton.style.borderRadius =
    "12px";

  openButton.style.cursor =
    "pointer";


  openButton.addEventListener(
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
    downloadLink
  );

  controls.appendChild(
    openButton
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
// 🧠 THINKING
// =====================================================

function showThinking() {

  if (!thinking) return;

  thinking.classList.remove(
    "hidden"
  );

  thinking.textContent =
    "Kirong AI is thinking";

}


function hideThinking() {

  if (!thinking) return;

  thinking.classList.add(
    "hidden"
  );

}


// =====================================================
// 🔒 SEND STATE
// =====================================================

function setSendingState(state) {

  isSending = state;


  if (!sendBtn) return;


  sendBtn.disabled =
    state;


  sendBtn.style.opacity =
    state ? "0.6" : "1";


  sendBtn.style.cursor =
    state
      ? "not-allowed"
      : "pointer";

}


// =====================================================
// 🌍 LANGUAGE
// =====================================================

function getSelectedLanguage() {

  const languageSelect =
    document.getElementById(
      "languageSelect"
    );


  return (
    languageSelect?.value ||
    "English"
  );

}


// =====================================================
// 📡 SAFE RESPONSE READER
// =====================================================

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

    } catch (error) {

      console.error(
        "❌ JSON parse error:",
        error
      );

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


  // ---------------------------------------------------
  // SHOW USER MESSAGE
  // ---------------------------------------------------

  addMessage(
    text,
    "user"
  );


  // ---------------------------------------------------
  // CLEAR INPUT
  // ---------------------------------------------------

  userInput.value = "";


  // ---------------------------------------------------
  // UI STATE
  // ---------------------------------------------------

  setSendingState(true);

  showThinking();


  try {

    const language =
      getSelectedLanguage();


    // -------------------------------------------------
    // API REQUEST
    // -------------------------------------------------

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


    // -------------------------------------------------
    // SERVER ERROR
    // -------------------------------------------------

    if (!response.ok) {

      addMessage(

        data?.text ||
        "⚠️ Kirong AI could not process your request.",

        "ai"

      );

      return;

    }


    // =================================================
    // 🎨 IMAGE RESPONSE
    // =================================================

    if (
      data?.type === "image" &&
      data?.image
    ) {

      console.log(
        "🎨 IMAGE RECEIVED:",
        data.provider,
        data.route
      );


      addImage(

        data.image,

        data.text ||
        "🎨 Nimekutengenezea picha yako. 🫂🔥",

        data.provider ||
        data.route ||
        "Image Engine"

      );


      // ------------------------------------------------
      // SAVE IMAGE REQUEST TO HISTORY
      // ------------------------------------------------

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


      return;

    }


    // =================================================
    // ❌ IMAGE FAILURE RESPONSE
    // =================================================

    if (
      data?.intent === "IMAGE" &&
      data?.type === "error"
    ) {

      addMessage(

        data.text ||
        "🎨 Image generation failed. Please try again.",

        "ai"

      );

      return;

    }


    // =================================================
    // 💬 NORMAL TEXT
    // =================================================

    const reply =
      data?.text ||
      "⚠️ Kirong AI returned an empty response.";


    addMessage(
      reply,
      "ai"
    );


    // -------------------------------------------------
    // SAVE HISTORY
    // -------------------------------------------------

    chatHistory.push({

      role: "user",

      content: text

    });


    chatHistory.push({

      role: "assistant",

      content: reply

    });


    trimHistory();

  }

  catch (error) {

    console.error(
      "🔥 KIRONG FRONTEND ERROR:",
      error
    );


    hideThinking();


    addMessage(

      "⚠️ Connection problem. Kirong AI could not respond right now. Please try again.",

      "ai"

    );

  }

  finally {

    hideThinking();

    setSendingState(false);


    if (userInput) {

      userInput.focus();

    }

  }

}


// =====================================================
// ✂️ LIMIT HISTORY
// =====================================================

function trimHistory() {

  if (
    chatHistory.length > 20
  ) {

    chatHistory =
      chatHistory.slice(-20);

  }

}


// =====================================================
// 📤 CHAT FORM SUBMIT
// =====================================================

if (chatForm) {

  chatForm.addEventListener(
    "submit",
    (event) => {

      event.preventDefault();

      sendMessage();

    }
  );

}


// =====================================================
// ⌨️ ENTER KEY
// =====================================================

if (userInput) {

  userInput.addEventListener(
    "keydown",
    (event) => {

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


// =====================================================
// 🌙 THEME
// =====================================================

function loadTheme() {

  const savedTheme =
    localStorage.getItem(
      "theme"
    );


  if (
    savedTheme === "dark"
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
  .querySelectorAll(".quickBtn")
  .forEach(
    (button) => {

      button.addEventListener(
        "click",
        () => {

          const action =
            button.dataset.action;


          if (!userInput) return;


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
// 🗑️ CLEAR CHAT
// =====================================================

const clearBtn =
  document.getElementById(
    "clearBtn"
  );


if (clearBtn) {

  clearBtn.addEventListener(
    "click",
    () => {

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


      chatHistory = [];


      if (thinking) {

        thinking.classList.add(
          "hidden"
        );

      }


      if (userInput) {

        userInput.focus();

      }

    }
  );

}


// =====================================================
// 💾 EXPORT CHAT
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
            ".message"
          )
        );


      if (!messages.length) {

        return;

      }


      const text =
        messages
          .map(
            (message) =>
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

        (position) => {

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


        (error) => {

          console.error(
            "Location error:",
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


// =====================================================
// 📎 FILE UPLOAD
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


      // ------------------------------------------------
      // Current backend does not receive file bytes yet.
      // ------------------------------------------------

      addMessage(

        "📎 File selected successfully. File Intelligence will be connected to the backend next.",

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
      (event) => {

        console.error(
          "Speech recognition error:",
          event
        );


        micBtn.textContent =
          "🎤";

      };


    recognition.onresult =
      (event) => {

        const transcript =
          event.results?.[0]?.[0]?.transcript;


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
// 🏁 READY
// =====================================================

console.log(
  "⚡ Kirong AI v4.0 frontend loaded successfully."
);

console.log(
  "🎨 Image response support: ENABLED"
);

console.log(
  "🧠 Chat history support: ENABLED"
);

console.log(
  "🎤 Voice input support: ENABLED"
);
