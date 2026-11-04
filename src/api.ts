import type { ModelOption, UsageInfo, ModelPricing } from './types';

export const FALLBACK_MODELS: ModelOption[] = [
  {
    id: "deepseek-v4.1-flash",
    name: "DeepSeek v4.1 Flash",
    description: "Model DeepSeek v4.1 siêu tốc độ được kích hoạt trên ViLao",
    isAvailableInKey: true,
    provider: "ViLao",
    badge: "Đang bật",
    pricing: {
      price_per_input_token: 0,
      price_per_output_token: 0,
      min_price_per_request: 0,
      price_per_request: 0,
    }
  }
];

export async function loginUser(username: string, password: string):Promise<{ success: boolean; token?: string; message?: string }> {
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  const data = await res.json();
  return data;
}

export async function fetchRemoteModels(authToken: string): Promise<ModelOption[]> {
  const res = await fetch('/api/vilao/models', {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${authToken}`,
      'Content-Type': 'application/json',
    }
  });

  if (!res.ok) {
    throw new Error(`Không thể lấy danh sách model (HTTP ${res.status})`);
  }

  const data = await res.json();
  const remoteList = Array.isArray(data.data) ? data.data : (Array.isArray(data) ? data : []);

  if (remoteList.length === 0) {
    return FALLBACK_MODELS;
  }

  return remoteList.map((item: any) => {
    let fullId = item.id;
    if (item.provider_prefix && !item.id.startsWith(item.provider_prefix + '/')) {
      fullId = `${item.provider_prefix}/${item.id}`;
    }

    const pricing: ModelPricing = {
      price_per_input_token: item.price_per_input_token ?? 0,
      price_per_output_token: item.price_per_output_token ?? 0,
      cached_input_price: item.cached_input_price ?? 0,
      cache_creation_price: item.cache_creation_price ?? 0,
      min_price_per_request: item.min_price_per_request ?? 0,
      price_per_request: item.price_per_request ?? 0,
    };

    return {
      id: fullId,
      name: item.model_id || item.id,
      description: `Model trên ViLao AI (Được gán vào API Key)`,
      isAvailableInKey: item.active !== false,
      provider: item.provider_prefix ? item.provider_prefix.toUpperCase() : 'ViLao',
      badge: item.active !== false ? 'Đang bật' : 'Đã tắt',
      pricing,
    };
  });
}

export function calculateCostVnd(usage?: UsageInfo, pricing?: ModelPricing): number {
  if (!usage) return 0;

  const effectivePricing: ModelPricing = pricing || {
    price_per_input_token: 5250,
    price_per_output_token: 26250,
    cached_input_price: 1575,
    min_price_per_request: 10,
    price_per_request: 0,
  };

  const promptTokens = usage.prompt_tokens || 0;
  const completionTokens = usage.completion_tokens || 0;
  const cachedTokens = usage.prompt_tokens_details?.cached_tokens || 0;
  const uncachedPromptTokens = Math.max(0, promptTokens - cachedTokens);

  let cost = 0;
  cost += (uncachedPromptTokens / 1_000_000) * (effectivePricing.price_per_input_token || 0);
  cost += (completionTokens / 1_000_000) * (effectivePricing.price_per_output_token || 0);
  cost += (cachedTokens / 1_000_000) * (effectivePricing.cached_input_price || 0);

  if (effectivePricing.price_per_request) {
    cost += effectivePricing.price_per_request;
  }

  if (effectivePricing.min_price_per_request && cost < effectivePricing.min_price_per_request && (promptTokens > 0 || completionTokens > 0)) {
    cost = effectivePricing.min_price_per_request;
  }

  return Math.round(cost * 10) / 10;
}

export async function sendChatMessage({
  authToken,
  model,
  messages,
  webSearch = false,
  memoryEnabled = true,
  compressToken = false,
}: {
  authToken: string;
  model: string;
  messages: { role: string; content: string }[];
  webSearch?: boolean;
  memoryEnabled?: boolean;
  compressToken?: boolean;
}): Promise<{ reply: string; usage?: UsageInfo; usedWebSearch?: boolean; reasoningContent?: string }> {
  const response = await fetch('/api/vilao/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`,
    },
    body: JSON.stringify({
      model: model,
      messages: messages,
      max_tokens: 4096, // Tăng trần token lên 4096 để model suy nghĩ xong vẫn đủ token trả lời ra câu chính
      temperature: 0.7,
      webSearch: webSearch,
      memoryEnabled: memoryEnabled,
      compressToken: compressToken,
    }),
  });

  if (!response.ok) {
    let errorDetail = '';
    try {
      const errJson = await response.json();
      errorDetail = errJson?.error?.message || errJson?.error || errJson?.message || JSON.stringify(errJson);
    } catch {
      errorDetail = await response.text();
    }

    const err = new Error(
      errorDetail || `Yêu cầu thất bại với mã lỗi HTTP ${response.status}`
    );
    (err as any).statusCode = response.status;
    (err as any).errorDetail = errorDetail;
    (err as any).requestedModel = model;
    throw err;
  }

  const data = await response.json();
  const choice = data.choices?.[0]?.message;
  
  // Ưu tiên lấy content chính thống.
  // Chỉ khi content rỗng (do chạm trần token lúc suy nghĩ), mới dùng reasoning_content tạm thời
  const reply = choice?.content || choice?.reasoning_content;
  if (!reply) {
    throw new Error("Không nhận được nội dung phản hồi từ model API.");
  }

  return {
    reply,
    usage: data.usage,
    usedWebSearch: data.usedWebSearch,
    reasoningContent: choice?.content ? choice?.reasoning_content : undefined,
  };
}
