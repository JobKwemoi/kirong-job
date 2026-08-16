```javascript
// =====================================================
// ⚡ KIRONG AI BACKEND DIAGNOSTIC
// STEP 1 — TEST VERCEL FUNCTION ONLY
// =====================================================

export default async function handler(req, res) {

  console.log("=================================");
  console.log("⚡ KIRONG AI FUNCTION STARTED");
  console.log("METHOD:", req.method);
  console.log("=================================");


  // ---------------------------------------------------
  // CORS
  // ---------------------------------------------------

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


  // ---------------------------------------------------
  // OPTIONS
  // ---------------------------------------------------

  if (req.method === "OPTIONS") {

    return res.status(200).end();

  }


  // ---------------------------------------------------
  // METHOD CHECK
  // ---------------------------------------------------

  if (req.method !== "POST") {

    return res.status(405).json({

      type: "error",

      text: "Method Not Allowed"

    });

  }


  try {

    console.log("📦 BODY RECEIVED");

    const body = req.body || {};

    console.log(
      "BODY TYPE:",
      typeof body
    );


    const message =
      typeof body.message === "string"
        ? body.message.trim()
        : "";


    console.log(
      "MESSAGE:",
      message
    );


    if (!message) {

      return res.status(400).json({

        type: "error",

        text: "Please enter a message."

      });

    }


    // -------------------------------------------------
    // ENVIRONMENT CHECK
    // -------------------------------------------------

    console.log(
      "GROQ KEY:",
      process.env.GROQ_API_KEY
        ? "FOUND"
        : "MISSING"
    );


    console.log(
      "HF TOKEN:",
      process.env.HF_TOKEN
        ? "FOUND"
        : "MISSING"
    );


    // -------------------------------------------------
    // SUCCESS
    // -------------------------------------------------

    return res.status(200).json({

      type: "text",

      text:
        `🔥 Backend iko LIVE bro! 🫂

Ujumbe umefika:
"${message}"

Vercel Function iko working vizuri.

GROQ:
${
  process.env.GROQ_API_KEY
    ? "✅ FOUND"
    : "❌ MISSING"
}

HUGGING FACE:
${
  process.env.HF_TOKEN
    ? "✅ FOUND"
    : "❌ MISSING"
}`,

      provider: "Kirong AI Backend",

      route: "DIAGNOSTIC"

    });

  }

  catch (error) {

    console.error(
      "🔥 DIAGNOSTIC ERROR:",
      error
    );


    return res.status(500).json({

      type: "error",

      text:
        "Backend diagnostic failed.",

      error:
        error?.message || "Unknown error"

    });

  }

}
```
