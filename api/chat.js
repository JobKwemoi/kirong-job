const MAX_MESSAGE_LENGTH = 30000;
const MAX_HISTORY_ITEMS = 12;

const MODE_INSTRUCTIONS = {
  chat: "Give a useful, clear, practical answer.",
  content: "Act as a content strategist. Provide polished, engaging content and clear options.",
  whatsapp: "Write concise, professional WhatsApp business messages that sound natural.",
  blog: "Act as an experienced blog editor. Use structure, accuracy, and actionable detail.",
  affiliate: "Give ethical, practical affiliate-marketing guidance. Never promise results.",
  school: "Teach step by step in simple language. Include an example where it helps."
};

function sendJson(response, status, data) {
  response.status(status).setHeader("Content-Type", "application/json; charset=utf-8").send(data);
}

export default async function handler(request, response) {
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    return sendJson(response, 405, { ok: false, error: "Method not allowed." });
  }

  const { message, history = [], mode = "chat" } = request.body || {};
  if (typeof message !== "string" || !message.trim()) return sendJson(response, 400, { ok: false, error: "A message is required." });
  if (message.length > MAX_MESSAGE_LENGTH) return sendJson(response, 400, { ok: false, error: "Message is too long." });
  if (!process.env.OPENAI_API_KEY) return sendJson(response, 503, { ok: false, error: "OPENAI_API_KEY is not configured on the server." });

  const safeHistory = Array.isArray(history) ? history.slice(-MAX_HISTORY_ITEMS).filter((item) => item && (item.role === "user" || item.role === "assistant") && typeof item.content === "string").map((item) => ({ role: item.role, content: item.content.slice(0, 8000) })) : [];
  const system = `You are Kirong AI, a friendly and capable assistant. Match the user's language; use natural Swahili when the user writes Swahili. ${MODE_INSTRUCTIONS[mode] || MODE_INSTRUCTIONS.chat} Do not claim to have performed external actions you did not perform.`;

  try {
    const upstream = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
      body: JSON.stringify({ model: process.env.OPENAI_MODEL || "gpt-4o-mini", messages: [{ role: "system", content: system }, ...safeHistory, { role: "user", content: message.trim() }], temperature: 0.7, max_tokens: 1200 })
    });
    const data = await upstream.json().catch(() => ({}));
    if (!upstream.ok) {
      console.error("OpenAI API error", upstream.status, data.error?.message);
      return sendJson(response, 502, { ok: false, error: "The AI service is temporarily unavailable. Please try again." });
    }
    const reply = data.choices?.[0]?.message?.content?.trim();
    if (!reply) return sendJson(response, 502, { ok: false, error: "The AI service returned an empty response." });
    return sendJson(response, 200, { ok: true, reply });
  } catch (error) {
    console.error("Chat request failed", error);
    return sendJson(response, 500, { ok: false, error: "Unable to reach the AI service. Please try again." });
  }
}
