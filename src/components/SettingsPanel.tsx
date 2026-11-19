'use client';

import React from 'react';
import { GenerationSettings } from '@/lib/providers/types';
import { ClientModelInfo } from '@/config/models';
import { X, Info, Zap, SlidersHorizontal } from 'lucide-react';

interface SettingsPanelProps {
  settings: GenerationSettings;
  onUpdateSettings: (s: Partial<GenerationSettings>) => void;
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
      {/* Mobile backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Settings drawer on mobile, stationary sidebar on desktop */}
      <aside
        aria-label="Generation Parameters"
        className="fixed lg:static inset-y-0 right-0 z-40 w-80 max-w-[85vw] border-l border-white/[0.08] bg-[#0f172a] p-5 space-y-6 overflow-y-auto flex flex-col h-full shadow-2xl lg:shadow-none flex-shrink-0"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-sky-400" />
            <h3 className="text-xs font-semibold text-white uppercase tracking-wider">
              Parameters
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close parameters"
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Model Spec Card */}
        <div className="p-3.5 rounded-xl bg-slate-900 border border-white/[0.06] space-y-2.5 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Provider</span>
            <span className="font-mono font-semibold uppercase text-slate-200">
              {selectedModel.provider}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Model ID</span>
            <span className="font-mono text-slate-200 truncate max-w-[160px]" title={selectedModel.providerModelId}>
              {selectedModel.providerModelId}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Context Window</span>
            <span className="font-mono text-slate-200">
              {selectedModel.contextLimit ? `${(selectedModel.contextLimit / 1024).toFixed(0)}k tokens` : '—'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Status</span>
            <span
              className={`font-semibold ${
                selectedModel.isConfigured ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {selectedModel.isConfigured
                ? selectedModel.isMockFallback
                  ? 'Demo Mode'
                  : 'Active'
                : 'Setup Needed'}
            </span>
          </div>
        </div>

        {/* Sliders */}
        <div className="space-y-6">
          {/* Temperature */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <label htmlFor="temp-slider" className="font-medium text-slate-300 flex items-center gap-1.5">
                <span>Temperature</span>
                <span title="Controls randomness. Lower is more deterministic, higher is more creative.">
                  <Info className="w-3 h-3 text-slate-500 cursor-help" />
                </span>
              </label>
              <span className="font-mono text-sky-400 font-semibold">
                {settings.temperature.toFixed(2)}
              </span>
            </div>
            <input
              id="temp-slider"
              type="range"
              min="0"
              max="2"
              step="0.05"
              value={settings.temperature}
              disabled={!capabilities.supportsTemperature}
              onChange={(e) => onUpdateSettings({ temperature: parseFloat(e.target.value) })}
              className="w-full"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-mono">
              <span>0.0 (Precise)</span>
              <span>1.0</span>
              <span>2.0 (Creative)</span>
            </div>
          </div>

          {/* Max Tokens */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <label htmlFor="max-tokens-slider" className="font-medium text-slate-300 flex items-center gap-1.5">
                <span>Max Output Tokens</span>
                <span title="Upper limit on generated tokens.">
                  <Info className="w-3 h-3 text-slate-500 cursor-help" />
                </span>
              </label>
              <span className="font-mono text-sky-400 font-semibold">
                {settings.maxTokens}
              </span>
            </div>
            <input
              id="max-tokens-slider"
              type="range"
              min="64"
              max={selectedModel.maxOutputTokensLimit || 4096}
              step="64"
              value={settings.maxTokens}
              disabled={!capabilities.supportsMaxTokens}
              onChange={(e) => onUpdateSettings({ maxTokens: parseInt(e.target.value) })}
              className="w-full"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-mono">
              <span>64</span>
              <span>{selectedModel.maxOutputTokensLimit || 4096}</span>
            </div>
          </div>

          {/* Top-P */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <label htmlFor="top-p-slider" className="font-medium text-slate-300 flex items-center gap-1.5">
                <span>Top-P</span>
                <span title="Nucleus sampling threshold.">
                  <Info className="w-3 h-3 text-slate-500 cursor-help" />
                </span>
              </label>
              <span className="font-mono text-sky-400 font-semibold">
                {settings.topP.toFixed(2)}
              </span>
            </div>
            <input
              id="top-p-slider"
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={settings.topP}
              disabled={!capabilities.supportsTopP}
              onChange={(e) => onUpdateSettings({ topP: parseFloat(e.target.value) })}
              className="w-full"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-mono">
              <span>0.0</span>
              <span>1.0</span>
            </div>
          </div>

          {/* Stream Toggle */}
          <div className="pt-3 border-t border-white/[0.08] flex items-center justify-between">
            <div className="space-y-0.5">
              <label htmlFor="stream-toggle" className="text-xs font-medium text-slate-200 flex items-center gap-1.5 cursor-pointer">
                <Zap className="w-3.5 h-3.5 text-sky-400" />
                <span>Stream Response</span>
              </label>
              <p className="text-[11px] text-slate-400">
                Receive tokens in real-time
              </p>
            </div>
            <input
              id="stream-toggle"
              type="checkbox"
              checked={settings.stream}
              disabled={!capabilities.supportsStreaming}
              onChange={(e) => onUpdateSettings({ stream: e.target.checked })}
              className="w-4 h-4 rounded bg-slate-800 border-white/[0.2] text-sky-500 focus:ring-sky-400 cursor-pointer"
            />
          </div>
        </div>
      </aside>
    </>
  );
};
