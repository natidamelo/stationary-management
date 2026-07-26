import React, { createContext, useContext, useState, useEffect } from 'react';
import { useTheme } from 'next-themes';

type Settings = {
  stationeryName: string;
  logoUrl: string | null;
};

type ThemeMode = 'light' | 'dark';

type SettingsContextType = {
  settings: Settings;
  themeMode: ThemeMode;
  updateSettings: (updates: Partial<Settings>) => void;
  toggleTheme: () => void;
  uploadLogo: (file: File) => Promise<string>;
};

const defaultSettings: Settings = {
  stationeryName: 'Stationery',
  logoUrl: null,
};

const SettingsContext = createContext<SettingsContextType | null>(null);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const { theme, setTheme } = useTheme();
  const [themeMode, setThemeMode] = useState<ThemeMode>('dark');

  useEffect(() => {
    const saved = localStorage.getItem('appSettings');
    const savedTheme = localStorage.getItem('themeMode') as ThemeMode | null;
    if (savedTheme === 'dark' || savedTheme === 'light') {
      setThemeMode(savedTheme);
      setTheme(savedTheme);
    }
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as Settings;
        let logoUrl = parsed.logoUrl ?? null;
        if (logoUrl && logoUrl.startsWith('/api/uploads')) {
          logoUrl = null;
        }
        setSettings({ ...defaultSettings, ...parsed, logoUrl });
      } catch {
        // Invalid JSON, use defaults
      }
    }
  }, [setTheme]);

  const updateSettings = (updates: Partial<Settings>) => {
    const newSettings = { ...settings, ...updates };
    setSettings(newSettings);
    localStorage.setItem('appSettings', JSON.stringify(newSettings));
  };

  const toggleTheme = () => {
    const next = (theme === 'dark' || themeMode === 'dark') ? 'light' : 'dark';
    setThemeMode(next);
    setTheme(next);
    localStorage.setItem('themeMode', next);
  };

  const uploadLogo = async (file: File): Promise<string> => {
    const toDataUrl = (fileObj: File) =>
      new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(fileObj);
      });

    const dataUrl = await toDataUrl(file);
    updateSettings({ logoUrl: dataUrl });
    return dataUrl;
  };

  return (
    <SettingsContext.Provider value={{ settings, themeMode: (theme as ThemeMode) || themeMode, updateSettings, toggleTheme, uploadLogo }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used within SettingsProvider');
  return ctx;
}
