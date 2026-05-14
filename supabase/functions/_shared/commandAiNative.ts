type Provider = 'openai' | 'anthropic' | 'google' | 'deepseek';

export type ChatMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

export type NativeChatOptions = {
  model: string;
  messages: ChatMessage[];
  responseFormat?: 'json_object' | 'text';
};

export type NativeChatResult = {
  provider: Provider;
  model: string;
  content: string;
  usage: {
    input_tokens: number;
    output_tokens: number;
    total_tokens: number;
  };
  raw?: unknown;
};

export type NativeImageResult = {
  text: string;
  images: Array<{ mimeType: string; base64: string }>;
  usage: NativeChatResult['usage'];
};

function splitProviderModel(model: string): { provider: Provider; model: string } {
  const raw = String(model || '').trim();
  const [prefix, rest] = raw.includes('/') ? raw.split('/', 2) : ['', raw];
  const candidate = (prefix || inferProvider(rest)) as Provider;
  if (!['openai', 'anthropic', 'google', 'deepseek'].includes(candidate)) {
    throw new Error(`provider_not_supported:${candidate || raw}`);
  }
  return { provider: candidate, model: rest || raw };
}

function inferProvider(model: string): Provider {
  const m = model.toLowerCase();
  if (m.startsWith('claude')) return 'anthropic';
  if (m.startsWith('gemini')) return 'google';
  if (m.startsWith('deepseek')) return 'deepseek';
  return 'openai';
}

function env(name: string, alternatives: string[] = []): string {
  for (const key of [name, ...alternatives]) {
    const value = Deno.env.get(key);
    if (value) return value;
  }
  throw new Error(`secret_missing:${name}`);
}

function usage(input = 0, output = 0) {
  return { input_tokens: input, output_tokens: output, total_tokens: input + output };
}

function systemAndUser(messages: ChatMessage[]) {
  const system = messages.filter((m) => m.role === 'system').map((m) => m.content).join('\n\n');
  const rest = messages.filter((m) => m.role !== 'system');
  return { system, rest };
}

export async function runNativeChat(options: NativeChatOptions): Promise<NativeChatResult> {
  const resolved = splitProviderModel(options.model);
  if (resolved.provider === 'anthropic') return callAnthropic(resolved.model, options);
  if (resolved.provider === 'google') return callGoogle(resolved.model, options);
  if (resolved.provider === 'deepseek') return callOpenAICompatible('deepseek', resolved.model, options);
  return callOpenAICompatible('openai', resolved.model, options);
}

async function callOpenAICompatible(
  provider: 'openai' | 'deepseek',
  model: string,
  options: NativeChatOptions,
): Promise<NativeChatResult> {
  const key = provider === 'openai' ? env('OPENAI_API_KEY') : env('DEEPSEEK_API_KEY');
  const base = provider === 'openai' ? 'https://api.openai.com/v1' : 'https://api.deepseek.com/v1';
  const res = await fetch(`${base}/chat/completions`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      messages: options.messages,
      temperature: 0.7,
      ...(options.responseFormat === 'json_object' ? { response_format: { type: 'json_object' } } : {}),
    }),
  });
  if (!res.ok) throw new Error(`${provider}_${res.status}:${(await res.text()).slice(0, 300)}`);
  const json = await res.json();
  return {
    provider,
    model,
    content: json.choices?.[0]?.message?.content ?? '',
    usage: usage(json.usage?.prompt_tokens ?? 0, json.usage?.completion_tokens ?? 0),
    raw: json,
  };
}

async function callAnthropic(model: string, options: NativeChatOptions): Promise<NativeChatResult> {
  const { system, rest } = systemAndUser(options.messages);
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': env('ANTHROPIC_API_KEY', ['CLAUDE_API_KEY']),
      'anthropic-version': '2023-06-01',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      max_tokens: 4096,
      temperature: 0.7,
      system: system || undefined,
      messages: rest.map((m) => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: m.content })),
    }),
  });
  if (!res.ok) throw new Error(`anthropic_${res.status}:${(await res.text()).slice(0, 300)}`);
  const json = await res.json();
  const content = (json.content ?? [])
    .filter((part: { type?: string }) => part.type === 'text')
    .map((part: { text?: string }) => part.text ?? '')
    .join('\n');
  return {
    provider: 'anthropic',
    model,
    content,
    usage: usage(json.usage?.input_tokens ?? 0, json.usage?.output_tokens ?? 0),
    raw: json,
  };
}

async function callGoogle(model: string, options: NativeChatOptions): Promise<NativeChatResult> {
  const { system, rest } = systemAndUser(options.messages);
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${env('GOOGLE_API_KEY', ['GEMINI_API_KEY'])}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: system ? { parts: [{ text: system }] } : undefined,
        contents: rest.map((m) => ({
          role: m.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: m.content }],
        })),
        generationConfig: {
          temperature: 0.7,
          ...(options.responseFormat === 'json_object' ? { responseMimeType: 'application/json' } : {}),
        },
      }),
    },
  );
  if (!res.ok) throw new Error(`google_${res.status}:${(await res.text()).slice(0, 300)}`);
  const json = await res.json();
  const text = (json.candidates?.[0]?.content?.parts ?? [])
    .map((part: { text?: string }) => part.text ?? '')
    .join('\n');
  return {
    provider: 'google',
    model,
    content: text,
    usage: usage(json.usageMetadata?.promptTokenCount ?? 0, json.usageMetadata?.candidatesTokenCount ?? 0),
    raw: json,
  };
}

export async function generateNativeGoogleImage(options: NativeChatOptions): Promise<NativeImageResult> {
  const { model } = splitProviderModel(options.model);
  const { system, rest } = systemAndUser(options.messages);
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${env('GOOGLE_API_KEY', ['GEMINI_API_KEY'])}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: system ? { parts: [{ text: system }] } : undefined,
        contents: rest.map((m) => ({ role: 'user', parts: [{ text: m.content }] })),
        generationConfig: { responseModalities: ['TEXT', 'IMAGE'] },
      }),
    },
  );
  if (!res.ok) throw new Error(`google_image_${res.status}:${(await res.text()).slice(0, 300)}`);
  const json = await res.json();
  const parts = json.candidates?.[0]?.content?.parts ?? [];
  return {
    text: parts.map((p: { text?: string }) => p.text ?? '').filter(Boolean).join('\n'),
    images: parts
      .map((p: { inlineData?: { mimeType?: string; data?: string } }) => p.inlineData)
      .filter(Boolean)
      .map((img: { mimeType?: string; data?: string }) => ({ mimeType: img.mimeType ?? 'image/png', base64: img.data ?? '' }))
      .filter((img: { base64: string }) => img.base64.length > 0),
    usage: usage(json.usageMetadata?.promptTokenCount ?? 0, json.usageMetadata?.candidatesTokenCount ?? 0),
  };
}