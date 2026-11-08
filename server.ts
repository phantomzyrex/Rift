import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  // JSON body parser with generous limit
  app.use(express.json({ limit: '50mb' }));

  // Music generation endpoint using Lyria models
  app.post('/api/generate-music', async (req, res) => {
    try {
      const { prompt, model = 'lyria-3-clip-preview' } = req.body;

      if (!prompt || typeof prompt !== 'string') {
        return res.status(400).json({ error: 'Prompt is required' });
      }

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(500).json({
          error: 'GEMINI_API_KEY is not configured on the server. Please verify AI Studio secrets.'
        });
      }

      const ai = new GoogleGenAI({ apiKey });

      // Supported Lyria models
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

      console.log(`[Lyria] Successfully generated audio (${Math.round(audioBase64.length / 1024)} KB)`);

      return res.json({
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
  });

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // In development, mount Vite middleware
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // In production, serve pre-built assets
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Rift Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
