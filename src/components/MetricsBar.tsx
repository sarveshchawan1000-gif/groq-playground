import React from 'react';
import { RequestMetrics } from '@/lib/providers/types';
import { Clock, Zap, Gauge, Coins, Layers } from 'lucide-react';

interface MetricsBarProps {
  metrics: RequestMetrics | null;
  isStreaming: boolean;
}

export const MetricsBar: React.FC<MetricsBarProps> = ({ metrics, isStreaming }) => {
  return (
    <div
      aria-label="Request Performance Metrics"
      className="flex flex-wrap items-center gap-x-6 gap-y-2 px-4 py-2.5 bg-surface-100/90 border border-surface-border rounded-xl text-xs text-zinc-300 font-mono shadow-sm"
    >
      {/* Elapsed Time */}
      <div className="flex items-center gap-1.5" title="Total response generation time">
        <Clock className="w-3.5 h-3.5 text-cyan-400" aria-hidden="true" />
        <span className="text-zinc-400">Total:</span>
        <span className="font-semibold text-zinc-100">
          {metrics?.elapsedMs !== undefined ? `${metrics.elapsedMs} ms` : isStreaming ? 'Streaming...' : 'Unavailable'}
        </span>
      </div>

      {/* Time to First Token (TTFT) */}
      <div className="flex items-center gap-1.5" title="Time to First Token (TTFT)">
        <Zap className="w-3.5 h-3.5 text-amber-400" aria-hidden="true" />
        <span className="text-zinc-400">TTFT:</span>
        <span className="font-semibold text-zinc-100">
          {metrics?.ttftMs !== undefined ? `${metrics.ttftMs} ms` : isStreaming ? 'Pending...' : 'Unavailable'}
        </span>
      </div>

      {/* Speed / Tokens per second */}
      <div className="flex items-center gap-1.5" title="Token throughput rate">
        <Gauge className="w-3.5 h-3.5 text-emerald-400" aria-hidden="true" />
        <span className="text-zinc-400">Speed:</span>
        <span className="font-semibold text-zinc-100">
          {metrics?.tokensPerSecond !== undefined ? `${metrics.tokensPerSecond} t/s` : 'Unavailable'}
        </span>
      </div>

      {/* Input / Output Tokens */}
      <div className="flex items-center gap-1.5" title="Prompt and completion token counts">
        <Layers className="w-3.5 h-3.5 text-indigo-400" aria-hidden="true" />
        <span className="text-zinc-400">Tokens:</span>
        <span className="font-semibold text-zinc-100">
          {metrics?.promptTokens !== undefined || metrics?.completionTokens !== undefined
            ? `${metrics.promptTokens ?? '?'} in / ${metrics.completionTokens ?? '?'} out`
            : 'Unavailable'}
        </span>
      </div>

      {/* Estimated Cost */}
      <div className="flex items-center gap-1.5" title="Calculated inference cost based on configured pricing">
        <Coins className="w-3.5 h-3.5 text-yellow-400" aria-hidden="true" />
        <span className="text-zinc-400">Cost:</span>
        <span className="font-semibold text-zinc-100">
          {metrics?.estimatedCost !== undefined && metrics.estimatedCost !== null
            ? `$${metrics.estimatedCost.toFixed(5)}`
            : 'Unavailable'}
        </span>
      </div>
    </div>
  );
};
