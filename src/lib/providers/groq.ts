import { ProviderAdapter, ChatRequest, RequestMetrics } from './types';
import { ModelConfig } from '@/config/models';
import { formatSSE, calculateCost } from './sse';

export class GroqAdapter implements ProviderAdapter {
  id = 'groq';
  name = 'Groq Cloud';

  isConfigured(): boolean {
    return Boolean(process.env.GROQ_API_KEY && process.env.GROQ_API_KEY.trim().length > 0);
  }

  getMissingReason(modelConfig: ModelConfig): string {
    return `Missing GROQ_API_KEY. Set it in .env.local to access ${modelConfig.name} (${modelConfig.providerModelId}).`;
  }

  async streamChat(
    request: ChatRequest,
    modelConfig: ModelConfig,
    abortSignal?: AbortSignal
  ): Promise<ReadableStream<Uint8Array>> {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      throw new Error(this.getMissingReason(modelConfig));
    }

    const startTime = performance.now();
    let ttftMs: number | undefined = undefined;

    // Format messages for OpenAI / Groq standard
    const formattedMessages = request.messages.map((m) => {
      if (m.attachments && m.attachments.length > 0 && modelConfig.capabilities.supportsVision) {
        return {
          role: m.role,
          content: [
            { type: 'text', text: m.content || '' },
            ...m.attachments.map((a) => ({
              type: 'image_url',
              image_url: { url: a.image_url.url },
            })),
          ],
        };
      }
      return {
        role: m.role,
        content: m.content,
      };
    });

    const isStreaming = request.settings.stream !== false && modelConfig.capabilities.supportsStreaming;

    const bodyPayload: Record<string, unknown> = {
      model: modelConfig.providerModelId,
      messages: formattedMessages,
      temperature: request.settings.temperature,
      max_tokens: request.settings.maxTokens,
      top_p: request.settings.topP,
      stream: isStreaming,
    };

    if (isStreaming) {
      bodyPayload.stream_options = { include_usage: true };
    }

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(bodyPayload),
      signal: abortSignal,
    });

    if (!response.ok) {
      let safeError = `Groq API responded with status ${response.status} (${response.statusText})`;
      try {
        const errorJson = await response.json();
        if (errorJson.error?.message) {
          safeError = `Groq Error: ${errorJson.error.message.replace(/gsk_[a-zA-Z0-9_-]+/g, '[REDACTED]')}`;
        }
      } catch {
        // fallback to status code message
      }
      throw new Error(safeError);
    }

    if (!isStreaming) {
      // Non-streaming handling
      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || '';
      const promptTokens = data.usage?.prompt_tokens;
      const completionTokens = data.usage?.completion_tokens;
      const totalTokens = data.usage?.total_tokens;
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

    // Streaming handling
    if (!response.body) {
      throw new Error('Groq upstream response body is missing.');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let totalCompletionText = '';
    let promptTokens: number | undefined = undefined;
    let completionTokens: number | undefined = undefined;
    let totalTokens: number | undefined = undefined;

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
                if (dataStr === '[DONE]') {
                  continue;
                }

                try {
                  const parsed = JSON.parse(dataStr);

                  // Capture usage if provider returned it in chunk
                  if (parsed.usage) {
                    promptTokens = parsed.usage.prompt_tokens ?? promptTokens;
                    completionTokens = parsed.usage.completion_tokens ?? completionTokens;
                    totalTokens = parsed.usage.total_tokens ?? totalTokens;
                  }

                  const deltaText = parsed.choices?.[0]?.delta?.content;
                  if (deltaText) {
                    if (ttftMs === undefined) {
                      ttftMs = Math.round(performance.now() - startTime);
                    }
                    totalCompletionText += deltaText;
                    controller.enqueue(formatSSE('delta', { text: deltaText }));
                  }
                } catch {
                  // Ignore JSON parse errors on malformed chunks
                }
              }
            }
          }

          // Complete metrics calculation
          const elapsedMs = Math.round(performance.now() - startTime);
          // If completionTokens was not provided by provider, estimate or leave undefined
          const resolvedCompletionTokens = completionTokens ?? (totalCompletionText.length > 0 ? Math.round(totalCompletionText.length / 4) : undefined);
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
