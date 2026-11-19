import { ProviderAdapter, ChatRequest, RequestMetrics } from './types';
import { ModelConfig } from '@/config/models';
import { formatSSE, calculateCost } from './sse';

export class AnthropicAdapter implements ProviderAdapter {
  id = 'anthropic';
  name = 'Anthropic';

  isConfigured(): boolean {
    return Boolean(process.env.ANTHROPIC_API_KEY && process.env.ANTHROPIC_API_KEY.trim().length > 0);
  }

  getMissingReason(modelConfig: ModelConfig): string {
    return `Missing ANTHROPIC_API_KEY. Set it in .env.local to access ${modelConfig.name} (${modelConfig.providerModelId}).`;
  }

  async streamChat(
    request: ChatRequest,
    modelConfig: ModelConfig,
    abortSignal?: AbortSignal
  ): Promise<ReadableStream<Uint8Array>> {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error(this.getMissingReason(modelConfig));
    }

    const startTime = performance.now();
    let ttftMs: number | undefined = undefined;

    // Anthropic separates system prompt from conversation messages
    const systemMessages = request.messages.filter((m) => m.role === 'system');
    const nonSystemMessages = request.messages.filter((m) => m.role !== 'system');
    const systemPrompt = systemMessages.map((m) => m.content).join('\n\n');

    const formattedMessages = nonSystemMessages.map((m) => {
      if (m.attachments && m.attachments.length > 0 && modelConfig.capabilities.supportsVision) {
        return {
          role: m.role === 'assistant' ? 'assistant' : 'user',
          content: [
            ...m.attachments.map((a) => {
              const url = a.image_url.url;
              if (url.startsWith('data:')) {
                const parts = url.split(',');
                const mimeMatch = parts[0].match(/:(.*?);/);
                const mediaType = mimeMatch ? mimeMatch[1] : 'image/jpeg';
                const base64Data = parts[1];
                return {
                  type: 'image',
                  source: {
                    type: 'base64',
                    media_type: mediaType,
                    data: base64Data,
                  },
                };
              }
              return {
                type: 'image',
                source: {
                  type: 'url',
                  url: url,
                },
              };
            }),
            { type: 'text', text: m.content || '' },
          ],
        };
      }
      return {
        role: m.role === 'assistant' ? 'assistant' : 'user',
        content: m.content,
      };
    });

    const isStreaming = request.settings.stream !== false && modelConfig.capabilities.supportsStreaming;

    const bodyPayload: Record<string, unknown> = {
      model: modelConfig.providerModelId,
      messages: formattedMessages,
      max_tokens: request.settings.maxTokens || 4096,
      temperature: request.settings.temperature,
      top_p: request.settings.topP,
      stream: isStreaming,
    };

    if (systemPrompt) {
      bodyPayload.system = systemPrompt;
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(bodyPayload),
      signal: abortSignal,
    });

    if (!response.ok) {
      let safeError = `Anthropic API responded with status ${response.status} (${response.statusText})`;
      try {
        const errorJson = await response.json();
        if (errorJson.error?.message) {
          safeError = `Anthropic Error: ${errorJson.error.message.replace(/sk-ant-[a-zA-Z0-9_-]+/g, '[REDACTED]')}`;
        }
      } catch {
        // fallback
      }
      throw new Error(safeError);
    }

    if (!isStreaming) {
      const data = await response.json();
      const content = data.content?.[0]?.text || '';
      const promptTokens = data.usage?.input_tokens;
      const completionTokens = data.usage?.output_tokens;
      const totalTokens = (promptTokens || 0) + (completionTokens || 0);
      const elapsedMs = Math.round(performance.now() - startTime);
      const tokensPerSecond = completionTokens && elapsedMs > 0 ? Number(((completionTokens / elapsedMs) * 1000).toFixed(1)) : undefined;

      const metrics: RequestMetrics = {
        elapsedMs,
        promptTokens,
        completionTokens,
        totalTokens,
        tokensPerSecond,
        estimatedCost: calculateCost(promptTokens, completionTokens, modelConfig.pricing),
      };

      return new ReadableStream({
        start(controller) {
          controller.enqueue(formatSSE('delta', { text: content }));
          controller.enqueue(formatSSE('metrics', { metrics }));
          controller.enqueue(formatSSE('done', {}));
          controller.close();
        },
      });
    }

    if (!response.body) {
      throw new Error('Anthropic upstream response body is missing.');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let totalCompletionText = '';
    let promptTokens: number | undefined = undefined;
    let completionTokens: number | undefined = undefined;

    return new ReadableStream<Uint8Array>({
      async start(controller) {
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
              const trimmed = line.trim();
              if (!trimmed || trimmed.startsWith(':')) continue;

              if (trimmed.startsWith('data: ')) {
                const dataStr = trimmed.slice(6).trim();
                try {
                  const parsed = JSON.parse(dataStr);
                  if (parsed.type === 'message_start' && parsed.message?.usage) {
                    promptTokens = parsed.message.usage.input_tokens;
                  }
                  if (parsed.type === 'message_delta' && parsed.usage) {
                    completionTokens = parsed.usage.output_tokens;
                  }
                  if (parsed.type === 'content_block_delta' && parsed.delta?.text) {
                    if (ttftMs === undefined) {
                      ttftMs = Math.round(performance.now() - startTime);
                    }
                    totalCompletionText += parsed.delta.text;
                    controller.enqueue(formatSSE('delta', { text: parsed.delta.text }));
                  }
                } catch {
                  // ignore malformed
                }
              }
            }
          }

          const elapsedMs = Math.round(performance.now() - startTime);
          const resolvedCompletionTokens = completionTokens ?? (totalCompletionText.length > 0 ? Math.round(totalCompletionText.length / 4) : undefined);
          const totalTokens = (promptTokens || 0) + (resolvedCompletionTokens || 0);
          const tokensPerSecond = resolvedCompletionTokens && elapsedMs > 0
            ? Number(((resolvedCompletionTokens / elapsedMs) * 1000).toFixed(1))
            : undefined;

          const metrics: RequestMetrics = {
            elapsedMs,
            ttftMs,
            promptTokens,
            completionTokens: resolvedCompletionTokens,
            totalTokens,
            tokensPerSecond,
            estimatedCost: calculateCost(promptTokens, resolvedCompletionTokens, modelConfig.pricing),
          };

          controller.enqueue(formatSSE('metrics', { metrics }));
          controller.enqueue(formatSSE('done', {}));
          controller.close();
        } catch (err: unknown) {
          if (abortSignal?.aborted) {
            controller.close();
            return;
          }
          const errorMessage = err instanceof Error ? err.message : 'Unknown streaming error';
          controller.enqueue(formatSSE('error', { error: errorMessage }));
          controller.close();
        }
      },
      cancel() {
        reader.cancel();
      },
    });
  }
}
