import React from 'react';
import { Sparkles, PanelLeft, Code2, Sliders, AlertCircle, ChevronRight } from 'lucide-react';
import { ClientModelInfo } from '@/config/models';

interface HeaderProps {
  selectedModel: ClientModelInfo;
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
  isSettingsOpen: boolean;
  onToggleSettings: () => void;
  onOpenCodeModal: () => void;
  onReturnToMain?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  selectedModel,
  isSidebarOpen,
  onToggleSidebar,
  isSettingsOpen,
  onToggleSettings,
  onOpenCodeModal,
  onReturnToMain,
}) => {
  return (
    <header
      style={{
        background: 'rgba(10,10,15,0.90)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
      }}
      className="sticky top-0 z-30 flex items-center justify-between px-4 h-12"
    >
      {/* Left: brand + sidebar toggle */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onToggleSidebar}
          aria-label={isSidebarOpen ? 'Close history' : 'Open history'}
          title="Toggle conversation history"
          style={{
            color: isSidebarOpen ? '#f0f0f4' : '#9898a8',
            background: isSidebarOpen ? 'rgba(255,255,255,0.08)' : 'transparent',
            border: '1px solid transparent',
            borderRadius: 8,
            padding: '5px',
            cursor: 'pointer',
            transition: 'all 0.15s',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <PanelLeft style={{ width: 16, height: 16 }} />
        </button>

        <button
          type="button"
          onClick={onReturnToMain}
          aria-label="Return to main"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 7,
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '4px 6px',
            borderRadius: 8,
            transition: 'opacity 0.15s',
          }}
        >
          <div style={{
            width: 26,
            height: 26,
            borderRadius: 7,
            background: 'linear-gradient(135deg, #4f8ef7 0%, #a78bfa 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}>
            <Sparkles style={{ width: 13, height: 13, color: '#fff' }} />
          </div>
          <span style={{
            fontSize: 14,
            fontWeight: 600,
            color: '#f0f0f4',
            letterSpacing: '-0.01em',
          }}>
            Aether<span style={{ color: '#4f8ef7' }}>Studio</span>
          </span>
          <span style={{
            fontSize: 10,
            fontWeight: 600,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: '#606070',
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 5,
            padding: '2px 6px',
          }}>
            Playground
          </span>
        </button>

        {/* Model breadcrumb */}
        <div className="hidden md:flex items-center gap-1.5 ml-1">
          <ChevronRight style={{ width: 12, height: 12, color: '#606070' }} />
          <span style={{
            fontSize: 12,
            color: '#9898a8',
            fontFamily: 'var(--font-mono, monospace)',
            maxWidth: 180,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}>
            {selectedModel.providerModelId}
          </span>
          <span style={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: selectedModel.isConfigured
              ? (selectedModel.isMockFallback ? '#f59e0b' : '#3ecf8e')
              : '#f43f5e',
            flexShrink: 0,
          }} />
        </div>
      </div>

      {/* Right: actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        {!selectedModel.isConfigured && (
          <div className="hidden sm:flex items-center gap-1.5" style={{
            fontSize: 11,
            color: '#f43f5e',
            background: 'rgba(244,63,94,0.08)',
            border: '1px solid rgba(244,63,94,0.2)',
            borderRadius: 7,
            padding: '3px 8px',
          }}>
            <AlertCircle style={{ width: 11, height: 11 }} />
            <span>Setup needed</span>
          </div>
        )}

        <button
          type="button"
          onClick={onOpenCodeModal}
          title="View API code"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            fontSize: 12,
            fontWeight: 500,
            color: '#9898a8',
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 8,
            padding: '5px 10px',
            cursor: 'pointer',
            transition: 'all 0.15s',
          }}
        >
          <Code2 style={{ width: 13, height: 13, color: '#4f8ef7' }} />
          <span className="hidden sm:inline">Code</span>
        </button>

        <button
          type="button"
          onClick={onToggleSettings}
          aria-label={isSettingsOpen ? 'Close settings' : 'Open settings'}
          title="Toggle settings panel"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: isSettingsOpen ? '#4f8ef7' : '#9898a8',
            background: isSettingsOpen ? 'rgba(79,142,247,0.12)' : 'rgba(255,255,255,0.05)',
            border: `1px solid ${isSettingsOpen ? 'rgba(79,142,247,0.3)' : 'rgba(255,255,255,0.08)'}`,
            borderRadius: 8,
            padding: 5,
            cursor: 'pointer',
            transition: 'all 0.15s',
          }}
        >
          <Sliders style={{ width: 14, height: 14 }} />
        </button>
      </div>
    </header>
  );
};
