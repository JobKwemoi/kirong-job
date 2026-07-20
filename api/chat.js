import Groq from "groq-sdk";

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ text: 'POST only' });
  
  if (!process.env.GROQ_API_KEY) {
    return res.status(500).json({ text: 'GROQ_API_KEY missing mkuu. Weka kwa Vercel Settings' });
  }

  try {
    const { message, language = 'English' } = req.body;
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
    
    const response = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant", // FAST + FREE
      messages: [
        { role: "system", content: `You are Meta Kirong AI by Kirong Job Kwemoi. Speak 95% English 5% Sheng. Use: mkuu, poa, sawa. Reply ONLY in ${language}.` },
        { role: "user", content: message }
      ],
    });

    res.status(200).json({ text: response.choices[0].message.content });
  } catch (error) {
    res.status(500).json({ text: `Error: ${error.message}` });
  }
}
