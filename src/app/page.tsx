'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Header } from '@/components/Header';
import { ModelSelector } from '@/components/ModelSelector';
import { ChatThread } from '@/components/ChatThread';
import { InputArea } from '@/components/InputArea';
import { SettingsPanel } from '@/components/SettingsPanel';
import { CodeModal } from '@/components/CodeModal';
import { ConversationsSidebar } from '@/components/ConversationsSidebar';
import { ClientModelInfo } from '@/config/models';
import { ChatMessage, GenerationSettings, RequestMetrics } from '@/lib/providers/types';
import { SavedConversation } from '@/types';
import {
  getSavedConversations,
  saveConversations,
  getUserPreferences,
  saveUserPreferences,
  DEFAULT_SETTINGS,
} from '@/lib/storage';
import { Sparkles, MessageSquare, Zap, Brain, Terminal, Trash2 } from 'lucide-react';

const FALLBACK_MODELS: ClientModelInfo[] = [
  {
    id: 'fast-model',
    slot: 1,
    name: 'Fast Model (Low Latency)',
    category: 'fast',
    provider: 'groq',
    providerModelId: 'openai/gpt-oss-20b',
    description: 'Engineered for low latency and high throughput.',
    contextLimit: 131072,
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
    requiredEnvVar: 'GROQ_API_KEY',
    setupHint: 'Add GROQ_API_KEY in .env.local to activate.',
    isConfigured: true,
    isMockFallback: false,
  },
];

export default function PlaygroundPage() {
  const [models, setModels] = useState<ClientModelInfo[]>(FALLBACK_MODELS);
  const [selectedModel, setSelectedModel] = useState<ClientModelInfo>(FALLBACK_MODELS[0]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [systemPrompt, setSystemPrompt] = useState('');
  const [inputPrompt, setInputPrompt] = useState('');
  const [settings, setSettings] = useState<GenerationSettings>(DEFAULT_SETTINGS);

  const [streamingResponse, setStreamingResponse] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<RequestMetrics | null>(null);

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isCodeModalOpen, setIsCodeModalOpen] = useState(false);

  const [savedConversations, setSavedConversations] = useState<SavedConversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);

  // Load initial preferences & fetch models
  useEffect(() => {
    async function loadData() {
      const prefs = getUserPreferences();
      setSettings(prefs.settings);
      setIsSidebarOpen(prefs.sidebarOpen);
      setIsSettingsOpen(prefs.settingsOpen);

      const convos = getSavedConversations();
      setSavedConversations(convos);

      try {
        const res = await fetch('/api/models');
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.models) && data.models.length > 0) {
            setModels(data.models);
            const preferred = data.models.find((m: ClientModelInfo) => m.id === prefs.selectedModelId);
            const fallback = data.models.find((m: ClientModelInfo) => m.isConfigured) || data.models[0];
            const chosen = preferred || fallback;
            setSelectedModel(chosen);
            setSettings((prev) => ({
              ...prev,
              temperature: chosen.temperatureDefault ?? prev.temperature,
              maxTokens: chosen.maxOutputTokensDefault ?? prev.maxTokens,
            }));
          }
        }
      } catch (err) {
        console.error('Failed to load models:', err);
      }
    }
    loadData();
  }, []);

  // Save preferences
  useEffect(() => {
    saveUserPreferences({
      selectedModelId: selectedModel.id,
      settings,
      sidebarOpen: isSidebarOpen,
      settingsOpen: isSettingsOpen,
    });
  }, [selectedModel.id, settings, isSidebarOpen, isSettingsOpen]);

  // Auto-save conversation
  const autoSave = useCallback((msgs: ChatMessage[]) => {
    if (msgs.length === 0) return;
    const firstUser = msgs.find((m) => m.role === 'user');
    const snippet = firstUser?.content.trim().slice(0, 36) || 'Playground Session';
    const title = snippet.length >= 36 ? `${snippet}...` : snippet;
    const now = Date.now();

    setSavedConversations((prev) => {
      let updated: SavedConversation[];
      if (activeConversationId) {
        updated = prev.map((c) =>
          c.id === activeConversationId
            ? { ...c, messages: msgs, modelId: selectedModel.id, settings, updatedAt: now }
            : c
        );
      } else {
        const newId = `convo_${now}_${Math.random().toString(36).slice(2, 7)}`;
        setActiveConversationId(newId);
        updated = [{ id: newId, title, updatedAt: now, modelId: selectedModel.id, messages: msgs, settings }, ...prev];
      }
      saveConversations(updated);
      return updated;
    });
  }, [activeConversationId, selectedModel.id, settings]);

  const handleClear = () => {
    abortControllerRef.current?.abort();
    setMessages([]);
    setInputPrompt('');
    setStreamingResponse('');
    setErrorMessage(null);
    setMetrics(null);
    setActiveConversationId(null);
  };

  const handleCopyMessage = async (content: string, id: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error('Failed to copy message:', err);
    }
  };

  const handleExecute = async (messagesToRun: ChatMessage[]) => {
    if (messagesToRun.length === 0) return;

    setErrorMessage(null);
    setStreamingResponse('');
    setMetrics(null);
    setIsStreaming(true);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    const allMessages: ChatMessage[] = systemPrompt.trim()
      ? [
          { id: 'sys-prompt', role: 'system', content: systemPrompt.trim() },
          ...messagesToRun.filter((m) => m.role !== 'system'),
        ]
      : messagesToRun.filter((m) => m.role !== 'system');

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ modelId: selectedModel.id, messages: allMessages, settings }),
        signal: controller.signal,
      });

      if (!res.ok) {
        let errText = `Server returned status ${res.status} (${res.statusText})`;
        try {
          const j = await res.json();
          if (j.error) errText = j.error;
        } catch {}
        setErrorMessage(errText);
        setIsStreaming(false);
        return;
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error('Response body unavailable.');

      const decoder = new TextDecoder();
      let buffer = '';
      let accumulated = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith('event:')) continue;
          if (trimmed.startsWith('data: ')) {
            try {
              const payload = JSON.parse(trimmed.slice(6));
              if (payload.text !== undefined) {
                accumulated += payload.text;
                setStreamingResponse((prev) => prev + payload.text);
              }
              if (payload.metrics) setMetrics(payload.metrics);
              if (payload.error) setErrorMessage(payload.error);
            } catch {}
          }
        }
      }

      if (accumulated.trim()) {
        const assistantMsg: ChatMessage = {
          id: `msg_asst_${Date.now()}`,
          role: 'assistant',
          content: accumulated,
        };
        const nextMessages = [...messagesToRun, assistantMsg];
        setMessages(nextMessages);
        setStreamingResponse('');
        autoSave(nextMessages);
      }
    } catch (err: unknown) {
      if (controller.signal.aborted) return;
      setErrorMessage(err instanceof Error ? err.message : 'Unknown generation failure.');
    } finally {
      setIsStreaming(false);
      abortControllerRef.current = null;
    }
  };

  const handleSubmit = () => {
    let next = [...messages];
    if (inputPrompt.trim()) {
      const userMsg: ChatMessage = {
        id: `msg_${Date.now()}`,
        role: 'user',
        content: inputPrompt.trim(),
      };
      next = [...next, userMsg];
      setMessages(next);
      setInputPrompt('');
    }
    if (next.length === 0) return;
    handleExecute(next);
  };

  const handleStop = () => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    setIsStreaming(false);
  };

  const handleRetry = () => {
    let toRun = [...messages];
    if (toRun.length > 0 && toRun[toRun.length - 1].role === 'assistant') {
      toRun = toRun.slice(0, -1);
      setMessages(toRun);
    }
    setStreamingResponse('');
    setErrorMessage(null);
    handleExecute(toRun);
  };

  const handleSelectConversation = (convo: SavedConversation) => {
    setActiveConversationId(convo.id);
    setMessages(convo.messages.filter((m) => m.role !== 'system'));
    setSettings(convo.settings);
    const model = models.find((m) => m.id === convo.modelId);
    if (model) setSelectedModel(model);
    setStreamingResponse('');
    setErrorMessage(null);
    setMetrics(null);
    setIsSidebarOpen(false);
  };

  // Keyboard shortcut: Escape stops active generation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isStreaming) handleStop();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isStreaming]);

  const chatMessages = messages.filter((m) => m.role !== 'system');
  const isEmpty = chatMessages.length === 0 && !isStreaming && !errorMessage;

  return (
    <div className="flex flex-col h-screen max-h-screen bg-[#0b0f19] text-slate-100 overflow-hidden font-sans">
      {/* Header */}
      <Header
        selectedModel={selectedModel}
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
        isSettingsOpen={isSettingsOpen}
        onToggleSettings={() => setIsSettingsOpen((prev) => !prev)}
        onOpenCodeModal={() => setIsCodeModalOpen(true)}
        onReturnToMain={handleClear}
      />

      {/* Main Workspace */}
      <div className="flex-1 flex overflow-hidden min-h-0 relative">
        {/* Left History Sidebar */}
        <ConversationsSidebar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          conversations={savedConversations}
          activeConversationId={activeConversationId}
          onSelectConversation={handleSelectConversation}
          onNewConversation={handleClear}
          onRenameConversation={(id, t) =>
            setSavedConversations((prev) => {
              const u = prev.map((c) => (c.id === id ? { ...c, title: t } : c));
              saveConversations(u);
              return u;
            })
          }
          onDeleteConversation={(id) => {
            setSavedConversations((prev) => {
              const u = prev.filter((c) => c.id !== id);
              saveConversations(u);
              return u;
            });
            if (activeConversationId === id) setActiveConversationId(null);
          }}
        />

        {/* Center Stage: Chat stream & input */}
        <main className="flex-1 flex flex-col min-w-0 h-full overflow-hidden relative">
          {/* Model selection toolbar */}
          <div className="flex-shrink-0 px-4 sm:px-6 py-2.5 border-b border-white/[0.08] bg-[#0b0f19]/80 backdrop-blur-sm z-10 flex items-center justify-between gap-3">
            <ModelSelector
              models={models}
              selectedModel={selectedModel}
              onSelectModel={(m) => {
                setSelectedModel(m);
                setSettings((prev) => ({
                  ...prev,
                  temperature: m.temperatureDefault ?? prev.temperature,
                  maxTokens: m.maxOutputTokensDefault ?? prev.maxTokens,
                }));
              }}
            />

            {messages.length > 0 && (
              <button
                type="button"
                onClick={handleClear}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-400 hover:text-white bg-slate-800/60 hover:bg-slate-800 border border-white/[0.08] rounded-lg transition-colors"
                title="Clear conversation"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Clear</span>
              </button>
            )}
          </div>

          {/* Chat Messages Area */}
          <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 min-h-0">
            <div className="max-w-3xl mx-auto">
              {isEmpty ? (
                /* Empty state */
                <div className="flex flex-col items-center justify-center min-h-[60vh] text-center py-10">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-sky-500/20 via-indigo-500/20 to-emerald-500/20 border border-sky-500/30 flex items-center justify-center mb-4 shadow-lg shadow-sky-500/10">
                    <Sparkles className="w-6 h-6 text-sky-400" />
                  </div>
                  <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight mb-2">
                    Aether<span className="text-sky-400">Studio</span> Playground
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-400 max-w-md leading-relaxed mb-8">
                    High-speed multi-model AI workspace. Select a model, configure parameters, and stream responses with real-time latency metrics.
                  </p>

                  {/* Starter Prompts */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-xl text-left">
                    {[
                      {
                        icon: <Zap className="w-4 h-4 text-sky-400" />,
                        title: 'Fast Query',
                        prompt: 'Explain how token streaming works over Server-Sent Events.',
                      },
                      {
                        icon: <Brain className="w-4 h-4 text-purple-400" />,
                        title: 'Coding Task',
                        prompt: 'Write a clean TypeScript debounce hook with cancellation.',
                      },
                      {
                        icon: <Terminal className="w-4 h-4 text-emerald-400" />,
                        title: 'SQL Architecture',
                        prompt: 'Design an indexing strategy for a high-write time series database.',
                      },
                      {
                        icon: <MessageSquare className="w-4 h-4 text-amber-400" />,
                        title: 'Logical Deduction',
                        prompt: 'Why did MS Dhoni retire from Test and international cricket?',
                      },
                    ].map((card) => (
                      <button
                        key={card.title}
                        type="button"
                        onClick={() => setInputPrompt(card.prompt)}
                        className="group p-3.5 rounded-xl border border-white/[0.08] bg-slate-900/60 hover:bg-slate-800/80 hover:border-sky-500/30 transition-all text-left"
                      >
                        <div className="flex items-center gap-2 mb-1">
                          {card.icon}
                          <span className="text-xs font-semibold text-slate-200">
                            {card.title}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                          {card.prompt}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <ChatThread
                  messages={messages}
                  streamingContent={streamingResponse}
                  isStreaming={isStreaming}
                  errorMessage={errorMessage}
                  metrics={metrics}
                  modelName={selectedModel.name}
                  onRetry={handleRetry}
                  onCopyMessage={handleCopyMessage}
                  copiedId={copiedId}
                />
              )}
            </div>
          </div>

          {/* Bottom Prompt Composer */}
          <div className="flex-shrink-0 px-4 sm:px-6 pb-4 pt-2 bg-gradient-to-t from-[#0b0f19] via-[#0b0f19]/95 to-transparent z-10">
            <div className="max-w-3xl mx-auto">
              <InputArea
                inputPrompt={inputPrompt}
                onInputChange={setInputPrompt}
                onSubmit={handleSubmit}
                onStop={handleStop}
                isStreaming={isStreaming}
                isModelConfigured={selectedModel.isConfigured}
                supportsVision={selectedModel.capabilities.supportsVision}
                systemPrompt={systemPrompt}
                onSystemPromptChange={setSystemPrompt}
                hasMessages={messages.length > 0}
              />
            </div>
          </div>
        </main>

        {/* Right Parameters Sidebar */}
        <SettingsPanel
          settings={settings}
          onUpdateSettings={(s) => setSettings((prev) => ({ ...prev, ...s }))}
          selectedModel={selectedModel}
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
        />
      </div>

      {/* Code Export Modal */}
      <CodeModal
        isOpen={isCodeModalOpen}
        onClose={() => setIsCodeModalOpen(false)}
        selectedModel={selectedModel}
        messages={messages}
        settings={settings}
      />
    </div>
  );
}
