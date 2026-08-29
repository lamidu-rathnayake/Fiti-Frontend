"use client";

import { useAuth } from "@/lib/firebase/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState } from "react";

interface NavSidebarProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function NavSidebar({ isOpen, onClose }: NavSidebarProps) {
    const { logout } = useAuth();
    const router = useRouter();
    // Assuming light/dark theme might eventually be handled by a provider.
    const [theme, setTheme] = useState<"dark" | "light">("dark");

    return (
        <>
            {/* Backdrop */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] transition-opacity"
                    onClick={onClose}
                />
            )}

            {/* Sidebar */}
            <div className={`fixed top-0 right-0 h-full w-72 bg-[#0A0B0E] border-l border-zinc-800 z-[101] transform transition-transform duration-300 ease-in-out ${isOpen ? "translate-x-0" : "translate-x-full"} flex flex-col p-6`}>
                {/* Header with Close Button */}
                <div className="flex justify-start mb-8">
                    <button onClick={onClose} className="w-8 h-8 rounded-full border border-zinc-700 flex items-center justify-center text-zinc-400 hover:text-white hover:border-[#F5CA53] transition-all">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                {/* Navigation / Actions */}
                <div className="flex-1 space-y-2 mt-4">
                    <Link
                        href="/client/profile"
                        onClick={onClose}
                        className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-zinc-900 text-zinc-300 hover:text-white transition-all group"
                    >
                        <svg className="w-5 h-5 text-zinc-500 group-hover:text-[#F5CA53] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        <span className="text-sm font-bold tracking-wide">My Profile & Settings</span>
                    </Link>

                    <Link
                        href="/client/home"
                        onClick={onClose}
                        className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-zinc-900 text-zinc-300 hover:text-white transition-all group"
                    >
                        <svg className="w-5 h-5 text-zinc-500 group-hover:text-[#F5CA53] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                        </svg>
                        <span className="text-sm font-bold tracking-wide">Dashboard Home</span>
                    </Link>

                    <Link
                        href="/client/biddingRequest"
                        onClick={onClose}
                        className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-zinc-900 text-zinc-300 hover:text-white transition-all group"
                    >
                        <svg className="w-5 h-5 text-zinc-500 group-hover:text-[#F5CA53] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                        </svg>
                        <span className="text-sm font-bold tracking-wide">Broadcast Bidding</span>
                    </Link>
                </div>

                <div className="space-y-6">
                    {/* Color Theme Selector from Mockup */}
                    <div className="pt-8 border-t border-zinc-800">
                        <p className="text-xs font-bold text-zinc-400 mb-3">Color Theme</p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setTheme("dark")}
                                className={`flex-1 py-2 border rounded text-sm font-bold transition-colors ${theme === 'dark' ? 'border-[#F5CA53] text-[#F5CA53] bg-[#F5CA53]/10' : 'border-zinc-700 text-zinc-400 hover:border-zinc-500'}`}
                            >
                                Dark
                            </button>
                            <button
                                onClick={() => setTheme("light")}
                                className={`flex-1 py-2 border rounded text-sm font-bold transition-colors ${theme === 'light' ? 'border-[#F5CA53] text-[#F5CA53] bg-[#F5CA53]/10' : 'border-zinc-700 text-zinc-400 hover:border-zinc-500'}`}
                            >
                                Light
                            </button>
                        </div>
                    </div>
                </div>

                {/* Footer / Logout */}
                <div className="mt-auto pt-6 flex">
                    <button
                        onClick={async () => {
                            await logout();
                            router.push("/login");
                        }}
                        className="px-4 py-2 border border-zinc-700 text-zinc-300 rounded text-sm font-bold hover:border-[#F5CA53] hover:text-[#F5CA53] transition-colors inline-block"
                    >
                        logout
                    </button>
                </div>
            </div>
        </>
    );
}
