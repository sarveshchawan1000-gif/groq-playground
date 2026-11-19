'use client';

import React, { useRef, useEffect, useState } from 'react';
import { Send, Square, Paperclip, ChevronDown, ChevronUp } from 'lucide-react';
import { ChatMessage, Role } from '@/lib/providers/types';

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
  const [focused, setFocused] = useState(false);

  // Auto-resize main textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(200, Math.max(44, textareaRef.current.scrollHeight))}px`;
    }
  }, [inputPrompt]);

  // Auto-resize system prompt textarea
  useEffect(() => {
    if (sysRef.current) {
      sysRef.current.style.height = 'auto';
      sysRef.current.style.height = `${Math.min(160, Math.max(60, sysRef.current.scrollHeight))}px`;
    }
  }, [systemPrompt, sysOpen]);

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
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
    }}>
      {/* System Prompt collapsible */}
      <div style={{
        background: 'rgba(167,139,250,0.04)',
        border: '1px solid rgba(167,139,250,0.12)',
        borderRadius: 10,
        overflow: 'hidden',
        transition: 'all 0.2s',
      }}>
        <button
          type="button"
          onClick={() => setSysOpen((v) => !v)}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
            padding: '8px 12px',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            gap: 8,
          }}
        >
          <span style={{ fontSize: 11, fontWeight: 600, color: '#a78bfa', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
            System Prompt
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {systemPrompt && !sysOpen && (
              <span style={{
                fontSize: 10,
                color: '#606070',
                maxWidth: 200,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}>
                {systemPrompt.slice(0, 60)}{systemPrompt.length > 60 ? '…' : ''}
              </span>
            )}
            {sysOpen
              ? <ChevronUp style={{ width: 13, height: 13, color: '#606070' }} />
              : <ChevronDown style={{ width: 13, height: 13, color: '#606070' }} />}
          </div>
        </button>

        {sysOpen && (
          <div style={{ padding: '0 12px 10px' }}>
            <textarea
              ref={sysRef}
              value={systemPrompt}
              onChange={(e) => onSystemPromptChange(e.target.value)}
              placeholder="Set the assistant's behavior, persona, or context…"
              rows={3}
              style={{
                width: '100%',
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: 8,
                padding: '8px 10px',
                fontSize: 13,
                color: '#f0f0f4',
                resize: 'none',
                outline: 'none',
                lineHeight: 1.6,
                fontFamily: 'inherit',
                boxSizing: 'border-box',
              }}
            />
          </div>
        )}
      </div>

      {/* Main input box */}
      <div style={{
        background: '#16161f',
        border: `1px solid ${focused ? 'rgba(79,142,247,0.35)' : 'rgba(255,255,255,0.09)'}`,
        borderRadius: 12,
        padding: '12px 14px 10px',
        transition: 'border-color 0.15s',
        boxShadow: focused ? '0 0 0 3px rgba(79,142,247,0.08)' : 'none',
      }}>
        <textarea
          ref={textareaRef}
          value={inputPrompt}
          onChange={(e) => onInputChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={isModelConfigured
            ? "Message… (⌘+Enter to send)"
            : "Configure an API key in .env.local to start chatting"}
          disabled={!isModelConfigured}
          rows={1}
          style={{
            width: '100%',
            background: 'none',
            border: 'none',
            outline: 'none',
            resize: 'none',
            fontSize: 14,
            color: '#f0f0f4',
            lineHeight: 1.65,
            fontFamily: 'inherit',
            maxHeight: 200,
            minHeight: 44,
            overflowY: 'auto',
          }}
        />

        {/* Bottom action row */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginTop: 8,
          paddingTop: 8,
          borderTop: '1px solid rgba(255,255,255,0.05)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            {/* Attach image (vision models) */}
            {supportsVision && onAttachImage && (
              <>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handleFileChange}
                  style={{ display: 'none' }}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  title="Attach image"
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    width: 30, height: 30, borderRadius: 7, cursor: 'pointer',
                    background: 'none', border: '1px solid rgba(255,255,255,0.07)',
                    color: '#606070', transition: 'all 0.15s',
                  }}
                >
                  <Paperclip style={{ width: 13, height: 13 }} />
                </button>
              </>
            )}

            <span style={{ fontSize: 11, color: '#606070' }}>
              {inputPrompt.length > 0 ? `${inputPrompt.length} chars` : ''}
            </span>
          </div>

          {/* Send / Stop */}
          {isStreaming ? (
            <button
              type="button"
              onClick={onStop}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '7px 14px',
                background: 'rgba(244,63,94,0.12)',
                border: '1px solid rgba(244,63,94,0.25)',
                borderRadius: 8, cursor: 'pointer',
                fontSize: 13, fontWeight: 600, color: '#f43f5e',
                transition: 'all 0.15s',
              }}
            >
              <Square style={{ width: 12, height: 12, fill: 'currentColor' }} />
              Stop
            </button>
          ) : (
            <button
              type="button"
              onClick={onSubmit}
              disabled={!canSend}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '7px 16px',
                background: canSend
                  ? 'linear-gradient(135deg, #4f8ef7 0%, #6366f1 100%)'
                  : 'rgba(255,255,255,0.05)',
                border: `1px solid ${canSend ? 'rgba(79,142,247,0.4)' : 'rgba(255,255,255,0.07)'}`,
                borderRadius: 8,
                cursor: canSend ? 'pointer' : 'not-allowed',
                fontSize: 13, fontWeight: 600,
                color: canSend ? '#fff' : '#606070',
                transition: 'all 0.15s',
                boxShadow: canSend ? '0 2px 12px rgba(79,142,247,0.25)' : 'none',
              }}
            >
              <Send style={{ width: 13, height: 13 }} />
              Send
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
