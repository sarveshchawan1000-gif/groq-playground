import React from 'react';
import { PanelLeft, Sliders, Code2, Sparkles, AlertCircle } from 'lucide-react';
import { ClientModelInfo } from '@/config/models';

interface HeaderProps {
  selectedModel: ClientModelInfo;
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
  isSettingsOpen: boolean;
  onToggleSettings: () => void;
  onOpenCodeModal: () => void;
  onReturnToMain?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  selectedModel,
  isSidebarOpen,
  onToggleSidebar,
  isSettingsOpen,
  onToggleSettings,
  onOpenCodeModal,
  onReturnToMain,
}) => {
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between px-4 sm:px-6 py-3 border-b border-surface-border bg-background/80 backdrop-blur-md">
      {/* Brand & Sidebar Toggle */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onToggleSidebar}
          aria-label={isSidebarOpen ? 'Close conversation history' : 'Open conversation history'}
          className="p-2 text-zinc-400 hover:text-zinc-100 hover:bg-surface-100 rounded-lg transition-colors focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:outline-none"
        >
          <PanelLeft className="w-5 h-5" aria-hidden="true" />
        </button>

        <button
          type="button"
          onClick={onReturnToMain}
          aria-label="Return to main playground screen"
          title="Return to main playground screen"
          className="flex items-center gap-2.5 text-left group rounded-xl p-1 -m-1 transition-all hover:opacity-95 focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:outline-none cursor-pointer"
        >
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-500 via-indigo-500 to-emerald-400 p-[1.5px] flex items-center justify-center shadow-lg shadow-cyan-500/10 group-hover:scale-105 transition-transform">
            <div className="w-full h-full bg-background rounded-[7px] flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-cyan-400" aria-hidden="true" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold tracking-tight text-zinc-100 text-base sm:text-lg group-hover:text-white transition-colors">
                Aether<span className="text-cyan-400 font-medium">Studio</span>
              </span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-surface-200 border border-surface-border text-zinc-400 group-hover:border-cyan-500/40 group-hover:text-zinc-300 transition-colors">
                Playground
              </span>
            </div>
          </div>
        </button>
      </div>

      {/* Model Status Pill & Action Buttons */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Model status indicator */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface-100 border border-surface-border text-xs">
          <div
            className={`w-2 h-2 rounded-full ${
              selectedModel.isConfigured
                ? selectedModel.isMockFallback
                  ? 'bg-amber-400 animate-pulse'
                  : 'bg-emerald-400'
                : 'bg-rose-500'
            }`}
            aria-hidden="true"
          />
          <span className="text-zinc-300 font-medium truncate max-w-[160px]">
            {selectedModel.name}
          </span>
          {selectedModel.isMockFallback && (
            <span className="text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-1 rounded">
              Demo Mode
            </span>
          )}
          {!selectedModel.isConfigured && (
            <span className="flex items-center gap-1 text-[10px] text-rose-400">
              <AlertCircle className="w-3 h-3" /> Setup Needed
            </span>
          )}
        </div>

        {/* View Code Button */}
        <button
          type="button"
          onClick={onOpenCodeModal}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-200 bg-surface-100 hover:bg-surface-200 border border-surface-border rounded-lg transition-colors focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:outline-none"
          title="Inspect equivalent API code (cURL, Python, TypeScript)"
        >
          <Code2 className="w-4 h-4 text-cyan-400" aria-hidden="true" />
          <span className="hidden sm:inline">View Code</span>
        </button>

        {/* Settings Panel Toggle */}
        <button
          type="button"
          onClick={onToggleSettings}
          aria-label={isSettingsOpen ? 'Close generation settings panel' : 'Open generation settings panel'}
          className={`p-2 rounded-lg border transition-colors focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:outline-none ${
            isSettingsOpen
              ? 'bg-surface-200 border-cyan-500/50 text-cyan-400'
              : 'text-zinc-400 hover:text-zinc-100 bg-surface-100 hover:bg-surface-200 border-surface-border'
          }`}
        >
          <Sliders className="w-4 h-4" aria-hidden="true" />
        </button>
      </div>
    </header>
  );
};
