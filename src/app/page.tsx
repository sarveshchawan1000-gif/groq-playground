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
import { SavedConversation, UserPreferences } from '@/types';
import {
  getSavedConversations,
  saveConversations,
  getUserPreferences,
  saveUserPreferences,
  DEFAULT_SETTINGS,
} from '@/lib/storage';
import { Sparkles, MessageSquare, Zap, Brain, PiggyBank } from 'lucide-react';

const FALLBACK_MODELS: ClientModelInfo[] = [
  {
    id: 'fast-model',
    slot: 1,
    name: 'Fast Model',
    category: 'fast',
    provider: 'groq',
    providerModelId: 'openai/gpt-oss-20b',
    description: 'Ultra-low latency, high throughput.',
    contextLimit: 131072,
    maxOutputTokensDefault: 2048,
    maxOutputTokensLimit: 8192,
    temperatureDefault: 0.7,
    capabilities: { supportsStreaming: true, supportsVision: false, supportsTemperature: true, supportsTopP: true, supportsMaxTokens: true },
    requiredEnvVar: 'GROQ_API_KEY',
    setupHint: 'Add GROQ_API_KEY to .env.local',
    isConfigured: true,
    isMockFallback: true,
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

  // Load data on mount
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
        console.error('Failed to load models', err);
      }
    }
    loadData();
  }, []);

  // Persist preferences
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
    const snippet = firstUser?.content.trim().slice(0, 40) || 'New Conversation';
    const title = snippet.length >= 40 ? `${snippet}…` : snippet;
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

  const handleCopyMessage = async (content: string, id?: string) => {
    try {
      await navigator.clipboard.writeText(content);
      if (id) {
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
      }
    } catch {}
  };

  const handleExecute = async (messagesToRun: ChatMessage[]) => {
    if (messagesToRun.length === 0) return;

    setErrorMessage(null);
    setStreamingResponse('');
    setMetrics(null);
    setIsStreaming(true);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    // Build messages with optional system prompt
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
        let errText = `Error ${res.status}: ${res.statusText}`;
        try {
          const j = await res.json();
          if (j.error) errText = j.error;
        } catch {}
        setErrorMessage(errText);
        setIsStreaming(false);
        return;
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error('No response stream');

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
                setStreamingResponse((p) => p + payload.text);
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
      setErrorMessage(err instanceof Error ? err.message : 'Unknown error');
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

  // Keyboard shortcut: Escape stops generation
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
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100dvh',
      background: '#0a0a0f',
      color: '#f0f0f4',
      overflow: 'hidden',
    }}>
      {/* Top nav */}
      <Header
        selectedModel={selectedModel}
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={() => setIsSidebarOpen((v) => !v)}
        isSettingsOpen={isSettingsOpen}
        onToggleSettings={() => setIsSettingsOpen((v) => !v)}
        onOpenCodeModal={() => setIsCodeModalOpen(true)}
        onReturnToMain={handleClear}
      />

      {/* Body */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden', position: 'relative' }}>
        {/* Left sidebar */}
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

        {/* Main chat column */}
        <main style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          minWidth: 0,
        }}>
          {/* Model selector bar */}
          <div style={{
            padding: '10px 16px',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            background: 'rgba(10,10,15,0.8)',
            backdropFilter: 'blur(8px)',
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}>
            <div style={{ maxWidth: 360, flex: 1 }}>
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
            </div>
            {messages.length > 0 && (
              <button
                type="button"
                onClick={handleClear}
                style={{
                  fontSize: 12, color: '#606070',
                  background: 'none', border: '1px solid rgba(255,255,255,0.07)',
                  borderRadius: 7, padding: '5px 10px',
                  cursor: 'pointer', transition: 'color 0.15s',
                }}
              >
                Clear
              </button>
            )}
          </div>

          {/* Chat area */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: '0 16px',
          }}>
            <div style={{ maxWidth: 740, margin: '0 auto' }}>
              {isEmpty ? (
                /* Empty state */
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minHeight: 'calc(100vh - 240px)',
                  textAlign: 'center',
                  padding: '40px 0',
                }}>
                  <div style={{
                    width: 52, height: 52, borderRadius: 14,
                    background: 'linear-gradient(135deg, rgba(79,142,247,0.2) 0%, rgba(167,139,250,0.2) 100%)',
                    border: '1px solid rgba(79,142,247,0.2)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    marginBottom: 16,
                  }}>
                    <Sparkles style={{ width: 22, height: 22, color: '#4f8ef7' }} />
                  </div>
                  <h1 style={{ fontSize: 20, fontWeight: 700, color: '#f0f0f4', marginBottom: 8, letterSpacing: '-0.02em' }}>
                    Aether<span style={{ color: '#4f8ef7' }}>Studio</span>
                  </h1>
                  <p style={{ fontSize: 14, color: '#606070', maxWidth: 340, lineHeight: 1.7, marginBottom: 32 }}>
                    Chat with AI models. Adjust settings, stream responses, and save your conversations.
                  </p>

                  {/* Quick start cards */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10, width: '100%', maxWidth: 600 }}>
                    {[
                      { icon: <Zap style={{ width: 14, height: 14 }} />, color: '#4f8ef7', label: 'Quick question', prompt: 'Explain quantum entanglement in simple terms.' },
                      { icon: <Brain style={{ width: 14, height: 14 }} />, color: '#a78bfa', label: 'Code help', prompt: 'Write a TypeScript function to debounce async operations.' },
                      { icon: <PiggyBank style={{ width: 14, height: 14 }} />, color: '#3ecf8e', label: 'Summarize', prompt: 'Summarize the key benefits of transformer architecture in AI.' },
                      { icon: <MessageSquare style={{ width: 14, height: 14 }} />, color: '#f59e0b', label: 'Creative', prompt: 'Write a short story about an AI that learns to dream.' },
                    ].map(({ icon, color, label, prompt }) => (
                      <button
                        key={label}
                        type="button"
                        onClick={() => { setInputPrompt(prompt); }}
                        style={{
                          padding: '12px 14px',
                          background: 'rgba(255,255,255,0.03)',
                          border: '1px solid rgba(255,255,255,0.07)',
                          borderRadius: 10,
                          cursor: 'pointer',
                          textAlign: 'left',
                          transition: 'all 0.15s',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 6,
                        }}
                        onMouseEnter={(e) => {
                          (e.currentTarget as HTMLElement).style.borderColor = `${color}40`;
                          (e.currentTarget as HTMLElement).style.background = `${color}08`;
                        }}
                        onMouseLeave={(e) => {
                          (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.07)';
                          (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.03)';
                        }}
                      >
                        <span style={{ color, display: 'flex', alignItems: 'center', gap: 5 }}>
                          {icon}
                          <span style={{ fontSize: 12, fontWeight: 600, color: '#9898a8' }}>{label}</span>
                        </span>
                        <span style={{ fontSize: 11, color: '#606070', lineHeight: 1.5 }}>
                          {prompt.slice(0, 55)}…
                        </span>
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
                  onCopyMessage={(content) => {
                    // Find matching message id
                    const msg = messages.find((m) => m.content === content);
                    handleCopyMessage(content, msg?.id);
                  }}
                  copiedId={copiedId}
                />
              )}
            </div>
          </div>

          {/* Input area */}
          <div style={{
            padding: '12px 16px 16px',
            background: 'linear-gradient(to top, #0a0a0f 80%, transparent)',
            flexShrink: 0,
          }}>
            <div style={{ maxWidth: 740, margin: '0 auto' }}>
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

        {/* Right settings panel */}
        {isSettingsOpen && (
          <div style={{ display: 'flex' }} className="hidden lg:flex">
            <SettingsPanel
              settings={settings}
              onUpdateSettings={(s) => setSettings((prev) => ({ ...prev, ...s }))}
              selectedModel={selectedModel}
              isOpen={isSettingsOpen}
              onClose={() => setIsSettingsOpen(false)}
            />
          </div>
        )}
        {/* Mobile settings */}
        <div className="lg:hidden">
          <SettingsPanel
            settings={settings}
            onUpdateSettings={(s) => setSettings((prev) => ({ ...prev, ...s }))}
            selectedModel={selectedModel}
            isOpen={isSettingsOpen}
            onClose={() => setIsSettingsOpen(false)}
          />
        </div>
      </div>

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
