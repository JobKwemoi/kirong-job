import Groq from "groq-sdk";
import OpenAI from "openai";
import Replicate from "replicate"; // TUMERUDISHA HII

const groq = process.env.GROQ_API_KEY? new Groq({ apiKey: process.env.GROQ_API_KEY }) : null;
const openai = process.env.OPENAI_API_KEY? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;
const replicate = process.env.REPLICATE_API_TOKEN? new Replicate({ auth: process.env.REPLICATE_API_TOKEN }) : null; // FREE TIER INATOSHA

function detectIntent(message) {
  const text = String(message || "").toLowerCase();
  if (text.includes("picha") || text.includes("simba") || text.includes("umbwa") || text.includes("generate image")) return "image";
  return "chat";
}

function createImagePrompt(userPrompt) {
  let request = String(userPrompt || "").trim();
  request = request.replace(/simba/gi, "lion").replace(/umbwa/gi, "dog");
  return `Photorealistic image of ${request}, high detail, 8k`;
}

async function generatePollinationsImage(userPrompt) {
  const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(createImagePrompt(userPrompt))}?model=flux-dev&width=1024&height=1024&nologo=true`;
  const response = await fetch(imageUrl, { signal: AbortSignal.timeout(15000) });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const blob = await response.blob();
  const arrayBuffer = await blob.arrayBuffer();
  const base64 = Buffer.from(arrayBuffer).toString('base64');
  return { image: `data:image/png;base64,${base64}`, provider: "Pollinations" };
}

async function generateReplicateFreeImage(userPrompt) {
  if (!replicate) throw new Error("REPLICATE_API_TOKEN missing");
  const output = await replicate.run("black-forest-labs/flux-schnell", {
    input: { prompt: createImagePrompt(userPrompt), aspect_ratio: "1:1", output_format: "png" }
  });
  const imageUrl = Array.isArray(output)? output[0] : output;
  return { image: imageUrl, provider: "Replicate FLUX Free" };
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method!== "POST") return res.status(405).json({ type: "error", text: "Method Not Allowed" });

  try {
    const { message } = req.body || {};
    const cleanMessage = message.trim();
    const intent = detectIntent(cleanMessage);

    if (intent === "image") {
      let lastError = "";

      try { const result = await generatePollinationsImage(cleanMessage);
        return res.status(200).json({ type: "image", text: "🎨 Hii hapa simba wako. 🫂🔥", image: result.image, provider: result.provider });
      } catch (e) { lastError = `Pollinations: ${e.message}`; }

      try { const result = await generateReplicateFreeImage(cleanMessage);
        return res.status(200).json({ type: "image", text: "🎨 Hii hapa simba wako kutoka Replicate. 🫂🔥", image: result.image, provider: result.provider });
      } catch (e) { lastError += ` | Replicate: ${e.message}`; }

      return res.status(500).json({
        type: "error",
        text: `🎨 Zote zimeshindwa bro.\n\nError: ${lastError}\n\nFIX: Weka REPLICATE_API_TOKEN kwa Vercel. Ni FREE.`
      });
    }

    const messages = [{ role: "system", content: "You are Kirong AI" }, { role: "user", content: cleanMessage }];
    const answer = await groq.chat.completions.create({model:"llama-3.1-8b-instant",messages}).then(r=>r.choices[0].message.content);
    return res.status(200).json({ type: "text", text: answer });

  } catch (error) {
    return res.status(500).json({ type: "error", text: `⚠️ Error: ${error.message}` });
  }
}
