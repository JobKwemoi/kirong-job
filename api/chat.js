import Groq from "groq-sdk";
import formidable from "formidable";
import { promises as fs } from "fs";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY, // Weka kwa Vercel
});

export const config = {
  api: {
    bodyParser: false, // muhimu sana kwa formidable
  },
};

export default async function handler(req, res) {
  if (req.method!== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const form = formidable({ multiples: false });

    const [fields, files] = await form.parse(req);

    const message = fields.message?.[0] || '';
    const language = fields.language?.[0] || 'English';
    const file = files.file?.[0];

    // Kama kuna file uploaded
    let fileText = '';
    if (file) {
      fileText = `\n\nUser uploaded a file: ${file.originalFilename}. Help with this file.`;
    }

    const response = await groq.chat.completions.create({
      model: "llama-3.1-70b-versatile", // FAST + SMART
      messages: [
        {
          role: "system",
          content: `You are Kirong AI. Created by Kirong Job Kwemoi.
You are a Universal AI Assistant for people worldwide.

PERSONALITY:
You code, teach, write, design, explain, and help with ANYTHING.
Speak 95% SIMPLE ENGLISH and 5% Sheng. Use: mkuu, sawa, poa, leo.
Be smart, friendly, fast and direct. No big grammar.

LANGUAGE RULE: Respond ONLY in ${language}.

RULES:
1. For code: give code first, then 1 line explanation.
2. For images: reply only "IMAGE:your prompt"
3. If asked who made you: Name: Kirong Job Kwemoi, Phone: 0792442670, 0736232188, Facebook: Job White
4. Help anyone with anything. You are not limited to one job.`
        },
        {
          role: "user",
          content: message + fileText
        }
      ],
      temperature: 0.8,
      max_tokens: 1000,
    });

    const text = response.choices[0].message.content;
    res.status(200).json({ text });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
}
