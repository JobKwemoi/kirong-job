// ============================================
// ⚡ KIRONG AI FRONTEND V7.0
// FILE INTELLIGENCE + NEON GLASS UI
// ============================================

const chatWindow = document.getElementById("chat-window");
const userInput = document.getElementById("user-input");
const sendBtn = document.getElementById("send-btn");
const languageSelect = document.getElementById("language-select");
const fileInput = document.getElementById("file-input"); // ADD HII KWA HTML YAKO
const filePreview = document.getElementById("file-preview"); // ADD HII KWA HTML YAKO

let chatHistory = [];
let selectedFile = null;

// ============================================
// 📎 FILE HANDLING
// ============================================

fileInput?.addEventListener("change", (e) => {
  selectedFile = e.target.files[0];
  if (selectedFile) {
    filePreview.innerHTML = `
      <div class="file-tag">
        📎 ${selectedFile.name} 
        <span class="remove-file" onclick="removeFile()">×</span>
      </div>
    `;
    filePreview.style.display = "block";
  }
});

function removeFile() {
  selectedFile = null;
  fileInput.value = "";
  filePreview.innerHTML = "";
  filePreview.style.display = "none";
}

// ============================================
// 💬 SEND MESSAGE
// ============================================

async function sendMessage() {
  const text = userInput.value.trim();
  const language = languageSelect.value;
  
  if (!text &&!selectedFile) return;

  // ONYESHA USER MESSAGE
  if (text) addMessage("user", text);
  if (selectedFile) addMessage("user", `📎 Uploaded: ${selectedFile.name}`);
  
  userInput.value = "";
  showTyping();

  try {
    const formData = new FormData();
    formData.append("message", text);
    formData.append("history", JSON.stringify(chatHistory));
    formData.append("language", language);
    if (selectedFile) formData.append("file", selectedFile);

    const response = await fetch("/api/chat", {
      method: "POST",
      body: formData // SIO JSON TENA
    });

    const data = await response.json();
    hideTyping();

    if (data.type === "image") {
      addMessage("ai", data.text, "image", data.image);
    } else {
      addMessage("ai", data.text);
    }

    // SAVE HISTORY
    if (text) chatHistory.push({ role: "user", content: text });
    chatHistory.push({ role: "assistant", content: data.text });
    if (chatHistory.length > 20) chatHistory = chatHistory.slice(-20);
    
    removeFile(); // CLEAR FILE BAADA YA KUTUMA

  } catch (error) {
    hideTyping();
    addMessage("ai", "❌ Network error. Please try again.");
    console.error(error);
  }
}

// ============================================
// 🎨 UI FUNCTIONS - PASTE ZAKO ZA ZAMANI HAPA
// ============================================

function addMessage(sender, text, type = "text", image = null) {
  const msgDiv = document.createElement("div");
  msgDiv.className = `message ${sender}`;
  
  if (type === "image" && image) {
    msgDiv.innerHTML = `
      <p>${text}</p>
      <img src="${image}" alt="Generated Image" class="generated-img"/>
    `;
  } else {
    msgDiv.innerHTML = `<p>${text}</p>`;
  }
  
  chatWindow.appendChild(msgDiv);
  chatWindow.scrollTop = chatWindow.scrollHeight;
}

function showTyping() { /*... code yako ya typing... */ }
function hideTyping() { /*... code yako ya typing... */ }

sendBtn.addEventListener("click", sendMessage);
userInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") sendMessage();
});
