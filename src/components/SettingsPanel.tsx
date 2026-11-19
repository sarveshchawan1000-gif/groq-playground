import React from 'react';
import { GenerationSettings } from '@/lib/providers/types';
import { ClientModelInfo } from '@/config/models';
import { Sliders, Info, Zap, AlertCircle, X } from 'lucide-react';

interface SettingsPanelProps {
  settings: GenerationSettings;
  onUpdateSettings: (newSettings: Partial<GenerationSettings>) => void;
  selectedModel: ClientModelInfo;
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({
  settings,
  onUpdateSettings,
  selectedModel,
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  const { capabilities } = selectedModel;

  return (
    <>
      {/* Mobile Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
        onClick={onClose}
        aria-hidden="true"
      />

      <aside
        aria-label="Generation Parameters and Model Details"
        className="fixed lg:static inset-y-0 right-0 z-40 w-80 max-w-[85vw] border-l border-surface-border bg-surface-50 p-5 space-y-6 overflow-y-auto flex flex-col h-full shadow-2xl lg:shadow-none flex-shrink-0"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-surface-border">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-cyan-400" aria-hidden="true" />
            <h3 className="text-sm font-semibold text-zinc-100 uppercase tracking-wide">
              Parameters
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-zinc-400">
              Slot #{selectedModel.slot}
            </span>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close parameters panel"
              className="p-1 text-zinc-400 hover:text-zinc-100 hover:bg-surface-200 rounded-lg lg:hidden"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

      {/* Model Spec Card */}
      <div className="p-3.5 rounded-xl bg-surface-100 border border-surface-border space-y-2 text-xs">
        <div className="flex items-center justify-between">
          <span className="text-zinc-400">Provider</span>
          <span className="font-mono uppercase font-semibold text-zinc-200">
            {selectedModel.provider}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-zinc-400">Model ID</span>
          <span className="font-mono text-zinc-200 truncate max-w-[150px]" title={selectedModel.providerModelId}>
            {selectedModel.providerModelId}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-zinc-400">Context Window</span>
          <span className="font-mono text-zinc-200">
            {selectedModel.contextLimit
              ? `${(selectedModel.contextLimit / 1024).toFixed(0)}k tokens`
              : 'Unavailable'}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-zinc-400">Status</span>
          <span className={`font-medium ${selectedModel.isConfigured ? 'text-emerald-400' : 'text-rose-400'}`}>
            {selectedModel.isConfigured
              ? selectedModel.isMockFallback
                ? 'Demo Mode'
                : 'Configured'
              : 'Setup Needed'}
          </span>
        </div>
      </div>

      {/* Setup Warning if not configured */}
      {!selectedModel.isConfigured && (
        <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-900/60 text-xs text-rose-300 space-y-1.5">
          <div className="flex items-center gap-1.5 font-semibold text-rose-200">
            <AlertCircle className="w-4 h-4 text-rose-400" />
            <span>Missing API Credentials</span>
          </div>
          <p className="text-[11px] leading-relaxed text-zinc-300">
            {selectedModel.setupHint}
          </p>
        </div>
      )}

      {/* Generation Sliders & Controls */}
      <div className="space-y-5">
        {/* Temperature */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <label htmlFor="temp-slider" className="font-medium text-zinc-200 flex items-center gap-1">
              <span>Temperature</span>
              <span className="text-zinc-400" title="Controls randomness: Lower is deterministic; higher is more creative.">
                <Info className="w-3 h-3" />
              </span>
            </label>
            <span className="font-mono text-cyan-400 font-semibold">
              {settings.temperature.toFixed(2)}
            </span>
          </div>
          <input
            id="temp-slider"
            type="range"
            min="0"
            max="2"
            step="0.05"
            disabled={!capabilities.supportsTemperature}
            value={settings.temperature}
            onChange={(e) => onUpdateSettings({ temperature: parseFloat(e.target.value) })}
            className="w-full h-1.5 bg-surface-200 rounded-lg appearance-none cursor-pointer accent-cyan-400 disabled:opacity-30 disabled:cursor-not-allowed"
          />
          <div className="flex justify-between text-[10px] text-zinc-500 font-mono">
            <span>0.0 (Precise)</span>
            <span>1.0</span>
            <span>2.0 (Creative)</span>
          </div>
        </div>

        {/* Max Tokens */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <label htmlFor="max-tokens-slider" className="font-medium text-zinc-200 flex items-center gap-1">
              <span>Maximum Output</span>
              <span className="text-zinc-400" title="The upper limit on generated tokens for a single completion.">
                <Info className="w-3 h-3" />
              </span>
            </label>
            <span className="font-mono text-cyan-400 font-semibold">
              {settings.maxTokens} tokens
            </span>
          </div>
          <input
            id="max-tokens-slider"
            type="range"
            min="64"
            max={selectedModel.maxOutputTokensLimit || 4096}
            step="64"
            disabled={!capabilities.supportsMaxTokens}
            value={settings.maxTokens}
            onChange={(e) => onUpdateSettings({ maxTokens: parseInt(e.target.value) })}
            className="w-full h-1.5 bg-surface-200 rounded-lg appearance-none cursor-pointer accent-cyan-400 disabled:opacity-30 disabled:cursor-not-allowed"
          />
          <div className="flex justify-between text-[10px] text-zinc-500 font-mono">
            <span>64</span>
            <span>{selectedModel.maxOutputTokensLimit || 4096}</span>
          </div>
        </div>

        {/* Top-P */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <label htmlFor="top-p-slider" className="font-medium text-zinc-200 flex items-center gap-1">
              <span>Top-P (Nucleus)</span>
              <span className="text-zinc-400" title="Controls diversity via nucleus sampling. 1.0 considers all tokens.">
                <Info className="w-3 h-3" />
              </span>
            </label>
            <span className="font-mono text-cyan-400 font-semibold">
              {settings.topP.toFixed(2)}
            </span>
          </div>
          <input
            id="top-p-slider"
            type="range"
            min="0"
            max="1"
            step="0.05"
            disabled={!capabilities.supportsTopP}
            value={settings.topP}
            onChange={(e) => onUpdateSettings({ topP: parseFloat(e.target.value) })}
            className="w-full h-1.5 bg-surface-200 rounded-lg appearance-none cursor-pointer accent-cyan-400 disabled:opacity-30 disabled:cursor-not-allowed"
          />
          <div className="flex justify-between text-[10px] text-zinc-500 font-mono">
            <span>0.0</span>
            <span>1.0</span>
          </div>
        </div>

        {/* Stream Toggle */}
        <div className="pt-2 border-t border-surface-border flex items-center justify-between">
          <div className="space-y-0.5">
            <label htmlFor="stream-toggle" className="text-xs font-medium text-zinc-200 flex items-center gap-1.5 cursor-pointer">
              <Zap className="w-3.5 h-3.5 text-cyan-400" />
              <span>Stream Response</span>
            </label>
            <p className="text-[11px] text-zinc-400">
              Transmit partial tokens incrementally as computed
            </p>
          </div>
          <input
            id="stream-toggle"
            type="checkbox"
            disabled={!capabilities.supportsStreaming}
            checked={settings.stream}
            onChange={(e) => onUpdateSettings({ stream: e.target.checked })}
            className="w-4 h-4 rounded bg-surface-200 border-surface-border text-cyan-500 focus:ring-cyan-400 focus:ring-offset-background cursor-pointer disabled:opacity-30"
          />
        </div>
      </div>
    </aside>
    </>
  );
};
