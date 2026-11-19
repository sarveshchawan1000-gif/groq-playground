import { RequestMetrics } from './types';

export function formatSSE(event: 'delta' | 'metrics' | 'error' | 'done', payload: unknown): Uint8Array {
  const encoder = new TextEncoder();
  const json = JSON.stringify(payload);
  return encoder.encode(`event: ${event}\ndata: ${json}\n\n`);
}

export function calculateCost(
  promptTokens?: number,
  completionTokens?: number,
  pricing?: { inputPerMillion?: number; outputPerMillion?: number }
): number | null {
  if (!pricing || promptTokens === undefined || completionTokens === undefined) {
    return null;
  }
  const inputCost = (promptTokens / 1_000_000) * (pricing.inputPerMillion || 0);
  const outputCost = (completionTokens / 1_000_000) * (pricing.outputPerMillion || 0);
  return Number((inputCost + outputCost).toFixed(6));
}
