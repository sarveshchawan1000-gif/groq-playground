'use client';

import React, { useState } from 'react';
import { SavedConversation } from '@/types';
import {
  Plus, MessageSquare, Trash2, Pencil, Check, X, ChevronRight, Clock,
} from 'lucide-react';

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

  function relativeTime(ts: number) {
    const diff = Date.now() - ts;
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  }

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 38,
            background: 'rgba(0,0,0,0.5)',
          }}
          className="lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <nav
        aria-label="Conversation history"
        style={{
          position: 'fixed',
          top: 0, left: 0, bottom: 0,
          zIndex: 39,
          width: 260,
          background: '#0d0d14',
          borderRight: '1px solid rgba(255,255,255,0.07)',
          display: 'flex',
          flexDirection: 'column',
          transform: isOpen ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 0.22s cubic-bezier(0.4,0,0.2,1)',
          boxShadow: isOpen ? '12px 0 40px rgba(0,0,0,0.3)' : 'none',
        }}
      >
        {/* Header */}
        <div style={{
          padding: '12px 12px 10px',
          borderBottom: '1px solid rgba(255,255,255,0.07)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 8,
          marginTop: 48, // below app header
        }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#606070', letterSpacing: '0.07em', textTransform: 'uppercase' }}>
            History
          </span>
          <button
            type="button"
            onClick={onNewConversation}
            title="New conversation"
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              fontSize: 12, fontWeight: 600, color: '#4f8ef7',
              background: 'rgba(79,142,247,0.10)',
              border: '1px solid rgba(79,142,247,0.2)',
              borderRadius: 7, padding: '5px 10px',
              cursor: 'pointer', transition: 'all 0.15s',
            }}
          >
            <Plus style={{ width: 12, height: 12 }} /> New
          </button>
        </div>

        {/* List */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '8px 6px' }}>
          {conversations.length === 0 ? (
            <div style={{ padding: '32px 16px', textAlign: 'center' }}>
              <MessageSquare style={{ width: 24, height: 24, color: '#3a3a50', margin: '0 auto 10px' }} />
              <p style={{ fontSize: 12, color: '#606070', lineHeight: 1.6 }}>
                No saved conversations yet. Start chatting!
              </p>
            </div>
          ) : (
            conversations.map((convo) => {
              const isActive = convo.id === activeConversationId;
              const isEditing = editingId === convo.id;

              return (
                <div
                  key={convo.id}
                  onClick={() => !isEditing && onSelectConversation(convo)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '8px 8px',
                    borderRadius: 8,
                    cursor: isEditing ? 'default' : 'pointer',
                    background: isActive ? 'rgba(79,142,247,0.10)' : 'transparent',
                    border: `1px solid ${isActive ? 'rgba(79,142,247,0.18)' : 'transparent'}`,
                    marginBottom: 2,
                    transition: 'all 0.12s',
                    position: 'relative',
                    group: 'true',
                  } as React.CSSProperties}
                  onMouseEnter={(e) => {
                    if (!isActive) (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.03)';
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) (e.currentTarget as HTMLElement).style.background = 'transparent';
                  }}
                >
                  <ChevronRight style={{
                    width: 12, height: 12,
                    color: isActive ? '#4f8ef7' : '#3a3a50',
                    flexShrink: 0,
                  }} />

                  <div style={{ flex: 1, minWidth: 0 }}>
                    {isEditing ? (
                      <input
                        autoFocus
                        value={editingTitle}
                        onChange={(e) => setEditingTitle(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') saveEdit(convo.id);
                          if (e.key === 'Escape') setEditingId(null);
                        }}
                        onClick={(e) => e.stopPropagation()}
                        style={{
                          width: '100%', fontSize: 12, color: '#f0f0f4',
                          background: 'rgba(255,255,255,0.06)',
                          border: '1px solid rgba(79,142,247,0.3)',
                          borderRadius: 5, padding: '3px 6px',
                          outline: 'none',
                        }}
                      />
                    ) : (
                      <div style={{
                        fontSize: 12, fontWeight: 500,
                        color: isActive ? '#f0f0f4' : '#9898a8',
                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                        lineHeight: 1.4,
                      }}>
                        {convo.title}
                      </div>
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                      <Clock style={{ width: 9, height: 9, color: '#3a3a50' }} />
                      <span style={{ fontSize: 10, color: '#3a3a50' }}>
                        {relativeTime(convo.updatedAt)}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  {isEditing ? (
                    <div style={{ display: 'flex', gap: 3 }}>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); saveEdit(convo.id); }}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#3ecf8e', padding: 2 }}
                      >
                        <Check style={{ width: 12, height: 12 }} />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setEditingId(null); }}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#606070', padding: 2 }}
                      >
                        <X style={{ width: 12, height: 12 }} />
                      </button>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', gap: 2, opacity: 0 }}
                      className="sidebar-actions"
                      onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.opacity = '1'}
                    >
                      <button
                        type="button"
                        title="Rename"
                        onClick={(e) => startEdit(convo, e)}
                        style={{
                          background: 'none', border: 'none', cursor: 'pointer',
                          color: '#606070', padding: 3, borderRadius: 4,
                          display: 'flex', alignItems: 'center',
                        }}
                      >
                        <Pencil style={{ width: 11, height: 11 }} />
                      </button>
                      <button
                        type="button"
                        title="Delete"
                        onClick={(e) => { e.stopPropagation(); onDeleteConversation(convo.id); }}
                        style={{
                          background: 'none', border: 'none', cursor: 'pointer',
                          color: '#606070', padding: 3, borderRadius: 4,
                          display: 'flex', alignItems: 'center',
                        }}
                      >
                        <Trash2 style={{ width: 11, height: 11 }} />
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '10px 12px',
          borderTop: '1px solid rgba(255,255,255,0.05)',
          fontSize: 10, color: '#3a3a50', textAlign: 'center',
        }}>
          {conversations.length} conversation{conversations.length !== 1 ? 's' : ''} saved locally
        </div>
      </nav>

      <style>{`
        .sidebar-actions { transition: opacity 0.15s; }
        div:hover > .sidebar-actions { opacity: 1 !important; }
      `}</style>
    </>
  );
};
