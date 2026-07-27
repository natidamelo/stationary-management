import React, { createContext, useContext, useState, useEffect } from 'react';
import { useTheme } from 'next-themes';

export type RolePermissionsMap = Record<string, string[]>;

export const ALL_MENU_MODULES = [
  { path: '/', label: 'Dashboard' },
  { path: '/categories', label: 'Categories' },
  { path: '/stores', label: 'Stores' },
  { path: '/suppliers', label: 'Suppliers' },
  { path: '/items', label: 'Products' },
  { path: '/customers', label: 'Customers' },
  { path: '/purchase-requests', label: 'Requisitions' },
  { path: '/purchase-orders', label: 'Orders' },
  { path: '/goods-receiving', label: 'Goods Receiving' },
  { path: '/item-issues', label: 'Item Issues' },
  { path: '/store-transfers', label: 'Store Transfers' },
  { path: '/reception', label: 'Sales (Reception)' },
  { path: '/users', label: 'Users' },
  { path: '/messages', label: 'Messages' },
  { path: '/reports', label: 'Reports' },
];

export const DEFAULT_ROLE_PERMISSIONS: RolePermissionsMap = {
  admin: ALL_MENU_MODULES.map((m) => m.path),
  dealer: [...ALL_MENU_MODULES.map((m) => m.path), '/registered-tenants', '/licenses'],
  manager: ALL_MENU_MODULES.map((m) => m.path),
  reception: ['/reception', '/items', '/customers', '/messages'],
  user: ['/', '/categories', '/suppliers', '/items', '/customers', '/purchase-requests', '/goods-receiving', '/item-issues', '/store-transfers', '/messages'],
  inventory_clerk: ['/', '/categories', '/suppliers', '/items', '/purchase-requests', '/goods-receiving', '/item-issues', '/store-transfers', '/messages'],
};

export type Settings = {
  stationeryName: string;
  logoUrl: string | null;
  rolePermissions: RolePermissionsMap;
};

type ThemeMode = 'light' | 'dark';

type SettingsContextType = {
  settings: Settings;
  themeMode: ThemeMode;
  updateSettings: (updates: Partial<Settings>) => void;
  toggleTheme: () => void;
  uploadLogo: (file: File) => Promise<string>;
  isModuleAllowed: (role: string, path: string) => boolean;
};

const defaultSettings: Settings = {
  stationeryName: 'Stationery',
  logoUrl: null,
  rolePermissions: DEFAULT_ROLE_PERMISSIONS,
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
        
        // Merge with default role permissions to ensure any new role/path exists
        const mergedPermissions: RolePermissionsMap = { ...DEFAULT_ROLE_PERMISSIONS };
        if (parsed.rolePermissions) {
          Object.keys(parsed.rolePermissions).forEach((roleKey) => {
            mergedPermissions[roleKey] = parsed.rolePermissions[roleKey];
          });
        }

        setSettings({ ...defaultSettings, ...parsed, logoUrl, rolePermissions: mergedPermissions });
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

  const isModuleAllowed = (roleName: string, path: string): boolean => {
    const normalizedRole = (roleName || 'user').toLowerCase().trim();
    
    // Admin and dealer always have full access
    if (normalizedRole === 'admin' || normalizedRole === 'dealer') {
      return true;
    }

    const rolePaths = settings.rolePermissions[normalizedRole] || DEFAULT_ROLE_PERMISSIONS[normalizedRole] || DEFAULT_ROLE_PERMISSIONS['user'];
    return rolePaths.includes(path);
  };

  return (
    <SettingsContext.Provider 
      value={{ 
        settings, 
        themeMode: (theme as ThemeMode) || themeMode, 
        updateSettings, 
        toggleTheme, 
        uploadLogo,
        isModuleAllowed,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used within SettingsProvider');
  return ctx;
}
