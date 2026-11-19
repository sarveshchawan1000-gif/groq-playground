import React, { useState } from 'react';
import { ClientModelInfo } from '@/config/models';
import { ChatMessage, GenerationSettings } from '@/lib/providers/types';
import { generateCurlCode, generatePythonCode, generateTypeScriptCode } from '@/lib/code-generator';
import { X, Copy, Check, Terminal, Code2 } from 'lucide-react';

interface CodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedModel: ClientModelInfo;
  messages: ChatMessage[];
  settings: GenerationSettings;
}

type LanguageTab = 'curl' | 'python' | 'typescript';

export const CodeModal: React.FC<CodeModalProps> = ({
  isOpen,
  onClose,
  selectedModel,
  messages,
  settings,
}) => {
  const [activeTab, setActiveTab] = useState<LanguageTab>('curl');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const getCode = () => {
    switch (activeTab) {
      case 'curl':
        return generateCurlCode(selectedModel, messages, settings);
      case 'python':
        return generatePythonCode(selectedModel, messages, settings);
      case 'typescript':
        return generateTypeScriptCode(selectedModel, messages, settings);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(getCode());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy code snippet', err);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="code-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
    >
      <div className="relative w-full max-w-3xl rounded-2xl bg-surface-50 border border-surface-border shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-surface-border bg-surface-100">
          <div className="flex items-center gap-2">
            <Terminal className="w-5 h-5 text-cyan-400" />
            <h3 id="code-modal-title" className="text-base font-semibold text-zinc-100">
              API Request Export
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close API code dialog"
            className="p-1.5 text-zinc-400 hover:text-zinc-100 hover:bg-surface-200 rounded-lg transition-colors focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:outline-none"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Notice */}
        <div className="px-6 py-2.5 bg-cyan-950/20 border-b border-surface-border text-xs text-zinc-300 flex items-center justify-between">
          <span>
            🔒 Safe export: API keys are strictly masked as variables and never exposed in this code.
          </span>
          <span className="font-mono text-cyan-400 text-[11px]">
            Target: {selectedModel.providerModelId}
          </span>
        </div>

        {/* Language Tabs & Copy Button */}
        <div className="flex items-center justify-between px-6 py-3 border-b border-surface-border bg-surface-50">
          <div className="flex items-center gap-1.5 p-1 bg-surface-100 border border-surface-border rounded-xl">
            {(['curl', 'python', 'typescript'] as LanguageTab[]).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg capitalize transition-colors focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:outline-none ${
                  activeTab === tab
                    ? 'bg-cyan-500 text-zinc-950 shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {tab === 'typescript' ? 'TypeScript' : tab === 'curl' ? 'cURL' : 'Python'}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-surface-100 hover:bg-surface-200 border border-surface-border text-zinc-200 rounded-lg transition-colors focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:outline-none"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-zinc-400" />
                <span>Copy Code</span>
              </>
            )}
          </button>
        </div>

        {/* Code View Area */}
        <div className="flex-1 overflow-auto p-6 bg-background font-mono text-xs text-zinc-200 leading-relaxed">
          <pre className="whitespace-pre overflow-x-auto select-all">
            <code>{getCode()}</code>
          </pre>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-surface-border bg-surface-100 flex items-center justify-between text-xs text-zinc-400">
          <div className="flex items-center gap-1.5">
            <Code2 className="w-3.5 h-3.5 text-cyan-400" />
            <span>Ready to integrate into your application codebase</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1 text-xs text-zinc-300 hover:text-white rounded-lg bg-surface-200 hover:bg-surface-300 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
