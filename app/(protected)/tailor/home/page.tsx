"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/firebase/AuthContext";
import {
    listOpenRequests,
    listShopOrders,
    submitBid,
    updateOrderStatus,
} from "@/lib/api/endpoints/orders";
import { listTailorShops } from "@/lib/api/endpoints/shops";
import { getTailorProfile, updateTailorProfile } from "@/lib/api/endpoints/profiles";
import type { ClothingRequest, Order, ShopRequest } from "@/lib/api/types/order";
import type { Shop } from "@/lib/api/types/shop";
import type { TailorProfile } from "@/lib/api/types/profile";

interface RequestView {
    req: ClothingRequest;
    myShopRequest: ShopRequest | null;
    isBidding: boolean;
    isDirect: boolean;
}

type Tab = "overview" | "pipeline" | "earnings" | "settings";

export default function TailorHomePage() {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState<Tab>("pipeline");
    const [tailorShops, setTailorShops] = useState<Shop[]>([]);
    const [selectedShop, setSelectedShop] = useState<Shop | null>(null);
    
    // Data state
    const [openRequests, setOpenRequests] = useState<ClothingRequest[]>([]);
    const [shopOrders, setShopOrders] = useState<Order[]>([]);
    const [tailorProfile, setTailorProfile] = useState<TailorProfile | null>(null);
    
    // UI state
    const [isLoading, setIsLoading] = useState(true);
    const [isShopDropdownOpen, setIsShopDropdownOpen] = useState(false);
    
    // Action state
    const [submittingBidFor, setSubmittingBidFor] = useState<number | null>(null);
    const [completingOrderId, setCompletingOrderId] = useState<number | null>(null);
    const [actionToast, setActionToast] = useState<{ msg: string; ok: boolean } | null>(null);
    
    // Form state
    const [bidPrices, setBidPrices] = useState<Record<number, string>>({});
    const [bidMessages, setBidMessages] = useState<Record<number, string>>({});
    const [settingsPhone, setSettingsPhone] = useState("");
    const [settingsCity, setSettingsCity] = useState("");
    const [settingsAddress, setSettingsAddress] = useState("");
    const [isSavingSettings, setIsSavingSettings] = useState(false);
    const [settingsSaved, setSettingsSaved] = useState(false);

    const showToast = (msg: string, ok = true) => {
        setActionToast({ msg, ok });
        setTimeout(() => setActionToast(null), 3000);
    };

    const fetchData = useCallback(async () => {
        if (!user) return;
        setIsLoading(true);
        try {
            const [profileRes, shopsRes, reqsRes] = await Promise.allSettled([
                getTailorProfile(user.uid),
                listTailorShops(user.uid),
                listOpenRequests(),
            ]);

            if (profileRes.status === "fulfilled") {
                const p = profileRes.value;
                setTailorProfile(p);
                setSettingsPhone(p.phone || "");
                setSettingsCity(p.city || "");
                setSettingsAddress(p.address || "");
            }

            let activeShop: Shop | null = null;
            if (shopsRes.status === "fulfilled" && shopsRes.value.length > 0) {
                const shops = shopsRes.value;
                setTailorShops(shops);
                const storedId = localStorage.getItem("tailorSelectedShopId");
                activeShop = storedId ? (shops.find((s) => String(s.shop_id) === storedId) ?? shops[0]) : shops[0];
                setSelectedShop(activeShop);
                localStorage.setItem("tailorSelectedShopId", String(activeShop.shop_id));
            }

            if (reqsRes.status === "fulfilled") {
                setOpenRequests(reqsRes.value);
            }

            if (activeShop?.shop_id) {
                try {
                    const orders = await listShopOrders(activeShop.shop_id);
                    setShopOrders(orders);
                } catch { setShopOrders([]); }
            }
        } catch (err) {
            console.error("Failed to load tailor data:", err);
        } finally {
            setIsLoading(false);
        }
    }, [user]);

    useEffect(() => { fetchData(); }, [user, fetchData]);

    const handleSelectShop = useCallback(async (shop: Shop) => {
        setSelectedShop(shop);
        setIsShopDropdownOpen(false);
        localStorage.setItem("tailorSelectedShopId", String(shop.shop_id));
        if (shop.shop_id) {
            setIsLoading(true);
            try { 
                const orders = await listShopOrders(shop.shop_id); 
                setShopOrders(orders); 
            } catch { setShopOrders([]); }
            setIsLoading(false);
        }
    }, []);

    // ── Pipeline Data Preparation ──
    
    const newInquiries: RequestView[] = [];
    const pendingClient: RequestView[] = [];
    const activeWorkshop = shopOrders.filter((o) => o.order_status === "in_progress");
    const completedHistory = shopOrders.filter((o) => o.order_status === "completed");

    if (selectedShop) {
        openRequests.forEach((req) => {
            const myShopRequest = req.shop_requests?.find((sr) => sr.shop_id === selectedShop.shop_id) || null;
            const view: RequestView = {
                req,
                myShopRequest,
                isBidding: req.request_type === "bidding",
                isDirect: req.request_type === "direct",
            };

            // If we have an accepted quote, it's an order now, skip it from requests lists.
            if (myShopRequest?.status === "accepted") return;

            // If we have already quoted, it is pending client approval
            if (myShopRequest?.status === "quoted") {
                pendingClient.push(view);
                return;
            }

            // New Inquiry if direct to us, OR if it's a bidding request we haven't answered
            if ((myShopRequest && myShopRequest.status === "pending") || (!myShopRequest && view.isBidding)) {
                newInquiries.push(view);
            }
        });
    }

    const totalRevenue = completedHistory.reduce((sum, o) => sum + (o.accepted_price || 0), 0);
    const pipelineValue = activeWorkshop.reduce((sum, o) => sum + (o.accepted_price || 0), 0);
    const shopDisplayName = selectedShop?.shop_name || "Your Shop";

    // ── Handlers ──

    const handleSubmitQuote = async (view: RequestView) => {
        const srId = view.myShopRequest?.shop_request_id;
        if (!srId) {
            showToast("Cannot bid without a valid shop request context.", false);
            return;
        }
        
        const price = Number(bidPrices[srId]);
        if (!price || price <= 0) return;
        
        setSubmittingBidFor(srId);
        try {
            await submitBid({
                shop_request_id: srId,
                bid_amount: price,
                message: bidMessages[srId] || `Quote of LKR ${price.toLocaleString()} submitted.`,
            });
            showToast("Quote submitted successfully!");
            setBidPrices((p) => { const n = { ...p }; delete n[srId]; return n; });
            setBidMessages((p) => { const n = { ...p }; delete n[srId]; return n; });
            await fetchData(); // Refresh board
        } catch (err) {
            console.error("Failed to submit quote:", err);
            showToast("Failed to submit quote. Try again.", false);
        } finally { 
            setSubmittingBidFor(null); 
        }
    };

    const handleMarkComplete = async (orderId: number) => {
        setCompletingOrderId(orderId);
        try {
            await updateOrderStatus(orderId, "completed");
            showToast("Order marked as completed!");
            await fetchData(); // Refresh board
        } catch (err) {
            console.error("Failed to mark complete:", err);
            showToast("Failed to complete order. Try again.", false);
        } finally { 
            setCompletingOrderId(null); 
        }
    };

    // ── Render Helpers ──

    const SkeletonCard = () => <div className="h-40 bg-[#141519] rounded-xl border border-zinc-800/60 animate-pulse" />;

    const renderInquiryCard = (view: RequestView) => {
        const { req, myShopRequest, isDirect } = view;
        const srId = myShopRequest?.shop_request_id;
        const isSubmitting = srId != null && submittingBidFor === srId;
        const priceVal = srId != null ? (bidPrices[srId] ?? "") : "";
        const canSubmit = srId != null;

        return (
            <div key={req.request_id} className="bg-[#18191E] border border-zinc-800/80 rounded-xl overflow-hidden flex flex-col hover:border-zinc-700 transition-colors shadow-sm relative group">
                <div className={`absolute top-0 left-0 w-1 h-full ${isDirect ? "bg-sky-400" : "bg-amber-400"}`} />
                <div className="p-4 pl-5 flex-1">
                    <div className="flex justify-between items-start mb-2">
                        <div>
                            <span className={`text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded border mb-1.5 inline-block ${isDirect ? "text-sky-400 bg-sky-400/10 border-sky-400/20" : "text-amber-400 bg-amber-400/10 border-amber-400/20"}`}>
                                {isDirect ? "Direct" : "Bidding"}
                            </span>
                            <h4 className="text-sm font-bold text-white leading-tight">{req.clothing_category || "Custom Garment"}</h4>
                        </div>
                        <span className="text-xs font-mono text-zinc-500">#{req.request_id}</span>
                    </div>
                    <p className="text-[10px] text-zinc-400 mb-2">
                        {req.gender ? `${req.gender.charAt(0).toUpperCase() + req.gender.slice(1)} fit` : "Custom"} &bull; {req.target_budget ? `Budget: LKR ${req.target_budget.toLocaleString()}` : "Open Budget"}
                    </p>
                    {req.description && <p className="text-[10px] text-zinc-500 italic line-clamp-2 bg-[#141519] p-2 rounded-lg border border-zinc-800">"{req.description}"</p>}
                </div>
                
                {canSubmit ? (
                    <div className="p-3 bg-[#141519] border-t border-zinc-800/80 space-y-2">
                        <div className="grid grid-cols-2 gap-2">
                            <input 
                                type="number" 
                                placeholder="Your Price (LKR)" 
                                value={priceVal}
                                onChange={(e) => srId != null && setBidPrices((p) => ({ ...p, [srId]: e.target.value }))}
                                className="w-full bg-[#1A1B20] border border-zinc-700/60 focus:border-[#F5CA53]/60 rounded-lg px-2 py-1.5 text-[10px] text-white placeholder-zinc-600 outline-none transition-colors" 
                            />
                            <input 
                                type="text" 
                                placeholder="Short message..." 
                                value={srId != null ? (bidMessages[srId] ?? "") : ""}
                                onChange={(e) => srId != null && setBidMessages((p) => ({ ...p, [srId]: e.target.value }))}
                                className="w-full bg-[#1A1B20] border border-zinc-700/60 focus:border-[#F5CA53]/60 rounded-lg px-2 py-1.5 text-[10px] text-white placeholder-zinc-600 outline-none transition-colors" 
                            />
                        </div>
                        <button 
                            onClick={() => handleSubmitQuote(view)} 
                            disabled={isSubmitting || !priceVal || Number(priceVal) <= 0}
                            className="w-full bg-[#F5CA53] hover:bg-[#f7d369] disabled:bg-zinc-700 disabled:text-zinc-500 disabled:cursor-not-allowed text-black font-black text-[10px] uppercase tracking-widest py-2 rounded-lg transition-all flex items-center justify-center gap-2"
                        >
                            {isSubmitting ? "Submitting..." : "Send Quote"}
                        </button>
                    </div>
                ) : (
                    <div className="p-3 bg-[#141519] border-t border-zinc-800/80 text-center">
                        <span className="text-[10px] text-zinc-500">Shop request not initialized</span>
                    </div>
                )}
            </div>
        );
    };

    const renderPendingCard = (view: RequestView) => {
        const { req, myShopRequest } = view;
        return (
            <div key={req.request_id} className="bg-[#18191E] border border-zinc-800/80 rounded-xl overflow-hidden shadow-sm relative opacity-80 hover:opacity-100 transition-opacity">
                <div className="absolute top-0 left-0 w-1 h-full bg-[#F5CA53]" />
                <div className="p-4 pl-5">
                    <div className="flex justify-between items-start mb-2">
                        <h4 className="text-sm font-bold text-white leading-tight">{req.clothing_category || "Custom Garment"}</h4>
                        <span className="text-[9px] uppercase font-bold text-[#F5CA53] bg-[#F5CA53]/10 px-2 py-0.5 rounded border border-[#F5CA53]/20">Quoted</span>
                    </div>
                    <div className="bg-[#141519] border border-zinc-800 rounded-lg p-2.5 flex justify-between items-center mt-3">
                        <span className="text-[10px] text-zinc-500 uppercase font-bold">Your Offer</span>
                        <span className="text-xs font-black text-white">LKR {Number(myShopRequest?.offered_price || 0).toLocaleString()}</span>
                    </div>
                    <p className="text-[9px] text-zinc-500 mt-3 text-center uppercase tracking-wider font-bold">Awaiting Client Approval</p>
                </div>
            </div>
        );
    };

    const renderOrderCard = (ord: Order, isActive: boolean) => {
        const isCompleting = completingOrderId === ord.order_id;
        return (
            <div key={ord.order_id} className={`bg-[#18191E] border border-zinc-800/80 rounded-xl overflow-hidden shadow-sm relative ${!isActive && 'opacity-60 grayscale hover:grayscale-0 transition-all'}`}>
                <div className={`absolute top-0 left-0 w-1 h-full ${isActive ? "bg-emerald-400" : "bg-zinc-600"}`} />
                <div className="p-4 pl-5">
                    <div className="flex justify-between items-start mb-1">
                        <h4 className="text-sm font-bold text-white leading-tight">Order #{ord.order_id}</h4>
                        <span className="text-xs font-mono text-zinc-500">Ref #{ord.shop_request_id}</span>
                    </div>
                    <p className="text-xs font-black text-emerald-400 mb-3">LKR {Number(ord.accepted_price).toLocaleString()}</p>
                    
                    {isActive ? (
                        <button 
                            onClick={() => handleMarkComplete(ord.order_id)} 
                            disabled={isCompleting}
                            className="w-full bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 font-bold text-[10px] uppercase tracking-widest py-2 rounded-lg transition-all flex items-center justify-center gap-2"
                        >
                            {isCompleting ? "Completing..." : "✓ Mark Completed"}
                        </button>
                    ) : (
                        <div className="bg-zinc-800/50 rounded-lg p-2 text-center border border-zinc-700/50">
                            <span className="text-[10px] text-zinc-400 uppercase font-bold tracking-widest">Finished</span>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="text-white flex flex-col h-screen selection:bg-[#F5CA53] selection:text-black font-sans bg-[#0B0C10]">
            {actionToast && (
                <div className={`fixed top-6 right-6 z-50 text-white text-xs font-bold px-5 py-3 rounded-xl shadow-2xl flex items-center gap-2 ${actionToast.ok ? "bg-emerald-600" : "bg-red-600"}`}>
                    {actionToast.msg}
                </div>
            )}
            
            {/* Header */}
            <header className="h-16 shrink-0 border-b border-zinc-800/60 bg-[#121316] flex items-center px-6 lg:px-12 justify-between">
                <div className="flex items-center gap-8">
                    <span className="text-[#F5CA53] font-serif font-black text-xl tracking-tighter">Atelier Mode</span>
                    <nav className="hidden sm:flex items-center gap-1">
                        {[
                            { key: "pipeline", label: "Pipeline" },
                            { key: "overview", label: "Overview" },
                            { key: "earnings", label: "Earnings" },
                            { key: "settings", label: "Settings" }
                        ].map(t => (
                            <button 
                                key={t.key} 
                                onClick={() => setActiveTab(t.key as Tab)}
                                className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all ${activeTab === t.key ? "bg-[#F5CA53]/10 text-[#F5CA53]" : "text-zinc-500 hover:text-white"}`}
                            >
                                {t.label}
                            </button>
                        ))}
                    </nav>
                </div>
                
                <div className="relative">
                    <button onClick={() => setIsShopDropdownOpen(!isShopDropdownOpen)} className="flex items-center gap-2 bg-[#1A1B20] border border-zinc-800 hover:border-[#F5CA53]/40 px-4 py-2 rounded-full text-xs font-bold text-[#F5CA53] transition-all">
                        <span className="truncate max-w-[120px]">{shopDisplayName}</span>
                        <svg className={`w-3 h-3 transition-transform ${isShopDropdownOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                    </button>
                    {isShopDropdownOpen && (
                        <div className="absolute top-full right-0 mt-2 w-48 bg-[#1A1B20] border border-zinc-800 rounded-xl shadow-xl overflow-hidden z-20 py-1">
                            {tailorShops.map(shop => (
                                <button key={shop.shop_id} onClick={() => handleSelectShop(shop)} className="w-full text-left px-4 py-2.5 text-xs font-bold hover:bg-[#25262C] transition-colors text-zinc-300">
                                    {shop.shop_name}
                                </button>
                            ))}
                            <div className="h-px bg-zinc-800 my-1"/>
                            <Link href="/tailor/add-shop" className="w-full text-left px-4 py-2 text-xs font-bold text-[#F5CA53] hover:bg-[#25262C] transition-colors flex items-center gap-2">
                                + Add New Shop
                            </Link>
                        </div>
                    )}
                </div>
            </header>

            <main className="flex-1 overflow-hidden flex flex-col bg-[#0B0C10]">
                {/* PIPELINE VIEW */}
                {activeTab === "pipeline" && (
                    <div className="flex-1 overflow-x-auto flex flex-col p-6 lg:px-12">
                        <div className="mb-6 shrink-0">
                            <h1 className="text-2xl font-extrabold text-white tracking-tight">Order Pipeline</h1>
                            <p className="text-xs text-zinc-500 mt-1">Track and manage the entire lifecycle of your commissions.</p>
                        </div>
                        
                        <div className="flex-1 min-h-0 flex gap-6 pb-6 w-max lg:w-full">
                            {/* Column 1: New Inquiries */}
                            <div className="w-[300px] lg:flex-1 flex flex-col bg-[#121316] rounded-2xl border border-zinc-800/60 shrink-0">
                                <div className="p-4 border-b border-zinc-800/60 bg-[#16171B] rounded-t-2xl flex items-center justify-between">
                                    <h3 className="text-xs font-black uppercase tracking-widest text-white">New Inquiries</h3>
                                    <span className="bg-zinc-800 text-zinc-300 text-[10px] px-2 py-0.5 rounded-full font-mono">{newInquiries.length}</span>
                                </div>
                                <div className="p-4 overflow-y-auto flex-1 space-y-4 custom-scrollbar">
                                    {isLoading ? <><SkeletonCard/><SkeletonCard/></> : newInquiries.length === 0 ? (
                                        <p className="text-xs text-zinc-600 text-center mt-10">No new requests</p>
                                    ) : newInquiries.map(renderInquiryCard)}
                                </div>
                            </div>

                            {/* Column 2: Pending Client */}
                            <div className="w-[300px] lg:flex-1 flex flex-col bg-[#121316] rounded-2xl border border-zinc-800/60 shrink-0">
                                <div className="p-4 border-b border-zinc-800/60 bg-[#16171B] rounded-t-2xl flex items-center justify-between">
                                    <h3 className="text-xs font-black uppercase tracking-widest text-white">Pending Client</h3>
                                    <span className="bg-[#F5CA53]/10 text-[#F5CA53] border border-[#F5CA53]/20 text-[10px] px-2 py-0.5 rounded-full font-mono">{pendingClient.length}</span>
                                </div>
                                <div className="p-4 overflow-y-auto flex-1 space-y-4 custom-scrollbar">
                                    {isLoading ? <><SkeletonCard/></> : pendingClient.length === 0 ? (
                                        <p className="text-xs text-zinc-600 text-center mt-10">No pending quotes</p>
                                    ) : pendingClient.map(renderPendingCard)}
                                </div>
                            </div>

                            {/* Column 3: Active Workshop */}
                            <div className="w-[300px] lg:flex-1 flex flex-col bg-[#121316] rounded-2xl border border-zinc-800/60 shrink-0">
                                <div className="p-4 border-b border-zinc-800/60 bg-[#16171B] rounded-t-2xl flex items-center justify-between">
                                    <h3 className="text-xs font-black uppercase tracking-widest text-white">Active Workshop</h3>
                                    <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] px-2 py-0.5 rounded-full font-mono">{activeWorkshop.length}</span>
                                </div>
                                <div className="p-4 overflow-y-auto flex-1 space-y-4 custom-scrollbar">
                                    {isLoading ? <><SkeletonCard/></> : activeWorkshop.length === 0 ? (
                                        <p className="text-xs text-zinc-600 text-center mt-10">No active orders</p>
                                    ) : activeWorkshop.map(o => renderOrderCard(o, true))}
                                </div>
                            </div>

                            {/* Column 4: Completed */}
                            <div className="w-[300px] lg:flex-1 flex flex-col bg-[#121316] rounded-2xl border border-zinc-800/60 shrink-0">
                                <div className="p-4 border-b border-zinc-800/60 bg-[#16171B] rounded-t-2xl flex items-center justify-between">
                                    <h3 className="text-xs font-black uppercase tracking-widest text-zinc-500">Completed</h3>
                                    <span className="bg-zinc-800 text-zinc-500 border border-zinc-700 text-[10px] px-2 py-0.5 rounded-full font-mono">{completedHistory.length}</span>
                                </div>
                                <div className="p-4 overflow-y-auto flex-1 space-y-4 custom-scrollbar">
                                    {isLoading ? <><SkeletonCard/></> : completedHistory.length === 0 ? (
                                        <p className="text-xs text-zinc-600 text-center mt-10">No completed orders</p>
                                    ) : completedHistory.map(o => renderOrderCard(o, false))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* OVERVIEW TAB */}
                {activeTab === "overview" && (
                    <div className="p-6 lg:p-12 overflow-y-auto custom-scrollbar h-full">
                        <div className="max-w-4xl mx-auto space-y-8">
                            <div><h1 className="text-3xl font-extrabold">Dashboard Overview</h1><p className="text-zinc-500 text-xs mt-1">High-level statistics for {shopDisplayName}</p></div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {[
                                    { label: "New Inquiries", value: newInquiries.length, color: "text-white" },
                                    { label: "Pending Quotes", value: pendingClient.length, color: "text-[#F5CA53]" },
                                    { label: "Active Orders", value: activeWorkshop.length, color: "text-emerald-400" },
                                    { label: "Completed", value: completedHistory.length, color: "text-zinc-400" },
                                ].map((stat, i) => (
                                    <div key={i} className="bg-[#121316] border border-zinc-800/60 p-5 rounded-2xl">
                                        <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-2">{stat.label}</p>
                                        <p className={`text-3xl font-black ${stat.color}`}>{stat.value}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
                
                {/* EARNINGS TAB */}
                {activeTab === "earnings" && (
                    <div className="p-6 lg:p-12 overflow-y-auto custom-scrollbar h-full">
                        <div className="max-w-4xl mx-auto space-y-8">
                            <div><h1 className="text-3xl font-extrabold">Earnings & Revenue</h1><p className="text-zinc-500 text-xs mt-1">Financial overview for {shopDisplayName}</p></div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="bg-[#121316] border border-zinc-800/60 p-6 rounded-2xl">
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-2">Total Earned</p>
                                    <p className="text-4xl font-black text-emerald-400">LKR {totalRevenue.toLocaleString()}</p>
                                </div>
                                <div className="bg-[#121316] border border-zinc-800/60 p-6 rounded-2xl">
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-2">Pipeline Value (In Progress)</p>
                                    <p className="text-4xl font-black text-[#F5CA53]">LKR {pipelineValue.toLocaleString()}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
                
                {/* SETTINGS TAB */}
                {activeTab === "settings" && (
                    <div className="p-6 lg:p-12 overflow-y-auto custom-scrollbar h-full">
                        <div className="max-w-2xl mx-auto space-y-8">
                            <div><h1 className="text-3xl font-extrabold">Tailor Settings</h1><p className="text-zinc-500 text-xs mt-1">Manage your professional profile.</p></div>
                            <form className="bg-[#121316] border border-zinc-800/60 rounded-2xl p-6 sm:p-8 space-y-5">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Firebase Email</label>
                                    <div className="w-full bg-[#18191E] border border-zinc-700/60 rounded-xl px-4 py-3 text-sm text-zinc-500 cursor-not-allowed">{user?.email}</div>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Verification</label>
                                    <div className="w-full bg-emerald-500/5 border border-emerald-500/20 rounded-xl px-4 py-3 text-sm text-emerald-400 flex items-center gap-2">
                                        <span className="w-2 h-2 rounded-full bg-emerald-400"/>
                                        {tailorProfile?.is_verified ? "Verified Identity" : "Pending Verification"}
                                    </div>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
