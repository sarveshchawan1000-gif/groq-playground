/**
 * Model Registry Configuration
 * 
 * Central configuration file for all models available in the playground.
 * Supports a provider-adapter architecture so models can come from Groq, OpenAI,
 * Anthropic, or other providers without modifying UI components.
 * 
 * PLACEHOLDER ENTRIES:
 * The 4 slots below contain initial placeholder configurations clearly marked
 * for replacement with your preferred model IDs, providers, and environment variables.
 */

export type ProviderType = 'groq' | 'openai' | 'anthropic' | 'mock';

export interface ModelPricing {
  inputPerMillion?: number;
  outputPerMillion?: number;
}

export interface ModelCapabilities {
  supportsStreaming: boolean;
  supportsVision: boolean;
  supportsTemperature: boolean;
  supportsTopP: boolean;
  supportsMaxTokens: boolean;
}

export interface ModelConfig {
  id: string;
  slot: 1 | 2 | 3 | 4;
  name: string;
  category: 'fast' | 'reasoning' | 'budget' | 'vision';
  provider: ProviderType;
  providerModelId: string;
  description: string;
  contextLimit?: number;
  maxOutputTokensDefault: number;
  maxOutputTokensLimit: number;
  temperatureDefault: number;
  capabilities: ModelCapabilities;
  pricing?: ModelPricing;
  requiredEnvVar: string;
  setupHint: string;
}

export interface ClientModelInfo extends ModelConfig {
  isConfigured: boolean;
  isMockFallback?: boolean;
}

/**
 * INITIAL 4 CONFIGURED MODEL SLOTS
 * To change a model:
 * 1. Update the `provider` and `providerModelId` below, OR
 * 2. Set the corresponding environment variable (e.g., MODEL_FAST_ID, GROQ_API_KEY)
 */
export const MODEL_REGISTRY: ModelConfig[] = [
  // =========================================================================
  // 1. FAST MODEL — Optimized for low latency
  // =========================================================================
  {
    id: 'fast-model',
    slot: 1,
    name: 'Fast Model (Low Latency)',
    category: 'fast',
    provider: (process.env.MODEL_FAST_PROVIDER as ProviderType) || 'groq',
    // Fast model ID (e.g. openai/gpt-oss-20b or llama-3.1-8b-instant)
    providerModelId: process.env.MODEL_FAST_ID || 'openai/gpt-oss-20b',
    description: 'Engineered for near-instant responses, ultra-low TTFT, and high throughput.',
    contextLimit: process.env.MODEL_FAST_CONTEXT ? parseInt(process.env.MODEL_FAST_CONTEXT) : 131072,
    maxOutputTokensDefault: 2048,
    maxOutputTokensLimit: 8192,
    temperatureDefault: 0.7,
    capabilities: {
      supportsStreaming: true,
      supportsVision: false,
      supportsTemperature: true,
      supportsTopP: true,
      supportsMaxTokens: true,
    },
    pricing: process.env.MODEL_FAST_INPUT_COST_PER_M ? {
      inputPerMillion: parseFloat(process.env.MODEL_FAST_INPUT_COST_PER_M),
      outputPerMillion: parseFloat(process.env.MODEL_FAST_OUTPUT_COST_PER_M || '0'),
    } : undefined,
    requiredEnvVar: 'GROQ_API_KEY',
    setupHint: 'Add GROQ_API_KEY in .env.local to activate the high-speed engine.',
  },

  // =========================================================================
  // 2. REASONING MODEL — Optimized for coding and complex tasks
  // =========================================================================
  {
    id: 'reasoning-model',
    slot: 2,
    name: 'Reasoning Model (Deep Logic)',
    category: 'reasoning',
    provider: (process.env.MODEL_REASONING_PROVIDER as ProviderType) || 'groq',
    // Reasoning model ID (e.g. openai/gpt-oss-120b or llama-3.3-70b-versatile)
    providerModelId: process.env.MODEL_REASONING_ID || 'openai/gpt-oss-120b',
    description: 'Excels at complex mathematical reasoning, algorithm design, and detailed code synthesis.',
    contextLimit: process.env.MODEL_REASONING_CONTEXT ? parseInt(process.env.MODEL_REASONING_CONTEXT) : 131072,
    maxOutputTokensDefault: 4096,
    maxOutputTokensLimit: 8192,
    temperatureDefault: 0.2,
    capabilities: {
      supportsStreaming: true,
      supportsVision: false,
      supportsTemperature: true,
      supportsTopP: true,
      supportsMaxTokens: true,
    },
    pricing: process.env.MODEL_REASONING_INPUT_COST_PER_M ? {
      inputPerMillion: parseFloat(process.env.MODEL_REASONING_INPUT_COST_PER_M),
      outputPerMillion: parseFloat(process.env.MODEL_REASONING_OUTPUT_COST_PER_M || '0'),
    } : undefined,
    requiredEnvVar: 'GROQ_API_KEY',
    setupHint: 'Set GROQ_API_KEY (or provider key) in .env.local to enable the reasoning model.',
  },

  // =========================================================================
  // 3. BUDGET MODEL — Optimized for lower-cost use
  // =========================================================================
  {
    id: 'budget-model',
    slot: 3,
    name: 'Budget Model (High Efficiency)',
    category: 'budget',
    provider: (process.env.MODEL_BUDGET_PROVIDER as ProviderType) || 'groq',
    // Budget model ID (e.g. qwen/qwen3.8-27b or gemma2-9b-it)
    providerModelId: process.env.MODEL_BUDGET_ID || 'qwen/qwen3.8-27b',
    description: 'Cost-effective inference balanced for everyday conversational and transformation tasks.',
    contextLimit: process.env.MODEL_BUDGET_CONTEXT ? parseInt(process.env.MODEL_BUDGET_CONTEXT) : 8192,
    maxOutputTokensDefault: 2048,
    maxOutputTokensLimit: 8192,
    temperatureDefault: 0.7,
    capabilities: {
      supportsStreaming: true,
      supportsVision: false,
      supportsTemperature: true,
      supportsTopP: true,
      supportsMaxTokens: true,
    },
    pricing: process.env.MODEL_BUDGET_INPUT_COST_PER_M ? {
      inputPerMillion: parseFloat(process.env.MODEL_BUDGET_INPUT_COST_PER_M),
      outputPerMillion: parseFloat(process.env.MODEL_BUDGET_OUTPUT_COST_PER_M || '0'),
    } : undefined,
    requiredEnvVar: 'GROQ_API_KEY',
    setupHint: 'Configure GROQ_API_KEY in .env.local to enable budget-friendly queries.',
  },

  // =========================================================================
  // 4. VISION MODEL — Accepts image input
  // =========================================================================
  {
    id: 'vision-model',
    slot: 4,
    name: 'Vision Model (Multimodal)',
    category: 'vision',
    provider: (process.env.MODEL_VISION_PROVIDER as ProviderType) || 'groq',
    // Vision / Multimodal model ID (e.g. openai/gpt-oss-120b or llama-3.2-11b-vision-preview)
    providerModelId: process.env.MODEL_VISION_ID || 'openai/gpt-oss-120b',
    description: 'Multimodal model supporting OCR, image question-answering, and visual scene analysis.',
    contextLimit: process.env.MODEL_VISION_CONTEXT ? parseInt(process.env.MODEL_VISION_CONTEXT) : 131072,
    maxOutputTokensDefault: 2048,
    maxOutputTokensLimit: 8192,
    temperatureDefault: 0.6,
    capabilities: {
      supportsStreaming: true,
      supportsVision: true,
      supportsTemperature: true,
      supportsTopP: true,
      supportsMaxTokens: true,
    },
    pricing: process.env.MODEL_VISION_INPUT_COST_PER_M ? {
      inputPerMillion: parseFloat(process.env.MODEL_VISION_INPUT_COST_PER_M),
      outputPerMillion: parseFloat(process.env.MODEL_VISION_OUTPUT_COST_PER_M || '0'),
    } : undefined,
    requiredEnvVar: 'GROQ_API_KEY',
    setupHint: 'Provide GROQ_API_KEY in .env.local to unlock multimodal visual inputs.',
  },
];
