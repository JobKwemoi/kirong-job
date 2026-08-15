import Groq from "groq-sdk";
import OpenAI from "openai";
import Replicate from "replicate";

// =====================================================
// ⚡ KIRONG AI v5.1 VERCEL SAFE
// NO BUFFER - NO CRASH
// =====================================================

const groq = process.env.GROQ_API_KEY? new Groq({ apiKey: process.env.GROQ_API_KEY }) : null;
const openai = process.env.OPENAI_API_KEY? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;
const replicate = process.env.REPLICATE_API_TOKEN? new Replicate({ auth: process.env.REPLICATE_API_TOKEN }) : null;

//... weka functions zote za juu hapa same as v5.0...

// BADILISHA HII SEHEMU TU YA IMAGE
async function generateFluxImage(userPrompt) {
  if (!replicate) throw new Error("REPLICATE_API_TOKEN is missing in Vercel ENV");

  console.log("🎨 ROUTER → FLUX PRIMARY");
  const output = await replicate.run("black-forest-labs/flux-schnell", {
    input: {
      prompt: createImagePrompt(userPrompt),
      aspect_ratio: "1:1",
      num_outputs: 1,
      output_format: "png",
      output_quality: 100
    }
  });

  const firstOutput = Array.isArray(output)? output[0] : output;
  let imageUrl = typeof firstOutput.url === "function"? await firstOutput.url() : firstOutput.url || firstOutput;
  if (!imageUrl) throw new Error("FLUX returned no image.");

  return { image: imageUrl, provider: "Replicate / FLUX", route: "FLUX PRIMARY" };
}

// MASTER ROUTER - FALLBACK SAFETY
async function generateImage(userPrompt) {
  if (replicate) {
    try {
      return await generateFluxImage(userPrompt);
    } catch (e) {
      console.error("FLUX ERROR:", e.message);
    }
  }
  if (openai) {
    try {
      return await generateOpenAIImage(userPrompt);
    } catch (e) {
      console.error("OPENAI ERROR:", e.message);
    }
  }
  throw new Error("No image API key found. Add REPLICATE_API_TOKEN or OPENAI_API_KEY to Vercel");
}

// MAIN HANDLER - ADD TRY CATCH MZURI
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  if (req.method!== "POST") return res.status(405).json({ type: "error", text: "Method Not Allowed" });

  try {
    const { message, history = [], language = "English" } = req.body || {};
    if (!message) return res.status(400).json({ type: "error", text: "Please enter a message." });

    // CHECK IF KEYS EXIST
    if (!groq &&!openai) {
      return res.status(500).json({
        type: "error",
        text: "⚠️ API Keys missing. Tafadhali weka GROQ_API_KEY na OPENAI_API_KEY kwa Vercel Environment Variables"
      });
    }

    const cleanMessage = message.trim();
    const safeHistory = Array.isArray(history)? history.slice(-20) : [];
    const intent = detectIntent(cleanMessage);

    //... rest ya code yako same...

  } catch (error) {
    console.error("🔥 GLOBAL ERROR:", error);
    return res.status(500).json({
      type: "error",
      text: `⚠️ Server Error: ${error.message}. Check Vercel Logs`
    });
  }
}
