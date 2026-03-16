// LLM API Helper
// Supports OpenAI-compatible APIs (OpenAI, custom base URL) and Google Gemini

export interface LLMSettings {
  llmProvider: 'openai' | 'gemini' | 'custom';
  llmApiKey: string;
  llmBaseUrl?: string;
  llmModel?: string;
}

export interface LLMMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

/**
 * Calls the configured LLM and returns the text response.
 */
export async function callLLM(
  messages: LLMMessage[],
  settings: LLMSettings
): Promise<string> {
  if (!settings.llmApiKey) {
    throw new Error('No LLM API key configured. Please add your key in AI Engine Settings.');
  }

  if (settings.llmProvider === 'gemini') {
    return callGemini(messages, settings);
  } else {
    return callOpenAICompatible(messages, settings);
  }
}

async function callOpenAICompatible(
  messages: LLMMessage[],
  settings: LLMSettings
): Promise<string> {
  const baseUrl = settings.llmBaseUrl?.replace(/\/$/, '') || 'https://api.openai.com/v1';
  const model = settings.llmModel || 'gpt-4o-mini';

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${settings.llmApiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.7,
      response_format: { type: 'json_object' },
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`LLM API error (${response.status}): ${err}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || '';
}

async function callGemini(
  messages: LLMMessage[],
  settings: LLMSettings
): Promise<string> {
  const model = settings.llmModel || 'gemini-1.5-flash';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${settings.llmApiKey}`;

  // Convert messages to Gemini format
  const systemMessage = messages.find((m) => m.role === 'system')?.content || '';
  const userMessages = messages.filter((m) => m.role !== 'system');

  const contents = userMessages.map((m) => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }));

  const body: any = {
    contents,
    generationConfig: {
      temperature: 0.7,
      responseMimeType: 'application/json',
    },
  };

  if (systemMessage) {
    body.systemInstruction = { parts: [{ text: systemMessage }] };
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Gemini API error (${response.status}): ${err}`);
  }

  const data = await response.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

/**
 * Simple prompt helper for single-message text generation (no JSON enforcement).
 */
export async function callLLMText(
  systemPrompt: string,
  userPrompt: string,
  settings: LLMSettings
): Promise<string> {
  const messages: LLMMessage[] = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt },
  ];

  if (settings.llmProvider === 'gemini') {
    // For text generation, relax JSON mode
    const model = settings.llmModel || 'gemini-1.5-flash';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${settings.llmApiKey}`;

    const body: any = {
      contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
      generationConfig: { temperature: 0.7 },
      systemInstruction: { parts: [{ text: systemPrompt }] },
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!response.ok) throw new Error(`Gemini API error: ${response.status}`);
    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  }

  // OpenAI-compatible — plain text, no JSON mode
  const baseUrl = settings.llmBaseUrl?.replace(/\/$/, '') || 'https://api.openai.com/v1';
  const openAIModel = settings.llmModel || 'gpt-4o-mini';

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${settings.llmApiKey}`,
    },
    body: JSON.stringify({ model: openAIModel, messages, temperature: 0.7 }),
  });

  if (!response.ok) throw new Error(`LLM API error: ${response.status}`);
  const data = await response.json();
  return data.choices?.[0]?.message?.content || '';
}
