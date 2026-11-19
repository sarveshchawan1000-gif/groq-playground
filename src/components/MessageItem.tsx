import React, { useRef, useEffect } from 'react';
import { ChatMessage, Role } from '@/lib/providers/types';
import { ArrowUp, ArrowDown, Trash2, Image, X, Bot, User, Terminal } from 'lucide-react';

interface MessageItemProps {
  message: ChatMessage;
  index: number;
  totalMessages: number;
  supportsVision: boolean;
  onUpdateContent: (id: string, content: string) => void;
  onUpdateRole: (id: string, role: Role) => void;
  onAddAttachment: (id: string, file: File) => void;
  onRemoveAttachment: (id: string, index: number) => void;
  onMoveUp: (index: number) => void;
  onMoveDown: (index: number) => void;
  onDelete: (id: string) => void;
}

export const MessageItem: React.FC<MessageItemProps> = ({
  message,
  index,
  totalMessages,
  supportsVision,
  onUpdateContent,
  onUpdateRole,
  onAddAttachment,
  onRemoveAttachment,
  onMoveUp,
  onMoveDown,
  onDelete,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-resize textarea to fit content
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.max(72, textareaRef.current.scrollHeight)}px`;
    }
  }, [message.content]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onAddAttachment(message.id, e.target.files[0]);
      e.target.value = '';
    }
  };

  const getRoleBadgeStyle = (role: Role) => {
    switch (role) {
      case 'system':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
      case 'user':
        return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20';
      case 'assistant':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
    }
  };

  const getRoleIcon = (role: Role) => {
    switch (role) {
      case 'system':
        return <Terminal className="w-3.5 h-3.5" aria-hidden="true" />;
      case 'user':
        return <User className="w-3.5 h-3.5" aria-hidden="true" />;
      case 'assistant':
        return <Bot className="w-3.5 h-3.5" aria-hidden="true" />;
    }
  };

  return (
    <div
      className="group relative rounded-xl border border-surface-border bg-surface-50 p-4 transition-all hover:border-zinc-700/80 focus-within:border-cyan-500/50 shadow-sm"
      aria-label={`${message.role} message block ${index + 1} of ${totalMessages}`}
    >
      {/* Header Bar: Role Selector & Action Controls */}
      <div className="flex items-center justify-between pb-3 border-b border-surface-border/50">
        <div className="flex items-center gap-2">
          {/* Role selector dropdown */}
          <div className="relative">
            <label htmlFor={`role-select-${message.id}`} className="sr-only">
              Message Role
            </label>
            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-semibold ${getRoleBadgeStyle(message.role)}`}>
              {getRoleIcon(message.role)}
              <select
                id={`role-select-${message.id}`}
                value={message.role}
                onChange={(e) => onUpdateRole(message.id, e.target.value as Role)}
                className="bg-transparent uppercase tracking-wider cursor-pointer focus:outline-none"
              >
                <option value="system" className="bg-surface-100 text-zinc-100">System</option>
                <option value="user" className="bg-surface-100 text-zinc-100">User</option>
                <option value="assistant" className="bg-surface-100 text-zinc-100">Assistant</option>
              </select>
            </div>
          </div>

          <span className="text-[11px] font-mono text-zinc-400">
            #{index + 1}
          </span>
        </div>

        {/* Message Reorder & Delete Controls */}
        <div className="flex items-center gap-1">
          {/* Vision upload button (User messages only, if vision supported) */}
          {message.role === 'user' && supportsVision && (
            <>
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
                id={`file-upload-${message.id}`}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                title="Attach image for multimodal analysis"
                aria-label="Attach image"
                className="p-1.5 text-zinc-400 hover:text-amber-400 hover:bg-surface-100 rounded-md transition-colors focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:outline-none"
              >
                <Image className="w-3.5 h-3.5" aria-hidden="true" />
              </button>
            </>
          )}

          {/* Move Up */}
          <button
            type="button"
            disabled={index === 0}
            onClick={() => onMoveUp(index)}
            aria-label="Move message up"
            title="Move message up"
            className="p-1.5 text-zinc-400 hover:text-zinc-100 hover:bg-surface-100 disabled:opacity-30 disabled:hover:bg-transparent rounded-md transition-colors focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:outline-none"
          >
            <ArrowUp className="w-3.5 h-3.5" aria-hidden="true" />
          </button>

          {/* Move Down */}
          <button
            type="button"
            disabled={index === totalMessages - 1}
            onClick={() => onMoveDown(index)}
            aria-label="Move message down"
            title="Move message down"
            className="p-1.5 text-zinc-400 hover:text-zinc-100 hover:bg-surface-100 disabled:opacity-30 disabled:hover:bg-transparent rounded-md transition-colors focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:outline-none"
          >
            <ArrowDown className="w-3.5 h-3.5" aria-hidden="true" />
          </button>

          {/* Delete Message */}
          <button
            type="button"
            onClick={() => onDelete(message.id)}
            aria-label="Delete this message"
            title="Delete message"
            className="p-1.5 text-zinc-400 hover:text-rose-400 hover:bg-surface-100 rounded-md transition-colors focus-visible:ring-2 focus-visible:ring-rose-400 focus-visible:outline-none"
          >
            <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* Image Attachments Preview */}
      {message.attachments && message.attachments.length > 0 && (
        <div className="pt-3 flex flex-wrap gap-2">
          {message.attachments.map((att, aIdx) => (
            <div key={aIdx} className="relative group/att rounded-lg overflow-hidden border border-surface-border bg-black/40">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={att.image_url.url}
                alt="Uploaded multimodal preview"
                className="w-24 h-24 object-cover"
              />
              <button
                type="button"
                onClick={() => onRemoveAttachment(message.id, aIdx)}
                aria-label="Remove image attachment"
                className="absolute top-1 right-1 p-1 bg-black/70 hover:bg-rose-600 text-white rounded-full transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Multiline Message Content Textarea */}
      <div className="pt-3">
        <label htmlFor={`content-input-${message.id}`} className="sr-only">
          {message.role} message content
        </label>
        <textarea
          id={`content-input-${message.id}`}
          ref={textareaRef}
          value={message.content}
          onChange={(e) => onUpdateContent(message.id, e.target.value)}
          placeholder={
            message.role === 'system'
              ? 'Enter system instructions (e.g. "You are an expert full-stack engineer...")...'
              : message.role === 'assistant'
              ? 'Enter example assistant response or prior turn...'
              : 'Enter user prompt or query...'
          }
          rows={2}
          className="w-full bg-transparent resize-none text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none leading-relaxed font-sans"
        />
      </div>

      <div className="flex justify-end pt-1">
        <span className="text-[10px] font-mono text-zinc-500">
          {message.content.length} chars
        </span>
      </div>
    </div>
  );
};
