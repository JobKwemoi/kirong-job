// =========================================================
// KIRONG AI — APP ENGINE
// Groq Testing Version
// =========================================================

const chatBox = document.getElementById("chatBox");
const userInput = document.getElementById("userInput");
const sendBtn = document.getElementById("sendBtn");
const themeBtn = document.getElementById("themeBtn");
const thinking = document.getElementById("thinking");
const chatForm = document.getElementById("chatForm");
const languageSelect = document.getElementById("languageSelect");

let chatHistory = [];


// =========================================================
// ADD MESSAGE
// =========================================================

function addMessage(text, sender) {

    const message = document.createElement("div");

    message.className = `message ${sender}`;

    const paragraph = document.createElement("p");

    paragraph.textContent = text;

    message.appendChild(paragraph);

    chatBox.appendChild(message);

    chatBox.scrollTop = chatBox.scrollHeight;
}


// =========================================================
// THINKING
// =========================================================

function showThinking() {

    thinking.classList.remove("hidden");

    chatBox.scrollTop = chatBox.scrollHeight;
}


function hideThinking() {

    thinking.classList.add("hidden");
}


// =========================================================
// SEND MESSAGE
// =========================================================

async function sendMessage() {

    const text = userInput.value.trim();

    if (!text) return;

    // Add user message
    addMessage(text, "user");

    userInput.value = "";

    userInput.focus();

    showThinking();

    sendBtn.disabled = true;

    try {

        const response = await fetch("/api/chat", {

            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({

                message: text,

                history: chatHistory,

                language:
                    languageSelect?.value || "English"

            })

        });


        const data = await response.json();


        if (!response.ok) {

            throw new Error(
                data?.text ||
                "Kirong AI request failed."
            );

        }


        if (!data?.text) {

            throw new Error(
                "Empty response from Kirong AI."
            );

        }


        // Show AI response
        addMessage(data.text, "ai");


        // Save conversation
        chatHistory.push({

            role: "user",

            content: text

        });


        chatHistory.push({

            role: "assistant",

            content: data.text

        });


        // Keep memory manageable
        if (chatHistory.length > 20) {

            chatHistory =
                chatHistory.slice(-20);

        }

    }

    catch (error) {

        console.error(
            "Kirong AI:",
            error
        );

        addMessage(
            "⚠️ " +
            (error.message ||
            "Something went wrong."),
            "ai"
        );

    }

    finally {

        hideThinking();

        sendBtn.disabled = false;

        userInput.focus();

    }
}


// =========================================================
// FORM SUBMIT
// =========================================================

if (chatForm) {

    chatForm.addEventListener(
        "submit",
        function(event) {

            event.preventDefault();

            sendMessage();

        }
    );

} else {

    sendBtn?.addEventListener(
        "click",
        sendMessage
    );

}


// =========================================================
// ENTER KEY
// =========================================================

userInput?.addEventListener(
    "keydown",
    function(event) {

        if (
            event.key === "Enter" &&
            !event.shiftKey
        ) {

            event.preventDefault();

            sendMessage();

        }

    }
);


// =========================================================
// THEME
// =========================================================

const savedTheme =
    localStorage.getItem("theme");

if (savedTheme === "dark") {

    document.body.classList.add("dark");

    themeBtn.textContent = "☀️";

}


themeBtn?.addEventListener(
    "click",
    function() {

        document.body.classList.toggle(
            "dark"
        );

        const dark =
            document.body.classList.contains(
                "dark"
            );

        themeBtn.textContent =
            dark ? "☀️" : "🌙";

        localStorage.setItem(
            "theme",
            dark ? "dark" : "light"
        );

    }
);


// =========================================================
// QUICK ACTIONS
// =========================================================

document
    .querySelectorAll(".quickBtn")
    .forEach(function(button) {

        button.addEventListener(
            "click",
            function() {

                const action =
                    button.dataset.action;

                userInput.value =
                    action + " ";

                userInput.focus();

            }
        );

    });


// =========================================================
// CLEAR CHAT
// =========================================================

const clearBtn =
    document.getElementById("clearBtn");

clearBtn?.addEventListener(
    "click",
    function() {

        chatBox.innerHTML = `
            <div class="message ai">
                <p>
                    Hello 👋
                    <br><br>
                    I am <strong>Kirong AI</strong>.
                    How can I help you today?
                </p>
            </div>
        `;

        chatHistory = [];

        userInput.focus();

    }
);


// =========================================================
// EXPORT CHAT
// =========================================================

const exportBtn =
    document.getElementById("exportBtn");

exportBtn?.addEventListener(
    "click",
    function() {

        const messages =
            [...document.querySelectorAll(".message")];

        const text =
            messages
                .map(message =>
                    message.innerText
                )
                .join("\n\n");

        const blob =
            new Blob(
                [text],
                {
                    type: "text/plain"
                }
            );

        const url =
            URL.createObjectURL(blob);

        const link =
            document.createElement("a");

        link.href = url;

        link.download =
            "KirongAI_Conversation.txt";

        link.click();

        URL.revokeObjectURL(url);

    }
);


// =========================================================
// LOCATION
// =========================================================

const locationBtn =
    document.getElementById("locationBtn");

locationBtn?.addEventListener(
    "click",
    function() {

        if (!navigator.geolocation) {

            addMessage(
                "Location is not supported by this browser.",
                "ai"
            );

            return;
        }


        addMessage(
            "📍 Requesting your location...",
            "ai"
        );


        navigator.geolocation.getCurrentPosition(

            function(position) {

                const latitude =
                    position.coords.latitude
                        .toFixed(4);

                const longitude =
                    position.coords.longitude
                        .toFixed(4);

                addMessage(
                    `📍 Latitude: ${latitude}
Longitude: ${longitude}`,
                    "ai"
                );

            },

            function() {

                addMessage(
                    "⚠️ Location permission was not granted.",
                    "ai"
                );

            }

        );

    }
);


// =========================================================
// FILE UPLOAD
// =========================================================

const uploadBtn =
    document.getElementById("uploadBtn");

const fileInput =
    document.getElementById("fileInput");


uploadBtn?.addEventListener(
    "click",
    function() {

        fileInput?.click();

    }
);


fileInput?.addEventListener(
    "change",
    function() {

        const file =
            fileInput.files?.[0];

        if (!file) return;

        addMessage(
            `📎 File selected: ${file.name}`,
            "user"
        );

    }
);


// =========================================================
// STARTUP
// =========================================================

console.log(
    "⚡ Kirong AI frontend initialized."
);
