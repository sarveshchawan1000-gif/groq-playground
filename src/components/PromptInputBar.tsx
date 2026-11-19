import React, { useRef, useEffect } from 'react';
import { Play, Square, RotateCcw, Trash2, Image, Send, CornerDownLeft } from 'lucide-react';

interface PromptInputBarProps {
  inputPrompt: string;
  onInputChange: (val: string) => void;
  onSubmitPrompt: () => void;
  onStop: () => void;
  onClear: () => void;
  onRetry: () => void;
  isStreaming: boolean;
  canRetry: boolean;
  supportsVision: boolean;
  onAttachImage?: (file: File) => void;
  isModelConfigured: boolean;
}

export const PromptInputBar: React.FC<PromptInputBarProps> = ({
  inputPrompt,
  onInputChange,
  onSubmitPrompt,
  onStop,
  onClear,
  onRetry,
  isStreaming,
  canRetry,
  supportsVision,
  onAttachImage,
  isModelConfigured,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(180, Math.max(52, textareaRef.current.scrollHeight))}px`;
    }
  }, [inputPrompt]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Cmd+Enter or Ctrl+Enter submits
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      if (!isStreaming) {
        onSubmitPrompt();
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0] && onAttachImage) {
      onAttachImage(e.target.files[0]);
      e.target.value = '';
    }
  };

  return (
    <div className="w-full">
      <div className="rounded-2xl border border-surface-border bg-surface-100/95 p-3 shadow-xl focus-within:border-cyan-500/50 transition-all">
        {/* Multiline Input Field */}
        <div className="relative">
          <label htmlFor="main-prompt-input" className="sr-only">
            Compose AI Query
          </label>
          <textarea
            id="main-prompt-input"
            ref={textareaRef}
            value={inputPrompt}
            onChange={(e) => onInputChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message or prompt here... (Press ⌘+Enter or Ctrl+Enter to Run)"
            rows={1}
            className="w-full bg-transparent resize-none text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none leading-relaxed max-h-44 font-sans pr-2"
          />
        </div>

        {/* Action Controls & Run Bar */}
        <div className="flex flex-wrap items-center justify-between pt-2.5 mt-1 border-t border-surface-border/50 gap-2">
          {/* Left tools: Attachment, Clear, Retry */}
          <div className="flex items-center gap-1.5">
            {supportsVision && onAttachImage && (
              <>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                  id="prompt-file-upload"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  title="Upload image for this request"
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs text-zinc-300 hover:text-amber-400 hover:bg-surface-200 rounded-lg transition-colors border border-surface-border"
                >
                  <Image className="w-3.5 h-3.5 text-amber-400" />
                  <span className="hidden sm:inline">Add Image</span>
                </button>
              </>
            )}

            <button
              type="button"
              onClick={onClear}
              title="Clear all messages"
              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs text-zinc-400 hover:text-zinc-100 hover:bg-surface-200 rounded-lg transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Clear</span>
            </button>

            {canRetry && !isStreaming && (
              <button
                type="button"
                onClick={onRetry}
                title="Retry last request"
                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs text-zinc-300 hover:text-cyan-400 hover:bg-surface-200 rounded-lg transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Retry</span>
              </button>
            )}
          </div>

          {/* Right actions: Run / Stop */}
          <div className="flex items-center gap-2">
            <span className="hidden md:inline-flex items-center gap-1 text-[11px] font-mono text-zinc-500 mr-1">
              <CornerDownLeft className="w-3 h-3" /> ⌘+Enter
            </span>

            {isStreaming ? (
              <button
                type="button"
                onClick={onStop}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-rose-300 bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 rounded-xl transition-all shadow-sm focus-visible:ring-2 focus-visible:ring-rose-400 focus-visible:outline-none"
              >
                <Square className="w-3.5 h-3.5 fill-current" />
                <span>Stop</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={onSubmitPrompt}
                disabled={!isModelConfigured && !inputPrompt.trim()}
                className={`inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl transition-all shadow-sm focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:outline-none ${
                  !isModelConfigured
                    ? 'bg-zinc-800 text-zinc-400 border border-zinc-700 cursor-not-allowed'
                    : 'bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white shadow-cyan-500/20 active:scale-[0.98]'
                }`}
              >
                {inputPrompt.trim() ? (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Run Query</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Run</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
