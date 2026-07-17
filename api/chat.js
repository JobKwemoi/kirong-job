import express from 'express';
import fetch from 'node-fetch';
import cors from 'cors';
const app = express();
app.use(cors()); app.use(express.json()); app.use(express.static('.'));
const GROQ_API_KEY = "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



"; // WEKA KEY YAKO

app.post('/api/chat', async (req, res) => {
  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST", headers: { "Authorization": `Bearer ${GROQ_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify(req.body)
    });
    const data = await response.json(); res.json(data);
  } catch (error) { res.status(500).json({error: error.message}); }
});
app.listen(3001, () => console.log("🔥 Kirong AI Backend running on http://localhost:3001"));
