// =====================================================
// ⚡ KIRONG AI — FINAL CHAT ENGINE
// v6.1
//
// 🧠 Groq              → Chat / Text
// 🎨 Hugging Face      → Image Generation
// 🇬🇧 English           → Supported
// 🇰🇪 Kiswahili         → Supported
// =====================================================

import Groq from "groq-sdk";
import { InferenceClient } from "@huggingface/inference";


// =====================================================
// 🔐 ENVIRONMENT VARIABLES
// =====================================================

const GROQ_API_KEY =
  process.env.GROQ_API_KEY;

const HUGGINGFACE_API_KEY =
  process.env.HUGGINGFACE_API_KEY;


// =====================================================
// 🤖 CLIENTS
// =====================================================

const groq = GROQ_API_KEY
  ? new Groq({
      apiKey: GROQ_API_KEY
    })
  : null;


const hf = HUGGINGFACE_API_KEY
  ? new InferenceClient(
      HUGGINGFACE_API_KEY
    )
  : null;


// =====================================================
// 🌍 LANGUAGE
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
// 🎨 IMAGE INTENT
// =====================================================

function detectIntent(message) {

  const text =
    String(message || "")
      .toLowerCase()
      .trim();


  // ---------------------------------------------------
  // 🇬🇧 ENGLISH
  // ---------------------------------------------------

  const englishPatterns = [

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
  // 🇰🇪 KISWAHILI
  // ---------------------------------------------------

  const swahiliPatterns = [

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


  const englishImage =
    englishPatterns.some(
      pattern => text.includes(pattern)
    );


  const swahiliImage =
    swahiliPatterns.some(
      pattern => text.includes(pattern)
    );


  if (
    englishImage ||
    swahiliImage
  ) {

    return "image";

  }


  return "chat";
}


// =====================================================
// 🎨 IMAGE PROMPT
// =====================================================

function createImagePrompt(userPrompt) {

  let prompt =
    String(userPrompt || "")
      .trim();


  // Remove common commands

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

  if (!HUGGINGFACE_API_KEY) {

    throw new Error(
      "HUGGINGFACE_API_KEY is missing from Vercel Environment Variables."
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
    "🎨 Kirong AI → Hugging Face image request"
  );


  // ---------------------------------------------------
  // FLUX
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
  // IMAGE → BASE64
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
// 🧹 HISTORY
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


      return (
        typeof item.content === "string"
      );

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

Jibu kwa Kiswahili sanifu, cha kawaida na kinachoeleweka.

MAELEKEZO:

1. Jibu kwa Kiswahili isipokuwa mtumiaji akiomba lugha nyingine.

2. Kuwa rafiki, mwenye heshima, mwenye akili na mwenye msaada.

3. Usiseme kwamba wewe ni "text-only AI".

4. Kirong AI ina uwezo wa kusaidia kutengeneza picha kupitia image generation engine.

5. Image requests zinashughulikiwa na image engine.

6. Usidai picha imetengenezwa ikiwa image engine imefeli.

7. Kwa coding, toa code safi na inayoweza kutumika.

8. Kwa maswali ya kawaida, jibu moja kwa moja.

9. Usifichue API keys, tokens, environment variables au secrets.

10. Usidai umefanya action ambayo hujafanya.

11. Tumia Kiswahili cha asili.

12. Mtumiaji akichanganya Kiswahili na English, unaweza kuelewa mchanganyiko huo.
`;

  }


  return `
You are Kirong AI 🌍💜,
an intelligent AI assistant created by Kirong Job Kwemoi.

Reply in natural, clear English.

RULES:

1. Reply in English unless another language is requested.

2. Be friendly, respectful, intelligent and helpful.

3. Never say that you are a "text-only AI".

4. Kirong AI supports image generation through a separate image engine.

5. Image requests are handled by the image engine.

6. Never claim an image was generated if the image engine failed.

7. For coding questions, provide clean practical code.

8. Answer normal questions directly.

9. Never reveal API keys, tokens, environment variables or secrets.

10. Never claim an action was completed when it was not.

11. Keep answers useful and natural.

12. You understand both English and Kiswahili.
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
  // METHOD
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
    // 📦 BODY
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
    // EMPTY MESSAGE
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
    // 🧠 INTENT
    // =================================================

    const intent =
      detectIntent(message);


    console.log(
      `⚡ Kirong AI → ${intent} → ${language}`
    );


    // =================================================
    // 🎨 IMAGE
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
    // 🧠 CHAT
    // =================================================

    if (!GROQ_API_KEY) {

      return res.status(500).json({

        type:
          "error",

        text:

          language === "Swahili"

            ? "⚠️ GROQ_API_KEY haijawekwa kwenye Vercel."

            : "⚠️ GROQ_API_KEY is missing from Vercel."

      });

    }


    if (!groq) {

      throw new Error(
        "Groq client could not be initialized."
      );

    }


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
    // ⚡ GROQ
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


    const answer =
      completion
        ?.choices?.[0]
        ?.message?.content
        ?.trim();


    if (!answer) {

      throw new Error(
        "Groq returned an empty response."
      );

    }


    // =================================================
    // ✅ RESPONSE
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


    const errorMessage =
      String(
        error?.message ||
        "Unknown server error."
      );


    return res.status(500).json({

      type:
        "error",

      text:
        `⚠️ Kirong AI server error: ${errorMessage}`

    });

  }

}

