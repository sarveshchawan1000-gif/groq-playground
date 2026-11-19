'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ClientModelInfo } from '@/config/models';
import {
  ChevronDown, Check, Zap, Brain, PiggyBank, Eye,
  AlertTriangle, ShieldCheck, Search
} from 'lucide-react';

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
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setSearch('');
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => searchInputRef.current?.focus(), 60);
    }
  }, [isOpen]);

  const filtered = models.filter(
    (m) =>
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.providerModelId.toLowerCase().includes(search.toLowerCase()) ||
      m.category.toLowerCase().includes(search.toLowerCase())
  );

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'fast':
        return <Zap className="w-3.5 h-3.5 text-sky-400" />;
      case 'reasoning':
        return <Brain className="w-3.5 h-3.5 text-purple-400" />;
      case 'budget':
        return <PiggyBank className="w-3.5 h-3.5 text-emerald-400" />;
      case 'vision':
        return <Eye className="w-3.5 h-3.5 text-amber-400" />;
      default:
        return <Zap className="w-3.5 h-3.5 text-sky-400" />;
    }
  };

  return (
    <div ref={containerRef} className="relative w-full max-w-sm">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className="w-full flex items-center justify-between gap-3 px-3.5 py-2 rounded-xl bg-slate-900/90 hover:bg-slate-800/90 border border-white/[0.08] hover:border-white/[0.16] transition-all shadow-sm text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-slate-800 flex items-center justify-center flex-shrink-0 border border-white/[0.06]">
            {getCategoryIcon(selectedModel.category)}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-xs text-white truncate">
                {selectedModel.name}
              </span>
              <span className="text-[10px] uppercase font-mono px-1 py-0.2 rounded bg-slate-800 text-slate-400 border border-white/[0.06]">
                {selectedModel.provider}
              </span>
            </div>
            <div className="text-[11px] font-mono text-slate-400 truncate">
              {selectedModel.providerModelId}
            </div>
          </div>
        </div>
        <ChevronDown
          className={`w-4 h-4 text-slate-400 flex-shrink-0 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          role="listbox"
          aria-label="Available models"
          className="absolute left-0 top-full mt-2 w-full min-w-[320px] max-w-[420px] max-h-96 overflow-y-auto rounded-2xl bg-slate-900 border border-white/[0.12] shadow-2xl p-2 z-50 flex flex-col gap-1 backdrop-blur-xl"
        >
          {/* Search box */}
          <div className="flex items-center gap-2 px-3 py-2 bg-slate-800/60 rounded-xl border border-white/[0.06] mb-1">
            <Search className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
            <input
              ref={searchInputRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search models..."
              className="w-full bg-transparent border-none text-xs text-white placeholder-slate-500 focus:outline-none"
            />
          </div>

          {/* Model options */}
          <div className="flex flex-col gap-1">
            {filtered.map((m) => {
              const isSelected = m.id === selectedModel.id;
              return (
                <div
                  key={m.id}
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => {
                    onSelectModel(m);
                    setIsOpen(false);
                    setSearch('');
                  }}
                  className={`flex flex-col gap-1.5 p-2.5 rounded-xl cursor-pointer transition-colors border ${
                    isSelected
                      ? 'bg-sky-500/10 border-sky-500/30 text-white'
                      : 'hover:bg-slate-800/70 border-transparent text-slate-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-6 h-6 rounded-md bg-slate-800 flex items-center justify-center flex-shrink-0">
                        {getCategoryIcon(m.category)}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-xs text-white truncate">
                            {m.name}
                          </span>
                          <span className="text-[9px] uppercase font-mono px-1 py-0.2 rounded bg-slate-800 text-slate-400">
                            {m.provider}
                          </span>
                        </div>
                        <div className="text-[10px] font-mono text-slate-400 truncate">
                          {m.providerModelId}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 flex-shrink-0">
                      {m.isConfigured ? (
                        <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                          <ShieldCheck className="w-3 h-3" /> Ready
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] text-rose-400 bg-rose-500/10 px-1.5 py-0.5 rounded border border-rose-500/20">
                          <AlertTriangle className="w-3 h-3" /> Setup
                        </span>
                      )}
                      {isSelected && <Check className="w-3.5 h-3.5 text-sky-400 ml-1" />}
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-400 leading-relaxed pl-8 line-clamp-2">
                    {m.description}
                  </p>
                </div>
              );
            })}

            {filtered.length === 0 && (
              <div className="p-4 text-center text-xs text-slate-500">
                No models found matching &quot;{search}&quot;
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
