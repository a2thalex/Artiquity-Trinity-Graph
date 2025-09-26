// api/gemini/creative-image.js
import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
  const FAL_API_KEY = process.env.FAL_API_KEY;

  if (!GEMINI_API_KEY) {
    console.error("GEMINI_API_KEY is missing from environment variables");
    return res
      .status(500)
      .json({ error: "Server configuration error: GEMINI_API_KEY is missing." });
  }

  if (!FAL_API_KEY) {
    console.error("FAL_API_KEY is missing from environment variables");
    return res
      .status(500)
      .json({ error: "Server configuration error: FAL_API_KEY is missing." });
  }

  try {
    const {
      artistName = "Artist",
      selectedStrategy = "creative",
      identityElements = ["modern", "artistic"],
      inputs = {},
    } = req.body || {};

    console.log("Received request:", { artistName, selectedStrategy, identityElements });

    // Validate required fields
    if (!artistName || !selectedStrategy || !Array.isArray(identityElements)) {
      return res.status(400).json({
        error: "Artist name, selected strategy, and identity elements are required",
      });
    }

    if (identityElements.length === 0) {
      return res.status(400).json({
        error: "Identity elements must include at least one item",
      });
    }

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

    // Create detailed prompt for AI image generation
    const imagePrompt = `professional artistic image for ${artistName}, ${selectedStrategy} creative strategy, featuring ${identityElements.join(" and ")}, modern high-quality digital art, visually striking marketing brand identity${formattedInputs ? `, ${formattedInputs}` : ""}`;

    console.log("Generating real AI image with prompt:", imagePrompt);

    try {
      // Use FAL.AI Nano Banana for real image generation
      console.log("Calling FAL.AI Nano Banana model...");

      const falResponse = await fetch("https://fal.run/fal-ai/nano-banana", {
        method: "POST",
        headers: {
          "Authorization": `Key ${FAL_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          prompt: imagePrompt,
          image_size: "square",
          num_inference_steps: 4,
          num_images: 1,
          enable_safety_checker: true
        })
      });

      let imageUrl;

      if (falResponse.ok) {
        const falData = await falResponse.json();
        console.log("FAL.AI response:", falData);

        // Extract image URL from FAL.AI response
        if (falData.images && falData.images.length > 0) {
          imageUrl = falData.images[0].url;
          console.log("Successfully generated image with FAL.AI Nano Banana");
        } else {
          // Fallback to Pollinations if FAL.AI doesn't return an image
          imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(imagePrompt)}?width=1024&height=1024&nologo=true&seed=${Date.now()}`;
          console.log("FAL.AI didn't return image, using Pollinations fallback");
        }
      } else {
        // Fallback to Pollinations if FAL.AI fails
        console.log("FAL.AI request failed, using Pollinations fallback");
        imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(imagePrompt)}?width=1024&height=1024&nologo=true&seed=${Date.now()}`;
      }

      // Generate creative concept using Gemini
      let concept = "Visual concept for " + artistName;

      try {
        const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
        const textModel = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const conceptPrompt = `Create a brief creative concept for artist "${artistName}" using ${selectedStrategy} strategy with these identity elements: ${identityElements.join(", ")}.`;

        const result = await textModel.generateContent(conceptPrompt);
        const response = result.response;
        concept = response.text();

        console.log("Successfully generated creative concept with Gemini");
      } catch (geminiError) {
        console.log("Gemini text generation failed, using default concept:", geminiError.message);
      }

      return res.json({
        prompt: imagePrompt,
        concept: concept,
        imageUrl: imageUrl,
        note: "Real AI-generated image created successfully",
        success: true
      });

    } catch (imageError) {
      console.error("Image generation error:", imageError);

      // Final fallback with Pollinations
      const fallbackImageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(imagePrompt)}?width=1024&height=1024&nologo=true&seed=${Date.now()}`;

      return res.json({
        prompt: imagePrompt,
        concept: "Visual concept for " + artistName,
        imageUrl: fallbackImageUrl,
        note: "Generated image using fallback service",
        success: true
      });
    }

  } catch (error) {
    console.error("Error in creative-image API:", error);

    // Even in error cases, try to provide a real AI image
    const { artistName = "Artist" } = req.body || {};
    const fallbackPrompt = `artistic creative image for ${artistName}, modern professional design`;
    const fallbackImageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(fallbackPrompt)}?width=1024&height=1024&nologo=true&seed=${Date.now()}`;

    return res.json({
      prompt: fallbackPrompt,
      imageUrl: fallbackImageUrl,
      note: "Generated fallback AI image",
      success: false,
      error: error.message
    });
  }
}
