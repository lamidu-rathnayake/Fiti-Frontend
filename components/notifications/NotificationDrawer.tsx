"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/firebase/AuthContext";
import { getNotifications, markNotificationRead } from "@/lib/api/endpoints/support";
import type { Notification } from "@/lib/api/types/support";

interface NotificationDrawerProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function NotificationDrawer({ isOpen, onClose }: NotificationDrawerProps) {
    const { user } = useAuth();
    const [notifications, setNotifications] = useState<Array<{
        id: number | string;
        title: string;
        message: string;
        time: string;
        read: boolean;
        type: "commission" | "fitting" | "chat" | "system";
    }>>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!isOpen) return;

        const fetchUserNotifications = async () => {
            setLoading(true);
            try {
                if (user?.uid) {
                    const apiData = await getNotifications(user.uid);
                    if (apiData && apiData.length > 0) {
                        setNotifications(
                            apiData.map((n) => ({
                                id: n.notification_id,
                                title: "Atelier Notification",
                                message: n.message,
                                time: n.created_at ? new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Just now",
                                read: n.is_read || false,
                                type: "commission",
                            }))
                        );
                        setLoading(false);
                        return;
                    }
                }
            } catch {
                // Offline fallback
            }

            setNotifications([]);
            setLoading(false);
        };

        fetchUserNotifications();
    }, [isOpen, user]);

    const handleMarkAsRead = async (id: number | string) => {
        setNotifications((prev) =>
            prev.map((n) => (n.id === id ? { ...n, read: true } : n))
        );
        if (typeof id === "number") {
            try {
                await markNotificationRead(id);
            } catch {
                // Ignore failure
            }
        }
    };

    const handleMarkAllRead = () => {
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    };

    if (!isOpen) return null;

    const unreadCount = notifications.filter((n) => !n.read).length;

    return (
        <div className="fixed inset-0 z-50 overflow-hidden font-sans">
            {/* Backdrop */}
            <div
                onClick={onClose}
                className="absolute inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
            />

            <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
                <div className="w-screen max-w-md bg-[#0D0E12] border-l border-zinc-800 text-white shadow-2xl flex flex-col justify-between">
                    {/* DRAWER HEADER */}
                    <div className="p-6 border-b border-zinc-800/80 bg-[#121318] flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-[#F5CA53]/10 border border-[#F5CA53]/30 flex items-center justify-center text-[#F5CA53]">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                                </svg>
                            </div>
                            <div>
                                <h2 className="text-sm font-extrabold font-heading text-white flex items-center gap-2">
                                    Notifications
                                    {unreadCount > 0 && (
                                        <span className="px-2 py-0.5 rounded-full bg-[#F5CA53] text-black text-[10px] font-bold">
                                            {unreadCount} New
                                        </span>
                                    )}
                                </h2>
                                <p className="text-[11px] text-zinc-400">Atelier commission &amp; appointment alerts</p>
                            </div>
                        </div>

                        <button
                            onClick={onClose}
                            className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    {/* ACTION TOOLBAR */}
                    <div className="px-6 py-3 border-b border-zinc-800/60 bg-[#0A0B0E] flex items-center justify-between text-xs">
                        <span className="text-zinc-500 font-mono text-[10px] uppercase tracking-wider">
                            Recent Activity
                        </span>
                        {unreadCount > 0 && (
                            <button
                                onClick={handleMarkAllRead}
                                className="text-[#F5CA53] hover:underline font-semibold text-[11px]"
                            >
                                Mark all as read
                            </button>
                        )}
                    </div>

                    {/* NOTIFICATIONS LIST */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-3">
                        {loading ? (
                            <div className="text-center py-12 font-mono text-xs text-zinc-500 animate-pulse">
                                Loading notifications...
                            </div>
                        ) : notifications.length > 0 ? (
                            notifications.map((item) => (
                                <div
                                    key={item.id}
                                    onClick={() => handleMarkAsRead(item.id)}
                                    className={`p-4 rounded-2xl border transition-all cursor-pointer space-y-2 ${
                                        !item.read
                                            ? "bg-[#14161D] border-[#F5CA53]/40 shadow-[0_0_15px_rgba(245,202,83,0.05)]"
                                            : "bg-[#111216] border-zinc-800/80 opacity-80"
                                    }`}
                                >
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="flex items-center gap-2">
                                            {!item.read && (
                                                <span className="w-2 h-2 rounded-full bg-[#F5CA53] shrink-0" />
                                            )}
                                            <h4 className="text-xs font-bold text-white font-heading">
                                                {item.title}
                                            </h4>
                                        </div>
                                        <span className="text-[10px] font-mono text-zinc-500 shrink-0">
                                            {item.time}
                                        </span>
                                    </div>
                                    <p className="text-xs text-zinc-300 leading-relaxed">
                                        {item.message}
                                    </p>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-16 space-y-2 text-zinc-500">
                                <span className="text-2xl">🔔</span>
                                <p className="text-xs">No notifications right now.</p>
                            </div>
                        )}
                    </div>

                    {/* FOOTER */}
                    <div className="p-4 border-t border-zinc-800/80 bg-[#121318] text-center">
                        <button
                            onClick={onClose}
                            className="w-full py-2.5 rounded-xl bg-[#18191E] border border-zinc-800 hover:border-zinc-700 text-xs font-bold text-zinc-300 hover:text-white transition-all"
                        >
                            Close Drawer
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
