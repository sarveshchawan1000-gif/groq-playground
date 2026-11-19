'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Header } from '@/components/Header';
import { ModelSelector } from '@/components/ModelSelector';
import { ConversationEditor } from '@/components/ConversationEditor';
import { PromptInputBar } from '@/components/PromptInputBar';
import { StreamingResponseArea } from '@/components/StreamingResponseArea';
import { SettingsPanel } from '@/components/SettingsPanel';
import { CodeModal } from '@/components/CodeModal';
import { ConversationsSidebar } from '@/components/ConversationsSidebar';
import { ClientModelInfo } from '@/config/models';
import {
  ChatMessage,
  Role,
  GenerationSettings,
  RequestMetrics,
  ImageAttachment,
} from '@/lib/providers/types';
import {
  SavedConversation,
  UserPreferences,
} from '@/types';
import {
  getSavedConversations,
  saveConversations,
  getUserPreferences,
  saveUserPreferences,
  DEFAULT_SETTINGS,
} from '@/lib/storage';
import { Sparkles, AlertTriangle } from 'lucide-react';

const FALLBACK_MODELS: ClientModelInfo[] = [
  {
    id: 'fast-model',
    slot: 1,
    name: 'Fast Model (Low Latency)',
    category: 'fast',
    provider: 'groq',
    providerModelId: 'llama-3.1-8b-instant',
    description: 'Engineered for near-instant responses, ultra-low TTFT, and high throughput.',
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
    setupHint: 'Add GROQ_API_KEY in .env.local to activate the high-speed engine.',
    isConfigured: true,
    isMockFallback: true,
  },
];

export default function PlaygroundPage() {
  // --- State Initialization ---
  const [models, setModels] = useState<ClientModelInfo[]>(FALLBACK_MODELS);
  const [selectedModel, setSelectedModel] = useState<ClientModelInfo>(FALLBACK_MODELS[0]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputPrompt, setInputPrompt] = useState('');
  const [promptAttachments, setPromptAttachments] = useState<ImageAttachment[]>([]);
  const [settings, setSettings] = useState<GenerationSettings>(DEFAULT_SETTINGS);

  // Response & Streaming state
  const [streamingResponse, setStreamingResponse] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<RequestMetrics | null>(null);

  // Layout & UI Modals
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(true);
  const [isCodeModalOpen, setIsCodeModalOpen] = useState(false);

  // Saved Conversations state
  const [savedConversations, setSavedConversations] = useState<SavedConversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);

  // Abort controller ref for stop button
  const abortControllerRef = useRef<AbortController | null>(null);

  // 1. Load initial models from /api/models and load localStorage
  useEffect(() => {
    async function loadData() {
      // Load preferences from localStorage
      const prefs = getUserPreferences();
      setSettings(prefs.settings);
      setIsSidebarOpen(prefs.sidebarOpen);
      setIsSettingsOpen(prefs.settingsOpen);

      // Load saved conversations
      const convos = getSavedConversations();
      setSavedConversations(convos);

      try {
        const res = await fetch('/api/models');
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.models) && data.models.length > 0) {
            setModels(data.models);

            // Match preferred model or pick first configured
            const preferred = data.models.find((m: ClientModelInfo) => m.id === prefs.selectedModelId);
            const fallback = data.models.find((m: ClientModelInfo) => m.isConfigured) || data.models[0];
            const chosen = preferred || fallback;
            setSelectedModel(chosen);

            // Sync settings default for chosen model
            setSettings((prev) => ({
              ...prev,
              temperature: chosen.temperatureDefault ?? prev.temperature,
              maxTokens: chosen.maxOutputTokensDefault ?? prev.maxTokens,
            }));
          }
        }
      } catch (err) {
        console.error('Failed to fetch models from API', err);
      }
    }

    loadData();
  }, []);

  // 2. Persist preferences on change
  useEffect(() => {
    saveUserPreferences({
      selectedModelId: selectedModel.id,
      settings,
      sidebarOpen: isSidebarOpen,
      settingsOpen: isSettingsOpen,
    });
  }, [selectedModel.id, settings, isSidebarOpen, isSettingsOpen]);

  // 3. Auto-save current conversation to local storage
  const autoSaveConversation = useCallback(
    (currentMessages: ChatMessage[]) => {
      if (currentMessages.length === 0) return;

      const firstUserMsg = currentMessages.find((m) => m.role === 'user');
      const snippet = firstUserMsg?.content.trim().slice(0, 36) || 'Playground Session';
      const title = snippet.length >= 36 ? `${snippet}...` : snippet;

      setSavedConversations((prev) => {
        let updated: SavedConversation[];
        const now = Date.now();

        if (activeConversationId) {
          updated = prev.map((c) =>
            c.id === activeConversationId
              ? {
                  ...c,
                  messages: currentMessages,
                  modelId: selectedModel.id,
                  settings,
                  updatedAt: now,
                }
              : c
          );
        } else {
          const newId = `convo_${now}_${Math.random().toString(36).substring(2, 7)}`;
          setActiveConversationId(newId);
          const newConvo: SavedConversation = {
            id: newId,
            title,
            updatedAt: now,
            modelId: selectedModel.id,
            messages: currentMessages,
            settings,
          };
          updated = [newConvo, ...prev];
        }

        saveConversations(updated);
        return updated;
      });
    },
    [activeConversationId, selectedModel.id, settings]
  );

  // --- Message manipulation handlers ---
  const handleUpdateMessageContent = (id: string, content: string) => {
    setMessages((prev) => {
      const updated = prev.map((m) => (m.id === id ? { ...m, content } : m));
      return updated;
    });
  };

  const handleUpdateMessageRole = (id: string, role: Role) => {
    setMessages((prev) =>
      prev.map((m) => (m.id === id ? { ...m, role } : m))
    );
  };

  const handleAddAttachment = (id: string, file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (result) {
        setMessages((prev) =>
          prev.map((m) => {
            if (m.id === id) {
              const currentAttachments = m.attachments || [];
              return {
                ...m,
                attachments: [...currentAttachments, { type: 'image_url', image_url: { url: result } }],
              };
            }
            return m;
          })
        );
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveAttachment = (id: string, attachmentIndex: number) => {
    setMessages((prev) =>
      prev.map((m) => {
        if (m.id === id && m.attachments) {
          return {
            ...m,
            attachments: m.attachments.filter((_, idx) => idx !== attachmentIndex),
          };
        }
        return m;
      })
    );
  };

  const handleMoveUp = (index: number) => {
    if (index <= 0) return;
    setMessages((prev) => {
      const copy = [...prev];
      const temp = copy[index - 1];
      copy[index - 1] = copy[index];
      copy[index] = temp;
      return copy;
    });
  };

  const handleMoveDown = (index: number) => {
    setMessages((prev) => {
      if (index >= prev.length - 1) return prev;
      const copy = [...prev];
      const temp = copy[index + 1];
      copy[index + 1] = copy[index];
      copy[index] = temp;
      return copy;
    });
  };

  const handleDeleteMessage = (id: string) => {
    setMessages((prev) => prev.filter((m) => m.id !== id));
  };

  const handleAddMessage = (role: Role) => {
    const newMessage: ChatMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      role,
      content: '',
    };
    setMessages((prev) => [...prev, newMessage]);
  };

  const handleLoadTemplate = (templateMessages: ChatMessage[]) => {
    setMessages(templateMessages);
    setStreamingResponse('');
    setErrorMessage(null);
    setMetrics(null);
  };

  const handleClear = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setMessages([]);
    setInputPrompt('');
    setStreamingResponse('');
    setErrorMessage(null);
    setMetrics(null);
    setActiveConversationId(null);
  };

  // --- Generation & Run Execution ---
  const handleExecuteRequest = async (messagesToRun: ChatMessage[]) => {
    if (messagesToRun.length === 0) return;

    // Reset run states
    setErrorMessage(null);
    setStreamingResponse('');
    setMetrics(null);
    setIsStreaming(true);

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          modelId: selectedModel.id,
          messages: messagesToRun,
          settings,
        }),
        signal: abortController.signal,
      });

      if (!response.ok) {
        let errText = `Server responded with ${response.status} (${response.statusText})`;
        try {
          const errJson = await response.json();
          if (errJson.error) {
            errText = errJson.error;
          }
        } catch {
          // ignore
        }
        setErrorMessage(errText);
        setIsStreaming(false);
        return;
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('Response stream body unavailable.');
      }

      const decoder = new TextDecoder();
      let buffer = '';
      let accumulatedText = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) continue;

          if (trimmed.startsWith('event: ')) {
            // SSE event declaration
            continue;
          }

          if (trimmed.startsWith('data: ')) {
            const dataStr = trimmed.slice(6).trim();
            try {
              const payload = JSON.parse(dataStr);

              if (payload.text !== undefined) {
                accumulatedText += payload.text;
                setStreamingResponse((prev) => prev + payload.text);
              }

              if (payload.metrics) {
                setMetrics(payload.metrics);
              }

              if (payload.error) {
                setErrorMessage(payload.error);
              }
            } catch {
              // Ignore malformed partial chunks
            }
          }
        }
      }

      // Automatically append completed assistant turn to conversation
      if (accumulatedText.trim().length > 0) {
        const assistantMessage: ChatMessage = {
          id: `msg_asst_${Date.now()}`,
          role: 'assistant',
          content: accumulatedText,
        };
        const nextMessages = [...messagesToRun, assistantMessage];
        setMessages(nextMessages);
        autoSaveConversation(nextMessages);
      }
    } catch (err: unknown) {
      if (abortController.signal.aborted) {
        // Normal stop action, no error display needed
        return;
      }
      const message = err instanceof Error ? err.message : 'Unknown generation failure.';
      setErrorMessage(message);
    } finally {
      setIsStreaming(false);
      abortControllerRef.current = null;
    }
  };

  const handleSubmitPrompt = () => {
    let nextMessages = [...messages];

    // If user entered prompt in the bottom bar, append it
    if (inputPrompt.trim()) {
      const userMessage: ChatMessage = {
        id: `msg_${Date.now()}`,
        role: 'user',
        content: inputPrompt.trim(),
        attachments: promptAttachments.length > 0 ? promptAttachments : undefined,
      };
      nextMessages = [...nextMessages, userMessage];
      setMessages(nextMessages);
      setInputPrompt('');
      setPromptAttachments([]);
    }

    if (nextMessages.length === 0) {
      return;
    }

    handleExecuteRequest(nextMessages);
  };

  const handleStop = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsStreaming(false);
    }
  };

  const handleRetry = () => {
    // If last message was assistant, pop it and re-run prior messages
    let messagesToRerun = [...messages];
    if (messagesToRerun.length > 0 && messagesToRerun[messagesToRerun.length - 1].role === 'assistant') {
      messagesToRerun = messagesToRerun.slice(0, -1);
      setMessages(messagesToRerun);
    }
    handleExecuteRequest(messagesToRerun);
  };

  // --- Saved conversation actions ---
  const handleSelectConversation = (convo: SavedConversation) => {
    setActiveConversationId(convo.id);
    setMessages(convo.messages);
    setSettings(convo.settings);
    const targetModel = models.find((m) => m.id === convo.modelId);
    if (targetModel) {
      setSelectedModel(targetModel);
    }
    setStreamingResponse('');
    setErrorMessage(null);
    setMetrics(null);
  };

  const handleNewConversation = () => {
    handleClear();
  };

  const handleRenameConversation = (id: string, newTitle: string) => {
    setSavedConversations((prev) => {
      const updated = prev.map((c) => (c.id === id ? { ...c, title: newTitle } : c));
      saveConversations(updated);
      return updated;
    });
  };

  const handleDeleteConversation = (id: string) => {
    setSavedConversations((prev) => {
      const updated = prev.filter((c) => c.id !== id);
      saveConversations(updated);
      return updated;
    });
    if (activeConversationId === id) {
      setActiveConversationId(null);
    }
  };

  return (
    <div className="flex flex-col h-screen max-h-screen bg-background text-zinc-100 selection:bg-cyan-500/20 overflow-hidden">
      {/* Top Navigation Bar */}
      <Header
        selectedModel={selectedModel}
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        isSettingsOpen={isSettingsOpen}
        onToggleSettings={() => setIsSettingsOpen(!isSettingsOpen)}
        onOpenCodeModal={() => setIsCodeModalOpen(true)}
        onReturnToMain={handleClear}
      />

      {/* Main Workspace: 3-pane responsive layout */}
      <div className="flex-1 flex overflow-hidden min-h-0 relative">
        {/* Left: Saved Conversations History Sidebar */}
        <ConversationsSidebar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          conversations={savedConversations}
          activeConversationId={activeConversationId}
          onSelectConversation={handleSelectConversation}
          onNewConversation={handleNewConversation}
          onRenameConversation={handleRenameConversation}
          onDeleteConversation={handleDeleteConversation}
        />

        {/* Center: Main Stage (Model Selector, Conversation, Output, Prompt) */}
        <main className="flex-1 flex flex-col min-w-0 h-full overflow-hidden relative">
          {/* Top Toolbar: Model Selector & Quick Capabilities */}
          <div className="flex-shrink-0 px-4 sm:px-6 py-3 border-b border-surface-border/50 bg-background/60 backdrop-blur-sm z-10">
            <div className="max-w-4xl mx-auto flex flex-wrap items-center justify-between gap-3">
              <div className="flex-1 min-w-[280px]">
                <ModelSelector
                  models={models}
                  selectedModel={selectedModel}
                  onSelectModel={(model) => setSelectedModel(model)}
                />
              </div>

              {/* Status Notice if Model Requires Credentials */}
              {!selectedModel.isConfigured && (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
                  <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                  <span>{selectedModel.setupHint}</span>
                </div>
              )}
            </div>
          </div>

          {/* Scrollable Conversation Messages & Streaming Output */}
          <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 min-h-0">
            <div className="max-w-4xl mx-auto space-y-6">
              <ConversationEditor
                messages={messages}
                supportsVision={selectedModel.capabilities.supportsVision}
                onUpdateContent={handleUpdateMessageContent}
                onUpdateRole={handleUpdateMessageRole}
                onAddAttachment={handleAddAttachment}
                onRemoveAttachment={handleRemoveAttachment}
                onMoveUp={handleMoveUp}
                onMoveDown={handleMoveDown}
                onDelete={handleDeleteMessage}
                onAddMessage={handleAddMessage}
                onLoadTemplate={handleLoadTemplate}
              />

              {/* Streaming & Active Generation Output Area */}
              <StreamingResponseArea
                responseContent={streamingResponse}
                isStreaming={isStreaming}
                errorMessage={errorMessage}
                metrics={metrics}
                onRetry={handleRetry}
                modelName={selectedModel.name}
              />
            </div>
          </div>

          {/* Anchored Bottom Multiline Prompt Composer Bar */}
          <div className="flex-shrink-0 px-4 sm:px-6 pb-4 pt-1 bg-gradient-to-t from-background via-background/95 to-transparent z-10">
            <div className="max-w-4xl mx-auto">
              <PromptInputBar
                inputPrompt={inputPrompt}
                onInputChange={setInputPrompt}
                onSubmitPrompt={handleSubmitPrompt}
                onStop={handleStop}
                onClear={handleClear}
                onRetry={handleRetry}
                isStreaming={isStreaming}
                canRetry={messages.length > 0}
                supportsVision={selectedModel.capabilities.supportsVision}
                onAttachImage={(file) => {
                  const reader = new FileReader();
                  reader.onload = (e) => {
                    const url = e.target?.result as string;
                    if (url) {
                      setPromptAttachments((prev) => [
                        ...prev,
                        { type: 'image_url', image_url: { url } },
                      ]);
                    }
                  };
                  reader.readAsDataURL(file);
                }}
                isModelConfigured={selectedModel.isConfigured}
              />
            </div>
          </div>
        </main>

        {/* Right: Collapsible Generation Settings Panel */}
        <SettingsPanel
          settings={settings}
          onUpdateSettings={(newSettings) =>
            setSettings((prev) => ({ ...prev, ...newSettings }))
          }
          selectedModel={selectedModel}
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
        />
      </div>

      {/* API Code Generation Modal */}
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
