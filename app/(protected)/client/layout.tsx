"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/lib/firebase/AuthContext";
import NavSidebar from "@/components/navigation/NavSidebar";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
    const { user, logout } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const [searchQuery, setSearchQuery] = useState("");
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    return (
        <div className="min-h-screen bg-[#07080A] text-white flex flex-col justify-between selection:bg-[#F5CA53] selection:text-black font-sans relative">
            {/* TOP NAVIGATION HEADER */}
            <header className="w-full border-b border-zinc-900/90 bg-[#0A0B0E]/95 backdrop-blur-xl sticky top-0 z-50 transition-all duration-300">
                <div className="max-w-7xl mx-auto px-4 sm:px-8 py-4 flex items-center justify-between gap-4">
                    {/* Left: Hamburger & Atelier Logo */}
                    <div className="flex items-center gap-4">
                        {/* Hamburger Button */}
                        <button 
                            onClick={() => setIsSidebarOpen(true)} 
                            className="p-1 -ml-1 hover:bg-[#141519] rounded-lg transition-colors text-zinc-400 hover:text-[#F5CA53]"
                            title="Menu"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                        </button>
                        
                        <Link href="/" className="flex items-center gap-3 group">
                            <div className="relative h-9 px-3 py-1 flex items-center justify-center transition-all duration-300 group-hover:scale-105 ">
                                <img
                                    src="/logo_dark.png"
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
            {/* NAV SIDEBAR COMPONENT */}
            <NavSidebar 
                isOpen={isSidebarOpen} 
                onClose={() => setIsSidebarOpen(false)}
            />

        </div>
    );
}
