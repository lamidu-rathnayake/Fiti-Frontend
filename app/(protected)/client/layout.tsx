"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/lib/firebase/AuthContext";
import AtelierChatDrawer from "@/components/chat/AtelierChatDrawer";
import NotificationDrawer from "@/components/notifications/NotificationDrawer";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
    const { user, logout } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const [searchQuery, setSearchQuery] = useState("");
    const [isNotificationOpen, setIsNotificationOpen] = useState(false);
    const [isChatDrawerOpen, setIsChatDrawerOpen] = useState(false);

    return (
        <div className="min-h-screen bg-[#07080A] text-white flex flex-col justify-between selection:bg-[#F5CA53] selection:text-black font-sans relative">
            {/* TOP NAVIGATION HEADER */}
            <header className="w-full border-b border-zinc-900/90 bg-[#0A0B0E]/95 backdrop-blur-xl sticky top-0 z-50 transition-all duration-300">
                <div className="max-w-7xl mx-auto px-4 sm:px-8 py-4 flex items-center justify-between gap-4">
                    {/* Left: Back button & Atelier Logo */}
                    <div className="flex items-center gap-4">
                        <Link href="/" className="flex items-center gap-3 group">
                            <div className="relative h-9 px-3 py-1 bg-[#FFFDF9] rounded-xl border border-[#F5CA53]/50 shadow-[0_0_15px_rgba(245,202,83,0.25)] flex items-center justify-center transition-all duration-300 group-hover:scale-105 group-hover:shadow-[0_0_25px_rgba(245,202,83,0.45)]">
                                <img
                                    src="/logo_light.png"
                                    alt="FITI Atelier Digital Logo"
                                    className="h-7 w-auto object-contain"
                                />
                            </div>
                        </Link>
                    </div>

                    {/* Middle Navigation Links */}
                    <nav className="hidden lg:flex items-center space-x-8 text-xs font-bold tracking-wider text-zinc-400">
                        <Link href="/storefront" className="hover:text-[#F5CA53] transition-colors">
                            Storefront
                        </Link>
                        <Link href="/client/home" className={pathname === '/client/home' ? 'text-white font-extrabold relative pb-1 border-b-2 border-[#F5CA53]' : 'hover:text-[#F5CA53] transition-colors'}>
                            Dashboard
                        </Link>
                        <Link href="/orders" className={pathname === '/orders' ? 'text-white font-extrabold relative pb-1 border-b-2 border-[#F5CA53]' : 'hover:text-[#F5CA53] transition-colors'}>
                            Orders
                        </Link>
                        <Link href="/tailors" className={pathname === '/tailors' ? 'text-white font-extrabold relative pb-1 border-b-2 border-[#F5CA53]' : 'hover:text-[#F5CA53] transition-colors'}>
                            Tailors
                        </Link>
                    </nav>

                    {/* Right User Actions & Search Bar */}
                    <div className="flex items-center space-x-3">
                        {/* Search Input Box */}
                        <div className="relative hidden md:block w-48 lg:w-56">
                            <svg className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#F5CA53]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            <input
                                type="text"
                                placeholder="Find a tailor..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter" && searchQuery.trim()) {
                                        router.push(`/tailors?q=${encodeURIComponent(searchQuery.trim())}`);
                                    }
                                }}
                                className="w-full pl-9 pr-3 py-1.5 bg-[#141519] border border-zinc-800 focus:border-[#F5CA53] rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none transition-all"
                            />
                        </div>

                        {/* Cart / Shopping Bag Icon */}
                        <Link href="/storefront" title="Shopping Bag" className="w-9 h-9 rounded-xl border border-zinc-800 bg-[#141519] hover:border-zinc-700 flex items-center justify-center text-zinc-400 hover:text-white transition-all">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                            </svg>
                        </Link>

                        {/* Notification Bell */}
                        <button
                            onClick={() => setIsNotificationOpen(true)}
                            title="Notifications"
                            className="w-9 h-9 rounded-xl border border-zinc-800 bg-[#141519] hover:border-[#F5CA53]/50 flex items-center justify-center text-zinc-400 hover:text-[#F5CA53] transition-all relative"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                            </svg>
                            <span className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-[#F5CA53]" />
                        </button>

                        {/* Live Chat / Texting Icon */}
                        <button
                            onClick={() => setIsChatDrawerOpen((prev) => !prev)}
                            title="Direct Message Tailor"
                            className="w-9 h-9 rounded-xl border border-[#F5CA53]/50 bg-[#F5CA53]/10 hover:bg-[#F5CA53]/20 flex items-center justify-center text-[#F5CA53] transition-all relative"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
                            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-black" />
                        </button>

                        {/* Logout Button */}
                        <button
                            onClick={async () => {
                                await logout();
                                router.push("/login");
                            }}
                            className="px-3.5 py-1.5 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-400 hover:bg-rose-500 hover:text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm"
                            title="Sign out"
                        >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                            <span className="hidden sm:inline">Logout</span>
                        </button>
                    </div>
                </div>
            </header>

            {/* MAIN CONTENT AREA */}
            <div className="flex-1 flex flex-col">
                {children}
            </div>

            {/* ATELIER DIGITAL FOOTER */}
            <footer className="w-full border-t border-zinc-900/90 bg-[#07080A] py-8 px-4 sm:px-8 mt-auto relative z-20">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-xs">
                    <div>
                        <span className="font-extrabold text-sm tracking-widest text-white uppercase font-heading block">
                            ATELIER DIGITAL
                        </span>
                        <p className="text-zinc-500 text-[11px] mt-1 font-mono">
                            &copy; {new Date().getFullYear()} ATELIER DIGITAL. ALL RIGHTS RESERVED.
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-6 text-zinc-400 font-mono text-[11px]">
                        <Link href="/terms" className="hover:text-[#F5CA53] transition-colors">Terms of Service</Link>
                        <Link href="/privacy" className="hover:text-[#F5CA53] transition-colors">Privacy Policy</Link>
                        <Link href="/contact" className="hover:text-[#F5CA53] transition-colors">Contact Support</Link>
                    </div>
                </div>
            </footer>

            {/* FLOATING TEXT / CHAT TRIGGER BUTTON */}
            {!isChatDrawerOpen && (
                <button
                    onClick={() => setIsChatDrawerOpen(true)}
                    className="fixed bottom-6 right-6 z-[8888] px-4 py-3 bg-[#F5CA53] hover:bg-[#f7d369] text-black font-extrabold text-xs uppercase tracking-wider rounded-full shadow-[0_0_25px_rgba(245,202,83,0.5)] flex items-center gap-2 transition-all hover:scale-105"
                >
                    <span className="w-2 h-2 rounded-full bg-emerald-600 animate-ping" />
                    <span>💬 Text Atelier Tailor</span>
                </button>
            )}

            {/* LIVE ATELIER CHAT DRAWER */}
            <AtelierChatDrawer
                isOpen={isChatDrawerOpen}
                onClose={() => setIsChatDrawerOpen(false)}
                userRole="client"
            />

            {/* REAL-TIME NOTIFICATION DRAWER */}
            <NotificationDrawer
                isOpen={isNotificationOpen}
                onClose={() => setIsNotificationOpen(false)}
            />
        </div>
    );
}
