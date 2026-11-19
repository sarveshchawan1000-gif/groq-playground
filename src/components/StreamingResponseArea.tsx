import React, { useState } from 'react';
import { RequestMetrics } from '@/lib/providers/types';
import { MetricsBar } from './MetricsBar';
import { Copy, Check, RotateCcw, AlertTriangle, Sparkles } from 'lucide-react';

interface StreamingResponseAreaProps {
  responseContent: string;
  isStreaming: boolean;
  errorMessage: string | null;
  metrics: RequestMetrics | null;
  onRetry: () => void;
  modelName: string;
}

export const StreamingResponseArea: React.FC<StreamingResponseAreaProps> = ({
  responseContent,
  isStreaming,
  errorMessage,
  metrics,
  onRetry,
  modelName,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!responseContent) return;
    try {
      await navigator.clipboard.writeText(responseContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy response', err);
    }
  };

  if (!isStreaming && !responseContent && !errorMessage) {
    return null; // Don't take up space when there has been no run yet
  }

  return (
    <div className="space-y-3 pt-2">
      <div className="rounded-2xl border border-surface-border bg-surface-50 p-4 sm:p-5 shadow-lg relative overflow-hidden">
        {/* Top Header of Response */}
        <div className="flex items-center justify-between pb-3 border-b border-surface-border/60 mb-3">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-cyan-400" />
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-300">
              Response Output
            </span>
            <span className="text-[11px] font-mono text-zinc-400">
              ({modelName})
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {responseContent && !isStreaming && (
              <button
                type="button"
                onClick={handleCopy}
                aria-label={copied ? 'Response copied' : 'Copy response text'}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-zinc-300 hover:text-zinc-100 bg-surface-100 hover:bg-surface-200 border border-surface-border rounded-lg transition-colors focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:outline-none"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-zinc-400" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            )}

            {!isStreaming && (responseContent || errorMessage) && (
              <button
                type="button"
                onClick={onRetry}
                aria-label="Regenerate response"
                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-zinc-300 hover:text-cyan-400 bg-surface-100 hover:bg-surface-200 border border-surface-border rounded-lg transition-colors focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:outline-none"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Regenerate</span>
              </button>
            )}
          </div>
        </div>

        {/* Error State */}
        {errorMessage && (
          <div className="p-4 mb-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-3">
            <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-semibold block">Execution Error:</span>
              <p className="leading-relaxed">{errorMessage}</p>
            </div>
          </div>
        )}

        {/* Response Text / Streaming Content */}
        <div className="min-h-[60px] text-sm text-zinc-100 leading-relaxed font-sans whitespace-pre-wrap break-words">
          {responseContent ? (
            <>
              {responseContent}
              {isStreaming && (
                <span
                  className="inline-block w-2 h-4 ml-1 bg-cyan-400 align-middle animate-pulse motion-reduce:animate-none"
                  aria-hidden="true"
                />
              )}
            </>
          ) : isStreaming ? (
            <div className="flex items-center gap-2 text-xs text-zinc-400 py-3">
              <Sparkles className="w-4 h-4 text-cyan-400 animate-spin motion-reduce:animate-none" />
              <span>Awaiting first token from model provider...</span>
            </div>
          ) : null}
        </div>
      </div>

      {/* Metrics Bar */}
      {(metrics || isStreaming) && (
        <MetricsBar metrics={metrics} isStreaming={isStreaming} />
      )}
    </div>
  );
};
