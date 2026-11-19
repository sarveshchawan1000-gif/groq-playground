import React, { useState, useRef, useEffect } from 'react';
import { ClientModelInfo } from '@/config/models';
import { ChevronDown, Check, Zap, Brain, PiggyBank, Eye, AlertTriangle, ShieldCheck } from 'lucide-react';

interface ModelSelectorProps {
  models: ClientModelInfo[];
  selectedModel: ClientModelInfo;
  onSelectModel: (model: ClientModelInfo) => void;
}

export const ModelSelector: React.FC<ModelSelectorProps> = ({
  models,
  selectedModel,
  onSelectModel,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'fast':
        return <Zap className="w-4 h-4 text-cyan-400" aria-hidden="true" />;
      case 'reasoning':
        return <Brain className="w-4 h-4 text-purple-400" aria-hidden="true" />;
      case 'budget':
        return <PiggyBank className="w-4 h-4 text-emerald-400" aria-hidden="true" />;
      case 'vision':
        return <Eye className="w-4 h-4 text-amber-400" aria-hidden="true" />;
      default:
        return <Zap className="w-4 h-4 text-zinc-400" aria-hidden="true" />;
    }
  };

  return (
    <div className="relative" ref={containerRef}>
      <label htmlFor="model-select-button" className="sr-only">
        Choose AI Model
      </label>
      <button
        id="model-select-button"
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className="flex items-center justify-between w-full sm:w-auto min-w-[280px] px-3.5 py-2.5 bg-surface-100 hover:bg-surface-200 border border-surface-border rounded-xl transition-all focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:outline-none shadow-sm"
      >
        <div className="flex items-center gap-2.5 text-left">
          <div className="p-1.5 rounded-lg bg-surface-200 border border-surface-border">
            {getCategoryIcon(selectedModel.category)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm text-zinc-100">
                {selectedModel.name}
              </span>
              <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-surface-200 text-zinc-400 border border-surface-border">
                {selectedModel.provider}
              </span>
            </div>
            <div className="text-xs text-zinc-400 font-mono flex items-center gap-1.5">
              <span>{selectedModel.providerModelId}</span>
              {!selectedModel.isConfigured && (
                <span className="text-rose-400 flex items-center gap-0.5">
                  • <AlertTriangle className="w-3 h-3 inline" /> Unconfigured
                </span>
              )}
            </div>
          </div>
        </div>
        <ChevronDown
          className={`w-4 h-4 text-zinc-400 ml-3 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          aria-hidden="true"
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          role="listbox"
          aria-label="Available AI Models"
          className="absolute left-0 top-full mt-2 w-full sm:w-[420px] max-h-[480px] overflow-y-auto bg-surface-50 border border-surface-border rounded-xl shadow-2xl p-1.5 z-50 divide-y divide-surface-border/50"
        >
          <div className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
            Select Active Model Slot
          </div>

          <div className="space-y-1 py-1">
            {models.map((model) => {
              const isSelected = model.id === selectedModel.id;
              return (
                <div
                  key={model.id}
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => {
                    onSelectModel(model);
                    setIsOpen(false);
                  }}
                  className={`flex flex-col gap-1.5 p-3 rounded-lg cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-surface-200/90 border border-cyan-500/40 text-zinc-100'
                      : 'hover:bg-surface-100 text-zinc-300'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-1 rounded bg-surface-200 border border-surface-border">
                        {getCategoryIcon(model.category)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm text-zinc-100">
                            {model.name}
                          </span>
                          <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-surface-200 text-zinc-400 border border-surface-border">
                            {model.provider}
                          </span>
                        </div>
                        <div className="text-xs font-mono text-zinc-400">
                          {model.providerModelId}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {model.isConfigured ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                          <ShieldCheck className="w-3 h-3" />
                          Ready
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
                          <AlertTriangle className="w-3 h-3" />
                          Setup required
                        </span>
                      )}
                      {isSelected && <Check className="w-4 h-4 text-cyan-400 ml-1" aria-hidden="true" />}
                    </div>
                  </div>

                  <p className="text-xs text-zinc-400 leading-relaxed pl-8">
                    {model.description}
                  </p>

                  {/* Setup hint if unconfigured */}
                  {!model.isConfigured && (
                    <div className="mt-1 pl-8 text-[11px] text-rose-300/90 bg-rose-950/30 p-2 rounded border border-rose-900/40">
                      💡 <strong>Setup Hint:</strong> {model.setupHint}
                    </div>
                  )}

                  {/* Capabilities badges */}
                  <div className="flex flex-wrap gap-1.5 pl-8 mt-1">
                    {model.capabilities.supportsVision && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-amber-400">
                        Multimodal Vision
                      </span>
                    )}
                    {model.capabilities.supportsStreaming && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
                        Real-time Stream
                      </span>
                    )}
                    {model.contextLimit && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-zinc-400">
                        {(model.contextLimit / 1024).toFixed(0)}k Context
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
