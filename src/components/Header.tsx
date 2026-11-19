import React from 'react';
import { Sparkles, PanelLeft, Code2, Sliders, AlertCircle, ChevronRight } from 'lucide-react';
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
    <header className="sticky top-0 z-30 flex items-center justify-between px-3 sm:px-5 h-14 border-b border-white/[0.08] bg-[#0b0f19]/90 backdrop-blur-md flex-shrink-0">
      {/* Left: Brand & Sidebar toggle */}
      <div className="flex items-center gap-2 sm:gap-3">
        <button
          type="button"
          onClick={onToggleSidebar}
          aria-label={isSidebarOpen ? 'Close history' : 'Open history'}
          title="Toggle history sidebar"
          className={`p-2 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 ${
            isSidebarOpen
              ? 'text-sky-400 bg-sky-500/10 border border-sky-500/20'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-transparent'
          }`}
        >
          <PanelLeft className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={onReturnToMain}
          aria-label="Return to playground home"
          title="Return to playground home"
          className="flex items-center gap-2.5 px-2 py-1 -ml-1 rounded-xl transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 cursor-pointer text-left"
        >
          <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-sky-500 via-indigo-500 to-emerald-400 flex items-center justify-center shadow-md shadow-sky-500/20 flex-shrink-0">
            <Sparkles className="w-3.5 h-3.5 text-white" />
          </div>
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-sm tracking-tight text-white">
              Aether<span className="text-sky-400 font-semibold">Studio</span>
            </span>
            <span className="text-[10px] uppercase font-semibold tracking-wider px-1.5 py-0.5 rounded bg-slate-800/90 border border-slate-700/60 text-slate-400">
              Playground
            </span>
          </div>
        </button>

        {/* Model ID preview breadcrumb */}
        <div className="hidden md:flex items-center gap-1.5 text-xs text-slate-400 pl-2">
          <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
          <span className="font-mono text-slate-300 max-w-[200px] truncate">
            {selectedModel.providerModelId}
          </span>
          <span
            className={`w-2 h-2 rounded-full ${
              selectedModel.isConfigured
                ? selectedModel.isMockFallback
                  ? 'bg-amber-400'
                  : 'bg-emerald-400'
                : 'bg-rose-500'
            }`}
          />
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2">
        {!selectedModel.isConfigured && (
          <div className="hidden sm:flex items-center gap-1.5 text-xs text-rose-300 bg-rose-500/10 border border-rose-500/20 px-2.5 py-1 rounded-lg">
            <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
            <span>Setup required</span>
          </div>
        )}

        <button
          type="button"
          onClick={onOpenCodeModal}
          title="Inspect API export code"
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800/60 hover:bg-slate-800 border border-white/[0.08] rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
        >
          <Code2 className="w-3.5 h-3.5 text-sky-400" />
          <span className="hidden sm:inline">Export Code</span>
        </button>

        <button
          type="button"
          onClick={onToggleSettings}
          aria-label={isSettingsOpen ? 'Close settings panel' : 'Open settings panel'}
          title="Toggle parameters panel"
          className={`p-2 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 border ${
            isSettingsOpen
              ? 'text-sky-400 bg-sky-500/10 border-sky-500/30'
              : 'text-slate-400 hover:text-slate-200 bg-slate-800/60 hover:bg-slate-800 border-white/[0.08]'
          }`}
        >
          <Sliders className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
