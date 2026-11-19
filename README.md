# Aether AI Studio (AI Playground)

A responsive, high-performance AI playground inspired by the streamlined workflow of modern inference consoles. Features an original visual identity, provider-adapter architecture, real-time token streaming with live performance telemetry, message orchestration, and local browser persistence.

> **Status Notice**: This application is an MVP developer playground and is **not claimed to be production-ready**. To transition to production, configure verified provider credentials, enforce authenticated user sessions, establish durable database storage, and calibrate upstream rate limits.

---

## Key Features

- **Provider-Adapter Architecture**: Models from Groq, OpenAI, Anthropic, or custom providers can be added or swapped without touching the frontend UI.
- **4 Configured Model Slots**:
  1. **Fast Model**: Engineered for ultra-low latency & high throughput.
  2. **Reasoning Model**: Optimized for step-by-step logic and coding tasks.
  3. **Budget Model**: Configured for high cost efficiency on standard tasks.
  4. **Vision Model**: Multimodal image attachment and analysis.
- **Real-Time Streaming & Telemetry**:
  - Incremental chunk streaming via Server-Sent Events (SSE).
  - Metrics tracking: Elapsed time, Time to First Token (TTFT), token throughput rate (t/s), prompt/completion tokens, and estimated cost.
  - Zero metric fabrication: displays `Unavailable` when metrics are omitted by the provider.
- **Conversation Thread Orchestrator**:
  - Add, edit, reorder (Move Up / Down), and remove System, User, and Assistant messages.
  - Multiline prompt editor with keyboard shortcuts (`⌘+Enter` or `Ctrl+Enter` to Run).
  - Quick starter presets: Coding Assistant, Structured JSON Extractor, Logic & Reasoning.
- **Interactive Controls & Safety**:
  - Generation sliders for Temperature, Maximum Output Tokens, Top-P, and Streaming.
  - Dynamic capability toggles (unsupported features are disabled/hidden per model).
  - Safe API Code Export dialog (cURL, Python, TypeScript) with credentials masked as environment variables.
  - Local browser storage for session history (rename, reload, delete) and preference caching.
  - Server-side payload validation, sanitized error handling, and in-memory rate limiting.

---

## Project Structure

```
├── .env.example               # Template with environment variables & placeholders
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── chat/route.ts  # Validated server-side SSE streaming chat endpoint
│   │   │   └── models/route.ts# Sanitized client models endpoint
│   │   ├── globals.css        # Tailwind styling & reduced-motion definitions
│   │   ├── layout.tsx         # Root application layout
│   │   └── page.tsx           # Playground orchestrator page
│   ├── components/
│   │   ├── CodeModal.tsx      # Safe cURL/Python/TypeScript export dialog
│   │   ├── ConversationEditor.tsx # Message thread management & starter presets
│   │   ├── ConversationsSidebar.tsx # Local history drawer (rename, reload, delete)
│   │   ├── Header.tsx         # Application header with status indicators
│   │   ├── MessageItem.tsx    # Single message card (roles, ordering, attachments)
│   │   ├── MetricsBar.tsx     # Performance telemetry (Elapsed, TTFT, Speed, Cost)
│   │   ├── ModelSelector.tsx  # Dynamic model slot dropdown with setup alerts
│   │   ├── PromptInputBar.tsx # Multiline prompt editor with Run/Stop controls
│   │   ├── SettingsPanel.tsx  # Generation parameter sliders & model specs
│   │   └── StreamingResponseArea.tsx # Real-time response stream viewer
│   ├── config/
│   │   └── models.ts          # Central model registry & slot declarations
│   ├── lib/
│   │   ├── code-generator.ts  # Code snippet generators
│   │   ├── providers/
│   │   │   ├── types.ts       # Shared provider adapter interface & types
│   │   │   ├── sse.ts         # Server-Sent Event encoding & cost calculators
│   │   │   ├── groq.ts        # Groq Cloud API adapter
│   │   │   ├── openai.ts      # OpenAI API adapter
│   │   │   ├── anthropic.ts   # Anthropic API adapter
│   │   │   ├── mock.ts        # Demo / Offline simulated provider
│   │   │   └── registry.ts    # Central adapter dispatcher & configuration validator
│   │   ├── rate-limiter.ts    # In-memory sliding window rate limiter
│   │   └── storage.ts         # LocalStorage persistence helpers
│   └── types/
│       └── index.ts           # Core UI & session data structures
```

---

## Getting Started

### 1. Prerequisites
- Node.js (v18.0.0 or later recommended; tested on v26+)
- npm or pnpm

### 2. Installation
```bash
# Clone the repository
cd "groq playground"

# Install dependencies
npm install
```

### 3. Environment Configuration
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```

Edit `.env.local` to configure your API keys and model choices:
```env
# Add your provider keys:
GROQ_API_KEY=your_groq_api_key_here
OPENAI_API_KEY=your_openai_api_key_here

# (Optional) Override placeholder model IDs:
MODEL_FAST_ID=llama-3.1-8b-instant
MODEL_REASONING_ID=llama-3.3-70b-versatile
MODEL_BUDGET_ID=gemma2-9b-it
MODEL_VISION_ID=llama-3.2-11b-vision-preview

# Demo fallback mode (set to true to test the UI and streaming without keys):
ENABLE_DEMO_MOCK=true
```

> **Security Note**: Never commit `.env.local` or any file containing real API keys. API keys are strictly kept on the server and never sent to the browser.

### 4. Running the Application Locally
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your web browser.

---

## Managing Models & Providers

All model definitions reside in a single configuration file: [`src/config/models.ts`](src/config/models.ts).

### Adding a New Model
To add or customize a model, update `MODEL_REGISTRY` in `src/config/models.ts`:

```typescript
{
  id: 'custom-model',
  slot: 1,
  name: 'Custom High-Speed Model',
  category: 'fast',
  provider: 'groq', // 'groq' | 'openai' | 'anthropic'
  providerModelId: process.env.MODEL_CUSTOM_ID || 'your-model-id-here',
  description: 'Custom description for the UI.',
  contextLimit: 65536,
  maxOutputTokensDefault: 2048,
  maxOutputTokensLimit: 4096,
  temperatureDefault: 0.7,
  capabilities: {
    supportsStreaming: true,
    supportsVision: false,
    supportsTemperature: true,
    supportsTopP: true,
    supportsMaxTokens: true,
  },
  pricing: {
    inputPerMillion: 0.10,
    outputPerMillion: 0.20,
  },
  requiredEnvVar: 'GROQ_API_KEY',
  setupHint: 'Add GROQ_API_KEY in .env.local to activate.',
}
```

### Adding a New Provider Adapter
1. Implement the `ProviderAdapter` interface defined in [`src/lib/providers/types.ts`](src/lib/providers/types.ts).
2. Register the new adapter instance in [`src/lib/providers/registry.ts`](src/lib/providers/registry.ts).

---

## Remaining Setup Required for Real-World Deployment

1. **Provider Credentials**: Provide valid, active API keys (`GROQ_API_KEY`, etc.) in `.env.local`.
2. **Model Availability**: Ensure model IDs specified in configuration are currently provisioned and accessible on your provider account tier.
3. **Authentication & Multi-Tenancy**: The playground currently uses IP-based rate limiting and client-side `localStorage`. For multi-user deployments, implement user auth (e.g. NextAuth) and a persistent database (PostgreSQL/Supabase).
