export interface UsageInfo {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  prompt_tokens_details?: {
    cached_tokens?: number;
    cache_creation_tokens?: number;
  };
}

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  modelUsed?: string;
  error?: boolean;
  costVnd?: number;
  usage?: UsageInfo;
  usedWebSearch?: boolean;
  reasoningContent?: string;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
  selectedModel: string;
  totalCostVnd?: number;
}

export interface ModelPricing {
  price_per_input_token: number;
  price_per_output_token: number;
  cached_input_price?: number;
  cache_creation_price?: number;
  min_price_per_request?: number;
  price_per_request?: number;
}

export interface ModelOption {
  id: string;
  name: string;
  description: string;
  isAvailableInKey: boolean;
  provider: string;
  badge?: string;
  pricing?: ModelPricing;
}

export interface ToastMessage {
  id: string;
  type: 'error' | 'warning' | 'info' | 'success';
  title: string;
  message: string;
  detail?: string;
}
