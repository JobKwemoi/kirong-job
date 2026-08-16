// =====================================================
// ⚡ KIRONG AI — FINAL CHAT ENGINE
// Version 6.0
//
// 🧠 Groq          → Conversation / Intelligence
// 🎨 Hugging Face  → Image Generation
// 🇬🇧 English      → Fully supported
// 🇰🇪 Kiswahili    → Fully supported
// =====================================================

import Groq from "groq-sdk";
import { InferenceClient } from "@huggingface/inference";


// =====================================================
// 🔐 ENVIRONMENT VARIABLES
// =====================================================

const GROQ_API_KEY =
  process.env.GROQ_API_KEY;

const HF_TOKEN =
  process.env.HF_TOKEN;


// =====================================================
// 🤖 CLIENTS
// =====================================================

const groq = GROQ_API_KEY
  ? new Groq({
      apiKey: GROQ_API_KEY
    })
  : null;


const hf = HF_TOKEN
  ? new InferenceClient(HF_TOKEN)
  : null;


// =====================================================
// 🧠 LANGUAGE NORMALIZATION
// =====================================================

function normalizeLanguage(language) {

  const value =
    String(language || "")
      .trim()
      .toLowerCase();

  if (
    value === "swahili" ||
    value === "kiswahili" ||
    value === "sw"
  ) {
    return "Swahili";
  }

  return "English";
}


// =====================================================
// 🎨 IMAGE INTENT DETECTION
// =====================================================

function detectIntent(message) {

  const text =
    String(message || "")
      .toLowerCase()
      .trim();


  // ---------------------------------------------------
  // 🇬🇧 ENGLISH IMAGE COMMANDS
  // ---------------------------------------------------

  const englishImagePatterns = [

    "generate image",
    "generate an image",
    "generate a picture",
    "generate picture",

    "create image",
    "create an image",
    "create a picture",
    "create picture",

    "make image",
    "make an image",
    "make a picture",
    "make picture",

    "draw an image",
    "draw a picture",

    "create artwork",
    "generate artwork",

    "show me an image",
    "show me a picture"

  ];


  // ---------------------------------------------------
  // 🇰🇪 KISWAHILI IMAGE COMMANDS
  // ---------------------------------------------------

  const swahiliImagePatterns = [

    "picha",
    "tengeneza picha",
    "tengeneza image",

    "nitengenezee picha",
    "nitengenezee image",

    "nigeneretie picha",
    "nigeneretie image",

    "nitengezee picha",
    "nitengezee image",

    "chora picha",
    "nichoree picha",

    "tengeneza mchoro",
    "nitengenezee mchoro"

  ];


  const englishRequest =
    englishImagePatterns.some(
      pattern => text.includes(pattern)
    );


  const swahiliRequest =
    swahiliImagePatterns.some(
      pattern => text.includes(pattern)
    );


  if (
    englishRequest ||
    swahiliRequest
  ) {

    return "image";

  }


  return "chat";
}


// =====================================================
// 🎨 IMAGE PROMPT CREATION
// =====================================================

function createImagePrompt(userPrompt) {

  let prompt =
    String(userPrompt || "")
      .trim();


  // ---------------------------------------------------
  // Remove common commands
  // ---------------------------------------------------

  prompt =
    prompt.replace(
      /nigeneretie|nitengenezee|nitengezee|tengeneza|tengenezee|chora|nichoree|generate|create|make|draw|show me/gi,
      ""
    );


  prompt =
    prompt.replace(
      /picha ya|picha|image of|image|a picture of|picture of|a picture|picture|an image of|an image/gi,
      ""
    );


  prompt =
    prompt.trim();


  if (!prompt) {

    prompt =
      "a beautiful realistic scene";

  }


  return `
Photorealistic high-quality image of ${prompt}.

Ultra detailed.
Natural realistic lighting.
Professional photography.
Sharp focus.
Cinematic composition.
Realistic textures.
High visual quality.
`;
}


// =====================================================
// 🎨 HUGGING FACE IMAGE GENERATION
// =====================================================

async function generateImage(userPrompt) {

  if (!HF_TOKEN) {

    throw new Error(
      "HF_TOKEN is missing from Vercel Environment Variables."
    );

  }


  if (!hf) {

    throw new Error(
      "Hugging Face client could not be initialized."
    );

  }


  const prompt =
    createImagePrompt(userPrompt);


  console.log(
    "🎨 KIRONG AI IMAGE REQUEST"
  );

  console.log(
    "Prompt:",
    prompt
  );


  // ---------------------------------------------------
  // FLUX IMAGE GENERATION
  // ---------------------------------------------------

  const imageBlob =
    await hf.textToImage({

      model:
        "black-forest-labs/FLUX.1-schnell",

      inputs:
        prompt,

      provider:
        "auto"

    });


  if (!imageBlob) {

    throw new Error(
      "Hugging Face returned an empty image."
    );

  }


  // ---------------------------------------------------
  // Convert image → Base64
  // ---------------------------------------------------

  const arrayBuffer =
    await imageBlob.arrayBuffer();


  const base64 =
    Buffer
      .from(arrayBuffer)
      .toString("base64");


  return {
    image:
      `data:image/png;base64,${base64}`,

    provider:
      "Hugging Face FLUX"
  };
}


// =====================================================
// 🧹 SAFE HISTORY
// =====================================================

function cleanHistory(history) {

  if (!Array.isArray(history)) {

    return [];

  }


  return history
    .filter(item => {

      if (!item) {
        return false;
      }


      if (
        item.role !== "user" &&
        item.role !== "assistant" &&
        item.role !== "system"
      ) {

        return false;

      }


      return typeof item.content === "string";

    })
    .slice(-20);
}


// =====================================================
// 🧠 SYSTEM PROMPT
// =====================================================

function createSystemPrompt(language) {

  if (language === "Swahili") {

    return `
Wewe ni Kirong AI 🌍💜,
msaidizi wa akili bandia aliyeundwa na Kirong Job Kwemoi.

Jibu mtumiaji kwa Kiswahili sanifu, cha kawaida na kinachoeleweka.

MAELEKEZO MUHIMU:

1. Jibu kwa Kiswahili kila wakati isipokuwa mtumiaji akiomba lugha nyingine.

2. Kuwa rafiki, mwenye heshima, mwenye akili na mwenye msaada.

3. Usiseme kwamba wewe ni "text-only AI".

4. Kirong AI ina uwezo wa kusaidia kutengeneza picha kupitia image generation engine.

5. Ikiwa backend imepokea image request, image engine ndiyo inahusika na kutengeneza picha.

6. Usidanganye kwamba picha imetengenezwa ikiwa image engine haijafanikiwa.

7. Kwa maswali ya coding, toa code safi, sahihi na inayoweza kutumika.

8. Kwa maswali ya kawaida, jibu moja kwa moja bila maelezo yasiyo ya lazima.

9. Usifichue API keys, environment variables, secrets au taarifa za server.

10. Usidai kuwa umefanya action ambayo hujafanya.

11. Tumia Kiswahili cha asili na si tafsiri ya neno kwa neno kutoka Kiingereza.

12. Mtumiaji akichanganya Kiswahili na English, unaweza kutumia mchanganyiko huo kwa njia ya kawaida lakini msingi uwe Kiswahili.
`;

  }


  return `
You are Kirong AI 🌍💜,
an intelligent AI assistant created by Kirong Job Kwemoi.

Reply in clear, natural English.

IMPORTANT RULES:

1. Always answer in English unless the user explicitly requests another language.

2. Be friendly, intelligent, respectful and helpful.

3. Never say that you are a "text-only AI".

4. Kirong AI supports image generation through a separate image generation engine.

5. When an image request reaches the backend, the image engine handles generation.

6. Never claim that an image was generated if the image engine failed.

7. For coding questions, provide clean, practical and working code.

8. For normal questions, answer directly and naturally.

9. Never reveal API keys, environment variables, secrets or private server information.

10. Never claim to have performed an action that you did not perform.

11. Keep responses useful and avoid unnecessary repetition.

12. If the user mixes English and Kiswahili, you may naturally understand both, but respond primarily in English unless Kiswahili is requested.
`;

}


// =====================================================
// 🚀 API HANDLER
// =====================================================

export default async function handler(req, res) {

  // ===================================================
  // 🌍 CORS
  // ===================================================

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


  // ===================================================
  // OPTIONS
  // ===================================================

  if (req.method === "OPTIONS") {

    return res
      .status(200)
      .end();

  }


  // ===================================================
  // METHOD CHECK
  // ===================================================

  if (req.method !== "POST") {

    return res.status(405).json({

      type:
        "error",

      text:
        "Method Not Allowed"

    });

  }


  try {

    // =================================================
    // 📦 REQUEST BODY
    // =================================================

    const body =
      req.body || {};


    const message =
      String(
        body.message || ""
      ).trim();


    const language =
      normalizeLanguage(
        body.language
      );


    const history =
      cleanHistory(
        body.history
      );


    // =================================================
    // ❌ EMPTY MESSAGE
    // =================================================

    if (!message) {

      return res.status(400).json({

        type:
          "error",

        text:
          language === "Swahili"
            ? "Tafadhali andika ujumbe."
            : "Please enter a message."

      });

    }


    // =================================================
    // 🧠 DETECT USER INTENT
    // =================================================

    const intent =
      detectIntent(message);


    console.log(
      `⚡ Kirong AI → ${intent} → ${language}`
    );


    // =================================================
    // 🎨 IMAGE REQUEST
    // =================================================

    if (intent === "image") {

      try {

        const result =
          await generateImage(
            message
          );


        return res.status(200).json({

          type:
            "image",

          text:
            language === "Swahili"

              ? "🎨 Hii hapa picha yako kutoka Kirong AI. 🫂🔥"

              : "🎨 Here is your image from Kirong AI. 🫂🔥",

          image:
            result.image,

          provider:
            result.provider

        });

      }


      catch (imageError) {

        console.error(
          "🔥 IMAGE ENGINE ERROR:",
          imageError
        );


        return res.status(200).json({

          type:
            "error",

          text:

            language === "Swahili"

              ? `🎨 Kirong AI imejaribu kutengeneza picha lakini image engine haikufanikiwa.\n\nError: ${imageError.message}`

              : `🎨 Kirong AI tried to generate the image, but the image engine could not complete the request.\n\nError: ${imageError.message}`

        });

      }

    }


    // =================================================
    // 💬 CHAT REQUEST
    // =================================================

    if (!GROQ_API_KEY) {

      console.error(
        "❌ GROQ_API_KEY missing."
      );


      return res.status(500).json({

        type:
          "error",

        text:

          language === "Swahili"

            ? "⚠️ GROQ_API_KEY haijawekwa kwenye Vercel Environment Variables."

            : "⚠️ GROQ_API_KEY is missing from the Vercel Environment Variables."

      });

    }


    if (!groq) {

      throw new Error(
        "Groq client could not be initialized."
      );

    }


    // =================================================
    // 🧠 SYSTEM MESSAGE
    // =================================================

    const messages = [

      {
        role:
          "system",

        content:
          createSystemPrompt(
            language
          )

      },

      ...history,

      {
        role:
          "user",

        content:
          message

      }

    ];


    // =================================================
    // ⚡ GROQ REQUEST
    // =================================================

    const completion =
      await groq.chat.completions.create({

        model:
          "llama-3.1-8b-instant",

        messages:

          messages,

        temperature:
          0.7,

        max_tokens:
          2048

      });


    // =================================================
    // 📥 RESPONSE
    // =================================================

    const answer =
      completion
        ?.choices?.[0]
        ?.message
        ?.content
        ?.trim();


    // =================================================
    // ❌ EMPTY RESPONSE
    // =================================================

    if (!answer) {

      throw new Error(
        "Groq returned an empty response."
      );

    }


    // =================================================
    // ✅ SUCCESS
    // =================================================

    return res.status(200).json({

      type:
        "text",

      text:
        answer

    });

  }


  // ===================================================
  // 💥 GLOBAL ERROR
  // ===================================================

  catch (error) {

    console.error(
      "🔥 KIRONG AI SERVER ERROR:",
      error
    );


    const message =
      String(
        error?.message ||
        "Unknown server error."
      );


    return res.status(500).json({

      type:
        "error",

      text:
        `⚠️ Kirong AI server error: ${message}`

    });

  }

}

