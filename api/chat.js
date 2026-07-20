import Groq from "groq-sdk";

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ text: 'POST only mkuu' });
  
  if (!process.env.GROQ_API_KEY) {
    return res.status(500).json({ text: 'GROQ_API_KEY missing. Weka kwa Vercel Settings > Environment Variables' });
  }

  try {
    const { message, language = 'English' } = req.body;
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
    
    const response = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [
        { role: "system", content: `You are Kirong Job AI by Kirong Job Kwemoi. Speak 95% English 5% Sheng. Use: mkuu, poa, sawa, twende. Reply ONLY in ${language}. Be helpful, smart, and short.` },
        { role: "user", content: message }
      ],
      max_tokens: 800,
      temperature: 0.7
    });

    res.status(200).json({ text: response.choices[0].message.content });
  } catch (error) {
    console.error(error);
    res.status(500).json({ text: `Error: ${error.message}` });
  }
}
