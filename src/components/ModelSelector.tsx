'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ClientModelInfo } from '@/config/models';
import {
  ChevronDown, Check, Zap, Brain, PiggyBank, Eye,
  AlertTriangle, ShieldCheck, Search
} from 'lucide-react';

interface ModelSelectorProps {
  models: ClientModelInfo[];
  selectedModel: ClientModelInfo;
  onSelectModel: (model: ClientModelInfo) => void;
}

const categoryMeta: Record<string, { icon: React.ReactNode; color: string; bg: string }> = {
  fast: {
    icon: <Zap style={{ width: 13, height: 13 }} />,
    color: '#4f8ef7',
    bg: 'rgba(79,142,247,0.12)',
  },
  reasoning: {
    icon: <Brain style={{ width: 13, height: 13 }} />,
    color: '#a78bfa',
    bg: 'rgba(167,139,250,0.12)',
  },
  budget: {
    icon: <PiggyBank style={{ width: 13, height: 13 }} />,
    color: '#3ecf8e',
    bg: 'rgba(62,207,142,0.12)',
  },
  vision: {
    icon: <Eye style={{ width: 13, height: 13 }} />,
    color: '#f59e0b',
    bg: 'rgba(245,158,11,0.12)',
  },
};

export const ModelSelector: React.FC<ModelSelectorProps> = ({
  models,
  selectedModel,
  onSelectModel,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setSearch('');
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen && searchRef.current) {
      setTimeout(() => searchRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const filtered = models.filter(
    (m) =>
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.providerModelId.toLowerCase().includes(search.toLowerCase())
  );

  const meta = categoryMeta[selectedModel.category] || categoryMeta.fast;

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '8px 12px',
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.09)',
          borderRadius: 10,
          cursor: 'pointer',
          transition: 'all 0.15s',
          minWidth: 240,
          width: '100%',
        }}
      >
        {/* Category icon */}
        <span style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 28,
          height: 28,
          borderRadius: 7,
          background: meta.bg,
          color: meta.color,
          flexShrink: 0,
        }}>
          {meta.icon}
        </span>

        <span style={{ flex: 1, textAlign: 'left', minWidth: 0 }}>
          <span style={{
            display: 'block',
            fontSize: 13,
            fontWeight: 600,
            color: '#f0f0f4',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}>
            {selectedModel.name}
          </span>
          <span style={{
            display: 'block',
            fontSize: 11,
            color: '#9898a8',
            fontFamily: 'monospace',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}>
            {selectedModel.providerModelId}
          </span>
        </span>

        <ChevronDown
          style={{
            width: 14,
            height: 14,
            color: '#606070',
            flexShrink: 0,
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0)',
            transition: 'transform 0.2s',
          }}
        />
      </button>

      {isOpen && (
        <div
          role="listbox"
          aria-label="Select AI Model"
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            left: 0,
            width: '100%',
            minWidth: 320,
            maxWidth: 440,
            maxHeight: 420,
            overflowY: 'auto',
            background: '#16161f',
            border: '1px solid rgba(255,255,255,0.10)',
            borderRadius: 12,
            boxShadow: '0 20px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.05)',
            zIndex: 100,
            padding: '6px',
          }}
        >
          {/* Search */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '7px 10px',
            margin: '0 0 4px 0',
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 8,
          }}>
            <Search style={{ width: 13, height: 13, color: '#606070', flexShrink: 0 }} />
            <input
              ref={searchRef}
              type="text"
              placeholder="Search models…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                flex: 1,
                background: 'none',
                border: 'none',
                outline: 'none',
                fontSize: 12,
                color: '#f0f0f4',
              }}
            />
          </div>

          {/* Model list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {filtered.map((model) => {
              const isSelected = model.id === selectedModel.id;
              const m = categoryMeta[model.category] || categoryMeta.fast;
              return (
                <div
                  key={model.id}
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => { onSelectModel(model); setIsOpen(false); setSearch(''); }}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 10,
                    padding: '10px 10px',
                    borderRadius: 8,
                    cursor: 'pointer',
                    background: isSelected ? 'rgba(79,142,247,0.08)' : 'transparent',
                    border: `1px solid ${isSelected ? 'rgba(79,142,247,0.2)' : 'transparent'}`,
                    transition: 'all 0.12s',
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)';
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) (e.currentTarget as HTMLElement).style.background = 'transparent';
                  }}
                >
                  <span style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    width: 28, height: 28, borderRadius: 7,
                    background: m.bg, color: m.color, flexShrink: 0, marginTop: 1,
                  }}>
                    {m.icon}
                  </span>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: '#f0f0f4' }}>
                        {model.name}
                      </span>
                      {model.isConfigured ? (
                        <span style={{
                          fontSize: 10, color: '#3ecf8e', background: 'rgba(62,207,142,0.1)',
                          border: '1px solid rgba(62,207,142,0.2)', borderRadius: 5,
                          padding: '1px 6px', display: 'flex', alignItems: 'center', gap: 3,
                        }}>
                          <ShieldCheck style={{ width: 9, height: 9 }} /> Ready
                        </span>
                      ) : (
                        <span style={{
                          fontSize: 10, color: '#f43f5e', background: 'rgba(244,63,94,0.08)',
                          border: '1px solid rgba(244,63,94,0.2)', borderRadius: 5,
                          padding: '1px 6px', display: 'flex', alignItems: 'center', gap: 3,
                        }}>
                          <AlertTriangle style={{ width: 9, height: 9 }} /> Setup
                        </span>
                      )}
                      {isSelected && <Check style={{ width: 12, height: 12, color: '#4f8ef7', marginLeft: 'auto' }} />}
                    </div>
                    <div style={{ fontSize: 11, color: '#606070', fontFamily: 'monospace', marginBottom: 4 }}>
                      {model.providerModelId}
                    </div>
                    <div style={{ fontSize: 11, color: '#9898a8', lineHeight: 1.5 }}>
                      {model.description}
                    </div>
                    {/* Capability tags */}
                    <div style={{ display: 'flex', gap: 4, marginTop: 6, flexWrap: 'wrap' }}>
                      {model.contextLimit && (
                        <span style={{
                          fontSize: 10, color: '#606070', background: 'rgba(255,255,255,0.05)',
                          border: '1px solid rgba(255,255,255,0.08)', borderRadius: 4, padding: '1px 5px',
                        }}>
                          {(model.contextLimit / 1024).toFixed(0)}k ctx
                        </span>
                      )}
                      {model.capabilities.supportsStreaming && (
                        <span style={{
                          fontSize: 10, color: '#4f8ef7', background: 'rgba(79,142,247,0.08)',
                          border: '1px solid rgba(79,142,247,0.15)', borderRadius: 4, padding: '1px 5px',
                        }}>
                          Streaming
                        </span>
                      )}
                      {model.capabilities.supportsVision && (
                        <span style={{
                          fontSize: 10, color: '#f59e0b', background: 'rgba(245,158,11,0.08)',
                          border: '1px solid rgba(245,158,11,0.15)', borderRadius: 4, padding: '1px 5px',
                        }}>
                          Vision
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            {filtered.length === 0 && (
              <div style={{ textAlign: 'center', padding: '16px 0', color: '#606070', fontSize: 12 }}>
                No models match your search
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
