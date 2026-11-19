import React from 'react';
import { ChatMessage, Role } from '@/lib/providers/types';
import { MessageItem } from './MessageItem';
import { Plus, Sparkles, Code2, HelpCircle, Layers } from 'lucide-react';

interface ConversationEditorProps {
  messages: ChatMessage[];
  supportsVision: boolean;
  onUpdateContent: (id: string, content: string) => void;
  onUpdateRole: (id: string, role: Role) => void;
  onAddAttachment: (id: string, file: File) => void;
  onRemoveAttachment: (id: string, index: number) => void;
  onMoveUp: (index: number) => void;
  onMoveDown: (index: number) => void;
  onDelete: (id: string) => void;
  onAddMessage: (role: Role) => void;
  onLoadTemplate: (templateMessages: ChatMessage[]) => void;
}

export const ConversationEditor: React.FC<ConversationEditorProps> = ({
  messages,
  supportsVision,
  onUpdateContent,
  onUpdateRole,
  onAddAttachment,
  onRemoveAttachment,
  onMoveUp,
  onMoveDown,
  onDelete,
  onAddMessage,
  onLoadTemplate,
}) => {
  const starterTemplates = [
    {
      title: 'Coding Assistant',
      icon: <Code2 className="w-4 h-4 text-cyan-400" />,
      desc: 'System prompt with TypeScript context & optimization directives.',
      template: [
        {
          id: 'tpl-1',
          role: 'system' as Role,
          content: 'You are an elite TypeScript systems architect. Provide succinct, type-safe, production-grade solutions with minimal dependencies.',
        },
        {
          id: 'tpl-2',
          role: 'user' as Role,
          content: 'Write an asynchronous worker queue in TypeScript that supports concurrency limits, retry backoff, and task cancellation.',
        },
      ],
    },
    {
      title: 'JSON Data Extraction',
      icon: <Sparkles className="w-4 h-4 text-emerald-400" />,
      desc: 'Enforces pure JSON output with strict schema formatting.',
      template: [
        {
          id: 'tpl-1',
          role: 'system' as Role,
          content: 'You are a structured data extractor. You must respond ONLY with a valid JSON object matching the requested schema. Do not add markdown backticks or commentary.',
        },
        {
          id: 'tpl-2',
          role: 'user' as Role,
          content: 'Extract company name, founding year, key executives, and primary tech stack from this press release: "NovaDynamics was established in 2021 by Sarah Jenkins and David Rao to build distributed vector databases..."',
        },
      ],
    },
    {
      title: 'Logic & Reasoning',
      icon: <HelpCircle className="w-4 h-4 text-purple-400" />,
      desc: 'Step-by-step thinking for puzzles or algorithmic complexity.',
      template: [
        {
          id: 'tpl-1',
          role: 'system' as Role,
          content: 'You are a rigorous analytical logician. Break down questions step-by-step, listing assumptions, edge cases, and deductions before providing the conclusion.',
        },
        {
          id: 'tpl-2',
          role: 'user' as Role,
          content: 'A balance scale is available. You have 12 coins, 11 of identical weight and 1 counterfeit of differing weight (unknown if heavier or lighter). What is the minimum weighings required to identify the counterfeit, and what is the exact weighing strategy?',
        },
      ],
    },
  ];

  return (
    <div className="space-y-4">
      {/* Messages Header */}
      <div className="flex items-center justify-between pb-1">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-cyan-400" aria-hidden="true" />
          <h2 className="text-sm font-semibold tracking-wide text-zinc-200 uppercase">
            Conversation Thread
          </h2>
          <span className="text-xs font-mono text-zinc-400 px-2 py-0.5 rounded-full bg-surface-100 border border-surface-border">
            {messages.length} {messages.length === 1 ? 'message' : 'messages'}
          </span>
        </div>

        {/* Quick Add buttons */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => onAddMessage('user')}
            className="inline-flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg bg-surface-100 hover:bg-surface-200 border border-surface-border text-zinc-300 transition-colors focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:outline-none"
          >
            <Plus className="w-3.5 h-3.5 text-cyan-400" />
            <span>Add User</span>
          </button>
          <button
            type="button"
            onClick={() => onAddMessage('system')}
            className="inline-flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg bg-surface-100 hover:bg-surface-200 border border-surface-border text-zinc-300 transition-colors focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:outline-none"
          >
            <Plus className="w-3.5 h-3.5 text-purple-400" />
            <span>Add System</span>
          </button>
        </div>
      </div>

      {/* Empty State / Starter Presets */}
      {messages.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-surface-border bg-surface-50/50 p-6 sm:p-8 text-center">
          <div className="w-12 h-12 rounded-xl bg-surface-100 border border-surface-border mx-auto flex items-center justify-center text-cyan-400 mb-3 shadow-inner">
            <Sparkles className="w-6 h-6" />
          </div>
          <h3 className="text-base font-semibold text-zinc-200">
            No messages in conversation
          </h3>
          <p className="text-xs text-zinc-400 max-w-md mx-auto mt-1 mb-6">
            Begin by choosing a starter workflow below, or add a custom System or User message.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-left">
            {starterTemplates.map((item, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => onLoadTemplate(item.template)}
                className="group p-4 rounded-xl border border-surface-border bg-surface-100 hover:bg-surface-200/90 hover:border-cyan-500/40 transition-all text-left focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:outline-none"
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="p-1 rounded bg-surface-200 border border-surface-border group-hover:scale-105 transition-transform">
                    {item.icon}
                  </div>
                  <span className="font-semibold text-xs text-zinc-100">
                    {item.title}
                  </span>
                </div>
                <p className="text-[11px] text-zinc-400 leading-relaxed">
                  {item.desc}
                </p>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {messages.map((message, index) => (
            <MessageItem
              key={message.id}
              message={message}
              index={index}
              totalMessages={messages.length}
              supportsVision={supportsVision}
              onUpdateContent={onUpdateContent}
              onUpdateRole={onUpdateRole}
              onAddAttachment={onAddAttachment}
              onRemoveAttachment={onRemoveAttachment}
              onMoveUp={onMoveUp}
              onMoveDown={onMoveDown}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
};
