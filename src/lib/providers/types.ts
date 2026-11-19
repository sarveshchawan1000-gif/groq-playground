import { ModelConfig } from '@/config/models';

export type Role = 'system' | 'user' | 'assistant';

export interface ImageAttachment {
  type: 'image_url';
  image_url: {
    url: string; // data:image/...;base64,... or https://...
  };
}

export interface ChatMessage {
  id: string;
  role: Role;
  content: string;
  attachments?: ImageAttachment[];
}

export interface GenerationSettings {
  temperature: number;
  maxTokens: number;
  topP: number;
  stream: boolean;
}

export interface ChatRequest {
  modelId: string;
  messages: ChatMessage[];
  settings: GenerationSettings;
}

export interface RequestMetrics {
  elapsedMs?: number;
  ttftMs?: number; // Time to First Token in milliseconds
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
  tokensPerSecond?: number;
  estimatedCost?: number | null; // null => "unavailable"
}

export interface StreamEvent {
  event: 'delta' | 'metrics' | 'error' | 'done';
  data: {
    text?: string;
    metrics?: RequestMetrics;
    error?: string;
  };
}

export interface ProviderAdapter {
  id: string;
  name: string;
  isConfigured(): boolean;
  getMissingReason(modelConfig: ModelConfig): string;
  streamChat(
    request: ChatRequest,
    modelConfig: ModelConfig,
    abortSignal?: AbortSignal
  ): Promise<ReadableStream<Uint8Array>>;
}
