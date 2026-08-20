// ============================================
// ⚡ KIRONG AI FRONTEND V7.0
// ============================================

const chatBox = document.getElementById("chatBox"); // ILIKUWA chat-window
const userInput = document.getElementById("userInput"); // ILIKUWA user-input
const sendBtn = document.getElementById("sendBtn");
const chatForm = document.getElementById("chatForm");
const languageSelect = document.getElementById("languageSelect");
const fileInput = document.getElementById("fileInput");
const uploadBtn = document.getElementById("uploadBtn");
const filePreview = document.getElementById("filePreview");
const thinking = document.getElementById("thinking");

let chatHistory = [];
let selectedFile = null;

// 📎 FILE HANDLING
uploadBtn.addEventListener("click", () => fileInput.click());

fileInput.addEventListener("change", (e) => {
  selectedFile = e.target.files[0];
  if (selectedFile) {
    filePreview.innerHTML = `📎 ${selectedFile.name} <span class="removeFile" onclick="removeFile()">×</span>`;
    filePreview.style.display = "block";
  }
});

function removeFile() {
  selectedFile = null;
  fileInput.value = "";
  filePreview.innerHTML = "";
  filePreview.style.display = "none";
}

// 💬 SEND MESSAGE
chatForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const text = userInput.value.trim();
  const language = languageSelect.value;

  if (!text &&!selectedFile) return;

  if (text) addMessage("user", text);
  if (selectedFile) addMessage("user", `📎 ${selectedFile.name}`);

  userInput.value = "";
  showThinking();

  try {
    const formData = new FormData();
    formData.append("message", text);
    formData.append("history", JSON.stringify(chatHistory));
    formData.append("language", language);
    if (selectedFile) formData.append("file", selectedFile);

    const response = await fetch("/api/chat", { method: "POST", body: formData });
    const data = await response.json();
    hideThinking();

    if (data.type === "image") {
      addMessage("ai", data.text, "image", data.image);
    } else {
      addMessage("ai", data.text);
    }

    if (text) chatHistory.push({ role: "user", content: text });
    chatHistory.push({ role: "assistant", content: data.text });
    if (chatHistory.length > 20) chatHistory = chatHistory.slice(-20);

    removeFile();

  } catch (error) {
    hideThinking();
    addMessage("ai", "❌ Network error. Please try again.");
  }
});

// 🎨 UI FUNCTIONS
function addMessage(sender, text, type = "text", image = null) {
  document.getElementById("kirongWelcome").style.display = "none"; // FICHA WELCOME
  const msgDiv = document.createElement("div");
  msgDiv.className = `message ${sender}`;
  if (type === "image" && image) {
    msgDiv.innerHTML = `<p>${text}</p><img src="${image}" class="generated-img"/>`;
  } else {
    msgDiv.innerHTML = `<p>${text}</p>`;
  }
  chatBox.appendChild(msgDiv);
  chatBox.scrollTop = chatBox.scrollHeight;
}

function showThinking() { thinking.classList.remove("hidden"); }
function hideThinking() { thinking.classList.add("hidden"); }
