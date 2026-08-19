/* ============================================================
   ⚡ KIRONG AI — STYLE V6.1 PREMIUM
   🧠 Glass + Dark + Mobile First
   ============================================================ */

:root {
  --bg: #07060d;
  --bg-2: #0d0a1a;
  --card: rgba(20, 18, 30, 0.6);
  --card-hover: rgba(30, 28, 45, 0.7);
  --accent: #8b5cf6;
  --accent-2: #3b82f6;
  --text: #e5e7eb;
  --text-muted: #9ca3af;
  --border: rgba(255, 255, 255, 0.08);
  --success: #22c55e;
  --danger: #ef4444;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  background: var(--bg);
  color: var(--text);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif;
  min-height: 100dvh;
  overflow: hidden;
}

/* ===== AMBIENT BACKGROUND ===== */
.ambient {
  position: fixed;
  border-radius: 50%;
  filter: blur(140px);
  opacity: 0.18;
  z-index: -1;
  pointer-events: none;
}
.ambientOne { width: 500px; height: 500px; background: var(--accent); top: -150px; left: -100px; }
.ambientTwo { width: 600px; height: 600px; background: var(--accent-2); bottom: -200px; right: -150px; }
.ambientThree { width: 400px; height: 400px; background: var(--accent); top: 50%; left: 50%; transform: translate(-50%, -50%); }

/* ===== MAIN CONTAINER ===== */
.container {
  display: flex;
  flex-direction: column;
  height: 100dvh;
  max-width: 900px;
  margin: 0 auto;
  padding: env(safe-area-inset-top) 0 env(safe-area-inset-bottom) 0;
}

/* ===== HEADER ===== */
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 16px;
  background: var(--card);
  backdrop-filter: blur(20px);
  border-bottom: 1px solid var(--border);
  position: sticky;
  top: 0;
  z-index: 100;
}

.headerLeft { display: flex; align-items: center; gap: 16px; }
.brandArea { display: flex; align-items: center; gap: 10px; }
.brandLogo { font-size: 24px; }
.brandInfo h1 { font-size: 16px; font-weight: 700; }
.brandStatus { display: flex; align-items: center; gap: 6px; font-size: 11px; color: var(--text-muted); }
.statusDot { width: 7px; height: 7px; background: var(--success); border-radius: 50%; }

#languageSelect {
  background: rgba(255,255,255,0.05);
  border: 1px solid var(--border);
  color: var(--text);
  border-radius: 8px;
  padding: 6px 8px;
  font-size: 12px;
}

.headerActions { display: flex; gap: 8px; }
.headerActions button {
  width: 38px; height: 38px; border-radius: 10px;
  background: rgba(255,255,255,0.05); border: 1px solid var(--border);
  color: var(--text); font-size: 18px; cursor: pointer;
  transition: all .2s ease;
}
.headerActions button:hover { background: rgba(255,255,255,0.1); transform: scale(1.05); }

/* ===== CHAT BOX ===== */
.chatBox {
  flex: 1;
  overflow-y: auto;
  padding: 20px 12px;
  scroll-behavior: smooth;
}

/* ===== WELCOME SCREEN ===== */
.kirongWelcome { text-align: center; padding: 40px 20px; }
.kirongWelcomeLogo { font-size: 48px; margin-bottom: 16px; }
.welcomeEyebrow { display: flex; align-items: center; justify-content: center; gap: 10px; color: var(--accent); font-size: 11px; font-weight: 700; letter-spacing: 1px; margin-bottom: 12px; }
.welcomeEyebrow span { width: 30px; height: 1px; background: var(--accent); }
.kirongWelcome h2 { font-size: 22px; margin-bottom: 8px; }
.kirongWelcome h2 span { color: var(--accent); }
.kirongWelcome p { color: var(--text-muted); font-size: 14px; line-height: 1.6; }

/* UPGRADE: WELCOME CHIPS */
.welcomeChips { display: flex; gap: 8px; margin-top: 20px; flex-wrap: wrap; justify-content: center; }
.welcomeChips button {
  padding: 9px 14px; border: 1px solid rgba(139,92,246,.35);
  background: rgba(139,92,246,.12); color: #c4b5fd; border-radius: 22px;
  cursor: pointer; font-size: 13px; font-weight: 600;
  transition: all .2s;
}
.welcomeChips button:hover { background: rgba(139,92,246,.25); transform: translateY(-2px); }

/* ===== QUICK ACTIONS ===== */
.quickActions {
  display: flex; gap: 8px; padding: 10px 12px;
  overflow-x: auto; scrollbar-width: none;
  border-top: 1px solid var(--border);
  background: var(--card); backdrop-filter: blur(20px);
}
.quickActions::-webkit-scrollbar { display: none; }
.quickBtn {
  display: flex; align-items: center; gap: 6px;
  padding: 8px 14px; border-radius: 20px;
  background: rgba(255,255,255,0.05); border: 1px solid var(--border);
  color: var(--text); font-size: 13px; white-space: nowrap; cursor: pointer;
  transition: all .2s;
}
.quickBtn:hover { background: rgba(139,92,246,.2); border-color: var(--accent); }

/* ===== INPUT AREA - GLASS ===== */
.inputArea {
  display: flex; align-items: center; gap: 8px;
  padding: 10px; margin: 12px;
  background: var(--card);
  backdrop-filter: blur(20px);
  border: 1px solid var(--border);
  border-radius: 18px;
  position: sticky;
  bottom: 0;
}

#voiceSelect {
  background: transparent; border: 0; color: var(--text-muted);
  font-size: 12px; font-weight: 700; padding: 8px;
}

#uploadBtn, #micBtn {
  background: transparent; border: 0; font-size: 20px;
  cursor: pointer; padding: 8px; color: var(--text-muted);
  transition: color .2s;
}
#uploadBtn:hover, #micBtn:hover { color: var(--accent); }

#userInput {
  flex: 1; background: transparent; border: 0;
  color: var(--text); font-size: 15px; outline: none;
}
#userInput::placeholder { color: var(--text-muted); }

#sendBtn {
  background: var(--accent); border: 0; border-radius: 12px;
  width: 44px; height: 44px; color: white; font-size: 18px;
  cursor: pointer; transition: all .15s ease;
}
#sendBtn:active { transform: scale(0.92); }
#sendBtn:disabled { opacity: .5; cursor: not-allowed; }

/* ===== MESSAGES ===== */
.message {
  position: relative;
  max-width: 85%;
  padding: 14px 16px;
  margin: 10px 12px;
  border-radius: 16px;
  animation: fadeInUp 0.35s cubic-bezier(0.16, 1, 0.3, 1);
  line-height: 1.6;
}
.message.user {
  background: var(--accent);
  margin-left: auto;
  border-bottom-right-radius: 4px;
}
.message.ai {
  background: var(--card);
  border: 1px solid var(--border);
  border-bottom-left-radius: 4px;
}
.message.error { border: 1px solid var(--danger); }

@keyframes fadeInUp { 
  from {opacity:0; transform: translateY(12px)} 
  to {opacity:1; transform: translateY(0)} 
}

/* COPY + RETRY BUTTONS */
.kirongCopyBtn {
  position: absolute; top: 8px; right: 8px;
  background: rgba(255,255,255,.08); border: 0; border-radius: 8px;
  padding: 5px 8px; cursor: pointer; opacity: 0; transition: opacity .2s;
  font-size: 14px;
}
.message.ai:hover .kirongCopyBtn { opacity: 1; }

.kirongRetryBtn {
  margin-top: 10px; padding: 7px 12px;
  background: rgba(239,68,68,.15); border: 1px solid rgba(239,68,68,.3);
  color: #fca5a5; border-radius: 8px; cursor: pointer; font-size: 13px;
}

/* TYPING DOTS */
.thinking { display: flex; align-items: center; gap: 10px; padding: 14px 16px; }
.thinking.hidden { display: none; }
.kirongTyping { display: inline-flex; gap: 4px; }
.kirongTyping span {
  width: 7px; height: 7px; border-radius: 50%; background: var(--accent);
  animation: bounce 1.4s infinite;
}
.kirongTyping span:nth-child(2){ animation-delay: .2s; }
.kirongTyping span:nth-child(3){ animation-delay: .4s; }
@keyframes bounce { 0%,80%,100%{transform:scale(0)} 40%{transform:scale(1)} }

/* CODE BLOCKS */
pre { position: relative; background: #0f0f1a; padding: 12px; border-radius: 12px; overflow-x: auto; margin: 8px 0; }
code { font-family: 'Courier New', monospace; font-size: 13px; }
.copyCodeBtn {
  position: absolute; top: 8px; right: 8px; font-size: 11px;
  padding: 4px 8px; background: rgba(255,255,255,.1); border: 0; border-radius: 6px; color: #fff; cursor: pointer;
}

/* IMAGE */
.message img { width: 100%; border-radius: 12px; margin-top: 8px; }
.imageControls { display: flex; gap: 8px; margin-top: 10px; }
.imageControls a, .imageControls button {
  padding: 6px 10px; background: rgba(255,255,255,.08); border: 0;
  border-radius: 8px; color: var(--text); text-decoration: none; font-size: 12px; cursor: pointer;
}

/* ===== FOOTER ===== */
.footerButtons {
  display: flex; justify-content: center; gap: 10px;
  padding: 10px 12px; border-top: 1px solid var(--border);
}
.footerButtons button {
  display: flex; align-items: center; gap: 6px;
  padding: 8px 14px; background: rgba(255,255,255,0.05);
  border: 1px solid var(--border); border-radius: 10px;
  color: var(--text); cursor: pointer; font-size: 13px;
}
.footerButtons button:hover { background: rgba(255,255,255,0.1); }

/* ===== MOBILE ===== */
@media (max-width: 600px) {
  .chatBox { padding: 16px 8px; }
  .message { max-width: 90%; }
}

/* ===== REDUCED MOTION ===== */
@media (prefers-reduced-motion: reduce) {
  .message, .kirongTyping span { animation: none; }
}
