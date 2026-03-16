import { NextResponse } from 'next/server';
import { runComfyUIWorkflow } from '@/lib/comfyui';

export async function POST(req: Request) {
  try {
    const { image, provider, apiKey, endpoint } = await req.json();

    if (!image) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 });
    }

    if (provider === 'comfyui') {
      if (!endpoint) return NextResponse.json({ error: 'No ComfyUI endpoint provided' }, { status: 400 });

      // Strip "data:image/png;base64," if present
      const base64Image = image.split(',')[1] || image;

      // This is a minimal generic workflow for background removal (e.g. using Image Remove Background node)
      // You should replace this with your actual ComfyUI Remove BG workflow JSON.
      // E.g., using "Image Remove Background (rembg)"
      const workflow = {
        "1": {
          "inputs": {
            "image": base64Image
          },
          "class_type": "ETN_LoadImageBase64",
        },
        "2": {
          "inputs": {
            "image": ["1", 0],
          },
          "class_type": "Image Remove Background (rembg)"
        },
        "3": {
          "inputs": {
            "filename_prefix": "RemoveBG",
            "images": ["2", 0]
          },
          "class_type": "SaveImage"
        }
      };

      try {
        const resultBase64 = await runComfyUIWorkflow(endpoint, workflow, "3");
        return NextResponse.json({ result: resultBase64 });
      } catch (comfyError: any) {
        return NextResponse.json({ error: comfyError.message }, { status: 500 });
      }

    } else {
      // CLOUD API (e.g., remove.bg)
      if (!apiKey) return NextResponse.json({ error: 'No API key provided' }, { status: 400 });

      const base64Image = image.split(',')[1] || image;

      const response = await fetch('https://api.remove.bg/v1.0/removebg', {
        method: 'POST',
        headers: {
          'X-Api-Key': apiKey,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          image_file_b64: base64Image,
          size: 'auto'
        })
      });

      if (!response.ok) {
        throw new Error(`Cloud API failed: ${response.statusText}`);
      }

      const data = await response.json();
      return NextResponse.json({ result: `data:image/png;base64,${data.data.result_b64}` });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 });
  }
}
