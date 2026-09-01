import * as SecureStore from 'expo-secure-store';

export interface UserSettings {
  pushEnabled: boolean;
  emailEnabled: boolean;
  profileVisible: boolean;
  locationEnabled: boolean;
}

const DEFAULT_SETTINGS: UserSettings = {
  pushEnabled: true,
  emailEnabled: false,
  profileVisible: true,
  locationEnabled: true,
};

const STORAGE_KEY = 'monpro_user_settings';

export const settingsApi = {
  async get(): Promise<UserSettings> {
    try {
      const stored = await SecureStore.getItemAsync(STORAGE_KEY);
      if (stored) {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
      }
      return DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  },

  async update(settings: Partial<UserSettings>): Promise<UserSettings> {
    try {
      const current = await this.get();
      const updated = { ...current, ...settings };
      await SecureStore.setItemAsync(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    } catch {
      return { ...DEFAULT_SETTINGS, ...settings };
    }
  },

  async reset(): Promise<UserSettings> {
    try {
      await SecureStore.deleteItemAsync(STORAGE_KEY);
      return DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  },
};
