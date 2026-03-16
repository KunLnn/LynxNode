// Helper to interact with ComfyUI API
export async function runComfyUIWorkflow(
  endpoint: string,
  workflow: any,
  outputNodeId: string
): Promise<string> {
  // 1. Submit prompt
  const promptRes = await fetch(`${endpoint}/prompt`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt: workflow }),
  });

  if (!promptRes.ok) {
    throw new Error(`ComfyUI prompt failed: ${promptRes.statusText}`);
  }

  const { prompt_id } = await promptRes.json();

  // 2. Poll for completion
  return new Promise((resolve, reject) => {
    let attempts = 0;
    const maxAttempts = 120; // 2 minutes with 1s interval

    const poll = async () => {
      try {
        if (attempts >= maxAttempts) {
          reject(new Error('ComfyUI timeout'));
          return;
        }

        const historyRes = await fetch(`${endpoint}/history/${prompt_id}`);
        const historyData = await historyRes.json();

        if (historyData[prompt_id]) {
          // Finished
          const outputs = historyData[prompt_id].outputs;
          if (outputs && outputs[outputNodeId] && outputs[outputNodeId].images) {
            const imageInfo = outputs[outputNodeId].images[0];
            
            // Fetch the actual image
            const imageRes = await fetch(
              `${endpoint}/view?filename=${imageInfo.filename}&subfolder=${imageInfo.subfolder}&type=${imageInfo.type}`
            );
            
            const arrayBuffer = await imageRes.arrayBuffer();
            const base64 = Buffer.from(arrayBuffer).toString('base64');
            resolve(`data:image/png;base64,${base64}`);
            return;
          } else {
            reject(new Error('No image output found in ComfyUI result'));
            return;
          }
        }

        attempts++;
        setTimeout(poll, 1000); // 1 second interval
      } catch (err) {
        reject(err);
      }
    };

    poll();
  });
}
