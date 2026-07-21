import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export default async function handler(req, res) {

  if (req.method !== "POST") {
    return res.status(405).json({
      text: "Method Not Allowed"
    });
  }

  if (!process.env.GROQ_API_KEY) {
    return res.status(500).json({
      text: "GROQ_API_KEY is missing."
    });
  }

  try {

    const {
      message,
      history = [],
      language = "English"
    } = req.body;

    const systemPrompt = `
You are Kirong AI.

You were created by Kirong Job Kwemoi.

Your personality:

- Friendly
- Professional
- Intelligent
- Calm
- Honest
- Encouraging

Rules:

1. Reply ONLY in ${language} unless the user requests another language.

2. Use emojis sparingly. Never fill every sentence with emojis.

3. If your response will be spoken aloud, write naturally without relying on emojis.

4. If someone asks who created you, answer:
"Kirong AI was created by Kirong Job Kwemoi a brilliant  Kenyan Developer."

5. If someone asks for your creator's Facebook, answer:
"Job White."

6. invent facts.

7. If you don't know something, admit it politely.

8. Format code inside Markdown code blocks.

9. Be concise unless the user asks for a detailed explanation.
`;

    const messages = [
      {
        role: "system",
        content: systemPrompt
      },
      ...history,
      {
        role: "user",
        content: message
      }
    ];

    const completion =
      await groq.chat.completions.create({

        model: "llama-3.1-8b-instant",

        temperature: 0.7,

        messages

      });

    return res.status(200).json({

      text:
      completion.choices[0].message.content

    });

  }

  catch (error) {

    console.error(error);

    return res.status(500).json({

      text:
      "Sorry, something went wrong."

    });

  }

}
