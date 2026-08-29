"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/firebase/AuthContext";
import { listClientOrders, listOpenRequests } from "@/lib/api/endpoints/orders";

interface ClientOrderRow {
    id: string;
    title: string;
    client: string;
    tailor: string;
    date: string;
    status: string;
    progress: number;
    price: string;
}

export default function ClientOrdersPage() {
    const { user } = useAuth();
    
    const [searchQuery, setSearchQuery] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [isDbConnected, setIsDbConnected] = useState(false);
    const [clientOrders, setClientOrders] = useState<ClientOrderRow[]>([]);

    const filteredClientOrders = clientOrders.filter(
        (ord) =>
            ord.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
            ord.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            ord.client.toLowerCase().includes(searchQuery.toLowerCase()) ||
            ord.tailor.toLowerCase().includes(searchQuery.toLowerCase()) ||
            ord.status.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const fetchClientData = useCallback(async () => {
        setIsLoading(true);
        try {
            let rows: ClientOrderRow[] = [];

            if (user) {
                const fetched = await listClientOrders(user.uid);
                if (fetched && fetched.length > 0) {
                    rows = fetched.map((o) => ({
                        id: `ORD-${o.order_id}`,
                        title: `Order #${o.order_id}`,
                        client: user.displayName || user.email?.split("@")[0] || "Client",
                        tailor: "Verified Atelier Shop",
                        date: new Date(o.created_at).toLocaleDateString(),
                        status: (o.order_status || "pending").replace(/_/g, " ").toUpperCase(),
                        progress: o.order_status === "completed" ? 100 : o.order_status === "in_progress" ? 60 : 25,
                        price: o.accepted_price ? `LKR ${Number(o.accepted_price).toLocaleString()}` : "Pending",
                    }));
                }
            }

            if (rows.length === 0) {
                const openReqs = await listOpenRequests();
                if (openReqs && openReqs.length > 0) {
                    rows = openReqs.map((r) => ({
                        id: `REQ-${r.request_id}`,
                        title: r.clothing_category || "Custom Garment",
                        client: r.client_id ? r.client_id.slice(0, 8) : "Client",
                        tailor: "Marketplace Broadcast",
                        date: new Date(r.created_at).toLocaleDateString(),
                        status: r.status.toUpperCase(),
                        progress: 0,
                        price: r.target_budget ? `LKR ${Number(r.target_budget).toLocaleString()}` : "Pending Bids",
                    }));
                }
            }

            setClientOrders(rows);
            setIsDbConnected(true);
        } catch (err) {
            console.error("Failed to load client orders:", err);
            setIsDbConnected(false);
        } finally {
            setIsLoading(false);
        }
    }, [user]);

    useEffect(() => {
        fetchClientData();
    }, [fetchClientData]);

    return (
        <div className="min-h-screen bg-[#07080A] text-white flex flex-col justify-between selection:bg-[#F5CA53] selection:text-black font-sans">
            <main className="max-w-7xl w-full mx-auto px-4 sm:px-8 py-12 flex-1 space-y-8">
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                    <div>
                        <span className="text-[10px] font-mono tracking-[0.25em] text-[#F5CA53] uppercase block mb-1">
                            ORDER MANAGEMENT & TRACKING
                        </span>
                        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight font-heading">My Commissions</h1>
                    </div>

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
                    {clientOrders.length === 0 ? (
                        <div className="bg-[#121318] border border-zinc-800/80 rounded-2xl p-12 text-center space-y-2">
                            <h3 className="text-base font-bold text-white">{isLoading ? "Loading commissions…" : "No commissions yet"}</h3>
                            {!isLoading && (
                                <p className="text-xs text-zinc-400 max-w-sm mx-auto">
                                    Once you place a commission or a tailor accepts your request, it'll show up here.
                                </p>
                            )}
                        </div>
                    ) : filteredClientOrders.length > 0 ? (
                        filteredClientOrders.map((ord) => (
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
                                No commissions matched "{searchQuery}". Try searching by ID, tailor name, or status.
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
        </div>
    );
}
