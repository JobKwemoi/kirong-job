import Groq from "groq-sdk";
import OpenAI from "openai";

const groq = process.env.GROQ_API_KEY? new Groq({ apiKey: process.env.GROQ_API_KEY }) : null;
const openai = process.env.OPENAI_API_KEY? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;

function detectIntent(message) {
  const text = String(message || "").toLowerCase();
  if (text.includes("picha") || text.includes("simba") || text.includes("kuku") || text.includes("umbwa") || text.includes("generate image")) return "image";
  return "chat";
}

// TUMEONDOA KU-TRANSLATE HARDCODE. TUNAACHA AI IFANYE KAZI
function createImagePrompt(userPrompt) {
  let request = String(userPrompt || "").replace(/nigeneretie|tengeneza|picha ya/gi, "").trim();
  return `Photorealistic, high detail, 8k: ${request}`;
}

async function generatePollinationsImage(userPrompt) {
  const prompt = createImagePrompt(userPrompt);
  const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?model=flux-dev&width=1024&height=1024&nologo=true&seed=${Date.now()}`;
  const response = await fetch(imageUrl, { signal: AbortSignal.timeout(20000) });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const blob = await response.blob();
  const arrayBuffer = await blob.arrayBuffer();
  const base64 = Buffer.from(arrayBuffer).toString('base64');
  return { image: `data:image/png;base64,${base64}`, provider: "Pollinations" };
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method!== "POST") return res.status(405).json({ type: "error", text: "Method Not Allowed" });

  try {
    const { message, history = [], language = "English" } = req.body || {};
    const cleanMessage = message.trim();
    const intent = detectIntent(cleanMessage);

    if (intent === "image") {
      const result = await generatePollinationsImage(cleanMessage);
      return res.status(200).json({
        type: "image",
        text: `🎨 Nimekutengenezea: ${cleanMessage}. 🫂🔥`,
        image: result.image,
        provider: result.provider
      });
    }

    const messages = [{ role: "system", content: "You are Kirong AI" },...history, { role: "user", content: cleanMessage }];
    const answer = await groq.chat.completions.create({model:"llama-3.1-8b-instant",messages}).then(r=>r.choices[0].message.content);
    return res.status(200).json({ type: "text", text: answer });

  } catch (error) {
    return res.status(500).json({ type: "error", text: `⚠️ Error: ${error.message}` });
  }
}
