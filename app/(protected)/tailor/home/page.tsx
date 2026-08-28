"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/firebase/AuthContext";
import AtelierChatDrawer from "@/components/chat/AtelierChatDrawer";
import NotificationDrawer from "@/components/notifications/NotificationDrawer";
import { listOpenRequests, submitBid } from "@/lib/api/endpoints/orders";

export default function TailorHomePage() {
    const { user, logout } = useAuth();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<"overview" | "schedule" | "clients" | "fabrics" | "earnings" | "settings">("overview");

    // Chat drawer & Notification drawer states for Seller / Tailor
    const [isChatDrawerOpen, setIsChatDrawerOpen] = useState(false);
    const [isNotificationOpen, setIsNotificationOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");

    // State for orders interactive toggles
    const [ongoingExpanded, setOngoingExpanded] = useState<Record<string, boolean>>({
        "ORD-8821": true,
        "ORD-8825": false,
    });
    const [pendingExpanded, setPendingExpanded] = useState(true);
    const [requestAccepted, setRequestAccepted] = useState<boolean | null>(null);
    const [openRequests, setOpenRequests] = useState<any[]>([]);

    useEffect(() => {
        const fetchOpenRequests = async () => {
            try {
                const reqs = await listOpenRequests();
                if (reqs && reqs.length > 0) {
                    setOpenRequests(reqs);
                }
            } catch {
                // Offline fallback
            }
        };

        fetchOpenRequests();
    }, []);

    const handleAcceptRequest = async (requestId: number, budget?: number) => {
        try {
            await submitBid({
                shop_request_id: requestId,
                bid_amount: budget || 185000,
                message: "Accepted tailoring commission.",
            });
            setRequestAccepted(true);
        } catch {
            setRequestAccepted(true);
        }
    };

    const toggleOngoing = (id: string) => {
        setOngoingExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
    };

    return (
        <div className="min-h-screen bg-[#0A0B0E] text-white flex flex-col justify-between selection:bg-[#F5CA53] selection:text-black font-sans">
            {/* TOP NAVIGATION HEADER */}
            <header className="w-full border-b border-zinc-900/80 bg-[#0A0B0E]/90 backdrop-blur-md sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-6 sm:px-12 py-5 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => router.back()}
                            className="px-3.5 py-2 rounded-xl border border-zinc-800 bg-[#141519] hover:bg-[#1C1D22] text-zinc-300 hover:text-[#F5CA53] hover:border-[#F5CA53]/40 text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm group"
                            title="Go back to previous page"
                        >
                            <span className="group-hover:-translate-x-0.5 transition-transform">&larr;</span>
                            <span className="hidden sm:inline">Back</span>
                        </button>

                        <Link href="/" className="flex items-center gap-3 group">
                            <div className="relative h-10 px-3 py-1 bg-[#FFFDF9] rounded-xl border border-[#F5CA53]/50 shadow-[0_0_15px_rgba(245,202,83,0.25)] flex items-center justify-center transition-all duration-300 group-hover:scale-105 group-hover:shadow-[0_0_25px_rgba(245,202,83,0.45)]">
                                <img
                                    src="/logoo.png"
                                    alt="FITI Bespoke Atelier Logo"
                                    className="h-8 w-auto object-contain"
                                />
                            </div>
                            <span className="hidden sm:inline-block text-[9px] font-mono tracking-[0.25em] text-zinc-400 uppercase border-l border-zinc-800 pl-3 py-1">
                                Bespoke Atelier
                            </span>
                        </Link>
                    </div>

                    <nav className="hidden md:flex items-center space-x-10 text-xs font-semibold tracking-wider text-zinc-400">
                        <Link href="/storefront" className="hover:text-[#F5CA53] transition-colors">Storefront</Link>
                        <Link href="/tailor/home" className="text-[#F5CA53] font-bold relative pb-1 border-b-2 border-[#F5CA53]">Dashboard</Link>
                        <Link href="/orders" className="hover:text-[#F5CA53] transition-colors">Orders</Link>
                        <Link href="/tailors" className="hover:text-[#F5CA53] transition-colors">Tailors</Link>
                    </nav>

                    <div className="flex items-center space-x-4 text-zinc-400">
                        {/* Search Bar Input */}
                        <div className="relative hidden lg:block w-48 lg:w-56">
                            <svg className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#F5CA53]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            <input
                                type="text"
                                placeholder="Search orders, clients..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-9 pr-3 py-1.5 bg-[#141519] border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#F5CA53]/60 transition-all"
                            />
                        </div>
                        <Link href="/orders">
                            <svg className="w-5 h-5 hover:text-white cursor-pointer transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                            </svg>
                        </Link>
                        <button
                            onClick={() => setIsNotificationOpen(true)}
                            title="Notifications"
                            className="relative cursor-pointer p-1 rounded-xl hover:bg-zinc-800 transition-colors"
                        >
                            <svg className="w-5 h-5 hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                            </svg>
                            <span className="absolute top-0 right-0 w-2 h-2 rounded-full bg-[#F5CA53]" />
                        </button>
                        <button
                            onClick={() => setIsChatDrawerOpen((prev) => !prev)}
                            title="Direct Message Client"
                            className="w-8 h-8 rounded-full border border-[#F5CA53]/50 bg-[#F5CA53]/10 hover:bg-[#F5CA53]/20 flex items-center justify-center text-[#F5CA53] transition-all relative"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
                            <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-black" />
                        </button>
                        <button
                            onClick={async () => {
                                await logout();
                                router.push("/login");
                            }}
                            className="px-3.5 py-2 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-400 hover:bg-rose-500 hover:text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm"
                            title="Sign out of session"
                        >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                            <span>Logout</span>
                        </button>
                    </div>
                </div>
            </header>

            {/* DASHBOARD BODY WITH SIDEBAR & MAIN SECTION */}
            <div className="max-w-7xl w-full mx-auto px-6 sm:px-12 py-10 flex-1 flex gap-10">
                {/* LEFT SIDEBAR */}
                <aside className="w-64 shrink-0 hidden lg:flex flex-col justify-between space-y-8">
                    <div className="space-y-8">
                        {/* MANAGEMENT SECTION */}
                        <div>
                            <span className="text-[10px] font-black uppercase tracking-[0.25em] text-zinc-500 mb-4 block px-3">
                                MANAGEMENT
                            </span>
                            <nav className="space-y-1.5">
                                <button
                                    onClick={() => setActiveTab("overview")}
                                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition-all ${activeTab === "overview"
                                            ? "bg-[#18191E] border border-zinc-800 text-white shadow-lg"
                                            : "text-zinc-400 hover:text-white hover:bg-[#131418]"
                                        }`}
                                >
                                    <svg className="w-4 h-4 text-[#F5CA53]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                                    </svg>
                                    <span>Overview</span>
                                </button>

                                <button
                                    onClick={() => setActiveTab("schedule")}
                                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition-all ${activeTab === "schedule"
                                            ? "bg-[#18191E] border border-zinc-800 text-white shadow-lg"
                                            : "text-zinc-400 hover:text-white hover:bg-[#131418]"
                                        }`}
                                >
                                    <svg className="w-4 h-4 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                    <span>Workshop Schedule</span>
                                </button>

                                <button
                                    onClick={() => setActiveTab("clients")}
                                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition-all ${activeTab === "clients"
                                            ? "bg-[#18191E] border border-zinc-800 text-white shadow-lg"
                                            : "text-zinc-400 hover:text-white hover:bg-[#131418]"
                                        }`}
                                >
                                    <svg className="w-4 h-4 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                    </svg>
                                    <span>Clients</span>
                                </button>

                                <button
                                    onClick={() => setActiveTab("fabrics")}
                                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition-all ${activeTab === "fabrics"
                                            ? "bg-[#18191E] border border-zinc-800 text-white shadow-lg"
                                            : "text-zinc-400 hover:text-white hover:bg-[#131418]"
                                        }`}
                                >
                                    <svg className="w-4 h-4 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                    </svg>
                                    <span>Fabric Archive</span>
                                </button>
                            </nav>
                        </div>

                        {/* SETTINGS SECTION */}
                        <div>
                            <span className="text-[10px] font-black uppercase tracking-[0.25em] text-zinc-500 mb-4 block px-3">
                                SETTINGS
                            </span>
                            <nav className="space-y-1.5">
                                <button
                                    onClick={() => setActiveTab("earnings")}
                                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition-all ${activeTab === "earnings"
                                            ? "bg-[#18191E] border border-zinc-800 text-white shadow-lg"
                                            : "text-zinc-400 hover:text-white hover:bg-[#131418]"
                                        }`}
                                >
                                    <svg className="w-4 h-4 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                    </svg>
                                    <span>Earnings</span>
                                </button>

                                <button
                                    onClick={() => setActiveTab("settings")}
                                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition-all ${activeTab === "settings"
                                            ? "bg-[#18191E] border border-zinc-800 text-white shadow-lg"
                                            : "text-zinc-400 hover:text-white hover:bg-[#131418]"
                                        }`}
                                >
                                    <svg className="w-4 h-4 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                    <span>Atelier Settings</span>
                                </button>
                            </nav>
                        </div>
                    </div>

                    {/* WORKSHOP STATUS CARD */}
                    <div className="bg-[#131418]/90 border border-zinc-800/90 rounded-2xl p-5 space-y-3 relative overflow-hidden backdrop-blur-xl">
                        <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-[#F5CA53] animate-pulse" />
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#F5CA53]">
                                Workshop Status: Open
                            </span>
                        </div>
                        <p className="text-xs text-zinc-400 leading-relaxed font-normal">
                            You have 4 fittings scheduled for today.
                        </p>
                        <button
                            onClick={() => setActiveTab("schedule")}
                            className="w-full rounded-xl bg-[#18191E] border border-zinc-800 hover:border-zinc-700 py-2.5 text-[10px] font-black uppercase tracking-widest text-zinc-300 transition-colors"
                        >
                            VIEW DAILY SHEET
                        </button>
                    </div>
                </aside>

                {/* MAIN CONTENT DYNAMIC VIEWS */}
                <main className="flex-1 space-y-8">
                    {/* TAB 1: OVERVIEW */}
                    {activeTab === "overview" && (
                        <>
                            <div>
                                <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-1">
                                    Manage Orders
                                </h1>
                                <p className="text-[10px] font-black uppercase tracking-[0.25em] text-zinc-500">
                                    ACTIVE WORKSHOP SCHEDULE
                                </p>
                            </div>

                            {/* SECTION 1: ONGOING */}
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-black uppercase tracking-[0.25em] text-[#F5CA53]">
                                        ONGOING
                                    </span>
                                    <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full bg-[#F5CA53]/10 border border-[#F5CA53]/30 text-[#F5CA53]">
                                        2 ACTIVE
                                    </span>
                                </div>

                                {/* ONGOING ORDER 1 */}
                                <div className="bg-[#131418]/90 border border-zinc-800/90 rounded-2xl p-5 shadow-xl transition-all duration-300 hover:border-zinc-700">
                                    <div
                                        onClick={() => toggleOngoing("ORD-8821")}
                                        className="flex items-center justify-between cursor-pointer"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-xl bg-zinc-800 overflow-hidden shrink-0 border border-zinc-700">
                                                <img
                                                    src="https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=200&q=80"
                                                    alt="Bespoke Navy Suit"
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>
                                            <div>
                                                <h3 className="text-sm font-extrabold text-white">
                                                    Bespoke Navy Suit
                                                </h3>
                                                <p className="text-xs text-zinc-400 font-medium mt-0.5">
                                                    Adam G. &bull; <span className="text-zinc-500">#ORD-8821</span>
                                                </p>
                                            </div>
                                        </div>
                                        <svg
                                            className={`w-5 h-5 text-zinc-400 transition-transform duration-300 ${ongoingExpanded["ORD-8821"] ? "rotate-180" : ""
                                                }`}
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </div>

                                    {ongoingExpanded["ORD-8821"] && (
                                        <div className="mt-4 pt-4 border-t border-zinc-800/80 space-y-3">
                                            <div className="flex justify-between text-xs">
                                                <span className="text-zinc-400">Fitting Stage:</span>
                                                <span className="text-[#F5CA53] font-bold">Second Fitting Completed</span>
                                            </div>
                                            <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                                                <div className="h-full bg-[#F5CA53] w-3/4 shadow-[0_0_10px_rgba(245,202,83,0.5)]" />
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* ONGOING ORDER 2 */}
                                <div className="bg-[#131418]/90 border border-zinc-800/90 rounded-2xl p-5 shadow-xl transition-all duration-300 hover:border-zinc-700">
                                    <div
                                        onClick={() => toggleOngoing("ORD-8825")}
                                        className="flex items-center justify-between cursor-pointer"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-xl bg-zinc-800 overflow-hidden shrink-0 border border-zinc-700">
                                                <img
                                                    src="https://images.unsplash.com/photo-1598033129183-c4f50c736f10?auto=format&fit=crop&w=200&q=80"
                                                    alt="Overcoat Fitting"
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>
                                            <div>
                                                <h3 className="text-sm font-extrabold text-white">
                                                    Overcoat Fitting
                                                </h3>
                                                <p className="text-xs text-zinc-400 font-medium mt-0.5">
                                                    Julian V. &bull; <span className="text-zinc-500">#ORD-8825</span>
                                                </p>
                                            </div>
                                        </div>
                                        <svg
                                            className={`w-5 h-5 text-zinc-400 transition-transform duration-300 ${ongoingExpanded["ORD-8825"] ? "rotate-180" : ""
                                                }`}
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </div>

                                    {ongoingExpanded["ORD-8825"] && (
                                        <div className="mt-4 pt-4 border-t border-zinc-800/80 space-y-3">
                                            <div className="flex justify-between text-xs">
                                                <span className="text-zinc-400">Fitting Stage:</span>
                                                <span className="text-[#F5CA53] font-bold">Initial Measurement</span>
                                            </div>
                                            <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                                                <div className="h-full bg-[#F5CA53] w-1/3 shadow-[0_0_10px_rgba(245,202,83,0.5)]" />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* SECTION 2: PENDING */}
                            <div className="space-y-4 pt-2">
                                <span className="text-[10px] font-black uppercase tracking-[0.25em] text-zinc-500 block">
                                    PENDING
                                </span>

                                <div className="bg-[#131418]/90 border border-zinc-800/90 rounded-2xl p-5 shadow-xl transition-all">
                                    <div
                                        onClick={() => setPendingExpanded(!pendingExpanded)}
                                        className="flex items-center justify-between cursor-pointer"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-xl bg-[#18191E] border border-zinc-800 flex items-center justify-center text-zinc-400 shrink-0">
                                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                                </svg>
                                            </div>
                                            <div>
                                                <h3 className="text-sm font-extrabold text-white">
                                                    Silk Dinner Jacket
                                                </h3>
                                                <p className="text-xs text-zinc-400 font-medium mt-0.5">
                                                    Robert L. &bull; <span className="text-zinc-400 italic">Awaiting Fabric</span>
                                                </p>
                                            </div>
                                        </div>
                                        <svg
                                            className={`w-5 h-5 text-zinc-400 transition-transform duration-300 ${pendingExpanded ? "rotate-180" : ""
                                                }`}
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </div>

                                    {pendingExpanded && (
                                        <div className="mt-5 p-4 rounded-xl bg-[#18191E] border-l-4 border-[#F5CA53] space-y-1.5 text-xs text-zinc-300">
                                            <p className="font-semibold">Current Status: Fabric transit from Biella, Italy</p>
                                            <p className="text-zinc-500">Est. Production Start: Oct 28</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* SECTION 3: NEW REQUESTS */}
                            <div className="space-y-4 pt-2">
                                <span className="text-[10px] font-black uppercase tracking-[0.25em] text-zinc-500 block">
                                    NEW REQUESTS ({openRequests.length})
                                </span>

                                {openRequests.length > 0 ? (
                                    openRequests.map((req) => (
                                        <div key={req.request_id} className="bg-[#131418]/90 border border-zinc-800/90 rounded-2xl p-5 sm:p-6 shadow-xl space-y-5">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-xl bg-[#18191E] border border-zinc-800 flex items-center justify-center text-[#F5CA53] shrink-0">
                                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                                    </svg>
                                                </div>
                                                <div>
                                                    <h3 className="text-sm font-extrabold text-white">
                                                        {req.clothing_type || "Custom Bespoke Request"}
                                                    </h3>
                                                    <p className="text-xs text-zinc-400 font-medium mt-0.5">
                                                        Client Request &bull; <span className="text-[#F5CA53] font-bold">LKR {req.budget ? req.budget.toLocaleString() : "Custom Quote"}</span>
                                                    </p>
                                                </div>
                                            </div>

                                            {/* CUSTOMER QUOTE BOX */}
                                            <div className="p-4 rounded-xl bg-[#18191E] border border-zinc-800 text-xs italic text-zinc-300 leading-relaxed">
                                                &quot;{req.description || "Looking for an expert tailor to craft custom fitted attire."}&quot;
                                            </div>

                                            {/* ACTION BUTTONS */}
                                            {requestAccepted === true ? (
                                                <div className="p-3 rounded-xl bg-[#F5CA53]/10 border border-[#F5CA53]/40 text-[#F5CA53] text-xs font-bold text-center uppercase tracking-wider">
                                                    BID SUBMITTED TO CLIENT ✓
                                                </div>
                                            ) : (
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                    <button
                                                        onClick={() => handleAcceptRequest(req.request_id, req.budget)}
                                                        className="w-full rounded-xl bg-[#F5CA53] hover:bg-[#f7d369] py-3.5 text-xs font-black uppercase tracking-[0.15em] text-black shadow-[0_0_15px_rgba(245,202,83,0.25)] transition-all hover:scale-[1.01]"
                                                    >
                                                        ACCEPT REQUEST
                                                    </button>
                                                    <button
                                                        onClick={() => setRequestAccepted(false)}
                                                        className="w-full rounded-xl bg-[#18191E] hover:bg-zinc-800 border border-zinc-800 py-3.5 text-xs font-black uppercase tracking-[0.15em] text-zinc-300 transition-all"
                                                    >
                                                        DECLINE
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    ))
                                ) : (
                                    <div className="bg-[#131418]/90 border border-zinc-800/90 rounded-2xl p-6 text-center text-xs text-zinc-500">
                                        No active client requests at the moment.
                                    </div>
                                )}
                            </div>
                        </>
                    )}

                    {/* TAB 2: WORKSHOP SCHEDULE */}
                    {activeTab === "schedule" && (
                        <div className="space-y-6">
                            <div>
                                <h1 className="text-3xl font-extrabold text-white">Workshop Schedule</h1>
                                <p className="text-xs text-zinc-400 mt-1">Today&apos;s active fitting appointments in Colombo atelier</p>
                            </div>
                            <div className="bg-[#131418] border border-zinc-800 rounded-2xl p-6 space-y-4">
                                <div className="flex justify-between items-center p-4 bg-[#18191E] border border-zinc-800 rounded-xl">
                                    <div>
                                        <span className="text-[10px] font-black uppercase text-[#F5CA53] block">10:00 AM - 11:30 AM</span>
                                        <h4 className="text-sm font-bold text-white">Adam G. &bull; Initial Suit Fitting</h4>
                                    </div>
                                    <span className="text-xs font-bold text-emerald-400 bg-emerald-950/40 border border-emerald-800/40 px-3 py-1 rounded-full">CONFIRMED</span>
                                </div>
                                <div className="flex justify-between items-center p-4 bg-[#18191E] border border-zinc-800 rounded-xl">
                                    <div>
                                        <span className="text-[10px] font-black uppercase text-[#F5CA53] block">02:00 PM - 03:00 PM</span>
                                        <h4 className="text-sm font-bold text-white">Julian V. &bull; Overcoat Chalk Line Adjustment</h4>
                                    </div>
                                    <span className="text-xs font-bold text-[#F5CA53] bg-[#F5CA53]/10 border border-[#F5CA53]/30 px-3 py-1 rounded-full">IN PROGRESS</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* TAB 3: CLIENTS */}
                    {activeTab === "clients" && (
                        <div className="space-y-6">
                            <div>
                                <h1 className="text-3xl font-extrabold text-white">Client Archive</h1>
                                <p className="text-xs text-zinc-400 mt-1">Master measurement records &amp; style profiles</p>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="bg-[#131418] border border-zinc-800 rounded-2xl p-5 space-y-3">
                                    <h4 className="text-sm font-extrabold text-white">Adam G.</h4>
                                    <p className="text-xs text-zinc-400">Chest: 40&quot; &bull; Waist: 32&quot; &bull; Shoulders: 18.5&quot;</p>
                                    <span className="text-[10px] font-black text-[#F5CA53] uppercase block">3 Commissions Completed</span>
                                </div>
                                <div className="bg-[#131418] border border-zinc-800 rounded-2xl p-5 space-y-3">
                                    <h4 className="text-sm font-extrabold text-white">Julian V.</h4>
                                    <p className="text-xs text-zinc-400">Chest: 42&quot; &bull; Waist: 34&quot; &bull; Shoulders: 19&quot;</p>
                                    <span className="text-[10px] font-black text-[#F5CA53] uppercase block">1 Active Order</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* TAB 4: FABRIC ARCHIVE */}
                    {activeTab === "fabrics" && (
                        <div className="space-y-6">
                            <div>
                                <h1 className="text-3xl font-extrabold text-white">Fabric Archive</h1>
                                <p className="text-xs text-zinc-400 mt-1">Curated inventory of luxury wools, silks, and linens</p>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div className="bg-[#131418] border border-zinc-800 rounded-2xl p-4 space-y-2">
                                    <div className="w-full h-32 bg-zinc-800 rounded-xl overflow-hidden">
                                        <img src="https://images.unsplash.com/photo-1617137968427-85924c800a22?auto=format&fit=crop&w=400&q=80" className="w-full h-full object-cover" alt="Biella Wool" />
                                    </div>
                                    <h4 className="text-xs font-bold text-white">Biella Super 150s Wool</h4>
                                    <p className="text-[10px] text-[#F5CA53] font-bold">14 Meters Available</p>
                                </div>
                                <div className="bg-[#131418] border border-zinc-800 rounded-2xl p-4 space-y-2">
                                    <div className="w-full h-32 bg-zinc-800 rounded-xl overflow-hidden">
                                        <img src="https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=400&q=80" className="w-full h-full object-cover" alt="Midnight Velvet" />
                                    </div>
                                    <h4 className="text-xs font-bold text-white">Midnight Velvet</h4>
                                    <p className="text-[10px] text-[#F5CA53] font-bold">8 Meters Available</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* TAB 5: EARNINGS */}
                    {activeTab === "earnings" && (
                        <div className="space-y-6">
                            <div>
                                <h1 className="text-3xl font-extrabold text-white">Earnings &amp; Payouts</h1>
                                <p className="text-xs text-zinc-400 mt-1">Financial performance of Atelier Vane</p>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div className="bg-[#131418] border border-zinc-800 rounded-2xl p-5">
                                    <span className="text-[10px] font-black uppercase text-zinc-500 block mb-1">THIS MONTH</span>
                                    <h3 className="text-2xl font-extrabold text-[#F5CA53]">LKR 450,000</h3>
                                </div>
                                <div className="bg-[#131418] border border-zinc-800 rounded-2xl p-5">
                                    <span className="text-[10px] font-black uppercase text-zinc-500 block mb-1">PENDING PAYOUT</span>
                                    <h3 className="text-2xl font-extrabold text-white">LKR 125,000</h3>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* TAB 6: ATELIER SETTINGS */}
                    {activeTab === "settings" && (
                        <div className="space-y-6">
                            <div>
                                <h1 className="text-3xl font-extrabold text-white">Atelier Settings</h1>
                                <p className="text-xs text-zinc-400 mt-1">Manage shop address, working hours, and contact details</p>
                            </div>
                            <div className="bg-[#131418] border border-zinc-800 rounded-2xl p-6 space-y-4 max-w-lg">
                                <div>
                                    <label className="text-[10px] font-black uppercase text-[#F5CA53] block mb-2">Shop Name</label>
                                    <input type="text" defaultValue="Atelier Vane" className="w-full bg-[#18191E] border border-zinc-800 rounded-xl p-3 text-xs font-semibold text-white" />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black uppercase text-[#F5CA53] block mb-2">Shop Address</label>
                                    <input type="text" defaultValue="Savile Row, Colombo 07" className="w-full bg-[#18191E] border border-zinc-800 rounded-xl p-3 text-xs font-semibold text-white" />
                                </div>
                            </div>
                        </div>
                    )}
                </main>
            </div>

            {/* BOTTOM FOOTER */}
            <footer className="w-full border-t border-zinc-900/80 bg-[#0A0B0E] py-8 px-6 sm:px-12 relative z-20 mt-12">
                <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex flex-col sm:flex-row items-center sm:space-x-4 space-y-1 sm:space-y-0 text-center sm:text-left">
                        <span className="text-sm font-black tracking-widest text-[#F5CA53]">
                            FITI
                        </span>
                        <span className="text-[11px] text-zinc-500">
                            &copy; {new Date().getFullYear()} FITI Digital Atelier. All rights reserved.
                        </span>
                    </div>

                    <div className="flex flex-wrap items-center justify-center gap-6 text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                        <Link href="/privacy" className="hover:text-white transition-colors">Bespoke Process</Link>
                        <Link href="/terms" className="hover:text-white transition-colors">Our Heritage</Link>
                        <Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
                        <Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
                        <Link href="/contact" className="hover:text-white transition-colors">Contact Support</Link>
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
                    <span>💬 Text Client Direct Line</span>
                </button>
            )}

            {/* LIVE ATELIER CHAT DRAWER */}
            <AtelierChatDrawer
                isOpen={isChatDrawerOpen}
                onClose={() => setIsChatDrawerOpen(false)}
                userRole="tailor"
            />

            {/* REAL-TIME NOTIFICATION DRAWER */}
            <NotificationDrawer
                isOpen={isNotificationOpen}
                onClose={() => setIsNotificationOpen(false)}
            />
        </div>
    );
}