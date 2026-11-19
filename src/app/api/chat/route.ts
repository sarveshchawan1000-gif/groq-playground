import { NextRequest, NextResponse } from 'next/server';
import { getModelConfig, getProviderAdapter, isModelConfigured } from '@/lib/providers/registry';
import { checkRateLimit } from '@/lib/rate-limiter';
import { ChatRequest, Role } from '@/lib/providers/types';

export const dynamic = 'force-dynamic';

const MAX_TOTAL_CHARACTERS = 250_000; // ~60k tokens safeguard for MVP
const MAX_MESSAGES_COUNT = 50;

export async function POST(req: NextRequest) {
  // 1. Basic IP-based rate limiting
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || '127.0.0.1';
  const rateLimit = checkRateLimit(ip, 40, 60000);

  if (!rateLimit.allowed) {
    return NextResponse.json(
      {
        error: `Rate limit exceeded. Please wait ${Math.ceil(rateLimit.resetMs / 1000)} seconds before sending another request.`,
      },
      {
        status: 429,
        headers: {
          'Retry-After': String(Math.ceil(rateLimit.resetMs / 1000)),
        },
      }
    );
  }

  // 2. Parse and validate JSON payload
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON request payload.' },
      { status: 400 }
    );
  }

  if (!body || typeof body !== 'object') {
    return NextResponse.json(
      { error: 'Malformed request: payload must be a JSON object.' },
      { status: 400 }
    );
  }

  const { modelId, messages, settings } = body as Partial<ChatRequest>;

  // 3. Model ID validation
  if (!modelId || typeof modelId !== 'string') {
    return NextResponse.json(
      { error: 'Missing or invalid "modelId" parameter.' },
      { status: 400 }
    );
  }

  const modelConfig = getModelConfig(modelId);
  if (!modelConfig) {
    return NextResponse.json(
      { error: `Model "${modelId}" is not recognized in the system configuration.` },
      { status: 404 }
    );
  }

  // 4. Configuration / Provider check
  const isConfigured = isModelConfigured(modelConfig);
  const isMockAllowed = process.env.ENABLE_DEMO_MOCK === 'true';

  if (!isConfigured && !isMockAllowed) {
    const adapter = getProviderAdapter(modelConfig.provider);
    return NextResponse.json(
      {
        error: `Model "${modelConfig.name}" is currently unavailable. ${adapter.getMissingReason(modelConfig)}`,
        setupHint: modelConfig.setupHint,
        requiredEnvVar: modelConfig.requiredEnvVar,
      },
      { status: 400 }
    );
  }

  // 5. Messages array validation
  if (!Array.isArray(messages) || messages.length === 0) {
    return NextResponse.json(
      { error: 'Messages list must be a non-empty array.' },
      { status: 400 }
    );
  }

  if (messages.length > MAX_MESSAGES_COUNT) {
    return NextResponse.json(
      { error: `Too many messages. Maximum permitted is ${MAX_MESSAGES_COUNT}.` },
      { status: 400 }
    );
  }

  const validRoles: Role[] = ['system', 'user', 'assistant'];
  let totalChars = 0;

  for (let i = 0; i < messages.length; i++) {
    const m = messages[i];
    if (!m || typeof m !== 'object') {
      return NextResponse.json(
        { error: `Invalid message item at index ${i}.` },
        { status: 400 }
      );
    }
    if (!validRoles.includes(m.role)) {
      return NextResponse.json(
        { error: `Message at index ${i} has invalid role "${m.role}". Must be system, user, or assistant.` },
        { status: 400 }
      );
    }
    if (typeof m.content !== 'string') {
      return NextResponse.json(
        { error: `Message at index ${i} must have a string content.` },
        { status: 400 }
      );
    }
    totalChars += m.content.length;

    // Check attachments if any
    if (m.attachments) {
      if (!Array.isArray(m.attachments)) {
        return NextResponse.json(
          { error: `Attachments at message ${i} must be an array.` },
          { status: 400 }
        );
      }
      if (m.attachments.length > 0 && !modelConfig.capabilities.supportsVision) {
        return NextResponse.json(
          { error: `Model "${modelConfig.name}" does not accept visual attachments.` },
          { status: 400 }
        );
      }
      for (const att of m.attachments) {
        if (!att?.image_url?.url) {
          return NextResponse.json(
            { error: 'Attachment must specify an image_url.' },
            { status: 400 }
          );
        }
      }
    }
  }

  if (totalChars > MAX_TOTAL_CHARACTERS) {
    return NextResponse.json(
      { error: `Total conversation characters (${totalChars}) exceeds safety threshold (${MAX_TOTAL_CHARACTERS}).` },
      { status: 413 }
    );
  }

  // 6. Settings validation
  const safeSettings = {
    temperature: typeof settings?.temperature === 'number'
      ? Math.max(0, Math.min(2, settings.temperature))
      : modelConfig.temperatureDefault,
    maxTokens: typeof settings?.maxTokens === 'number'
      ? Math.max(1, Math.min(modelConfig.maxOutputTokensLimit, settings.maxTokens))
      : modelConfig.maxOutputTokensDefault,
    topP: typeof settings?.topP === 'number'
      ? Math.max(0, Math.min(1, settings.topP))
      : 1,
    stream: settings?.stream !== false && modelConfig.capabilities.supportsStreaming,
  };

  const normalizedRequest: ChatRequest = {
    modelId,
    messages,
    settings: safeSettings,
  };

  try {
    // Choose adapter: if real key exists, use real provider; otherwise fall back to mock demo if enabled
    const adapter = isConfigured
      ? getProviderAdapter(modelConfig.provider)
      : getProviderAdapter('mock');

    const stream = await adapter.streamChat(
      normalizedRequest,
      modelConfig,
      req.signal
    );

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no', // For Nginx / Cloudflare bypass buffering
      },
    });
  } catch (error: unknown) {
    const rawError = error instanceof Error ? error.message : 'Internal generation error';
    // Clean out any sensitive token patterns just in case
    const safeError = rawError
      .replace(/gsk_[a-zA-Z0-9_-]+/g, '[REDACTED_GROQ_KEY]')
      .replace(/sk-[a-zA-Z0-9_-]+/g, '[REDACTED_API_KEY]');

    return NextResponse.json({ error: safeError }, { status: 500 });
  }
}
