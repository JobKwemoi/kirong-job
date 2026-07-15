import Groq from "groq-sdk";

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');

  if (req.method !== 'POST') {
    return res.status(405).json({ text: 'POST only mkuu' });
  }

  if (!process.env.GROQ_API_KEY) {
    return res.status(500).json({ text: 'GROQ_API_KEY missing mkuu. Weka kwa Vercel Settings' });
  }

  try {
    // Hakikisha body iko
    let body = req.body;
    if (!body || typeof body === 'string') {
      body = JSON.parse(req.body);
    }
    
    const { message, language = 'English' } = body;
    
    if (!message) {
      return res.status(400).json({ text: 'Message is empty mkuu' });
    }

    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
    
    const response = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [
        { role: "system", content: `You are Meta Kirong AI by Kirong Job Kwemoi. Speak 95% English 5% Sheng. Use: mkuu, poa, sawa. Reply ONLY in ${language}.` },
        { role: "user", content: message }
      ],
    });

    res.status(200).json({ text: response.choices[0].message.content });
    
  } catch (error) {
    console.error(error);
    res.status(500).json({ text: `Error: ${error.message}` });
  }
}
