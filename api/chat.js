// =====================================================
// 🎨 POLLINATIONS IMAGE ENGINE - FIXED VERSION
// =====================================================

async function generatePollinationsImage(userPrompt) {

  const prompt = createImagePrompt(userPrompt);

  const encodedPrompt = encodeURIComponent(prompt);

  // 1. TUMEONDOA API KEY - Pollinations ni free
  // 2. TUMEWEKA model=flux-dev ndio ikuwe mbichi
  const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?model=flux-dev&width=1024&height=1024&nologo=true`;

  console.log("🎨 POLLINATIONS IMAGE URL CREATED:", imageUrl);

  // 2. TUMEONDOA HEADERS ZA AUTH
  const response = await fetch(imageUrl);

  if (!response.ok) {
    const errorText = await response.text();
    console.error("❌ POLLINATIONS ERROR:", response.status, errorText);
    throw new Error(`Pollinations image generation failed: ${response.status}`);
  }

  // Convert generated image to base64
  const arrayBuffer = await response.arrayBuffer();
  const base64 = Buffer.from(arrayBuffer).toString("base64");
  const contentType = response.headers.get("content-type") || "image/png";

  return {
    image: `data:${contentType};base64,${base64}`,
    provider: "Pollinations / FLUX-DEV",
    route: "POLLINATIONS FLUX-DEV",
  };
}
