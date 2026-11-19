import React, { useState } from 'react';
import { SavedConversation } from '@/types';
import { MessageSquare, Plus, Trash2, Edit2, Check, X, Clock } from 'lucide-react';

interface ConversationsSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  conversations: SavedConversation[];
  activeConversationId: string | null;
  onSelectConversation: (convo: SavedConversation) => void;
  onNewConversation: () => void;
  onRenameConversation: (id: string, newTitle: string) => void;
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
  const [editTitle, setEditTitle] = useState('');

  if (!isOpen) return null;

  const handleStartRename = (convo: SavedConversation, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(convo.id);
    setEditTitle(convo.title);
  };

  const handleSaveRename = (id: string, e: React.MouseEvent | React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (editTitle.trim()) {
      onRenameConversation(id, editTitle.trim());
    }
    setEditingId(null);
  };

  const handleCancelRename = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(null);
  };

  return (
    <>
      {/* Mobile backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
        onClick={onClose}
        aria-hidden="true"
      />

      <aside
        aria-label="Saved conversations history"
        className="fixed lg:static inset-y-0 left-0 z-40 w-72 sm:w-80 border-r border-surface-border bg-surface-50 flex flex-col h-full shadow-2xl lg:shadow-none transition-transform"
      >
        {/* Sidebar Header */}
        <div className="flex items-center justify-between p-4 border-b border-surface-border bg-surface-100">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-cyan-400" />
            <h2 className="text-sm font-semibold text-zinc-100">
              Saved Sessions
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close conversation history"
            className="p-1.5 text-zinc-400 hover:text-zinc-100 hover:bg-surface-200 rounded-lg lg:hidden"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* New Session Button */}
        <div className="p-3 border-b border-surface-border">
          <button
            type="button"
            onClick={onNewConversation}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold rounded-xl bg-surface-100 hover:bg-surface-200 border border-surface-border text-zinc-200 hover:text-white transition-colors focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:outline-none"
          >
            <Plus className="w-4 h-4 text-cyan-400" />
            <span>New Playground Session</span>
          </button>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {conversations.length === 0 ? (
            <div className="py-8 text-center text-xs text-zinc-500 px-4">
              <Clock className="w-6 h-6 mx-auto mb-2 opacity-40 text-zinc-400" />
              <p>No saved conversations yet.</p>
              <p className="text-[11px] mt-1 text-zinc-400">
                Your conversations are automatically backed up in local browser storage.
              </p>
            </div>
          ) : (
            conversations.map((convo) => {
              const isActive = convo.id === activeConversationId;
              const isEditing = convo.id === editingId;

              return (
                <div
                  key={convo.id}
                  onClick={() => !isEditing && onSelectConversation(convo)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !isEditing) onSelectConversation(convo);
                  }}
                  className={`group relative flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-all text-xs focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:outline-none ${
                    isActive
                      ? 'bg-surface-200/90 border border-cyan-500/40 text-zinc-100'
                      : 'hover:bg-surface-100 border border-transparent text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  {isEditing ? (
                    <form
                      onSubmit={(e) => handleSaveRename(convo.id, e)}
                      className="flex items-center gap-1 w-full"
                    >
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        autoFocus
                        className="flex-1 bg-surface-200 border border-cyan-500 rounded px-2 py-1 text-xs text-zinc-100 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={(e) => handleSaveRename(convo.id, e)}
                        className="p-1 hover:text-emerald-400 text-zinc-400"
                        title="Save title"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={handleCancelRename}
                        className="p-1 hover:text-rose-400 text-zinc-400"
                        title="Cancel"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </form>
                  ) : (
                    <>
                      <div className="flex-1 min-w-0 pr-2">
                        <div className="font-medium truncate text-zinc-200">
                          {convo.title}
                        </div>
                        <div className="text-[10px] text-zinc-400 flex items-center gap-2 mt-0.5 font-mono">
                          <span>{convo.messages.length} msg</span>
                          <span>•</span>
                          <span>{convo.modelId.replace('-model', '')}</span>
                        </div>
                      </div>

                      {/* Action buttons on hover */}
                      <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                        <button
                          type="button"
                          onClick={(e) => handleStartRename(convo, e)}
                          title="Rename conversation"
                          aria-label="Rename conversation"
                          className="p-1 hover:text-zinc-100 text-zinc-400 hover:bg-surface-200 rounded"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteConversation(convo.id);
                          }}
                          title="Delete conversation"
                          aria-label="Delete conversation"
                          className="p-1 hover:text-rose-400 text-zinc-400 hover:bg-surface-200 rounded"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Storage stats */}
        <div className="p-3 border-t border-surface-border text-[11px] text-zinc-400 text-center bg-surface-100/50">
          Local Storage Sync Active
        </div>
      </aside>
    </>
  );
};
