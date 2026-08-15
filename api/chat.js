import Groq from "groq-sdk";
import OpenAI from "openai";

const groq = process.env.GROQ_API_KEY? new Groq({ apiKey: process.env.GROQ_API_KEY }) : null;
const openai = process.env.OPENAI_API_KEY? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;

function detectIntent(message) {
  const text = String(message || "").toLowerCase();
  if (text.includes("picha") || text.includes("simba") || text.includes("kuku") || text.includes("ndege") || text.includes("generate image")) return "image";
  return "chat";
}

// FIX: SHORTEN + TRANSLATE PROMPT
function createImagePrompt(userPrompt) {
  let request = String(userPrompt || "").replace(/nigeneretie|tengeneza|picha ya|generate image of/gi, "").trim();

  // Translate key words to English for better results
  request = request.replace(/ndege/gi, "airplane");
  request = request.replace(/simba/gi, "lion");
  request = request.replace(/kuku/gi, "chicken");
  request = request.replace(/umbwa/gi, "dog");
  request = request.replace(/mlima/gi, "mountain");
  request = request.replace(/jua linapozama/gi, "sunset");

  // Limit to 100 characters max for Pollinations
  if (request.length > 100) request = request.slice(0, 97) + "...";

  return `Photorealistic, 8k, detailed: ${request}`;
}

async function generatePollinationsImage(userPrompt) {
  const prompt = createImagePrompt(userPrompt);
  console.log("🎨 PROMPT SENT:", prompt); // Tujue inatuma nini
  const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?model=flux-dev&width=1024&height=1024&nologo=true&seed=${Date.now()}`;
  const response = await fetch(imageUrl, { signal: AbortSignal.timeout(25000) });
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
    const { message, history = [], language = "Swahili" } = req.body || {};
    const cleanMessage = message.trim();
    const intent = detectIntent(cleanMessage);

    if (intent === "image") {
      try {
        const result = await generatePollinationsImage(cleanMessage);
        return res.status(200).json({
          type: "image",
          text: `🎨 Nimekutengenezea: ${cleanMessage} 🫂🔥`,
          image: result.image,
          provider: result.provider
        });
      } catch (e) {
        return res.status(500).json({
          type: "error",
          text: `🎨 Imeshindwa bro: ${e.message}\n\nJaribu kusema kwa kifupi: "picha ya ndege juu ya mlima"`
        });
      }
    }

    const messages = [{ role: "system", content: `You are Kirong AI. Reply in ${language}` },...history, { role: "user", content: cleanMessage }];
    const answer = await groq.chat.completions.create({model:"llama-3.1-8b-instant",messages}).then(r=>r.choices[0].message.content);
    return res.status(200).json({ type: "text", text: answer });

  } catch (error) {
    return res.status(500).json({ type: "error", text: `⚠️ Error: ${error.message}` });
  }
}
