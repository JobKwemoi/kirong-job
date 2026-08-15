import Groq from "groq-sdk";
import OpenAI from "openai";

const groq = process.env.GROQ_API_KEY? new Groq({ apiKey: process.env.GROQ_API_KEY }) : null;
const openai = process.env.OPENAI_API_KEY? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;

function detectIntent(message) {
  const text = String(message || "").toLowerCase();
  const imageRequests = ["generate image", "create image", "tengeneza picha", "nitengenezee picha", "generetie picha", "simba", "umbwa", "paka"];
  if (imageRequests.some(phrase => text.includes(phrase))) return "image";
  return "chat";
}

function createImagePrompt(userPrompt) {
  let request = String(userPrompt || "").trim();
  request = request.replace(/simba/gi, "lion").replace(/umbwa|mbwa/gi, "dog").replace(/paka/gi, "cat");
  return `Photorealistic image of ${request}, high detail, 8k`;
}

async function generatePollinationsImage(userPrompt) {
  const prompt = createImagePrompt(userPrompt);
  const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?model=flux-dev&width=1024&height=1024&nologo=true&seed=${Date.now()}`;
  
  const response = await fetch(imageUrl, { 
    headers: { 'User-Agent': 'KirongAI/1.0' },
    signal: AbortSignal.timeout(20000) // 20s timeout
  });
  
  if (!response.ok) throw new Error(`Pollinations HTTP ${response.status}`);
  
  const blob = await response.blob();
  if (blob.size < 1000) throw new Error("Pollinations returned empty image");
  
  // Convert to base64 for Vercel
  const arrayBuffer = await blob.arrayBuffer();
  const base64 = Buffer.from(arrayBuffer).toString('base64');
  return { image: `data:image/png;base64,${base64}`, provider: "Pollinations" };
}

async function generateOpenAIImage(userPrompt) {
  if (!openai) throw new Error("OPENAI_API_KEY missing");
  const result = await openai.images.generate({
    model: "gpt-image-1",
    prompt: createImagePrompt(userPrompt),
    size: "1024x1024", n: 1
  });
  const imageData = result?.data?.[0]?.b64_json;
  if (!imageData) throw new Error("OpenAI no data");
  return { image: `data:image/png;base64,${imageData}`, provider: "OpenAI" };
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method!== "POST") return res.status(405).json({ type: "error", text: "Method Not Allowed" });

  try {
    const { message, history = [], language = "English" } = req.body || {};
    const cleanMessage = message.trim();
    const intent = detectIntent(cleanMessage);

    if (intent === "image") {
      let lastError = "";
      
      // TRY 1: POLLINATIONS
      try {
        const result = await generatePollinationsImage(cleanMessage);
        return res.status(200).json({ type: "image", text: "🎨 Hii hapa simba wako. 🫂🔥", image: result.image, provider: result.provider });
      } catch (e) { lastError = `Pollinations: ${e.message}`; console.error(lastError); }

      // TRY 2: OPENAI
      try {
        const result = await generateOpenAIImage(cleanMessage);
        return res.status(200).json({ type: "image", text: "🎨 Hii hapa simba wako. 🫂🔥", image: result.image, provider: result.provider });
      } catch (e) { lastError += ` | OpenAI: ${e.message}`; console.error(lastError); }

      // FAILED BOTH
      return res.status(500).json({ 
        type: "error", 
        text: `🎨 Image zote zimeshindwa bro.\n\nError: ${lastError}\n\nSolution: Weka OPENAI_API_KEY kwa Vercel au jaribu baadaye.`,
        debug: lastError 
      });
    }

    // TEXT LOGIC
    const messages = [{ role: "system", content: "You are Kirong AI" },...history, { role: "user", content: cleanMessage }];
    const answer = groq? await groq.chat.completions.create({model:"llama-3.1-8b-instant",messages}).then(r=>r.choices[0].message.content) : await openai.chat.completions.create({model:"gpt-4o-mini",messages}).then(r=>r.choices[0].message.content);
    return res.status(200).json({ type: "text", text: answer });

  } catch (error) {
    return res.status(500).json({ type: "error", text: `⚠️ Error: ${error.message}` });
  }
}
