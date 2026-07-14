import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export default async function handler(req, res) {
  if (req.method!== 'POST') return res.status(405).json({ text: 'POST only' });

  try {
    const { message, language } = req.body; // Sasa tunasoma JSON

    if (!message) return res.status(400).json({ text: 'Message empty' });

    const response = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant", // Hii ni faster + free
      messages: [
        { role: "system", content: `You are Meta Kirong AI by Kirong Job Kwemoi. Speak 95% English 5% Sheng. Use: mkuu, poa. Reply ONLY in ${language}. For images reply: IMAGE:prompt` },
        { role: "user", content: message }
      ],
    });

    res.status(200).json({ text: response.choices[0].message.content });

  } catch (error) {
    console.log(error);
    res.status(500).json({ text: `Server Error: ${error.message}` });
  }
}
