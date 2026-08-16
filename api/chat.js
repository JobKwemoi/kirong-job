```javascript
// ============================================================
// ⚡ KIRONG AI — API ENGINE V5.1
// Groq = Chat
// Hugging Face = Image Generation
// ============================================================

import Groq from "groq-sdk";
import { InferenceClient } from "@huggingface/inference";


// ============================================================
// 🔐 CLIENTS
// ============================================================

const groq = process.env.GROQ_API_KEY
  ? new Groq({
      apiKey: process.env.GROQ_API_KEY
    })
  : null;


const hf = process.env.HF_TOKEN
  ? new InferenceClient(process.env.HF_TOKEN)
  : null;


// ============================================================
// 🧠 IMAGE INTENT DETECTION
// ============================================================

function detectIntent(message) {

  const text = String(message || "")
    .toLowerCase()
    .trim();

  const imagePatterns = [

    "generate image",
    "generate a picture",
    "create image",
    "create a picture",
    "make image",
    "make a picture",

    "generate picha",
    "tengeneza picha",
    "nitengenezee picha",
    "nigeneretie picha",
    "chora picha",
    "picha ya",
    "picha"

  ];

  return imagePatterns.some(
    pattern => text.includes(pattern)
  )
    ? "image"
    : "chat";
}


// ============================================================
// 🎨 CLEAN IMAGE PROMPT
// ============================================================

function createImagePrompt(userPrompt) {

  let prompt = String(userPrompt || "")
    .trim();

  prompt = prompt.replace(
    /^(please\s+)?(generate|create|make|draw)\s+(an?\s+)?(image|picture)\s+(of\s+)?/i,
    ""
  );

  prompt = prompt.replace(
    /^(nigeneretie|nitengenezee|tengeneza|chora)\s+(picha\s+ya\s+)?/i,
    ""
  );

  prompt = prompt.replace(
    /^picha\s+ya\s+/i,
    ""
  );

  prompt = prompt.trim();

  if (!prompt) {
    prompt = "a beautiful realistic landscape";
  }

  return [
    "Photorealistic image",
    prompt,
    "high detail",
    "cinematic lighting",
    "natural colors",
    "professional photography",
    "sharp focus"
  ].join(", ");
}


// ============================================================
// 🎨 HUGGING FACE IMAGE GENERATOR
// ============================================================

async function generateImage(userPrompt) {

  if (!hf) {
    throw new Error(
      "HF_TOKEN is missing from Vercel Environment Variables."
    );
  }

  const prompt =
    createImagePrompt(userPrompt);

  console.log(
    "🎨 Kirong AI image request:",
    prompt
  );


  // ----------------------------------------------------------
  // Hugging Face Inference Provider
  // ----------------------------------------------------------

  const image = await hf.textToImage({

    model:
      "black-forest-labs/FLUX.1-schnell",

    provider:
      "auto",

    inputs:
      prompt,

    parameters: {

      num_inference_steps: 4,

      guidance_scale: 0

    }

  });


  // ----------------------------------------------------------
  // Convert returned Blob to data URL
  // ----------------------------------------------------------

  const arrayBuffer =
    await image.arrayBuffer();

  const base64 =
    Buffer
      .from(arrayBuffer)
      .toString("base64");


  return {
    image:
      `data:image/png;base64,${base64}`,

    provider:
      "Hugging Face"
  };
}


// ============================================================
// 💬 CHAT ENGINE
// ============================================================

async function generateChat(
  message,
  history,
  language
) {

  if (!groq) {

    throw new Error(
      "GROQ_API_KEY is missing from Vercel Environment Variables."
    );

  }


  const safeHistory =
    Array.isArray(history)
      ? history.slice(-20)
      : [];


  const messages = [

    {
      role: "system",

      content: `
You are Kirong AI, a helpful intelligent assistant created by Kirong Job Kwemoi.

Language:
${language}

Rules:

1. Be helpful and natural.
2. If the user speaks Kiswahili, respond naturally in Kiswahili.
3. If the user speaks English, respond naturally in English.
4. Never claim to generate images if the image engine was not actually called.
5. Keep responses clear and useful.
      `.trim()
    },

    ...safeHistory,

    {
      role: "user",
      content: message
    }

  ];


  const completion =
    await groq.chat.completions.create({

      model:
        "llama-3.1-8b-instant",

      messages,

      temperature:
        0.7,

      max_tokens:
        2048

    });


  return (
    completion
      ?.choices?.[0]
      ?.message
      ?.content
      ?.trim()
    ||
    "Samahani, sijapata jibu kwa sasa."
  );
}


// ============================================================
// 🚀 VERCEL HANDLER
// ============================================================

export default async function handler(
  req,
  res
) {

  // ----------------------------------------------------------
  // CORS
  // ----------------------------------------------------------

  res.setHeader(
    "Access-Control-Allow-Origin",
    "*"
  );

  res.setHeader(
    "Access-Control-Allow-Methods",
    "POST, OPTIONS"
  );

  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type"
  );


  // ----------------------------------------------------------
  // OPTIONS
  // ----------------------------------------------------------

  if (req.method === "OPTIONS") {

    return res
      .status(200)
      .end();

  }


  // ----------------------------------------------------------
  // METHOD
  // ----------------------------------------------------------

  if (req.method !== "POST") {

    return res
      .status(405)
      .json({

        type: "error",

        text:
          "Method Not Allowed"

      });

  }


  try {

    const body =
      req.body || {};


    const message =
      typeof body.message === "string"
        ? body.message.trim()
        : "";


    const history =
      Array.isArray(body.history)
        ? body.history
        : [];


    const language =
      typeof body.language === "string"
        ? body.language
        : "English";


    // --------------------------------------------------------
    // VALIDATION
    // --------------------------------------------------------

    if (!message) {

      return res
        .status(400)
        .json({

          type: "error",

          text:
            "Please enter a message."

        });

    }


    // --------------------------------------------------------
    // DETECT INTENT
    // --------------------------------------------------------

    const intent =
      detectIntent(message);


    console.log(
      `⚡ Kirong AI → ${intent.toUpperCase()}`
    );


    // ========================================================
    // 🎨 IMAGE ENGINE
    // ========================================================

    if (intent === "image") {

      try {

        const result =
          await generateImage(message);


        return res
          .status(200)
          .json({

            type: "image",

            text:
              `🎨 Hii hapa picha yako, bro 🔥🫂`,

            image:
              result.image,

            provider:
              result.provider

          });

      }

      catch (imageError) {

        console.error(
          "🎨 IMAGE ENGINE ERROR:",
          imageError
        );


        return res
          .status(200)
          .json({

            type: "image_error",

            text:
              "🎨 Kirong AI imejaribu kutengeneza picha lakini image engine haikupatikana kwa sasa.",

            error:
              imageError?.message ||
              "Unknown image error"

          });

      }

    }


    // ========================================================
    // 💬 NORMAL CHAT
    // ========================================================

    const answer =
      await generateChat(
        message,
        history,
        language
      );


    return res
      .status(200)
      .json({

        type: "text",

        text:
          answer

      });


  }

  catch (error) {

    console.error(
      "🔥 KIRONG AI API ERROR:",
      error
    );


    return res
      .status(500)
      .json({

        type: "error",

        text:
          "⚠️ Kirong AI imepata tatizo kwenye server.",

        error:
          error?.message ||
          "Unknown server error"

      });

  }

}
```
