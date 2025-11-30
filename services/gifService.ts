import { encode } from 'https://esm.sh/modern-gif';

export const createGif = async (imageUrls: string[]): Promise<Blob> => {
  try {
    // 1. Load all images
    const images = await Promise.all(
      imageUrls.map(url => {
        return new Promise<HTMLImageElement | null>((resolve) => {
          const img = document.createElement('img'); // Use document.createElement for better consistency
          // Removing crossOrigin for base64 data URIs prevents "tainted canvas" and type errors in some contexts
          img.onload = () => resolve(img);
          img.onerror = (e) => {
            console.error("Failed to load image", url, e);
            resolve(null); // Resolve with null to handle gracefully
          };
          img.src = url;
        });
      })
    );

    // Filter out failed loads or incomplete images
    const validImages = images.filter((img): img is HTMLImageElement => 
        img !== null && img instanceof HTMLImageElement && img.complete && img.naturalWidth > 0 && img.naturalHeight > 0
    );

    if (validImages.length === 0) throw new Error("No valid images loaded");

    // 2. Setup Canvas
    const width = 512;
    const height = 512;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    
    if (!ctx) throw new Error("Could not get canvas context");

    const frames = [];

    // 3. Process frames SEQUENTIALLY
    for (const img of validImages) {
        // Strict check to ensure the object is a valid canvas source
        if (!(img instanceof HTMLImageElement)) {
            console.warn("Skipping invalid image frame:", img);
            continue;
        }

        // Clear and fill white
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, width, height);
        
        // Calculate dimensions to contain image
        // Use naturalWidth/Height to be safe
        const scale = Math.min(width / img.naturalWidth, height / img.naturalHeight);
        const w = img.naturalWidth * scale;
        const h = img.naturalHeight * scale;
        const x = (width - w) / 2;
        const y = (height - h) / 2;
        
        // Draw with safety check
        try {
            ctx.drawImage(img, x, y, w, h);
        } catch (e) {
            console.error("Error drawing frame:", e);
            continue; // Skip this frame if it fails
        }
        
        // Extract
        const imageData = ctx.getImageData(0, 0, width, height);
        frames.push({
            imageData,
            delay: 500
        });
    }

    if (frames.length === 0) throw new Error("No valid frames created for GIF");

    // 4. Encode
    const blob = await encode({
        width,
        height,
        frames,
    });

    return blob;

  } catch (error) {
    console.error("GIF Creation Error:", error);
    throw error;
  }
};