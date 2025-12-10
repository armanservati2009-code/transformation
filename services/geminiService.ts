import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Analyzes an image using Gemini 3 Pro Preview.
 */
export const analyzeImage = async (base64Image: string): Promise<string> => {
  try {
    // Gemini 3 Pro Preview is best for complex reasoning and analysis
    const model = 'gemini-3-pro-preview';
    
    // Remove data URL prefix if present for the API call payload
    const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, "");
    const mimeType = base64Image.match(/data:([^;]+);base64,/)?.[1] || "image/png";

    const response = await ai.models.generateContent({
      model: model,
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType,
              data: base64Data
            }
          },
          {
            text: "Analyze this image in detail. Describe the style, content, colors, and mood. Keep it concise but comprehensive."
          }
        ]
      }
    });

    return response.text || "No analysis available.";
  } catch (error) {
    console.error("Error analyzing image:", error);
    throw new Error("Failed to analyze image. Please try again.");
  }
};

/**
 * Edits/Transforms an image using Gemini 2.5 Flash Image.
 */
export const transformImage = async (base64Image: string, prompt: string): Promise<string> => {
  try {
    // Gemini 2.5 Flash Image is optimized for image generation and editing
    const model = 'gemini-2.5-flash-image';

    const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, "");
    const mimeType = base64Image.match(/data:([^;]+);base64,/)?.[1] || "image/png";

    const response = await ai.models.generateContent({
      model: model,
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType,
              data: base64Data
            }
          },
          {
            text: prompt
          }
        ]
      }
    });

    // Check for image in response parts
    if (response.candidates && response.candidates[0].content && response.candidates[0].content.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData && part.inlineData.data) {
          return `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
        }
      }
    }

    throw new Error("No image generated.");
  } catch (error) {
    console.error("Error transforming image:", error);
    throw new Error("Failed to transform image. The model might be busy or the request invalid.");
  }
};