import { SavedConversation, UserPreferences } from '@/types';
import { GenerationSettings } from '@/lib/providers/types';

const CONVERSATIONS_KEY = 'aether_saved_conversations_v1';
const PREFERENCES_KEY = 'aether_user_preferences_v1';

export const DEFAULT_SETTINGS: GenerationSettings = {
  temperature: 0.7,
  maxTokens: 2048,
  topP: 1.0,
  stream: true,
};

export const DEFAULT_PREFERENCES: UserPreferences = {
  selectedModelId: 'fast-model',
  settings: DEFAULT_SETTINGS,
  sidebarOpen: false,
  settingsOpen: true,
};

export function getSavedConversations(): SavedConversation[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(CONVERSATIONS_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveConversations(conversations: SavedConversation[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(CONVERSATIONS_KEY, JSON.stringify(conversations));
  } catch (err) {
    console.error('Failed to save conversations to localStorage', err);
  }
}

export function getUserPreferences(): UserPreferences {
  if (typeof window === 'undefined') return DEFAULT_PREFERENCES;
  try {
    const raw = localStorage.getItem(PREFERENCES_KEY);
    if (!raw) return DEFAULT_PREFERENCES;
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_PREFERENCES,
      ...parsed,
      settings: { ...DEFAULT_SETTINGS, ...parsed.settings },
    };
  } catch {
    return DEFAULT_PREFERENCES;
  }
}

export function saveUserPreferences(prefs: Partial<UserPreferences>): void {
  if (typeof window === 'undefined') return;
  try {
    const current = getUserPreferences();
    const updated = { ...current, ...prefs };
    localStorage.setItem(PREFERENCES_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error('Failed to save preferences to localStorage', err);
  }
}
