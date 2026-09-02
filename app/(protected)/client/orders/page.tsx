"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/firebase/AuthContext";
import { 
    listClientOrders, 
    listClientRequests,
    acceptBid
} from "@/lib/api/endpoints/orders";
import type { ClothingRequest, Order, ShopRequest } from "@/lib/api/types/order";
import FullPageLock from "@/components/FullPageLock";

type Tab = "pending" | "quotations" | "orders";

export default function ClientOrdersPage() {
    const { user } = useAuth();
    
    const [activeTab, setActiveTab] = useState<Tab>("pending");
    const [isLoading, setIsLoading] = useState(true);
    
    const [clientRequests, setClientRequests] = useState<ClothingRequest[]>([]);
    const [clientOrders, setClientOrders] = useState<Order[]>([]);
    
    const [acceptingQuoteId, setAcceptingQuoteId] = useState<number | null>(null);
    const [actionToast, setActionToast] = useState<{ msg: string; ok: boolean } | null>(null);

    const showToast = (msg: string, ok = true) => {
        setActionToast({ msg, ok });
        setTimeout(() => setActionToast(null), 3000);
    };

    const fetchData = useCallback(async () => {
        if (!user) return;
        setIsLoading(true);
        try {
            const [ordersRes, requestsRes] = await Promise.allSettled([
                listClientOrders(user.uid),
                listClientRequests(user.uid)
            ]);
            
            if (ordersRes.status === "fulfilled") {
                setClientOrders(ordersRes.value || []);
            }
            if (requestsRes.status === "fulfilled") {
                setClientRequests(requestsRes.value || []);
            }
        } catch (err) {
            console.error("Failed to load client data:", err);
            showToast("Failed to load data", false);
        } finally {
            setIsLoading(false);
        }
    }, [user]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleAcceptQuote = async (shopReq: ShopRequest) => {
        if (!shopReq.offered_price) return;
        setAcceptingQuoteId(shopReq.shop_request_id);
        try {
            await acceptBid({
                shop_request_id: shopReq.shop_request_id,
                accepted_price: shopReq.offered_price
            });
            showToast("Quotation accepted! Order created successfully.");
            await fetchData();
            setActiveTab("orders"); // Move to orders tab to see the new order
        } catch (err) {
            console.error("Failed to accept quote:", err);
            showToast("Failed to accept quotation. Please try again.", false);
        } finally {
            setAcceptingQuoteId(null);
        }
    };

    // ── Filter Logic ──
    // Pending requests: Requests that are open and have no shop_requests with "quoted" or "accepted" status.
    const pendingRequests = clientRequests.filter(req => {
        if (req.status !== "open") return false;
        const hasQuotes = req.shop_requests?.some(sr => sr.status === "quoted" || sr.status === "accepted");
        return !hasQuotes;
    });

    // Quotations: Shop requests that are currently quoted (waiting for client to accept or reject).
    // We flatten them out so each card represents a specific quotation from a tailor.
    const quotations: { req: ClothingRequest, shopReq: ShopRequest }[] = [];
    clientRequests.forEach(req => {
        if (req.status !== "open") return;
        req.shop_requests?.forEach(sr => {
            if (sr.status === "quoted") {
                quotations.push({ req, shopReq: sr });
            }
        });
    });

    // Active & Completed Orders
    const activeOrders = clientOrders.filter(o => o.order_status === "in_progress");
    const completedOrders = clientOrders.filter(o => o.order_status === "completed");

    const Skeleton = () => (
        <div className="space-y-4">
            {[1, 2, 3].map(i => (
                <div key={i} className="h-32 bg-cream-bg border border-accent/20 rounded-2xl animate-pulse" />
            ))}
        </div>
    );

    const renderPendingRequest = (req: ClothingRequest) => (
        <div key={req.request_id} className="bg-cream-bg border border-accent/20 rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
                <div className="flex items-center gap-3 mb-1">
                    <span className="text-xs font-mono font-bold text-accent">REQ-{req.request_id}</span>
                    <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-earth-text/10 text-earth-text">
                        {req.request_type}
                    </span>
                    <span className="text-xs font-bold text-earth-text/50">&bull; {new Date(req.created_at).toLocaleDateString()}</span>
                </div>
                <h3 className="text-base font-extrabold text-earth-text font-heading">{req.clothing_category || "Custom Garment"}</h3>
                <p className="text-xs text-earth-text/70 mt-1">
                    {req.target_budget ? `Budget: LKR ${req.target_budget.toLocaleString()}` : "Open Budget"} &bull; {req.gender || "Any"} Fit
                </p>
                {req.description && <p className="text-[11px] text-earth-text/60 italic mt-2 line-clamp-2">"{req.description}"</p>}
            </div>
            <div className="shrink-0 flex items-center justify-center bg-warm-beige border border-accent/20 px-4 py-3 rounded-xl">
                <span className="text-xs font-bold text-earth-text/70">Awaiting Quotations...</span>
            </div>
        </div>
    );

    const renderQuotation = (item: { req: ClothingRequest, shopReq: ShopRequest }) => {
        const { req, shopReq } = item;
        const isAccepting = acceptingQuoteId === shopReq.shop_request_id;
        
        return (
            <div key={shopReq.shop_request_id} className="bg-cream-bg border-2 border-accent/30 rounded-2xl p-6 shadow-md flex flex-col sm:flex-row justify-between items-start gap-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-accent/5 rounded-bl-full -z-10" />
                <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                        <span className="text-[10px] font-mono font-bold text-accent uppercase tracking-widest block">QUOTATION RECEIVED</span>
                        <span className="text-xs font-bold text-earth-text/50">&bull; Ref REQ-{req.request_id}</span>
                    </div>
                    <h3 className="text-lg font-extrabold text-earth-text font-heading">{req.clothing_category || "Custom Garment"}</h3>
                    <p className="text-xs text-earth-text/70 mt-1 mb-4">
                        Tailor Shop ID: #{shopReq.shop_id} &bull; Valid quotation for your request.
                    </p>
                    
                    <div className="bg-warm-beige border border-accent/20 p-3 rounded-xl inline-block">
                        <span className="text-[10px] uppercase font-bold text-earth-text/60 block mb-1">Offered Price</span>
                        <span className="text-xl font-black text-accent font-mono">
                            LKR {shopReq.offered_price?.toLocaleString() || "N/A"}
                        </span>
                    </div>
                </div>
                
                <div className="w-full sm:w-48 shrink-0 space-y-2">
                    <button 
                        onClick={() => handleAcceptQuote(shopReq)}
                        disabled={isAccepting}
                        className="w-full py-3 bg-accent text-white rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-accent-hover transition-colors shadow-sm disabled:opacity-70 flex justify-center items-center gap-2"
                    >
                        {isAccepting ? (
                            <><span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"/> Processing...</>
                        ) : (
                            "Accept & Order"
                        )}
                    </button>
                    <button className="w-full py-2.5 bg-transparent border border-earth-text/20 text-earth-text/70 hover:text-earth-text hover:bg-earth-text/5 rounded-xl text-xs font-bold transition-colors">
                        Decline
                    </button>
                </div>
            </div>
        );
    };

    const renderOrder = (ord: Order, isActive: boolean) => {
        const progress = isActive ? 60 : 100;
        
        return (
            <div key={ord.order_id} className="bg-cream-bg border border-accent/20 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow group">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-5 border-b border-accent/15 pb-4">
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <span className="text-xs font-mono font-bold text-accent">ORD-{ord.order_id}</span>
                            <span className="text-xs font-bold text-earth-text/50">&bull; {new Date(ord.created_at).toLocaleDateString()}</span>
                        </div>
                        <h3 className="text-base font-extrabold text-earth-text font-heading group-hover:text-accent transition-colors">
                            Bespoke Order
                        </h3>
                    </div>
                    <div className="text-right">
                        <span className="text-lg font-black text-earth-text block">LKR {Number(ord.accepted_price).toLocaleString()}</span>
                        <span className={`text-[10px] font-mono font-bold uppercase px-2.5 py-1 rounded-full border inline-block mt-1 ${
                            isActive ? "bg-accent/10 border-accent/30 text-accent" : "bg-earth-text/10 border-earth-text/20 text-earth-text/60"
                        }`}>
                            {(ord.order_status || "").replace(/_/g, " ")}
                        </span>
                    </div>
                </div>

                <div className="space-y-2">
                    <div className="flex justify-between text-[11px] font-bold text-earth-text/70">
                        <span>{isActive ? "Fitting Progress" : "Completed"}</span>
                        <span className={isActive ? "text-accent font-black" : "text-earth-text font-black"}>{progress}%</span>
                    </div>
                    <div className="w-full h-2.5 bg-warm-beige border border-accent/20 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full transition-all ${isActive ? "bg-accent" : "bg-earth-text/40"}`} style={{ width: `${progress}%` }} />
                    </div>
                </div>
            </div>
        );
    };

    return (
        <main className="max-w-7xl w-full mx-auto px-4 sm:px-8 py-8 flex-1 space-y-8 bg-warm-beige min-h-screen text-earth-text selection:bg-accent selection:text-cream-bg">
            {actionToast && (
                <div className={`fixed top-6 right-6 z-50 text-white text-xs font-bold px-5 py-3 rounded-xl shadow-2xl flex items-center gap-2 ${actionToast.ok ? "bg-emerald-600" : "bg-red-600"}`}>
                    {actionToast.msg}
                </div>
            )}
            
            <div>
                <span className="text-[10px] font-mono tracking-[0.25em] text-earth-text/60 uppercase block mb-1 font-bold">
                    ORDER MANAGEMENT
                </span>
                <h1 className="text-3xl sm:text-4xl font-extrabold text-earth-text tracking-tight font-heading">My Commissions</h1>
            </div>

            {/* Custom Tabs */}
            <div className="flex items-center gap-2 border-b border-accent/20 pb-0 overflow-x-auto">
                {[
                    { id: "pending", label: "Pending Requests", count: pendingRequests.length },
                    { id: "quotations", label: "Quotations", count: quotations.length },
                    { id: "orders", label: "Active Orders", count: activeOrders.length }
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as Tab)}
                        className={`flex items-center gap-2 px-5 py-3 text-xs font-bold uppercase tracking-wider transition-all border-b-2 whitespace-nowrap ${
                            activeTab === tab.id 
                            ? "border-accent text-accent" 
                            : "border-transparent text-earth-text/50 hover:text-earth-text hover:border-earth-text/20"
                        }`}
                    >
                        {tab.label}
                        {tab.count > 0 && (
                            <span className={`px-2 py-0.5 rounded-full text-[10px] ${
                                activeTab === tab.id ? "bg-accent/10 text-accent" : "bg-earth-text/10 text-earth-text/70"
                            }`}>
                                {tab.count}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {/* Tab Contents */}
            <div className="min-h-[400px]">
                {isLoading ? (
                    <Skeleton />
                ) : (
                    <>
                        {/* PENDING TAB */}
                        {activeTab === "pending" && (
                            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                {pendingRequests.length === 0 ? (
                                    <div className="bg-cream-bg border border-accent/20 rounded-2xl p-12 text-center shadow-sm">
                                        <h3 className="text-base font-bold text-earth-text font-heading mb-2">No pending requests</h3>
                                        <p className="text-xs text-earth-text/60">Any requests you make that haven't received a quotation yet will appear here.</p>
                                    </div>
                                ) : (
                                    pendingRequests.map(renderPendingRequest)
                                )}
                            </div>
                        )}

                        {/* QUOTATIONS TAB */}
                        {activeTab === "quotations" && (
                            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                {quotations.length === 0 ? (
                                    <div className="bg-cream-bg border border-accent/20 rounded-2xl p-12 text-center shadow-sm">
                                        <h3 className="text-base font-bold text-earth-text font-heading mb-2">No quotations yet</h3>
                                        <p className="text-xs text-earth-text/60">When tailors respond to your requests with a price, they will appear here for your approval.</p>
                                    </div>
                                ) : (
                                    quotations.map(renderQuotation)
                                )}
                            </div>
                        )}

                        {/* ORDERS TAB */}
                        {activeTab === "orders" && (
                            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                <div>
                                    <h3 className="text-xs font-mono font-bold text-earth-text/60 uppercase tracking-widest mb-4">In Progress</h3>
                                    {activeOrders.length === 0 ? (
                                        <div className="bg-cream-bg border border-accent/20 rounded-2xl p-8 text-center text-xs text-earth-text/60 shadow-sm">
                                            No active orders right now.
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            {activeOrders.map(o => renderOrder(o, true))}
                                        </div>
                                    )}
                                </div>
                                
                                {completedOrders.length > 0 && (
                                    <div>
                                        <h3 className="text-xs font-mono font-bold text-earth-text/60 uppercase tracking-widest mb-4">Completed</h3>
                                        <div className="space-y-4">
                                            {completedOrders.map(o => renderOrder(o, false))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </>
                )}
            </div>
            <FullPageLock
                isSubmitting={acceptingQuoteId !== null}
                badgeText="ORDER CONFIRMATION"
                title="Accepting Quotation"
                message="Converting quotation into an active commission order..."
            />
        </main>
    );
}
