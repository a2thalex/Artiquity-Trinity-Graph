// api/gemini/generate-vision-board.js
import { GoogleGenAI, Type } from "@google/genai";

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

  if (!GEMINI_API_KEY) {
    return res.status(500).json({ error: 'Server configuration error: GEMINI_API_KEY is missing.' });
  }

  try {
    const { brandName, idea, selectedIdeas, identityElements } = req.body;

    // Support both old and new parameter formats
    const ideaText = idea || (selectedIdeas ? selectedIdeas.join(', ') : '');
    const brandNameText = brandName || 'Brand';

    if (!brandNameText || !ideaText) {
      return res.status(400).json({ error: 'Brand name and idea are required' });
    }

    console.log('Generating vision board for:', { brandName: brandNameText, idea: ideaText });

    // Create a detailed prompt for vision board image generation
    const imagePrompt = `Create a professional vision board image for "${brandNameText}" based on the creative idea: "${ideaText}".

    The vision board should be a modern, artistic collage that visually represents the brand's creative direction and includes:
    - Visual mood and aesthetic elements
    - Color palette representation
    - Typography and design elements
    - Brand personality visualization
    - Creative concept illustration

    Style: Professional, modern, artistic vision board layout with clean composition, high-quality design elements, suitable for brand presentation and marketing use.`;

    console.log('Using image prompt:', imagePrompt);

    // Generate image using Pollinations AI (reliable and free)
    const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(imagePrompt)}?width=1024&height=1024&nologo=true&seed=${Date.now()}`;

    console.log('Generated image URL:', imageUrl);

    // Return the image data URL
    res.json({
      imageDataUrl: imageUrl,
      prompt: imagePrompt,
      success: true,
      note: "Vision board generated successfully"
    });

  } catch (error) {
    console.error('Error generating vision board:', error);
    res.status(500).json({ error: 'Failed to generate vision board.' });
  }
}
