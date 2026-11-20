import express from "express";
import { GoogleGenAI } from "@google/genai";
import protect from "../middleware/authMiddleware.js";

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
      const models = ['gemini-3.8-flash', 'gemini-2.5-flash'];
    let response;
    let lastError;
    const maxRetries = 3;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
          },
        });
        break; // Success
      } catch (err) {
        const isRetryable =
          err.status === 503 ||
          err.message?.includes('fetch failed') ||
          err.cause?.code === 'UND_ERR_SOCKET';

        if (isRetryable && attempt < maxRetries) {
          const delayMs = attempt * 1500;
          console.warn(`Temporary network/API error. Retrying in ${delayMs / 1000}s (Attempt ${attempt}/${maxRetries})...`);
          await new Promise((resolve) => setTimeout(resolve, delayMs));
          continue;
        }
        if (err.status === 503) {
          return res.status(503).json({
            message: 'Gemini servers are currently busy. Please wait a few seconds and try again.',
          });
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