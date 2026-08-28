"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/firebase/AuthContext";
import { listClientOrders, listOpenRequests } from "@/lib/api/endpoints/orders";

export default function OrdersPage() {
    const { user, role, logout, setRole } = useAuth();
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState("");
    const [orders, setOrders] = useState<Array<{
        id: string;
        title: string;
        client: string;
        tailor: string;
        date: string;
        status: string;
        progress: number;
        price: string;
    }>>([]);
    const [loading, setLoading] = useState(true);

    const homeUrl = role === "tailor" ? "/tailor/home" : role === "client" ? "/client/home" : "/client/home";

    const filteredOrders = orders.filter(
        (ord) =>
            ord.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
            ord.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            ord.client.toLowerCase().includes(searchQuery.toLowerCase()) ||
            ord.tailor.toLowerCase().includes(searchQuery.toLowerCase()) ||
            ord.status.toLowerCase().includes(searchQuery.toLowerCase())
    );

    useEffect(() => {
        const fetchOrders = async () => {
            setLoading(true);
            try {
                if (user) {
                    const fetchedOrders = await listClientOrders(user.uid);
                    if (fetchedOrders && fetchedOrders.length > 0) {
                        setOrders(
                            fetchedOrders.map((o) => ({
                                id: `ORD-${o.order_id}`,
                                title: `Bespoke Order #${o.order_id}`,
                                client: user.displayName || user.email?.split("@")[0] || "Client",
                                tailor: "Verified Atelier Shop",
                                date: new Date(o.created_at).toLocaleDateString(),
                                status: o.status.toUpperCase(),
                                progress: o.status === "completed" ? 100 : o.status === "in_progress" ? 60 : 25,
                                price: `LKR ${o.accepted_price.toLocaleString()}`,
                            }))
                        );
                        setLoading(false);
                        return;
                    }
                }
                const openReqs = await listOpenRequests();
                if (openReqs && openReqs.length > 0) {
                    setOrders(
                        openReqs.map((r) => ({
                            id: `REQ-${r.request_id}`,
                            title: r.clothing_category || "Custom Garment",
                            client: r.client_id.slice(0, 8),
                            tailor: r.request_location || "Marketplace Broadcast",
                            date: new Date(r.created_at).toLocaleDateString(),
                            status: r.status.toUpperCase(),
                            progress: 30,
                            price: r.target_budget ? `LKR ${r.target_budget.toLocaleString()}` : "Pending Bids",
                        }))
                    );
                    setLoading(false);
                    return;
                }
            } catch {
                // Network/Offline fallback: render initial default orders
            }

            setOrders([
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
            ]);
            setLoading(false);
        };

        fetchOrders();
    }, [user]);

    return (
        <div className="min-h-screen bg-[#07080A] text-white flex flex-col justify-between selection:bg-[#F5CA53] selection:text-black font-sans">
            {/* TOP NAVIGATION HEADER */}
            <header className="w-full border-b border-zinc-900/90 bg-[#0A0B0E]/95 backdrop-blur-xl sticky top-0 z-50 transition-all duration-300">
                <div className="max-w-7xl mx-auto px-4 sm:px-8 py-4 flex items-center justify-between gap-4">
                    {/* Left: Back button & Atelier Logo */}
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => router.back()}
                            className="px-3 py-1.5 rounded-xl border border-zinc-800 bg-[#141519] hover:bg-[#1C1D22] text-zinc-300 hover:text-[#F5CA53] hover:border-[#F5CA53]/40 text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm group"
                            title="Go back to previous page"
                        >
                            <span className="group-hover:-translate-x-0.5 transition-transform">&larr;</span>
                            <span className="hidden sm:inline">Back</span>
                        </button>

                        <Link href="/" className="flex items-center gap-3 group">
                            <div className="relative h-9 px-3 py-1 bg-[#FFFDF9] rounded-xl border border-[#F5CA53]/50 shadow-[0_0_15px_rgba(245,202,83,0.25)] flex items-center justify-center transition-all duration-300 group-hover:scale-105 group-hover:shadow-[0_0_25px_rgba(245,202,83,0.45)]">
                                <img
                                    src="/logoo.png"
                                    alt="FITI Atelier Digital Logo"
                                    className="h-7 w-auto object-contain"
                                />
                            </div>
                            <span className="font-extrabold tracking-widest text-sm text-white uppercase font-heading hidden sm:inline-block">
                                ATELIER DIGITAL
                            </span>
                        </Link>
                    </div>

                    {/* Middle Navigation Links */}
                    <nav className="hidden lg:flex items-center space-x-8 text-xs font-bold tracking-wider text-zinc-400">
                        <Link href="/storefront" className="hover:text-[#F5CA53] transition-colors">
                            Storefront
                        </Link>
                        <Link href={homeUrl} className="hover:text-[#F5CA53] transition-colors">
                            Dashboard
                        </Link>
                        <Link href="/orders" className="text-white font-extrabold relative pb-1 border-b-2 border-[#F5CA53]">
                            Orders
                        </Link>
                        <Link href="/tailors" className="hover:text-[#F5CA53] transition-colors">
                            Tailors
                        </Link>
                    </nav>

                    {/* Right Action Buttons */}
                    <div className="flex items-center space-x-3">
                        <button
                            type="button"
                            onClick={() => {
                                setRole("client");
                                router.push("/client/home");
                            }}
                            className="bg-[#141519] border border-zinc-800 hover:border-[#F5CA53] text-[#F5CA53] font-bold text-xs px-3 py-1.5 rounded-xl transition-all"
                        >
                            Client Dash
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                setRole("tailor");
                                router.push("/tailor/home");
                            }}
                            className="bg-[#141519] border border-zinc-800 hover:border-[#F5CA53] text-[#F5CA53] font-bold text-xs px-3 py-1.5 rounded-xl transition-all"
                        >
                            Seller Dash
                        </button>
                        <button
                            onClick={async () => {
                                await logout();
                                router.push("/login");
                            }}
                            className="px-3.5 py-1.5 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-400 hover:bg-rose-500 hover:text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm"
                            title="Sign out"
                        >
                            <span>Logout</span>
                        </button>
                    </div>
                </div>
            </header>

            {/* MAIN CONTENT */}
            <main className="max-w-7xl w-full mx-auto px-4 sm:px-8 py-12 flex-1 space-y-8">
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                    <div>
                        <span className="text-[10px] font-mono tracking-[0.25em] text-[#F5CA53] uppercase block mb-1">
                            ORDER MANAGEMENT &amp; TRACKING
                        </span>
                        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight font-heading">
                            My Commissions
                        </h1>
                    </div>

                    {/* LIVE SEARCH BAR */}
                    <div className="relative w-full sm:w-72">
                        <svg className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#F5CA53]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search by order ID, title, tailor..."
                            className="w-full pl-10 pr-8 py-2.5 bg-[#141519] border border-zinc-800 focus:border-[#F5CA53] rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none transition-all shadow-inner"
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery("")}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white text-xs font-bold"
                            >
                                &times;
                            </button>
                        )}
                    </div>
                </div>

                <div className="space-y-4">
                    {filteredOrders.length > 0 ? (
                        filteredOrders.map((ord) => (
                        <div key={ord.id} className="bg-[#121318] border border-zinc-800/80 rounded-2xl p-6 shadow-xl space-y-4">
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-zinc-800/80 pb-4">
                                <div>
                                    <div className="flex items-center gap-3">
                                        <span className="text-xs font-mono font-bold text-[#F5CA53]">{ord.id}</span>
                                        <span className="text-xs font-bold text-zinc-500">• {ord.date}</span>
                                    </div>
                                    <h3 className="text-base font-extrabold text-white mt-1 font-heading">{ord.title}</h3>
                                    <p className="text-xs text-zinc-400 mt-0.5">{ord.tailor} &bull; Client: {ord.client}</p>
                                </div>
                                <div className="text-right">
                                    <span className="text-sm font-black text-white block">{ord.price}</span>
                                    <span className="text-[10px] font-mono font-bold text-[#F5CA53] uppercase px-2.5 py-1 rounded-full bg-[#F5CA53]/10 border border-[#F5CA53]/30 inline-block mt-1">
                                        {ord.status}
                                    </span>
                                </div>
                            </div>

                            <div className="space-y-1">
                                <div className="flex justify-between text-[11px] font-semibold text-zinc-400">
                                    <span>Fitting Progress</span>
                                    <span className="text-[#F5CA53] font-bold">{ord.progress}%</span>
                                </div>
                                <div className="w-full h-2 bg-zinc-900 rounded-full overflow-hidden">
                                    <div className="h-full bg-[#F5CA53] rounded-full transition-all" style={{ width: `${ord.progress}%` }} />
                                </div>
                            </div>
                        </div>
                    ))
                    ) : (
                        <div className="bg-[#121318] border border-zinc-800/80 rounded-2xl p-12 text-center space-y-3">
                            <span className="text-3xl">🔍</span>
                            <h3 className="text-base font-bold text-white">No commissions found</h3>
                            <p className="text-xs text-zinc-400 max-w-sm mx-auto">
                                No active or completed commissions matched &quot;{searchQuery}&quot;. Try searching by ID, tailor name, or status.
                            </p>
                            <button
                                onClick={() => setSearchQuery("")}
                                className="px-4 py-2 bg-[#18191E] border border-[#F5CA53]/50 hover:bg-[#F5CA53]/10 text-[#F5CA53] text-xs font-bold rounded-xl transition-all"
                            >
                                Clear Search Filter
                            </button>
                        </div>
                    )}
                </div>
            </main>

            {/* FOOTER */}
            <footer className="w-full border-t border-zinc-900/90 bg-[#07080A] py-8 px-4 sm:px-8 relative z-20">
                <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
                    <span className="font-extrabold text-sm tracking-widest text-white uppercase font-heading">
                        ATELIER DIGITAL
                    </span>
                    <div className="flex gap-6 text-[10px] font-mono uppercase font-bold text-zinc-400">
                        <Link href="#privacy">Privacy Policy</Link>
                        <Link href="#terms">Terms of Service</Link>
                        <Link href="#contact">Contact Support</Link>
                    </div>
                </div>
            </footer>
        </div>
    );
}
