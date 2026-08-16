// =========================================================
// ⚡ KIRONG AI V5 — FINAL AI ROUTER
// Groq + OpenAI + Hugging Face FLUX
// Text + Vision + Image Generation
// =========================================================

import Groq from "groq-sdk";
import OpenAI from "openai";
import { HfInference } from "@huggingface/inference";


// =========================================================
// 🔐 API CLIENTS
// =========================================================

const groq = process.env.GROQ_API_KEY
    ? new Groq({
        apiKey: process.env.GROQ_API_KEY
      })
    : null;


const openai = process.env.OPENAI_API_KEY
    ? new OpenAI({
        apiKey: process.env.OPENAI_API_KEY
      })
    : null;


// IMPORTANT:
// Vercel Environment Variable:
// HF_TOKEN
//
// NOT HUGGINGFACE_API_KEY
//

const hf = process.env.HF_TOKEN
    ? new HfInference(process.env.HF_TOKEN)
    : null;


// =========================================================
// 🧠 SAFE STRING
// =========================================================

function safeString(value) {

    if (typeof value !== "string") {
        return "";
    }

    return value.trim();
}


// =========================================================
// 🎨 IMAGE INTENT DETECTION
// =========================================================

function detectImageIntent(message) {

    const text =
        safeString(message).toLowerCase();


    // Swahili image-generation phrases
    const swahiliPatterns = [

        "tengeneza picha",
        "nitengenezee picha",
        "nitengezee picha",
        "nigeneretie picha",
        "generate picha",
        "unda picha",
        "nichoree picha",
        "chora picha",
        "nataka picha",
        "nipe picha ya",
        "tengeneza image",
        "generate image"

    ];


    // English image-generation phrases
    const englishPatterns = [

        "generate an image",
        "generate image",
        "create an image",
        "create image",
        "make an image",
        "make image",
        "generate a picture",
        "create a picture",
        "make a picture",
        "draw an image",
        "draw a picture",
        "show me an image"

    ];


    return [
        ...swahiliPatterns,
        ...englishPatterns
    ].some(pattern =>
        text.includes(pattern)
    );
}


// =========================================================
// 🎨 IMAGE PROMPT CLEANER
// =========================================================

function createImagePrompt(userPrompt) {

    let request =
        safeString(userPrompt);


    // Remove common generation commands
    request = request
        .replace(
            /nigeneretie|nitengenezee|nitengezee|tengeneza|unda|chora|nichoree|nataka|generate|create|make|draw|picha|image|picture|ya|of/gi,
            " "
        )
        .replace(/\s+/g, " ")
        .trim();


    if (!request) {

        request =
            "a beautiful cinematic scene";

    }


    return `
Photorealistic high-quality image of ${request}.

Professional composition,
cinematic lighting,
realistic details,
natural colors,
sharp focus,
high detail,
beautiful atmosphere,
professional photography,
8k quality.
`.trim();
}


// =========================================================
// 🎨 HUGGING FACE IMAGE GENERATION
// =========================================================

async function generateImage(prompt) {

    if (!hf) {

        throw new Error(
            "HF_TOKEN is missing from Vercel Environment Variables."
        );

    }


    console.log(
        "🎨 Kirong AI → Hugging Face FLUX"
    );


    const blob =
        await hf.textToImage({

            model:
                "black-forest-labs/FLUX.1-schnell",

            inputs:
                createImagePrompt(prompt),

            parameters: {

                num_inference_steps: 4,

                guidance_scale: 0

            }

        });


    if (!blob) {

        throw new Error(
            "Hugging Face returned an empty image."
        );

    }


    const arrayBuffer =
        await blob.arrayBuffer();


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


// =========================================================
// 👁️ OPENAI VISION
// =========================================================

async function analyzeImage(
    imageData,
    message,
    language
) {

    if (!openai) {

        throw new Error(
            "OPENAI_API_KEY is not configured."
        );

    }


    const userMessage =
        safeString(message) ||
        "Analyze this image and explain what you see.";


    const response =
        await openai.chat.completions.create({

            model:
                "gpt-4o-mini",

            messages: [

                {
                    role: "system",

                    content:
                        `You are Kirong AI Vision.

Analyze uploaded images carefully.

Reply in ${language}.

Be helpful, accurate and concise.
If the image contains code or an error,
explain the problem and give a practical fix.`
                },

                {
                    role: "user",

                    content: [

                        {
                            type: "text",

                            text:
                                userMessage
                        },

                        {

                            type: "image_url",

                            image_url: {

                                url:
                                    imageData

                            }

                        }

                    ]

                }

            ],

            temperature: 0.4,

            max_tokens: 1200

        });


    return (
        response
            ?.choices?.[0]
            ?.message?.content
            ?.trim()
        || "I could not analyze that image."
    );
}


// =========================================================
// ⚡ GROQ TEXT ENGINE
// =========================================================

async function generateGroqResponse(
    message,
    history,
    language
) {

    if (!groq) {

        throw new Error(
            "GROQ_API_KEY is not configured."
        );

    }


    const safeHistory =
        Array.isArray(history)
            ? history
                .filter(item =>
                    item &&
                    (
                        item.role === "user" ||
                        item.role === "assistant"
                    ) &&
                    typeof item.content === "string"
                )
                .slice(-20)
            : [];


    const messages = [

        {
            role: "system",

            content: `
You are Kirong AI, an intelligent Kenyan AI assistant.

Reply in ${language}.

You can help with:
- programming
- web development
- business
- education
- writing
- technology
- general questions
- creative tasks

Be friendly, intelligent and practical.

IMPORTANT:
If the user asks you to generate an image,
do NOT say that you are text-based.
The backend image engine handles image generation.
`
        },

        ...safeHistory,

        {
            role: "user",

            content: message
        }

    ];


    const response =
        await groq.chat.completions.create({

            model:
                "llama-3.1-8b-instant",

            messages,

            temperature: 0.7,

            max_tokens: 1500

        });


    const answer =
        response
            ?.choices?.[0]
            ?.message?.content
            ?.trim();


    if (!answer) {

        throw new Error(
            "Groq returned an empty response."
        );

    }


    return answer;
}


// =========================================================
// 🧠 OPENAI TEXT FALLBACK
// =========================================================

async function generateOpenAIResponse(
    message,
    history,
    language
) {

    if (!openai) {

        throw new Error(
            "OPENAI_API_KEY is not configured."
        );

    }


    const safeHistory =
        Array.isArray(history)
            ? history
                .filter(item =>
                    item &&
                    (
                        item.role === "user" ||
                        item.role === "assistant"
                    ) &&
                    typeof item.content === "string"
                )
                .slice(-20)
            : [];


    const response =
        await openai.chat.completions.create({

            model:
                "gpt-4o-mini",

            messages: [

                {
                    role: "system",

                    content:
                        `You are Kirong AI.

Reply in ${language}.

Be intelligent, friendly and practical.`
                },

                ...safeHistory,

                {
                    role: "user",

                    content: message
                }

            ],

            temperature: 0.7,

            max_tokens: 1500

        });


    const answer =
        response
            ?.choices?.[0]
            ?.message?.content
            ?.trim();


    if (!answer) {

        throw new Error(
            "OpenAI returned an empty response."
        );

    }


    return answer;
}


// =========================================================
// 🚀 MAIN VERCEL HANDLER
// =========================================================

export default async function handler(
    req,
    res
) {

    // -----------------------------------------------------
    // CORS
    // -----------------------------------------------------

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


    // -----------------------------------------------------
    // OPTIONS
    // -----------------------------------------------------

    if (req.method === "OPTIONS") {

        return res.status(200).end();

    }


    // -----------------------------------------------------
    // METHOD
    // -----------------------------------------------------

    if (req.method !== "POST") {

        return res.status(405).json({

            type: "error",

            text:
                "Method Not Allowed"

        });

    }


    try {

        // =================================================
        // 📦 REQUEST DATA
        // =================================================

        const body =
            req.body || {};


        const message =
            safeString(body.message);


        const language =
            safeString(body.language)
            || "English";


        const history =
            Array.isArray(body.history)
                ? body.history
                : [];


        const imageData =
            safeString(body.imageData);


        // =================================================
        // 🛡️ MESSAGE VALIDATION
        // =================================================

        if (!message && !imageData) {

            return res.status(400).json({

                type: "error",

                text:
                    "Please send a message or image."

            });

        }


        // =================================================
        // 👁️ IMAGE / VISION REQUEST
        // =================================================

        if (imageData) {

            console.log(
                "👁️ Kirong AI → Vision"
            );


            try {

                const answer =
                    await analyzeImage(
                        imageData,
                        message,
                        language
                    );


                return res.status(200).json({

                    type: "text",

                    text: answer,

                    provider:
                        "OpenAI Vision"

                });

            }

            catch (visionError) {

                console.error(
                    "VISION ERROR:",
                    visionError
                );


                return res.status(500).json({

                    type: "error",

                    text:
                        "👁️ Kirong AI could not analyze the image right now."

                });

            }

        }


        // =================================================
        // 🎨 IMAGE GENERATION
        // =================================================

        if (detectImageIntent(message)) {

            console.log(
                "🎨 Image request detected:",
                message
            );


            try {

                const result =
                    await generateImage(
                        message
                    );


                return res.status(200).json({

                    type:
                        "image",

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
                    "IMAGE GENERATION ERROR:",
                    imageError
                );


                return res.status(500).json({

                    type:
                        "error",

                    text:
                        `🎨 Kirong AI imejaribu kutengeneza picha lakini image engine imekataa request.

Error:
${imageError.message}`

                });

            }

        }


        // =================================================
        // 💬 TEXT CHAT
        // =================================================

        console.log(
            "💬 Kirong AI → Text"
        );


        // -------------------------------------------------
        // TRY GROQ FIRST
        // -------------------------------------------------

        if (groq) {

            try {

                const answer =
                    await generateGroqResponse(
                        message,
                        history,
                        language
                    );


                return res.status(200).json({

                    type:
                        "text",

                    text:
                        answer,

                    provider:
                        "Groq"

                });

            }

            catch (groqError) {

                console.error(
                    "GROQ ERROR:",
                    groqError
                );

            }

        }


        // -------------------------------------------------
        // TRY OPENAI SECOND
        // -------------------------------------------------

        if (openai) {

            try {

                const answer =
                    await generateOpenAIResponse(
                        message,
                        history,
                        language
                    );


                return res.status(200).json({

                    type:
                        "text",

                    text:
                        answer,

                    provider:
                        "OpenAI"

                });

            }

            catch (openAIError) {

                console.error(
                    "OPENAI ERROR:",
                    openAIError
                );

            }

        }


        // -------------------------------------------------
        // NO ENGINE AVAILABLE
        // -------------------------------------------------

        return res.status(503).json({

            type:
                "error",

            text:
                "⚠️ Kirong AI haina AI engine inayopatikana kwa sasa. Check GROQ_API_KEY na OPENAI_API_KEY kwa Vercel."

        });


    }

    catch (error) {

        // =================================================
        // 💥 FINAL ERROR PROTECTION
        // =================================================

        console.error(
            "🔥 KIRONG AI FATAL ERROR:",
            error
        );


        return res.status(500).json({

            type:
                "error",

            text:
                "⚠️ Kirong AI imepata technical error. Tafadhali jaribu tena."

        });

    }

}
