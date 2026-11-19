'use client';

import React from 'react';
import { GenerationSettings } from '@/lib/providers/types';
import { ClientModelInfo } from '@/config/models';
import { X, Info, Zap, Thermometer, Hash, SlidersHorizontal } from 'lucide-react';

interface SettingsPanelProps {
  settings: GenerationSettings;
  onUpdateSettings: (s: Partial<GenerationSettings>) => void;
  selectedModel: ClientModelInfo;
  isOpen: boolean;
  onClose: () => void;
}

function Slider({
  id, label, hint, value, min, max, step, disabled, format, onChange,
}: {
  id: string; label: string; hint: string;
  value: number; min: number; max: number; step: number;
  disabled: boolean; format: (v: number) => string;
  onChange: (v: number) => void;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <label htmlFor={id} style={{
          fontSize: 12, fontWeight: 500, color: disabled ? '#606070' : '#9898a8',
          display: 'flex', alignItems: 'center', gap: 5, cursor: 'default',
        }}>
          {label}
          <span title={hint} style={{ cursor: 'help', color: '#606070' }}>
            <Info style={{ width: 11, height: 11 }} />
          </span>
        </label>
        <span style={{
          fontSize: 12, fontWeight: 700, color: disabled ? '#606070' : '#4f8ef7',
          fontFamily: 'monospace',
        }}>
          {format(value)}
        </span>
      </div>
      <input
        id={id}
        type="range"
        min={min} max={max} step={step}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        style={{ width: '100%' }}
      />
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#606070', fontFamily: 'monospace' }}>
        <span>{format(min)}</span>
        <span>{format(max)}</span>
      </div>
    </div>
  );
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({
  settings, onUpdateSettings, selectedModel, isOpen, onClose,
}) => {
  if (!isOpen) return null;
  const { capabilities } = selectedModel;

  return (
    <>
      {/* Mobile backdrop */}
      <div
        style={{
          position: 'fixed', inset: 0, zIndex: 40,
          background: 'rgba(0,0,0,0.5)',
          backdropFilter: 'blur(4px)',
        }}
        className="lg:hidden"
        onClick={onClose}
        aria-hidden="true"
      />

      <aside
        aria-label="Generation Settings"
        style={{
          position: 'fixed',
          top: 0, right: 0, bottom: 0,
          zIndex: 41,
          width: 300,
          background: '#111118',
          borderLeft: '1px solid rgba(255,255,255,0.07)',
          display: 'flex',
          flexDirection: 'column',
          overflowY: 'auto',
          boxShadow: '-20px 0 60px rgba(0,0,0,0.3)',
        }}
        // Static on large screens
        className="lg:static lg:shadow-none"
      >
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '14px 16px',
          borderBottom: '1px solid rgba(255,255,255,0.07)',
          position: 'sticky', top: 0,
          background: '#111118',
          zIndex: 2,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <SlidersHorizontal style={{ width: 14, height: 14, color: '#4f8ef7' }} />
            <span style={{ fontSize: 13, fontWeight: 600, color: '#f0f0f4' }}>Settings</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close settings"
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: 26, height: 26, borderRadius: 6,
              background: 'none', border: '1px solid rgba(255,255,255,0.07)',
              color: '#606070', cursor: 'pointer',
            }}
          >
            <X style={{ width: 13, height: 13 }} />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Model info card */}
          <div style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: 10,
            padding: '12px 14px',
          }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#606070', letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 10 }}>
              Model Info
            </div>
            {[
              { label: 'Provider', value: selectedModel.provider.toUpperCase() },
              { label: 'Model ID', value: selectedModel.providerModelId },
              { label: 'Context', value: selectedModel.contextLimit ? `${(selectedModel.contextLimit / 1024).toFixed(0)}k tokens` : '—' },
              { label: 'Status', value: selectedModel.isConfigured ? (selectedModel.isMockFallback ? 'Demo' : 'Live') : 'Setup needed', color: selectedModel.isConfigured ? (selectedModel.isMockFallback ? '#f59e0b' : '#3ecf8e') : '#f43f5e' },
            ].map(({ label, value, color }) => (
              <div key={label} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                marginBottom: 7,
              }}>
                <span style={{ fontSize: 11, color: '#606070' }}>{label}</span>
                <span style={{
                  fontSize: 11, color: color || '#9898a8',
                  fontFamily: 'monospace',
                  maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  textAlign: 'right',
                }}>
                  {value}
                </span>
              </div>
            ))}
          </div>

          {/* Divider */}
          <div style={{ height: 1, background: 'rgba(255,255,255,0.05)' }} />

          {/* Temperature */}
          <Slider
            id="temp"
            label="Temperature"
            hint="Controls randomness. Lower = precise, higher = creative."
            value={settings.temperature}
            min={0} max={2} step={0.05}
            disabled={!capabilities.supportsTemperature}
            format={(v) => v.toFixed(2)}
            onChange={(v) => onUpdateSettings({ temperature: v })}
          />

          {/* Max tokens */}
          <Slider
            id="max-tokens"
            label="Max Output Tokens"
            hint="Maximum number of tokens to generate."
            value={settings.maxTokens}
            min={64} max={selectedModel.maxOutputTokensLimit || 4096} step={64}
            disabled={!capabilities.supportsMaxTokens}
            format={(v) => `${v}`}
            onChange={(v) => onUpdateSettings({ maxTokens: Math.round(v) })}
          />

          {/* Top-P */}
          <Slider
            id="top-p"
            label="Top-P"
            hint="Nucleus sampling threshold. 1.0 = consider all tokens."
            value={settings.topP}
            min={0} max={1} step={0.05}
            disabled={!capabilities.supportsTopP}
            format={(v) => v.toFixed(2)}
            onChange={(v) => onUpdateSettings({ topP: v })}
          />

          {/* Divider */}
          <div style={{ height: 1, background: 'rgba(255,255,255,0.05)' }} />

          {/* Stream toggle */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <label
                htmlFor="stream-toggle"
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  fontSize: 12, fontWeight: 500,
                  color: capabilities.supportsStreaming ? '#9898a8' : '#606070',
                  cursor: capabilities.supportsStreaming ? 'pointer' : 'default',
                }}
              >
                <Zap style={{ width: 12, height: 12, color: '#4f8ef7' }} />
                Stream Response
              </label>
              <p style={{ fontSize: 11, color: '#606070', marginTop: 3 }}>
                Show tokens as generated
              </p>
            </div>
            <label className="toggle-switch">
              <input
                id="stream-toggle"
                type="checkbox"
                checked={settings.stream}
                disabled={!capabilities.supportsStreaming}
                onChange={(e) => onUpdateSettings({ stream: e.target.checked })}
              />
              <span className="toggle-slider" />
            </label>
          </div>

          {/* Keyboard shortcut hint */}
          <div style={{
            padding: '10px 12px',
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid rgba(255,255,255,0.05)',
            borderRadius: 8,
          }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#606070', letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 8 }}>
              Shortcuts
            </div>
            {[
              ['⌘ + Enter', 'Send message'],
              ['Esc', 'Stop generation'],
            ].map(([key, desc]) => (
              <div key={key} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                <span style={{ fontSize: 11, color: '#606070' }}>{desc}</span>
                <code style={{
                  fontSize: 10, color: '#9898a8',
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 4, padding: '1px 5px',
                }}>{key}</code>
              </div>
            ))}
          </div>
        </div>
      </aside>
    </>
  );
};
