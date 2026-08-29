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
            <div className={`fixed top-0 left-0 h-full w-72 bg-[#0A0B0E] border-r border-zinc-800 z-[101] transform transition-transform duration-300 ease-in-out ${isOpen ? "translate-x-0" : "-translate-x-full"} flex flex-col p-6`}>
                {/* Header with Close Button */}
                <div className="flex justify-end mb-8">
                    <button onClick={onClose} className="w-8 h-8 rounded-full border border-zinc-700 flex items-center justify-center text-zinc-400 hover:text-white hover:border-[#F5CA53] transition-all">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                {/* Navigation / Actions */}
                <div className="flex-1 space-y-6">
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
