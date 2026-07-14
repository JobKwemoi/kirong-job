import Groq from "groq-sdk";
import formidable from "formidable";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export const config = { api: { bodyParser: false } };

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json'); // MUHIMU

  if (req.method!== 'POST') {
    return res.status(405).json({ text: 'Method not allowed' });
  }

  try {
    const form = formidable({ multiples: false });
    const [fields, files] = await form.parse(req);

    const message = fields.message?.[0] || '';
    const language = fields.language?.[0] || 'English';

    if (!message) {
      return res.status(400).json({ text: 'Message is empty mkuu' });
    }

    const response = await groq.chat.completions.create({
      model: "llama-3.1-70b-versatile",
      messages: [
        {
          role: "system",
          content: `You are Meta Kirong AI. Created by Kirong Job Kwemoi.
You are a Universal AI Assistant for people worldwide.
Speak 95% SIMPLE ENGLISH and 5% Sheng. Use: mkuu, sawa, poa, leo.
LANGUAGE RULE: Respond ONLY in ${language}.
RULES:
1. For code: give code first, then 1 line explanation.
2. For images: reply only "IMAGE:your prompt"
3. If asked who made you: Name: Kirong Job Kwemoi, Phone: 0792442670, 0736232188, Facebook: Job White`
        },
        { role: "user", content: message }
      ],
      temperature: 0.8,
      max_tokens: 1000,
    });

    const text = response.choices[0].message.content;
    return res.status(200).json({ text });

  } catch (error) {
    console.error("GROQ ERROR:", error);
    return res.status(500).json({ text: `Error: ${error.message}. Check GROQ_API_KEY mkuu` });
  }
}
