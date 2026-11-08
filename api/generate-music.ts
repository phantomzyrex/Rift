import { GoogleGenAI } from '@google/genai';

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
    const { prompt, model = 'lyria-3-clip-preview' } = body;

    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({
        error: 'GEMINI_API_KEY is not configured on the server. Please verify environment variables in Vercel settings.'
      });
    }

    const ai = new GoogleGenAI({ apiKey });
    const selectedModel =
      model === 'lyria-3-pro-preview' ? 'lyria-3-pro-preview' : 'lyria-3-clip-preview';

    console.log(`[Lyria] Generating music with ${selectedModel}. Prompt: "${prompt.slice(0, 60)}..."`);

    const response = await ai.models.generateContentStream({
      model: selectedModel,
      contents: prompt
    });

    let audioBase64 = '';
    let lyrics = '';
    let mimeType = 'audio/wav';

    for await (const chunk of response) {
      const parts = chunk.candidates?.[0]?.content?.parts;
      if (!parts) continue;

      for (const part of parts) {
        if (part.inlineData?.data) {
          if (!audioBase64 && part.inlineData.mimeType) {
            mimeType = part.inlineData.mimeType;
          }
          audioBase64 += part.inlineData.data;
        }
        if (part.text && !lyrics) {
          lyrics = part.text;
        }
      }
    }

    if (!audioBase64) {
      return res.status(502).json({
        error: 'The music model completed without returning audio data. Please try another prompt.'
      });
    }

    return res.status(200).json({
      audioBase64,
      mimeType,
      lyrics,
      model: selectedModel,
      prompt
    });
  } catch (err: any) {
    console.error('[Lyria] Error generating music:', err);
    const message = err?.message || 'Music generation failed';
    return res.status(500).json({ error: message });
  }
}
