// api/gemini/creative-image-vertex.js
// Using Vertex AI for actual image generation
import { VertexAI } from "@google-cloud/vertexai";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  const GOOGLE_CLOUD_PROJECT = process.env.GOOGLE_CLOUD_PROJECT || "artiquity-ai";
  const GOOGLE_CLOUD_LOCATION = process.env.GOOGLE_CLOUD_LOCATION || "us-central1";

  try {
    const {
      artistName = "Artist",
      selectedStrategy = "creative",
      identityElements = ["modern", "artistic"],
      inputs = {},
    } = req.body || {};

    console.log("Vertex AI Image Generation Request:", { artistName, selectedStrategy, identityElements });

    // Initialize Vertex AI
    const vertexAI = new VertexAI({
      project: GOOGLE_CLOUD_PROJECT,
      location: GOOGLE_CLOUD_LOCATION,
    });

    // Format additional inputs
    const formattedInputs = Object.entries(inputs)
      .map(([key, value]) => {
        const trimmed = typeof value === "string" ? value.trim() : "";
        if (!trimmed) return null;
        const label = key
          .replace(/([A-Z])/g, " $1")
          .replace(/^./, (char) => char.toUpperCase());
        return `${label}: ${trimmed}`;
      })
      .filter(Boolean)
      .join(", ");

    // Create image generation prompt
    const imagePrompt = `Create a professional, modern, artistic image for artist "${artistName}" using ${selectedStrategy} strategy.
The image should prominently feature these identity elements: ${identityElements.join(", ")}.
${formattedInputs ? `Additional requirements: ${formattedInputs}. ` : ""}
Style: Professional, modern, artistic, high-quality digital art. The image should visually blend the artist's creative DNA with the chosen creative strategy.
Make it visually striking, suitable for marketing and brand identity use.`;

    console.log("Generating image with prompt:", imagePrompt);

    // Use Imagen 3 for image generation
    const model = vertexAI.preview.getGenerativeModel({
      model: 'imagen-3.0-generate-001',
    });

    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: imagePrompt }] }],
      generationConfig: {
        maxOutputTokens: 8192,
        temperature: 0.4,
      },
    });

    const response = await result.response;

    // Extract base64 image from response
    if (response.candidates && response.candidates[0]) {
      const candidate = response.candidates[0];
      if (candidate.content && candidate.content.parts) {
        for (const part of candidate.content.parts) {
          if (part.inlineData && part.inlineData.data) {
            const mimeType = part.inlineData.mimeType || "image/png";
            const base64Data = part.inlineData.data;
            const imageUrl = `data:${mimeType};base64,${base64Data}`;

            console.log("Successfully generated image with Vertex AI");
            return res.json({
              prompt: imagePrompt,
              imageUrl: imageUrl,
              note: "Image generated successfully using Vertex AI Imagen 3",
              success: true
            });
          }
        }
      }
    }

    // If no image in response, return error
    throw new Error("No image data in Vertex AI response");

  } catch (error) {
    console.error("Vertex AI error:", error);

    // Fallback to Gemini with image URL from external service
    try {
      const { artistName = "Artist" } = req.body || {};

      // Use an AI image generation service API
      const imageServiceUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(
        `professional artistic image for ${artistName}, modern creative design, high quality digital art`
      )}?width=1024&height=1024&nologo=true`;

      console.log("Using Pollinations AI for image generation");

      return res.json({
        prompt: `Creative image for ${artistName}`,
        imageUrl: imageServiceUrl,
        note: "Image generated using Pollinations AI service",
        success: true
      });

    } catch (fallbackError) {
      console.error("Fallback error:", fallbackError);

      const { artistName = "Artist" } = req.body || {};
      return res.status(500).json({
        error: "Failed to generate image",
        details: error.message,
        imageUrl: `https://via.placeholder.com/1024x1024/FF0000/ffffff?text=Error`,
        success: false
      });
    }
  }
}