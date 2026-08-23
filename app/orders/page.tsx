"use client";

import Link from "next/link";
import { useAuth } from "@/lib/firebase/AuthContext";

export default function OrdersPage() {
    const { user, role } = useAuth();
    const homeUrl = role === "tailor" ? "/tailor/home" : role === "client" ? "/client/home" : "/login";

    const orders = [
        {
            id: "ORD-8821",
            title: "Bespoke Navy Double-Breasted Suit",
            client: "Adam G.",
            tailor: "Atelier Vane (Colombo 07)",
            date: "Oct 18, 2026",
            status: "IN FITTING",
            progress: 75,
            price: "LKR 185,000",
        },
        {
            id: "ORD-8825",
            title: "Cashmere Overcoat",
            client: "Julian V.",
            tailor: "Savile Atelier (Colombo 03)",
            date: "Oct 20, 2026",
            status: "INITIAL MEASUREMENTS",
            progress: 30,
            price: "LKR 165,000",
        },
        {
            id: "ORD-8790",
            title: "Silk Dinner Tuxedo",
            client: "Robert L.",
            tailor: "Perera & Sons Atelier (Kandy)",
            date: "Sep 28, 2026",
            status: "COMPLETED",
            progress: 100,
            price: "LKR 210,000",
        },
    ];

    return (
        <div className="min-h-screen bg-[#0A0B0E] text-white flex flex-col justify-between selection:bg-[#F5CA53] selection:text-black font-sans">
            {/* TOP NAVIGATION HEADER */}
            <header className="w-full border-b border-zinc-900/80 bg-[#0A0B0E]/90 backdrop-blur-md sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-6 sm:px-12 py-5 flex items-center justify-between">
                    <Link href="/" className="text-xl sm:text-2xl font-black tracking-widest text-[#F5CA53] hover:opacity-90 transition-opacity">
                        FITI
                    </Link>

                    <nav className="hidden md:flex items-center space-x-10 text-xs font-semibold tracking-wider text-zinc-400">
                        <Link href="/storefront" className="hover:text-[#F5CA53] transition-colors">Storefront</Link>
                        <Link href={homeUrl} className="hover:text-[#F5CA53] transition-colors">Dashboard</Link>
                        <Link href="/orders" className="text-[#F5CA53] font-bold relative pb-1 border-b-2 border-[#F5CA53]">Orders</Link>
                        <Link href="/tailors" className="hover:text-[#F5CA53] transition-colors">Tailors</Link>
                    </nav>

                    <div className="flex items-center space-x-5 text-zinc-400">
                        <Link href={homeUrl} className="px-4 py-2 rounded-xl bg-[#F5CA53] text-black text-xs font-bold uppercase tracking-wider">
                            Dashboard
                        </Link>
                    </div>
                </div>
            </header>

            {/* MAIN CONTENT */}
            <main className="max-w-7xl w-full mx-auto px-6 sm:px-12 py-12 flex-1 space-y-8">
                <div>
                    <span className="text-[10px] font-black uppercase tracking-[0.25em] text-[#F5CA53] mb-2 block">
                        ORDER MANAGEMENT &amp; TRACKING
                    </span>
                    <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                        My Commissions
                    </h1>
                </div>

                <div className="space-y-4">
                    {orders.map((ord) => (
                        <div key={ord.id} className="bg-[#131418]/90 border border-zinc-800/90 rounded-2xl p-6 shadow-xl space-y-4">
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-zinc-800/80 pb-4">
                                <div>
                                    <div className="flex items-center gap-3">
                                        <span className="text-xs font-black text-[#F5CA53]">{ord.id}</span>
                                        <span className="text-xs font-bold text-zinc-500">• {ord.date}</span>
                                    </div>
                                    <h3 className="text-base font-extrabold text-white mt-1">{ord.title}</h3>
                                    <p className="text-xs text-zinc-400 mt-0.5">{ord.tailor} &bull; Client: {ord.client}</p>
                                </div>
                                <div className="text-right">
                                    <span className="text-sm font-black text-white block">{ord.price}</span>
                                    <span className="text-[10px] font-bold text-[#F5CA53] uppercase px-2.5 py-1 rounded-full bg-[#F5CA53]/10 border border-[#F5CA53]/30 inline-block mt-1">
                                        {ord.status}
                                    </span>
                                </div>
                            </div>

                            <div className="space-y-1">
                                <div className="flex justify-between text-[11px] font-semibold text-zinc-400">
                                    <span>Fitting Timeline</span>
                                    <span>{ord.progress}% Completed</span>
                                </div>
                                <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                                    <div className="h-full bg-[#F5CA53] shadow-[0_0_10px_rgba(245,202,83,0.5)]" style={{ width: `${ord.progress}%` }} />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </main>

            {/* FOOTER */}
            <footer className="w-full border-t border-zinc-900/80 bg-[#0A0B0E] py-8 px-6 sm:px-12 relative z-20">
                <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
                    <span className="text-sm font-black tracking-widest text-[#F5CA53]">FITI</span>
                    <div className="flex gap-6 text-[10px] uppercase font-bold text-zinc-400">
                        <Link href="/privacy">Privacy Policy</Link>
                        <Link href="/terms">Terms of Service</Link>
                        <Link href="/contact">Contact Support</Link>
                    </div>
                </div>
            </footer>
        </div>
    );
}
