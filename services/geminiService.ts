
import { GoogleGenAI, VideoGenerationReferenceType } from "@google/genai";
import { AvatarStyleId } from "../types";

// WARNING: In a production app, never expose API keys on the client side.
// This requires a proxy server. However, for this demo per instructions, we use process.env.API_KEY.
// Note: We create the client inside functions or update it to ensure we capture the latest key if updated via window.aistudio.
const getAIClient = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

const getStylePrompt = (style: AvatarStyleId): string => {
  switch (style) {
    case '3d':
      return 'a cute, vibrant 3D Pixar-like cartoon character. Render with soft warm lighting, rounded shapes, and high-fidelity textures.';
    case 'anime':
      return 'a high-quality modern anime character. Studio Ghibli inspired, vibrant colors, expressive eyes, clean lines.';
    case 'clay':
      return 'a cute claymation character. Stop-motion plasticine texture, soft rounded edges, handmade feel.';
    case 'flat':
      return 'a trendy flat vector illustration. Minimalist, bold solid colors, geometric shapes, no gradients, clean design.';
    case 'sketch':
      return 'an artistic colored pencil sketch. Hand-drawn texture, loose lines, warm artistic vibe.';
    case 'pixel':
      return 'a cute 8-bit pixel art character. Retro game style, vibrant limited color palette, blocky shapes.';
    case 'watercolor':
      return 'a soft watercolor painting. Artistic, pastel colors, paper texture, gentle brush strokes, dreamy vibe.';
    default:
      return 'a cute, vibrant 3D cartoon character.';
  }
};

export const generateAvatar = async (
  base64Image: string, 
  mimeType: string,
  style: AvatarStyleId = '3d',
  removeBackground: boolean = false
): Promise<string> => {
  try {
    const ai = getAIClient();
    const styleDescription = getStylePrompt(style);
    const bgInstruction = removeBackground 
      ? "IMPORTANT: The character must be isolated on a pure white background. Do not include any background scenery or objects." 
      : "Keep the background composition but stylize it to match the cartoon aesthetic.";

    const systemInstruction = `
      You are a professional digital artist specializing in creating sunny, vibrant, high-quality cartoon avatars. 
      Your output must be a single generated image based on the input image. 
      - Transform the person into ${styleDescription}
      - Expression: Cheerful, sunny, and positive.
      - ${bgInstruction}
      - Maintain recognizable key facial features but heavily stylized.
    `;

    // We use gemini-2.5-flash-image for efficient editing/generation
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image', 
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType,
              data: base64Image
            }
          },
          {
            text: `Generate a cartoon avatar. Style: ${style}. ${bgInstruction} Make it look sunny and happy.`
          }
        ]
      },
      config: {
        systemInstruction: systemInstruction,
      }
    });

    const candidates = response.candidates;
    if (!candidates || candidates.length === 0) throw new Error("No candidates returned from AI.");

    const parts = candidates[0].content.parts;
    let resultImageBase64 = null;

    for (const part of parts) {
        if (part.inlineData && part.inlineData.data) {
            resultImageBase64 = part.inlineData.data;
            break; 
        }
    }

    if (!resultImageBase64) throw new Error("AI did not return an image.");

    return `data:image/png;base64,${resultImageBase64}`;

  } catch (error) {
    console.error("Gemini API Error:", error);
    throw new Error("Failed to generate avatar. Please try again.");
  }
};

export const editAvatar = async (
    base64Image: string,
    mimeType: string,
    prompt: string
): Promise<string> => {
    try {
        const ai = getAIClient();
        // Use gemini-2.5-flash-image for editing. 
        // Note: gemini-3-pro-image-preview is often restricted/gated, leading to 403 errors.
        // gemini-2.5-flash-image is more reliable for general access.
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: {
                parts: [
                    {
                        inlineData: {
                            mimeType: mimeType,
                            data: base64Image
                        }
                    },
                    {
                        text: `Edit this image: ${prompt}. Maintain the cartoon style and composition.`
                    }
                ]
            }
        });

        const candidates = response.candidates;
        if (!candidates || candidates.length === 0) throw new Error("No candidates returned from AI.");

        const parts = candidates[0].content.parts;
        let resultImageBase64 = null;

        for (const part of parts) {
            if (part.inlineData && part.inlineData.data) {
                resultImageBase64 = part.inlineData.data;
                break;
            }
        }

        if (!resultImageBase64) throw new Error("AI did not return an image.");

        return `data:image/png;base64,${resultImageBase64}`;
    } catch (error) {
        console.error("Edit Avatar Error:", error);
        throw new Error("Failed to edit avatar. " + (error as Error).message);
    }
}

export const generateVideo = async (
    imageUrls: string[],
    prompt: string
): Promise<string> => {
    try {
        const ai = getAIClient();
        
        // Limit to 3 reference images as per Veo requirements for generating previews with references
        const selectedUrls = imageUrls.slice(0, 3);
        const referenceImagesPayload = [];

        for (const url of selectedUrls) {
            // Convert data URL to base64
            // Valid Data URI: data:image/png;base64,.....
            if (!url.startsWith('data:image')) {
                console.warn("Skipping non-image or invalid URL in video generation:", url.substring(0, 30));
                continue;
            }

            const base64 = url.split(',')[1];
            const mimeType = url.split(';')[0].split(':')[1] || 'image/png';
            
            referenceImagesPayload.push({
                image: {
                    imageBytes: base64,
                    mimeType: mimeType
                },
                referenceType: VideoGenerationReferenceType.ASSET
            });
        }

        console.log(`Starting Veo generation with prompt: "${prompt}" and ${referenceImagesPayload.length} reference images.`);

        // If we have reference images, we MUST use 'veo-3.1-generate-preview' with specific resolution/aspectRatio.
        // If not, we could use fast-generate, but here we stick to the one capable of references to be safe.
        let operation = await ai.models.generateVideos({
            model: 'veo-3.1-generate-preview',
            prompt: prompt || "Animate these characters in a fun, sunny way.",
            config: {
                numberOfVideos: 1,
                // Only attach reference images if we have them. 
                // Passing an empty array might cause issues in some API versions.
                ...(referenceImagesPayload.length > 0 ? { referenceImages: referenceImagesPayload } : {}),
                resolution: '720p',
                aspectRatio: '16:9' // Veo strict requirement for reference image mode
            }
        });

        console.log("Video operation started. Operation name:", operation.name);

        // Polling loop
        while (!operation.done) {
            await new Promise(resolve => setTimeout(resolve, 5000)); // Poll every 5 seconds
            operation = await ai.operations.getVideosOperation({ operation: operation });
            console.log("Polling Veo status...", operation.metadata?.state || 'Processing');
        }

        if (operation.error) {
            console.error("Veo Operation Error:", operation.error);
            throw new Error(`Video generation failed: ${operation.error.message}`);
        }

        // Check for response in different potential locations to be robust
        // The standard SDK location is operation.response.generatedVideos
        const generatedVideos = operation.response?.generatedVideos || (operation as any).result?.generatedVideos;

        const downloadLink = generatedVideos?.[0]?.video?.uri;
        
        if (!downloadLink) {
            console.error("Full Operation Object on failure:", JSON.stringify(operation, null, 2));
            throw new Error("No video URI returned. The video might have been filtered for safety or failed silently.");
        }

        // Fetch the actual video bytes using the API key
        const videoResponse = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
        if (!videoResponse.ok) throw new Error("Failed to download generated video.");
        
        const videoBlob = await videoResponse.blob();
        return URL.createObjectURL(videoBlob);

    } catch (error) {
        console.error("Generate Video Error:", error);
        throw new Error("Failed to generate video. " + (error as Error).message);
    }
}
