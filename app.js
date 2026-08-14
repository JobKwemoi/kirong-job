// =====================================================
// ⚡ KIRONG AI v3.1
// Stable Frontend Controller
// =====================================================

const chatBox = document.getElementById("chatBox");
const userInput = document.getElementById("userInput");
const sendBtn = document.getElementById("sendBtn");
const themeBtn = document.getElementById("themeBtn");
const thinking = document.getElementById("thinking");

let chatHistory = [];
let isSending = false;


// =====================================================
// 💬 ADD MESSAGE
// =====================================================

function addMessage(text, sender) {

  if (!chatBox) return;

  const message = document.createElement("div");

  message.className = `message ${sender}`;

  const paragraph = document.createElement("p");

  paragraph.innerHTML = String(text || "");

  message.appendChild(paragraph);

  chatBox.appendChild(message);

  chatBox.scrollTop = chatBox.scrollHeight;

  return message;
}


// =====================================================
// 🖼️ ADD IMAGE
// =====================================================

function addImage(image, caption = "") {

  if (!chatBox || !image) return;

  const message = document.createElement("div");

  message.className = "message ai";

  if (caption) {

    const paragraph = document.createElement("p");

    paragraph.textContent = caption;

    message.appendChild(paragraph);

  }

  const img = document.createElement("img");

  img.src = image;

  img.alt = "Kirong AI generated image";

  img.style.display = "block";
  img.style.width = "100%";
  img.style.maxWidth = "500px";
  img.style.marginTop = "12px";
  img.style.borderRadius = "18px";
  img.style.boxShadow = "0 15px 40px rgba(0,0,0,.35)";

  message.appendChild(img);


  const controls = document.createElement("div");

  controls.style.display = "flex";
  controls.style.gap = "10px";
  controls.style.marginTop = "12px";
  controls.style.flexWrap = "wrap";


  const downloadLink = document.createElement("a");

  downloadLink.href = image;
  downloadLink.download = "KirongAI_Generated.png";
  downloadLink.style.textDecoration = "none";


  const downloadButton = document.createElement("button");

  downloadButton.type = "button";
  downloadButton.textContent = "📥 Save Image";

  downloadButton.style.padding = "10px 15px";
  downloadButton.style.border = "none";
  downloadButton.style.borderRadius = "12px";
  downloadButton.style.cursor = "pointer";

  downloadLink.appendChild(downloadButton);


  const openButton = document.createElement("button");

  openButton.type = "button";
  openButton.textContent = "🔍 Open";

  openButton.style.padding = "10px 15px";
  openButton.style.border = "none";
  openButton.style.borderRadius = "12px";
  openButton.style.cursor = "pointer";

  openButton.addEventListener("click", () => {

    window.open(image, "_blank");

  });


  controls.appendChild(downloadLink);
  controls.appendChild(openButton);

  message.appendChild(controls);

  chatBox.appendChild(message);

  chatBox.scrollTop = chatBox.scrollHeight;
}


// =====================================================
// 🧠 THINKING
// =====================================================

function showThinking() {

  if (!thinking) return;

  thinking.classList.remove("hidden");

  thinking.textContent =
    "Kirong AI is thinking...";

}


function hideThinking() {

  if (!thinking) return;

  thinking.classList.add("hidden");

}


// =====================================================
// 🔒 SEND BUTTON STATE
// =====================================================

function setSendingState(state) {

  isSending = state;

  if (!sendBtn) return;

  sendBtn.disabled = state;

  sendBtn.style.opacity =
    state ? "0.6" : "1";

  sendBtn.style.cursor =
    state ? "not-allowed" : "pointer";

}


// =====================================================
// 🧠 GET LANGUAGE
// =====================================================

function getSelectedLanguage() {

  const languageSelect =
    document.getElementById("languageSelect");

  if (!languageSelect) {

    return "English";

  }

  return languageSelect.value || "English";

}


// =====================================================
// 📡 SAFE API RESPONSE
// =====================================================

async function readResponse(response) {

  const contentType =
    response.headers.get("content-type") || "";

  if (
    contentType.includes("application/json")
  ) {

    return await response.json();

  }

  const text =
    await response.text();

  return {
    text: text || "Unknown server response."
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


  // ===================================================
  // 👤 SHOW USER MESSAGE FIRST
  // ===================================================

  addMessage(
    text,
    "user"
  );


  // ===================================================
  // CLEAR INPUT AFTER MESSAGE IS SAFE
  // ===================================================

  userInput.value = "";


  // ===================================================
  // UI STATE
  // ===================================================

  setSendingState(true);

  showThinking();


  try {

    const language =
      getSelectedLanguage();


    // =================================================
    // 📡 API REQUEST
    // =================================================

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


    // =================================================
    // 📦 READ RESPONSE SAFELY
    // =================================================

    const data =
      await readResponse(response);


    hideThinking();


    // =================================================
    // ❌ SERVER ERROR
    // =================================================

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

      addImage(

        data.image,

        data.text ||
        "🎨 Kirong AI generated this image."

      );


      // Keep image request in history
      chatHistory.push({

        role: "user",

        content: text

      });


      chatHistory.push({

        role: "assistant",

        content:
          "[Image generated by Kirong AI]"

      });


      return;

    }


    // =================================================
    // 💬 NORMAL TEXT RESPONSE
    // =================================================

    const reply =
      data?.text ||
      "⚠️ Kirong AI returned an empty response.";


    addMessage(
      reply,
      "ai"
    );


    // =================================================
    // 🧠 SAVE HISTORY
    // =================================================

    chatHistory.push({

      role: "user",

      content: text

    });


    chatHistory.push({

      role: "assistant",

      content: reply

    });


    // =================================================
    // ✂️ LIMIT HISTORY
    // =================================================

    if (
      chatHistory.length > 20
    ) {

      chatHistory =
        chatHistory.slice(-20);

    }

  }

  catch (error) {

    console.error(
      "KIRONG FRONTEND ERROR:",
      error
    );


    hideThinking();


    addMessage(

      "⚠️ Connection problem. Your message was received, but Kirong AI could not respond right now.",

      "ai"

    );

  }

  finally {

    hideThinking();

    setSendingState(false);

    userInput.focus();

  }

}


// =====================================================
// 📤 SEND BUTTON
// =====================================================

if (sendBtn) {

  sendBtn.addEventListener(
    "click",
    sendMessage
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

if (
  localStorage.getItem("theme") === "dark"
) {

  document.body.classList.add("dark");

  if (themeBtn) {

    themeBtn.textContent = "☀️";

  }

}


if (themeBtn) {

  themeBtn.addEventListener(
    "click",
    () => {

      document.body.classList.toggle("dark");

      const dark =
        document.body.classList.contains("dark");


      themeBtn.textContent =
        dark ? "☀️" : "🌙";


      localStorage.setItem(
        "theme",
        dark ? "dark" : "light"
      );

    }
  );

}


// =====================================================
// ⚡ QUICK ACTIONS
// =====================================================

document
  .querySelectorAll(".quickBtn")
  .forEach((button) => {

    button.addEventListener(
      "click",
      () => {

        const action =
          button.dataset.action;


        if (
          action === "Image"
        ) {

          userInput.value =
            "Nigeneretie picha ya ";

        }

        else {

          userInput.value =
            `${action} `;

        }


        userInput.focus();

      }
    );

  });


// =====================================================
// 🗑️ CLEAR CHAT
// =====================================================

const clearBtn =
  document.getElementById("clearBtn");


if (clearBtn) {

  clearBtn.addEventListener(
    "click",
    () => {

      chatBox.innerHTML = `

        <div class="message ai">

          <p>
            Hello 👋<br>
            I am <b>Kirong AI</b>.<br>
            How can I help you today?
          </p>

        </div>

      `;

      chatHistory = [];

      userInput.focus();

    }
  );

}


// =====================================================
// 💾 EXPORT CHAT
// =====================================================

const exportBtn =
  document.getElementById("exportBtn");


if (exportBtn) {

  exportBtn.addEventListener(
    "click",
    () => {

      const messages =
        [
          ...document.querySelectorAll(
            ".message"
          )
        ];


      const text =
        messages
          .map(
            (message) =>
              message.innerText
          )
          .join("\n\n");


      const blob =
        new Blob(
          [text],
          {
            type:
              "text/plain"
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


// =====================================================
// 📍 LOCATION
// =====================================================

const locationBtn =
  document.getElementById("locationBtn");


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


      locationBtn.disabled = true;


      navigator.geolocation.getCurrentPosition(

        (position) => {

          const latitude =
            position.coords.latitude
              .toFixed(4);


          const longitude =
            position.coords.longitude
              .toFixed(4);


          addMessage(

            `📍 Latitude: ${latitude}<br>
             Longitude: ${longitude}`,

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

        }

      );

    }
  );

}


// =====================================================
// 📎 FILE UPLOAD
// =====================================================

const fileInput =
  document.getElementById("fileInput");

const uploadBtn =
  document.getElementById("uploadBtn");


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

    }
  );

}


// =====================================================
// 🏁 READY
// =====================================================

console.log(
  "⚡ Kirong AI frontend loaded successfully."
);
