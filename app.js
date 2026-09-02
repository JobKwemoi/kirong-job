"use strict";

const API_ENDPOINT = "/api/chat";
const STORAGE_KEY = "kirong-ai-chats-v1";
const MAX_FILE_SIZE = 2 * 1024 * 1024;
const $ = (id) => document.getElementById(id);
const chatBox = $("chatBox");
const userInput = $("userInput");
const sendBtn = $("sendBtn");
const thinking = $("thinking");
const fileInput = $("fileInput");
const filePreview = $("filePreview");
let attachedFile = null;
let activeMode = "chat";
let messages = loadMessages();

function loadMessages() { try { const saved = JSON.parse(localStorage.getItem(STORAGE_KEY)); return Array.isArray(saved) ? saved.slice(-40) : []; } catch { return []; } }
function saveMessages() { localStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-40))); renderHistory(); }
function escapeHtml(value) { const element = document.createElement("div"); element.textContent = value; return element.innerHTML; }
function formatText(text) { return escapeHtml(text).replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>").replace(/`([^`]+)`/g, "<code>$1</code>").replace(/\n/g, "<br>"); }

function addMessage(role, content) {
  const item = { role, content: String(content), createdAt: Date.now() };
  messages = [...messages, item].slice(-40); saveMessages(); renderMessage(item); chatBox.scrollTop = chatBox.scrollHeight;
}
function renderMessage(message) {
  const article = document.createElement("article"); article.className = `message ${message.role}`;
  article.innerHTML = `<div class="message-avatar" aria-hidden="true">${message.role === "user" ? "You" : "♛"}</div><div class="message-body"><p class="message-label">${message.role === "user" ? "You" : "Kirong AI"}</p><div class="messageContent">${formatText(message.content)}</div></div>`;
  chatBox.append(article);
}
function renderChat() {
  chatBox.innerHTML = "";
  if (!messages.length) { chatBox.innerHTML = '<div class="welcome-card"><span class="welcome-crown" aria-hidden="true">♛</span><h2>What can I help you create?</h2><p>Ask a question, upload a document, or choose a tool to get started.</p></div>'; return; }
  messages.forEach(renderMessage); chatBox.scrollTop = chatBox.scrollHeight;
}
function setThinking(value) { thinking.classList.toggle("hidden", !value); sendBtn.disabled = value; sendBtn.textContent = value ? "Sending…" : "Send ↑"; }
async function readAttachment(file) {
  if (!file) return "";
  if (file.size > MAX_FILE_SIZE) throw new Error("File must be 2 MB or smaller.");
  if (file.type.startsWith("image/")) return `\n\n[Attached image: ${file.name}]`;
  if (!file.type.startsWith("text/") && !/\.(txt|md|csv|json|js|html|css|py)$/i.test(file.name)) return `\n\n[Attached file: ${file.name}]`;
  return `\n\nAttached file (${file.name}):\n${(await file.text()).slice(0, 12000)}`;
}
async function sendMessage() {
  const prompt = userInput.value.trim(); if (!prompt && !attachedFile) return;
  try {
    setThinking(true); const attachmentText = await readAttachment(attachedFile); const fullPrompt = `${prompt || "Please analyze this attachment."}${attachmentText}`;
    addMessage("user", prompt || `Attached: ${attachedFile.name}`); userInput.value = ""; userInput.style.height = "auto"; attachedFile = null; filePreview.textContent = "";
    const response = await fetch(API_ENDPOINT, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message: fullPrompt, mode: activeMode, history: messages.slice(-12, -1).map(({ role, content }) => ({ role, content })) }) });
    const data = await response.json().catch(() => ({})); if (!response.ok || !data.ok) throw new Error(data.error || "Kirong AI could not reply. Please try again."); addMessage("assistant", data.reply);
  } catch (error) { addMessage("assistant", `Sorry, ${error.message}`); } finally { setThinking(false); userInput.focus(); }
}
function setActiveMode(mode, starterPrompt = "") {
  activeMode = mode; const labels = { content: "📝 Content Factory", whatsapp: "📱 WhatsApp Business", blog: "✍️ Blog Engine", affiliate: "🤝 Affiliate Engine", school: "🎓 School Mode" }; const banner = $("modeBanner");
  banner.classList.toggle("hidden", !labels[mode]); banner.innerHTML = labels[mode] ? `<span>${labels[mode]} active</span><button id="exitModeBtn" type="button">✕ Exit</button>` : ""; $("exitModeBtn")?.addEventListener("click", () => setActiveMode("chat"));
  if (starterPrompt) userInput.value = starterPrompt; showTab("chat"); userInput.focus();
}
function showTab(name) {
  document.querySelectorAll(".tabBtn").forEach((button) => { const selected = button.dataset.tab === name; button.classList.toggle("active", selected); button.setAttribute("aria-selected", String(selected)); });
  document.querySelectorAll(".tabPanel").forEach((panel) => { const selected = panel.id === name; panel.classList.toggle("active", selected); panel.hidden = !selected; }); $("sidebar")?.classList.remove("open"); $("sidebarOverlay")?.classList.remove("open");
}
function renderHistory() {
  const history = $("historyList"), sidebar = $("sidebarHistoryList"); if (!history || !sidebar) return; const userMessages = messages.filter((message) => message.role === "user").slice(-12).reverse();
  const cards = userMessages.map((message) => `<button class="historyItem" type="button">${escapeHtml(message.content.slice(0, 70))}</button>`).join(""); history.innerHTML = cards || '<p class="emptyText">No chats yet.</p>'; sidebar.innerHTML = userMessages.slice(0, 6).map((message) => `<button class="historyItem" type="button">${escapeHtml(message.content.slice(0, 35))}</button>`).join("");
}
function clearChat() { messages = []; saveMessages(); renderChat(); }
function setupOnboarding() {
  const overlay = $("onboardingOverlay"); if (localStorage.getItem("kirong-ai-onboarded")) overlay?.classList.add("hidden"); const close = () => { localStorage.setItem("kirong-ai-onboarded", "true"); overlay?.classList.add("hidden"); };
  $("finishOnboarding")?.addEventListener("click", close); $("skipOnboarding")?.addEventListener("click", close); document.querySelectorAll(".onboardingOption").forEach((button) => button.addEventListener("click", () => { document.querySelectorAll(".onboardingOption").forEach((item) => item.classList.remove("active")); button.classList.add("active"); }));
}
document.querySelectorAll(".tabBtn").forEach((button) => button.addEventListener("click", () => showTab(button.dataset.tab)));
document.querySelectorAll(".toolCard[data-mode]").forEach((card) => card.addEventListener("click", () => setActiveMode(card.dataset.mode, card.dataset.prompt)));
sendBtn.addEventListener("click", sendMessage); $("newChatBtn")?.addEventListener("click", clearChat); $("sidebarNewChatBtn")?.addEventListener("click", () => { clearChat(); showTab("chat"); }); $("clearChatBtn")?.addEventListener("click", clearChat); $("clearHistoryBtn")?.addEventListener("click", clearChat); $("attachBtn")?.addEventListener("click", () => fileInput.click());
fileInput?.addEventListener("change", () => { attachedFile = fileInput.files?.[0] || null; filePreview.textContent = attachedFile ? `Attached: ${attachedFile.name}` : ""; });
userInput.addEventListener("input", () => { userInput.style.height = "auto"; userInput.style.height = `${Math.min(userInput.scrollHeight, 180)}px`; }); userInput.addEventListener("keydown", (event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); sendMessage(); } });
$("sidebarToggle")?.addEventListener("click", () => { $("sidebar")?.classList.add("open"); $("sidebarOverlay")?.classList.add("open"); }); [$("sidebarCloseBtn"), $("sidebarOverlay")].forEach((button) => button?.addEventListener("click", () => { $("sidebar")?.classList.remove("open"); $("sidebarOverlay")?.classList.remove("open"); }));
$("historySearchInput")?.addEventListener("input", (event) => document.querySelectorAll("#historyList .historyItem").forEach((item) => { item.hidden = !item.textContent.toLowerCase().includes(event.target.value.toLowerCase()); }));
setupOnboarding(); renderChat(); renderHistory();
