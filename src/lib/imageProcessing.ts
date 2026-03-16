// Image Processing API Helpers
// Upscale: Replicate (real-esrgan)
// Remove Background: PhotoRoom API

export interface ImageAPISettings {
  imageApiKey: string;    // Replicate API key for upscaling
  removeBgApiKey: string; // PhotoRoom or remove.bg API key
}

/**
 * Upscale an image using Replicate's Real-ESRGAN model.
 * Input: base64 data URL
 * Returns: base64 data URL of upscaled image
 */
export async function upscaleImage(
  imageDataUrl: string,
  apiKey: string
): Promise<string> {
  if (!apiKey) throw new Error('No Replicate API key configured for image upscaling.');

  // Convert data URL to blob URL for Replicate input
  const base64Data = imageDataUrl.split(',')[1];
  const mimeType = imageDataUrl.split(';')[0].split(':')[1];

  // Submit to Replicate
  const submitRes = await fetch('https://api.replicate.com/v1/predictions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      version: '42fed1c4974146d4d2414e2be2c5277c7fcf05fcc3a73abf41610695738c1d7b', // nightmareai/real-esrgan
      input: {
        image: imageDataUrl,
        scale: 4,
        face_enhance: false,
      },
    }),
  });

  if (!submitRes.ok) throw new Error(`Replicate submission failed: ${submitRes.status}`);
  const prediction = await submitRes.json();
  const predictionId = prediction.id;

  // Poll for result
  for (let i = 0; i < 60; i++) {
    await new Promise((r) => setTimeout(r, 2000));

    const pollRes = await fetch(`https://api.replicate.com/v1/predictions/${predictionId}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    const result = await pollRes.json();

    if (result.status === 'succeeded') {
      // Fetch the output image and convert to data URL
      const imgRes = await fetch(result.output);
      const blob = await imgRes.blob();
      return await blobToDataUrl(blob);
    }

    if (result.status === 'failed') {
      throw new Error(`Replicate upscale failed: ${result.error}`);
    }
  }

  throw new Error('Replicate upscale timed out.');
}

/**
 * Remove background from an image using PhotoRoom API.
 * Input: base64 data URL
 * Returns: base64 data URL of image with background removed (PNG with alpha)
 */
export async function removeBg(
  imageDataUrl: string,
  apiKey: string
): Promise<string> {
  if (!apiKey) throw new Error('No Remove BG API key configured.');

  // Convert base64 to Blob
  const base64Data = imageDataUrl.split(',')[1];
  const mimeType = imageDataUrl.split(';')[0].split(':')[1] || 'image/png';
  const blob = base64ToBlob(base64Data, mimeType);

  const formData = new FormData();
  formData.append('image_file', blob, 'image.png');

  // Try PhotoRoom first
  const res = await fetch('https://sdk.photoroom.com/v1/segment', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
    },
    body: formData,
  });

  if (!res.ok) {
    throw new Error(`Remove BG API error (${res.status}): ${await res.text()}`);
  }

  const resultBlob = await res.blob();
  return await blobToDataUrl(resultBlob);
}

function base64ToBlob(base64: string, mimeType: string): Blob {
  const byteChars = atob(base64);
  const byteNumbers = new Array(byteChars.length);
  for (let i = 0; i < byteChars.length; i++) {
    byteNumbers[i] = byteChars.charCodeAt(i);
  }
  return new Blob([new Uint8Array(byteNumbers)], { type: mimeType });
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
