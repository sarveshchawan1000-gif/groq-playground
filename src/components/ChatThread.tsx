'use client';

import React, { useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { RequestMetrics, ChatMessage } from '@/lib/providers/types';
import { Copy, Check, RotateCcw, AlertTriangle, Sparkles, User, Bot, Clock, Zap, Hash } from 'lucide-react';

interface ChatThreadProps {
  messages: ChatMessage[];
  streamingContent: string;
  isStreaming: boolean;
  errorMessage: string | null;
  metrics: RequestMetrics | null;
  modelName: string;
  onRetry: () => void;
  onCopyMessage: (content: string, id: string) => void;
  copiedId: string | null;
}

function MetricsPills({ metrics, isStreaming }: { metrics: RequestMetrics | null; isStreaming: boolean }) {
  if (!metrics && !isStreaming) return null;
  return (
    <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-white/[0.06] text-[11px] text-slate-400">
      {isStreaming && !metrics && (
        <span className="flex items-center gap-1.5 text-sky-400">
          <Sparkles className="w-3.5 h-3.5 animate-spin" />
          <span>Generating tokens...</span>
        </span>
      )}
      {metrics && (
        <>
          {metrics.elapsedMs != null && (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-800/80 border border-white/[0.06]">
              <Clock className="w-3 h-3 text-slate-500" />
              <span>{(metrics.elapsedMs / 1000).toFixed(2)}s</span>
            </span>
          )}
          {metrics.ttftMs != null && (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-800/80 border border-white/[0.06]">
              <span>TTFT: {metrics.ttftMs}ms</span>
            </span>
          )}
          {metrics.completionTokens != null && (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-800/80 border border-white/[0.06]">
              <Hash className="w-3 h-3 text-slate-500" />
              <span>
                {metrics.promptTokens ?? 0} in / {metrics.completionTokens} out
              </span>
            </span>
          )}
          {metrics.tokensPerSecond != null && (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-semibold">
              <Zap className="w-3 h-3" />
              <span>{metrics.tokensPerSecond.toFixed(0)} tok/s</span>
            </span>
          )}
        </>
      )}
    </div>
  );
}

export const ChatThread: React.FC<ChatThreadProps> = ({
  messages,
  streamingContent,
  isStreaming,
  errorMessage,
  metrics,
  modelName,
  onRetry,
  onCopyMessage,
  copiedId,
}) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingContent, isStreaming]);

  const displayMessages = messages.filter((m) => m.role !== 'system');

  return (
    <div className="flex flex-col divide-y divide-white/[0.06]">
      {displayMessages.map((msg) => {
        const isUser = msg.role === 'user';
        const isAssistant = msg.role === 'assistant';
        const isCopied = copiedId === msg.id;

        return (
          <div key={msg.id} className="py-6 px-1 flex gap-3 sm:gap-4 group">
            {/* Avatar */}
            <div
              className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 border shadow-sm ${
                isUser
                  ? 'bg-sky-500/15 border-sky-500/30 text-sky-400'
                  : isAssistant
                  ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                  : 'bg-purple-500/15 border-purple-500/30 text-purple-400'
              }`}
            >
              {isUser ? (
                <User className="w-4 h-4" />
              ) : isAssistant ? (
                <Bot className="w-4 h-4" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
            </div>

            {/* Message Body */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-2">
                <span
                  className={`text-xs font-semibold ${
                    isUser
                      ? 'text-sky-400'
                      : isAssistant
                      ? 'text-emerald-400'
                      : 'text-purple-400'
                  }`}
                >
                  {isUser ? 'You' : modelName}
                </span>

                {/* Quick copy message button */}
                <button
                  type="button"
                  onClick={() => onCopyMessage(msg.content, msg.id)}
                  title="Copy message text"
                  className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800"
                >
                  {isCopied ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>

              {isAssistant ? (
                <div className="prose-chat">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {msg.content}
                  </ReactMarkdown>
                </div>
              ) : (
                <div className="text-sm text-slate-100 whitespace-pre-wrap break-words leading-relaxed">
                  {msg.content}
                </div>
              )}
            </div>
          </div>
        );
      })}

      {/* Active Streaming turn */}
      {(isStreaming || (errorMessage && !streamingContent)) && (
        <div className="py-6 px-1 flex gap-3 sm:gap-4">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
            <Bot className="w-4 h-4" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="text-xs font-semibold text-emerald-400 mb-2">
              {modelName}
            </div>

            {errorMessage ? (
              <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-start gap-3">
                <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
                <div className="space-y-2 flex-1">
                  <span className="font-semibold block text-rose-200">Execution Error:</span>
                  <p className="leading-relaxed">{errorMessage}</p>
                  <button
                    type="button"
                    onClick={onRetry}
                    className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium text-sky-300 bg-sky-500/15 border border-sky-500/30 rounded-lg hover:bg-sky-500/25 transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5" /> Retry Request
                  </button>
                </div>
              </div>
            ) : streamingContent ? (
              <div className="prose-chat">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {streamingContent}
                </ReactMarkdown>
                <span className="inline-block w-1.5 h-4 ml-1 bg-emerald-400 align-middle cursor-blink" />
              </div>
            ) : (
              <div className="flex items-center gap-2 text-xs text-slate-400 py-2">
                <Sparkles className="w-3.5 h-3.5 text-sky-400 animate-spin" />
                <span>Waiting for provider response...</span>
              </div>
            )}

            <MetricsPills metrics={metrics} isStreaming={isStreaming} />
          </div>
        </div>
      )}

      {/* Done metrics for the last turn */}
      {!isStreaming && metrics && displayMessages[displayMessages.length - 1]?.role === 'assistant' && (
        <div className="py-2 px-1">
          <MetricsPills metrics={metrics} isStreaming={false} />
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  );
};
