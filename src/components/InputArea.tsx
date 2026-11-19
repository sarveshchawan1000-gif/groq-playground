'use client';

import React, { useRef, useEffect, useState } from 'react';
import { Send, Square, Paperclip, ChevronDown, ChevronUp } from 'lucide-react';

interface InputAreaProps {
  inputPrompt: string;
  onInputChange: (val: string) => void;
  onSubmit: () => void;
  onStop: () => void;
  isStreaming: boolean;
  isModelConfigured: boolean;
  supportsVision: boolean;
  onAttachImage?: (file: File) => void;
  systemPrompt: string;
  onSystemPromptChange: (val: string) => void;
  hasMessages: boolean;
}

export const InputArea: React.FC<InputAreaProps> = ({
  inputPrompt,
  onInputChange,
  onSubmit,
  onStop,
  isStreaming,
  isModelConfigured,
  supportsVision,
  onAttachImage,
  systemPrompt,
  onSystemPromptChange,
  hasMessages,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const sysRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [sysOpen, setSysOpen] = useState(false);

  // Auto-resize main textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(220, Math.max(48, textareaRef.current.scrollHeight))}px`;
    }
  }, [inputPrompt]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      if (!isStreaming) onSubmit();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onAttachImage) {
      onAttachImage(file);
      e.target.value = '';
    }
  };

  const canSend = isModelConfigured && (inputPrompt.trim().length > 0 || hasMessages);

  return (
    <div className="w-full flex flex-col gap-2">
      {/* Collapsible System Prompt Drawer */}
      <div className="rounded-xl border border-purple-500/20 bg-purple-950/10 overflow-hidden transition-all">
        <button
          type="button"
          onClick={() => setSysOpen((prev) => !prev)}
          className="w-full flex items-center justify-between px-3 py-2 text-left hover:bg-purple-950/20 transition-colors"
        >
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold text-purple-400 uppercase tracking-wider">
              System Directives
            </span>
            {systemPrompt && !sysOpen && (
              <span className="text-xs text-slate-400 max-w-[280px] sm:max-w-md truncate">
                {systemPrompt}
              </span>
            )}
          </div>
          {sysOpen ? (
            <ChevronUp className="w-4 h-4 text-purple-400 flex-shrink-0" />
          ) : (
            <ChevronDown className="w-4 h-4 text-purple-400 flex-shrink-0" />
          )}
        </button>

        {sysOpen && (
          <div className="p-3 pt-0">
            <textarea
              ref={sysRef}
              value={systemPrompt}
              onChange={(e) => onSystemPromptChange(e.target.value)}
              placeholder="e.g. You are a senior fullstack engineer. Write concise, production-ready code with explanations."
              rows={3}
              className="w-full p-2.5 rounded-lg bg-slate-900/80 border border-white/[0.08] text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-500/40 resize-none font-sans leading-relaxed"
            />
          </div>
        )}
      </div>

      {/* Main Composer Box */}
      <div className="rounded-2xl border border-white/[0.10] bg-slate-900/90 focus-within:border-sky-500/50 p-3 transition-colors shadow-lg">
        <textarea
          ref={textareaRef}
          value={inputPrompt}
          onChange={(e) => onInputChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={
            isModelConfigured
              ? "Ask a question or enter a prompt... (Press ⌘+Enter to send)"
              : "Model is not configured. Add your API key in .env.local to begin."
          }
          disabled={!isModelConfigured}
          rows={1}
          className="w-full bg-transparent border-none text-sm text-slate-100 placeholder-slate-500 focus:outline-none resize-none leading-relaxed min-h-[48px] max-h-56 pr-2"
        />

        {/* Toolbar & Controls */}
        <div className="flex items-center justify-between pt-2 border-t border-white/[0.06] mt-1">
          <div className="flex items-center gap-2">
            {supportsVision && onAttachImage && (
              <>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  title="Attach image"
                  className="p-1.5 text-slate-400 hover:text-amber-400 rounded-lg hover:bg-slate-800 transition-colors"
                >
                  <Paperclip className="w-4 h-4" />
                </button>
              </>
            )}

            <span className="text-[11px] text-slate-500 font-mono hidden sm:inline">
              ⌘+Enter to submit
            </span>
          </div>

          <div className="flex items-center gap-2">
            {isStreaming ? (
              <button
                type="button"
                onClick={onStop}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl text-rose-300 bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 transition-all shadow-sm"
              >
                <Square className="w-3.5 h-3.5 fill-current" />
                <span>Stop</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={onSubmit}
                disabled={!canSend}
                className={`flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl transition-all shadow-sm ${
                  canSend
                    ? 'bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white shadow-sky-500/20 active:scale-[0.98]'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-white/[0.04]'
                }`}
              >
                <Send className="w-3.5 h-3.5" />
                <span>Send</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
