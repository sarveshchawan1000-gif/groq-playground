'use client';

import React, { useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { RequestMetrics } from '@/lib/providers/types';
import { Copy, Check, RotateCcw, AlertTriangle, Sparkles, User, Bot, Clock, Zap, Hash } from 'lucide-react';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface ChatThreadProps {
  messages: ChatMessage[];
  streamingContent: string;
  isStreaming: boolean;
  errorMessage: string | null;
  metrics: RequestMetrics | null;
  modelName: string;
  onRetry: () => void;
  onCopyMessage: (content: string) => void;
  copiedId: string | null;
}

function MetricsRow({ metrics, isStreaming }: { metrics: RequestMetrics | null; isStreaming: boolean }) {
  if (!metrics && !isStreaming) return null;
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      padding: '8px 12px',
      background: 'rgba(79,142,247,0.05)',
      border: '1px solid rgba(79,142,247,0.12)',
      borderRadius: 8,
      marginTop: 8,
      flexWrap: 'wrap',
    }}>
      {isStreaming && !metrics && (
        <span style={{ fontSize: 11, color: '#9898a8', display: 'flex', alignItems: 'center', gap: 5 }}>
          <Sparkles style={{ width: 11, height: 11, color: '#4f8ef7' }} />
          Generating…
        </span>
      )}
      {metrics && (
        <>
          {metrics.elapsedMs != null && (
            <span style={{ fontSize: 11, color: '#9898a8', display: 'flex', alignItems: 'center', gap: 4 }}>
              <Clock style={{ width: 10, height: 10, color: '#606070' }} />
              {(metrics.elapsedMs / 1000).toFixed(2)}s
            </span>
          )}
          {metrics.promptTokens != null && (
            <span style={{ fontSize: 11, color: '#9898a8', display: 'flex', alignItems: 'center', gap: 4 }}>
              <Hash style={{ width: 10, height: 10, color: '#606070' }} />
              {metrics.promptTokens} in / {metrics.completionTokens ?? '—'} out
            </span>
          )}
          {metrics.tokensPerSecond != null && (
            <span style={{ fontSize: 11, color: '#3ecf8e', display: 'flex', alignItems: 'center', gap: 4 }}>
              <Zap style={{ width: 10, height: 10 }} />
              {metrics.tokensPerSecond.toFixed(0)} tok/s
            </span>
          )}
          {metrics.estimatedCost != null && (
            <span style={{ fontSize: 11, color: '#9898a8' }}>
              ${metrics.estimatedCost.toFixed(6)}
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      {displayMessages.map((msg, idx) => {
        const isUser = msg.role === 'user';
        const isAssistant = msg.role === 'assistant';
        const isCopied = copiedId === msg.id;

        return (
          <div
            key={msg.id}
            className="animate-message"
            style={{
              padding: '20px 0',
              borderBottom: idx < displayMessages.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
            }}
          >
            <div style={{ display: 'flex', gap: 14, maxWidth: '100%' }}>
              {/* Avatar */}
              <div style={{
                width: 30,
                height: 30,
                borderRadius: 8,
                flexShrink: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: isUser
                  ? 'rgba(79,142,247,0.15)'
                  : isAssistant
                    ? 'rgba(62,207,142,0.12)'
                    : 'rgba(167,139,250,0.12)',
                border: `1px solid ${isUser
                  ? 'rgba(79,142,247,0.2)'
                  : isAssistant
                    ? 'rgba(62,207,142,0.18)'
                    : 'rgba(167,139,250,0.2)'}`,
              }}>
                {isUser
                  ? <User style={{ width: 14, height: 14, color: '#4f8ef7' }} />
                  : isAssistant
                    ? <Bot style={{ width: 14, height: 14, color: '#3ecf8e' }} />
                    : <Sparkles style={{ width: 14, height: 14, color: '#a78bfa' }} />}
              </div>

              {/* Content */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: isUser ? '#4f8ef7' : isAssistant ? '#3ecf8e' : '#a78bfa',
                  marginBottom: 8,
                  textTransform: 'capitalize',
                }}>
                  {isUser ? 'You' : isAssistant ? modelName.split('(')[0].trim() : 'System'}
                </div>

                {isAssistant ? (
                  <div className="prose-response">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {msg.content}
                    </ReactMarkdown>
                  </div>
                ) : (
                  <div style={{
                    fontSize: 14,
                    lineHeight: 1.7,
                    color: '#f0f0f4',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                  }}>
                    {msg.content}
                  </div>
                )}

                {/* Copy button on hover */}
                {msg.content && (
                  <button
                    type="button"
                    onClick={() => onCopyMessage(msg.content)}
                    style={{
                      marginTop: 8,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      fontSize: 11,
                      color: isCopied ? '#3ecf8e' : '#606070',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: '3px 0',
                      transition: 'color 0.15s',
                    }}
                  >
                    {isCopied
                      ? <><Check style={{ width: 11, height: 11 }} /> Copied</>
                      : <><Copy style={{ width: 11, height: 11 }} /> Copy</>}
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })}

      {/* Streaming assistant turn */}
      {(isStreaming || (errorMessage && !streamingContent)) && (
        <div style={{ padding: '20px 0' }} className="animate-message">
          <div style={{ display: 'flex', gap: 14 }}>
            <div style={{
              width: 30, height: 30, borderRadius: 8, flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'rgba(62,207,142,0.12)', border: '1px solid rgba(62,207,142,0.18)',
            }}>
              <Bot style={{ width: 14, height: 14, color: '#3ecf8e' }} />
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#3ecf8e', marginBottom: 8 }}>
                {modelName.split('(')[0].trim()}
              </div>

              {errorMessage ? (
                <div style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 10,
                  padding: '12px 14px',
                  background: 'rgba(244,63,94,0.06)',
                  border: '1px solid rgba(244,63,94,0.18)',
                  borderRadius: 10,
                }}>
                  <AlertTriangle style={{ width: 14, height: 14, color: '#f43f5e', flexShrink: 0, marginTop: 1 }} />
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: '#f43f5e', marginBottom: 4 }}>
                      Error
                    </div>
                    <div style={{ fontSize: 13, color: '#9898a8', lineHeight: 1.6 }}>
                      {errorMessage}
                    </div>
                    <button
                      type="button"
                      onClick={onRetry}
                      style={{
                        marginTop: 10,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 5,
                        fontSize: 12,
                        color: '#4f8ef7',
                        background: 'rgba(79,142,247,0.1)',
                        border: '1px solid rgba(79,142,247,0.2)',
                        borderRadius: 7,
                        padding: '5px 10px',
                        cursor: 'pointer',
                      }}
                    >
                      <RotateCcw style={{ width: 11, height: 11 }} /> Retry
                    </button>
                  </div>
                </div>
              ) : streamingContent ? (
                <div className="prose-response">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{streamingContent}</ReactMarkdown>
                  <span
                    className="cursor-blink"
                    style={{
                      display: 'inline-block',
                      width: 2,
                      height: 14,
                      background: '#3ecf8e',
                      marginLeft: 2,
                      verticalAlign: 'middle',
                      borderRadius: 1,
                    }}
                  />
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div className="shimmer" style={{
                    height: 14, width: 180, borderRadius: 7,
                  }} />
                  <div className="shimmer" style={{
                    height: 14, width: 120, borderRadius: 7, opacity: 0.5,
                  }} />
                </div>
              )}

              {/* Metrics */}
              <MetricsRow metrics={metrics} isStreaming={isStreaming} />
            </div>
          </div>
        </div>
      )}

      {/* Show metrics after last assistant message */}
      {!isStreaming && metrics && displayMessages[displayMessages.length - 1]?.role === 'assistant' && (
        <MetricsRow metrics={metrics} isStreaming={false} />
      )}

      <div ref={bottomRef} />
    </div>
  );
};
