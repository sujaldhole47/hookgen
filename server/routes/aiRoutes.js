import express from "express";
import { GoogleGenAI } from "@google/genai";
import protect from "../middleware/authMiddleware.js";

const withTimeout = (promise, ms = 20000) =>
  Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`Gemini timed out after ${ms / 1000}s`)), ms)
    ),
  ]);

const router = express.Router();

router.post('/generate', protect, async (req, res)=>{
    try {
    const { topic, includeVisuals = false, language = 'Hinglish', tone = 'Energetic & Fast-Paced' } = req.body;

    if (!topic) {
      return res.status(400).json({ message: 'Please provide a video topic' });
    }

        const ai = new GoogleGenAI({
            apiKey: process.env.GEMINI_API_KEY,
        });

        const prompt = `You are an expert Indian YouTube Shorts strategist.
      Create a high-retention YouTube Short plan for the topic: "${topic}".
      Language: ${language}
      Tone: ${tone}

      Return ONLY a valid JSON object with this exact structure:
      {
        "title": "A punchy, clickable Short title (max 60 characters)",
        "hooks": [
          "Hook option 1 (first 3 seconds, high curiosity)",
          "Hook option 2 (controversial or surprising angle)",
          "Hook option 3 (direct value/listicle opener)"
        ],
        "script": "A complete 45-second spoken script with clear pacing and a strong call-to-action at the end.",
        "brollIdeas": [
          "Visual shot 1 description",
          "Visual shot 2 description",
          "Visual shot 3 description",
          "Visual shot 4 description"
        ],
        "visualQueries": [
          { "caption": "1. Layered Bob Cut", "query": "indian woman layered haircut portrait" },
          { "caption": "2. Soft Waves", "query": "indian woman wavy hairstyle" },
          { "caption": "3. Shoulder-Length Lob", "query": "indian woman shoulder length hair" },
          { "caption": "4. Curtain Bangs", "query": "indian woman bangs hairstyle" },
          { "caption": "5. Classic Step Cut", "query": "indian woman long layered hair" }
        ]
      }`;
      const maxRetries = 3;
const models = ['gemini-3.8-flash', 'gemini-3.6-flash', 'gemini-3.5-flash'];

for (let attempt = 1; attempt <= maxRetries; attempt++) {
  try {
    const currentModel = models[attempt - 1] || 'gemini-3.8-flash';
    console.log(`Calling ${currentModel} (Attempt ${attempt}/${maxRetries})...`);

    const response = await withTimeout(
      ai.models.generateContent({
        model: currentModel,
        contents: prompt,
      }),
      20000
    );

    // ...keep your existing JSON parsing code here...
    break;
  } catch (err) {
    console.error(`Attempt ${attempt} failed:`, err.status || '', err.message, err.cause?.code || '');

    const isRetryable =
      err.status === 503 ||
      err.message?.includes('fetch failed') ||
      err.message?.includes('timed out') ||
      err.cause?.code === 'UND_ERR_SOCKET';

    if (isRetryable && attempt < maxRetries) {
      await new Promise((resolve) => setTimeout(resolve, attempt * 1500));
      continue;
    }
    throw err;
  }
}


    if (!response) {
      return res.status(503).json({
        message: 'AI servers are currently busy. Please wait a few seconds and try again.',
      });
    }

   


    
const generatedData = JSON.parse(response.text);

    // Generate 5 realistic images via Cloudflare Workers AI (FLUX.1-schnell)
    let visuals = [];
    if (
      includeVisuals &&
      process.env.CLOUDFLARE_ACCOUNT_ID &&
      process.env.CLOUDFLARE_API_TOKEN &&
      Array.isArray(generatedData.visualQueries)
    ) {
      const imagePromises = generatedData.visualQueries.slice(0, 5).map(async (item) => {
        try {
          const cfRes = await fetch(
            `https://api.cloudflare.com/client/v4/accounts/${process.env.CLOUDFLARE_ACCOUNT_ID}/ai/run/@cf/black-forest-labs/flux-1-schnell`,
            {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${process.env.CLOUDFLARE_API_TOKEN}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                prompt: `Realistic portrait photograph, ${item.query}, modern salon photography, sharp focus, natural lighting`,
                steps: 4,
              }),
            }
          );

          const cfData = await cfRes.json();
          const base64Image = cfData.result?.image;

          if (!base64Image) {
            console.error(`Cloudflare image failed for "${item.caption}":`, cfData.errors);
            return null;
          }

          return {
            caption: item.caption,
            imageUrl: `data:image/jpeg;base64,${base64Image}`,
          };
        } catch (err) {
          console.error(`Image gen failed for "${item.caption}":`, err.message);
          return null;
        }
      });

      const results = await Promise.all(imagePromises);
      visuals = results.filter(Boolean);
    }

    return res.json({ ...generatedData, visuals });
    
    } catch (error) {
        console.error("Gemini AI Error: ", error);
            res.status(500).json({ message: 'Failed to generate content', error: error.message });
    }
});

export default router;