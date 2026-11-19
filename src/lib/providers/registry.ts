import { ProviderAdapter } from './types';
import { ModelConfig, ClientModelInfo, MODEL_REGISTRY } from '@/config/models';
import { GroqAdapter } from './groq';
import { OpenAIAdapter } from './openai';
import { AnthropicAdapter } from './anthropic';
import { MockAdapter } from './mock';

const groqAdapter = new GroqAdapter();
const openaiAdapter = new OpenAIAdapter();
const anthropicAdapter = new AnthropicAdapter();
const mockAdapter = new MockAdapter();

export function getProviderAdapter(providerType: string): ProviderAdapter {
  switch (providerType) {
    case 'groq':
      return groqAdapter;
    case 'openai':
      return openaiAdapter;
    case 'anthropic':
      return anthropicAdapter;
    case 'mock':
      return mockAdapter;
    default:
      throw new Error(`Unsupported provider: "${providerType}"`);
  }
}

/**
 * Checks if a specific model has its required credentials / environment configured.
 */
export function isModelConfigured(model: ModelConfig): boolean {
  const adapter = getProviderAdapter(model.provider);
  return adapter.isConfigured();
}

/**
 * Returns model list with safe client metadata (excluding any server secrets).
 */
export function getClientModels(): ClientModelInfo[] {
  const isMockEnabled = process.env.ENABLE_DEMO_MOCK === 'true';

  return MODEL_REGISTRY.map((model) => {
    const configured = isModelConfigured(model);
    return {
      ...model,
      isConfigured: configured || isMockEnabled,
      isMockFallback: !configured && isMockEnabled,
    };
  });
}

/**
 * Finds a model by ID from the registry.
 */
export function getModelConfig(modelId: string): ModelConfig | undefined {
  return MODEL_REGISTRY.find((m) => m.id === modelId);
}
