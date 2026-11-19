import { ClientModelInfo } from '@/config/models';
import { Role, ChatMessage, GenerationSettings, RequestMetrics } from '@/lib/providers/types';

export type { Role, ChatMessage, GenerationSettings, RequestMetrics, ClientModelInfo };

export interface SavedConversation {
  id: string;
  title: string;
  updatedAt: number;
  modelId: string;
  messages: ChatMessage[];
  settings: GenerationSettings;
}

export interface UserPreferences {
  selectedModelId: string;
  settings: GenerationSettings;
  sidebarOpen: boolean;
  settingsOpen: boolean;
}
