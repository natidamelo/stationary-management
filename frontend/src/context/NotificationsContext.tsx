import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../api/client';
import { useAuth } from './AuthContext';

export type Notification = {
    _id: string;
    title: string;
    message: string;
    type: string;
    isRead: boolean;
    link?: string;
    createdAt: string;
};

type NotifContextType = {
    notifications: Notification[];
    unreadCount: number;
    markRead: (id: string) => void;
    markAllRead: () => void;
    deleteOne: (id: string) => void;
    clearAll: () => void;
    refresh: () => void;
};

const NotifContext = createContext<NotifContextType | null>(null);

export function NotificationsProvider({ children }: { children: React.ReactNode }) {
    const { user } = useAuth();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);

    const refresh = useCallback(async () => {
        if (!user) return;
        try {
            const [notifRes, countRes] = await Promise.all([
                api.get<Notification[]>('/notifications'),
                api.get<{ count: number }>('/notifications/unread-count'),
            ]);
            setNotifications(notifRes.data ?? []);
            setUnreadCount(countRes.data?.count ?? 0);
        } catch {
            // silent fail
        }
    }, [user]);

    useEffect(() => {
        refresh();
        const interval = setInterval(refresh, 30_000); // poll every 30s
        return () => clearInterval(interval);
    }, [refresh]);

    const markRead = async (id: string) => {
        try {
            await api.post(`/notifications/${id}/read`);
            setNotifications((prev) => prev.map((n) => (n._id === id ? { ...n, isRead: true } : n)));
            setUnreadCount((c) => Math.max(0, c - 1));
        } catch { }
    };

    const markAllRead = async () => {
        try {
            await api.post('/notifications/mark-all-read');
            setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
            setUnreadCount(0);
        } catch { }
    };

    const deleteOne = async (id: string) => {
        try {
            const wasUnread = notifications.find((n) => n._id === id)?.isRead === false;
            await api.delete(`/notifications/${id}`);
            setNotifications((prev) => prev.filter((n) => n._id !== id));
            if (wasUnread) setUnreadCount((c) => Math.max(0, c - 1));
        } catch { }
    };

    const clearAll = async () => {
        try {
            await api.delete('/notifications');
            setNotifications([]);
            setUnreadCount(0);
        } catch { }
    };

    return (
        <NotifContext.Provider value={{ notifications, unreadCount, markRead, markAllRead, deleteOne, clearAll, refresh }}>
            {children}
        </NotifContext.Provider>
    );
}

export function useNotifications() {
    const ctx = useContext(NotifContext);
    if (!ctx) throw new Error('useNotifications must be used within NotificationsProvider');
    return ctx;
}
