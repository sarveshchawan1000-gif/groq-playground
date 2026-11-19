'use client';

import React, { useState } from 'react';
import { SavedConversation } from '@/types';
import { Plus, MessageSquare, Trash2, Pencil, Check, X, Clock } from 'lucide-react';

interface ConversationsSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  conversations: SavedConversation[];
  activeConversationId: string | null;
  onSelectConversation: (c: SavedConversation) => void;
  onNewConversation: () => void;
  onRenameConversation: (id: string, title: string) => void;
  onDeleteConversation: (id: string) => void;
}

export const ConversationsSidebar: React.FC<ConversationsSidebarProps> = ({
  isOpen,
  onClose,
  conversations,
  activeConversationId,
  onSelectConversation,
  onNewConversation,
  onRenameConversation,
  onDeleteConversation,
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');

  const startEdit = (c: SavedConversation, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(c.id);
    setEditingTitle(c.title);
  };

  const saveEdit = (id: string) => {
    if (editingTitle.trim()) onRenameConversation(id, editingTitle.trim());
    setEditingId(null);
  };

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Drawer */}
      <nav
        aria-label="Conversation history"
        className={`fixed inset-y-0 left-0 z-40 w-72 bg-[#0b0f19] border-r border-white/[0.08] flex flex-col transition-transform duration-200 shadow-2xl ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/[0.08]">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Sessions History
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={onNewConversation}
              title="Start new conversation"
              className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-sky-400 bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/30 rounded-lg transition-colors"
            >
              <Plus className="w-3.5 h-3.5" /> New
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors ml-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {conversations.length === 0 ? (
            <div className="p-6 text-center text-slate-500">
              <MessageSquare className="w-6 h-6 mx-auto mb-2 opacity-40" />
              <p className="text-xs">No saved sessions yet.</p>
            </div>
          ) : (
            conversations.map((c) => {
              const isActive = c.id === activeConversationId;
              const isEditing = editingId === c.id;

              return (
                <div
                  key={c.id}
                  onClick={() => !isEditing && onSelectConversation(c)}
                  className={`group flex items-center justify-between gap-2 p-2.5 rounded-xl cursor-pointer transition-colors border ${
                    isActive
                      ? 'bg-sky-500/15 border-sky-500/30 text-white'
                      : 'hover:bg-slate-800/60 border-transparent text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <MessageSquare className={`w-3.5 h-3.5 flex-shrink-0 ${isActive ? 'text-sky-400' : 'text-slate-500'}`} />
                    {isEditing ? (
                      <input
                        autoFocus
                        value={editingTitle}
                        onChange={(e) => setEditingTitle(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') saveEdit(c.id);
                          if (e.key === 'Escape') setEditingId(null);
                        }}
                        onClick={(e) => e.stopPropagation()}
                        className="w-full bg-slate-900 border border-sky-500/40 rounded px-1.5 py-0.5 text-xs text-white focus:outline-none"
                      />
                    ) : (
                      <span className="text-xs truncate block">{c.title}</span>
                    )}
                  </div>

                  {isEditing ? (
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); saveEdit(c.id); }}
                        className="text-emerald-400 hover:text-emerald-300 p-0.5"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setEditingId(null); }}
                        className="text-slate-400 hover:text-slate-200 p-0.5"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                      <button
                        type="button"
                        onClick={(e) => startEdit(c, e)}
                        className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-700"
                      >
                        <Pencil className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); onDeleteConversation(c.id); }}
                        className="p-1 text-slate-400 hover:text-rose-400 rounded hover:bg-slate-700"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-white/[0.08] text-[11px] text-slate-500 flex items-center justify-between">
          <span>{conversations.length} saved local session{conversations.length !== 1 ? 's' : ''}</span>
          <Clock className="w-3.5 h-3.5 text-slate-600" />
        </div>
      </nav>
    </>
  );
};
