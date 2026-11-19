import { ChatMessage, GenerationSettings } from '@/lib/providers/types';
import { ClientModelInfo } from '@/config/models';

export function generateCurlCode(
  model: ClientModelInfo,
  messages: ChatMessage[],
  settings: GenerationSettings
): string {
  const payload = {
    model: model.providerModelId,
    messages: messages.map((m) => ({
      role: m.role,
      content: m.content,
    })),
    temperature: settings.temperature,
    max_tokens: settings.maxTokens,
    top_p: settings.topP,
    stream: settings.stream,
  };

  const endpoint = model.provider === 'anthropic'
    ? 'https://api.anthropic.com/v1/messages'
    : model.provider === 'openai'
    ? 'https://api.openai.com/v1/chat/completions'
    : 'https://api.groq.com/openai/v1/chat/completions';

  const authHeader = model.provider === 'anthropic'
    ? '-H "x-api-key: $ANTHROPIC_API_KEY" \\\n  -H "anthropic-version: 2023-06-01"'
    : `-H "Authorization: Bearer \$${model.requiredEnvVar || 'API_KEY'}"`;

  return `curl -X POST "${endpoint}" \\
  -H "Content-Type: application/json" \\
  ${authHeader} \\
  -d '${JSON.stringify(payload, null, 2)}'`;
}

export function generatePythonCode(
  model: ClientModelInfo,
  messages: ChatMessage[],
  settings: GenerationSettings
): string {
  const messagesFormatted = JSON.stringify(
    messages.map((m) => ({ role: m.role, content: m.content })),
    null,
    4
  );

  if (model.provider === 'anthropic') {
    return `import os
import anthropic

client = anthropic.Anthropic(
    api_key=os.environ.get("${model.requiredEnvVar}", "YOUR_ANTHROPIC_API_KEY")
)

response = client.messages.create(
    model="${model.providerModelId}",
    max_tokens=${settings.maxTokens},
    temperature=${settings.temperature},
    messages=${messagesFormatted}
)

print(response.content[0].text)`;
  }

  // Standard OpenAI/Groq compatible SDK
  const clientInit = model.provider === 'groq'
    ? `from groq import Groq\n\nclient = Groq(api_key=os.environ.get("${model.requiredEnvVar}", "YOUR_GROQ_API_KEY"))`
    : `from openai import OpenAI\n\nclient = OpenAI(api_key=os.environ.get("${model.requiredEnvVar}", "YOUR_OPENAI_API_KEY"))`;

  return `import os
${clientInit}

completion = client.chat.completions.create(
    model="${model.providerModelId}",
    messages=${messagesFormatted},
    temperature=${settings.temperature},
    max_tokens=${settings.maxTokens},
    top_p=${settings.topP},
    stream=${settings.stream ? 'True' : 'False'},
)

${settings.stream ? `for chunk in completion:\n    if chunk.choices[0].delta.content:\n        print(chunk.choices[0].delta.content, end="", flush=True)` : `print(completion.choices[0].message.content)`}`;
}

export function generateTypeScriptCode(
  model: ClientModelInfo,
  messages: ChatMessage[],
  settings: GenerationSettings
): string {
  const payload = {
    model: model.providerModelId,
    messages: messages.map((m) => ({
      role: m.role,
      content: m.content,
    })),
    temperature: settings.temperature,
    max_tokens: settings.maxTokens,
    top_p: settings.topP,
    stream: settings.stream,
  };

  const endpoint = model.provider === 'anthropic'
    ? 'https://api.anthropic.com/v1/messages'
    : model.provider === 'openai'
    ? 'https://api.openai.com/v1/chat/completions'
    : 'https://api.groq.com/openai/v1/chat/completions';

  return `// Execute client-safe or server-side request
async function runPlaygroundQuery() {
  const response = await fetch("${endpoint}", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer " + (process.env.${model.requiredEnvVar} || "YOUR_API_KEY"),
    },
    body: JSON.stringify(${JSON.stringify(payload, null, 4)}),
  });

  if (!response.ok) {
    throw new Error(\`Request failed with status \${response.status}\`);
  }

  const reader = response.body?.getReader();
  const decoder = new TextDecoder();

  while (reader) {
    const { done, value } = await reader.read();
    if (done) break;
    process.stdout.write(decoder.decode(value));
  }
}

runPlaygroundQuery().catch(console.error);`;
}
