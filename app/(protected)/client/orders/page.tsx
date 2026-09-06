"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/firebase/AuthContext";
import {
    listClientOrders,
    listClientRequests,
    acceptBid,
    rejectQuote,
    cancelRequest,
} from "@/lib/api/endpoints/orders";
import { listShops } from "@/lib/api/endpoints/shops";
import type {
    ClothingRequest,
    Order,
    ShopRequest,
} from "@/lib/api/types/order";
import FullPageLock from "@/components/FullPageLock";

type Tab = "pending" | "quotations" | "orders";

type SelectedCard =
    | { kind: "request"; request: ClothingRequest }
    | { kind: "quotation"; request: ClothingRequest; shopRequest: ShopRequest }
    | { kind: "order"; order: Order };

export default function ClientOrdersPage() {
    const { user } = useAuth();

    const [activeTab, setActiveTab] = useState<Tab>("pending");
    const [isLoading, setIsLoading] = useState(true);

    const [clientRequests, setClientRequests] = useState<ClothingRequest[]>([]);
    const [clientOrders, setClientOrders] = useState<Order[]>([]);
    const [shopNames, setShopNames] = useState<Record<number, string>>({});
    const [selectedCard, setSelectedCard] = useState<SelectedCard | null>(null);

    const [acceptingQuoteId, setAcceptingQuoteId] = useState<number | null>(
        null,
    );
    const [decliningQuoteId, setDecliningQuoteId] = useState<number | null>(
        null,
    );
    const [cancellingRequestId, setCancellingRequestId] = useState<
        number | null
    >(null);
    const [actionToast, setActionToast] = useState<{
        msg: string;
        ok: boolean;
    } | null>(null);

    const showToast = (msg: string, ok = true) => {
        setActionToast({ msg, ok });
        setTimeout(() => setActionToast(null), 3000);
    };

    const fetchData = useCallback(async () => {
        if (!user) return;
        setIsLoading(true);
        try {
            const [ordersRes, requestsRes, shopsRes] = await Promise.allSettled(
                [
                    listClientOrders(user.uid),
                    listClientRequests(user.uid),
                    listShops(),
                ],
            );

            if (ordersRes.status === "fulfilled") {
                setClientOrders(ordersRes.value || []);
            } else {
                console.error(
                    "Failed to load client orders:",
                    ordersRes.reason,
                );
                showToast("Failed to load orders", false);
            }
            if (requestsRes.status === "fulfilled") {
                setClientRequests(requestsRes.value || []);
            } else {
                console.error(
                    "Failed to load client requests:",
                    requestsRes.reason,
                );
                showToast("Failed to load requests", false);
            }
            if (shopsRes.status === "fulfilled") {
                setShopNames(
                    Object.fromEntries(
                        shopsRes.value.map((shop) => [
                            shop.shop_id,
                            shop.shop_name,
                        ]),
                    ),
                );
            } else {
                console.error("Failed to load shop names:", shopsRes.reason);
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
                accepted_price: shopReq.offered_price,
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

    const handleDeclineQuote = async (shopReq: ShopRequest) => {
        setDecliningQuoteId(shopReq.shop_request_id);
        try {
            await rejectQuote(shopReq.shop_request_id);
            showToast("Quotation declined.");
            await fetchData();
        } catch (err) {
            console.error("Failed to decline quote:", err);
            showToast("Failed to decline quotation. Please try again.", false);
        } finally {
            setDecliningQuoteId(null);
        }
    };

    const handleCancelRequest = async (request: ClothingRequest) => {
        if (
            !window.confirm(
                "Cancel this request? Any quotations for it will no longer be available.",
            )
        ) {
            return;
        }

        setCancellingRequestId(request.request_id);
        try {
            await cancelRequest(request.request_id);
            setSelectedCard(null);
            showToast("Request cancelled.");
            await fetchData();
        } catch (err) {
            console.error("Failed to cancel request:", err);
            showToast("Failed to cancel request. Please try again.", false);
        } finally {
            setCancellingRequestId(null);
        }
    };

    // ── Filter Logic ──
    // Pending requests: Requests that are open and have no shop_requests with "quoted" or "accepted" status.
    const pendingRequests = clientRequests.filter((req) => {
        if (req.status !== "open") return false;
        const hasQuotes = req.shop_requests?.some(
            (sr) => sr.status === "quoted" || sr.status === "accepted",
        );
        return !hasQuotes;
    });

    // Quotations: Shop requests that are currently quoted or rejected.
    // We flatten them out so each card represents a specific quotation from a tailor.
    const quotations: { req: ClothingRequest; shopReq: ShopRequest }[] = [];
    clientRequests.forEach((req) => {
        if (req.status !== "open") return;
        req.shop_requests?.forEach((sr) => {
            if (sr.status === "quoted" || sr.status === "rejected") {
                quotations.push({ req, shopReq: sr });
            }
        });
    });

    // Active & Completed Orders
    const activeOrders = clientOrders.filter(
        (o) => o.order_status === "in_progress",
    );
    const completedOrders = clientOrders.filter(
        (o) => o.order_status === "completed",
    );

    const Skeleton = () => (
        <div className="space-y-4">
            {[1, 2, 3].map((i) => (
                <div
                    key={i}
                    className="h-32 bg-cream-bg border border-accent/20 rounded-2xl animate-pulse"
                />
            ))}
        </div>
    );

    const renderPendingRequest = (req: ClothingRequest) => (
        <div
            key={req.request_id}
            role="button"
            tabIndex={0}
            onClick={() => setSelectedCard({ kind: "request", request: req })}
            onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    setSelectedCard({ kind: "request", request: req });
                }
            }}
            className="bg-cream-bg border border-accent/20 rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
        >
            <div>
                <div className="flex items-center gap-3 mb-1">
                    <span className="text-xs font-mono font-bold text-accent">
                        REQ-{req.request_id}
                    </span>
                    <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-earth-text/10 text-earth-text">
                        {req.request_type}
                    </span>
                    <span className="text-xs font-bold text-earth-text/50">
                        &bull; {new Date(req.created_at).toLocaleDateString()}
                    </span>
                </div>
                <h3 className="text-base font-extrabold text-earth-text font-heading">
                    {req.clothing_category || "Custom Garment"}
                </h3>
                <p className="text-xs text-earth-text/70 mt-1">
                    {req.target_budget
                        ? `Budget: LKR ${req.target_budget.toLocaleString()}`
                        : "Open Budget"}{" "}
                    &bull; {req.gender || "Any"} Fit
                </p>
                {req.description && (
                    <p className="text-[11px] text-earth-text/60 italic mt-2 line-clamp-2">
                        "{req.description}"
                    </p>
                )}
            </div>
            <div className="w-full shrink-0 space-y-2 sm:w-auto">
                <div className="flex items-center justify-center bg-warm-beige border border-accent/20 px-4 py-3 rounded-xl">
                    <span className="text-xs font-bold text-earth-text/70 text-right">
                        <span className="block">
                            {req.target_budget
                                ? `Requested: LKR ${Number(req.target_budget).toLocaleString()}`
                                : "Open Budget"}
                        </span>
                        <span className="block mt-1">Awaiting Quotations...</span>
                    </span>
                </div>
                <button
                    type="button"
                    onClick={(event) => {
                        event.stopPropagation();
                        void handleCancelRequest(req);
                    }}
                    disabled={cancellingRequestId === req.request_id}
                    className="w-full rounded-xl border border-red-600/30 px-4 py-2.5 text-xs font-bold text-red-700 transition-colors hover:bg-red-600/10 disabled:opacity-50"
                >
                    {cancellingRequestId === req.request_id
                        ? "Cancelling..."
                        : "Cancel Request"}
                </button>
            </div>
        </div>
    );

    const renderQuotation = (item: {
        req: ClothingRequest;
        shopReq: ShopRequest;
    }) => {
        const { req, shopReq } = item;
        const isAccepting = acceptingQuoteId === shopReq.shop_request_id;
        const isDeclining = decliningQuoteId === shopReq.shop_request_id;
        const isCancelling = cancellingRequestId === req.request_id;
        const isRejected = shopReq.status === "rejected";

        const shopBids =
            req.bids
                ?.filter((b) => b.shop_request_id === shopReq.shop_request_id)
                .sort((a, b) => (b.bid_id || 0) - (a.bid_id || 0)) || [];

        return (
            <div
                key={shopReq.shop_request_id}
                role="button"
                tabIndex={0}
                onClick={() =>
                    setSelectedCard({
                        kind: "quotation",
                        request: req,
                        shopRequest: shopReq,
                    })
                }
                onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        setSelectedCard({
                            kind: "quotation",
                            request: req,
                            shopRequest: shopReq,
                        });
                    }
                }}
                className={`bg-cream-bg border-2 border-accent/30 rounded-2xl p-6 shadow-md flex flex-col sm:flex-row justify-between items-start gap-6 relative overflow-hidden transition-all ${isRejected ? "opacity-60 grayscale-[0.3]" : ""}`}
            >
                <div className="absolute top-0 right-0 w-32 h-32 bg-accent/5 rounded-bl-full -z-10" />
                <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                        {isRejected ? (
                            <span className="text-[10px] font-mono font-bold text-red-600/80 uppercase tracking-widest block bg-red-600/10 px-2 py-0.5 rounded">
                                DECLINED BY YOU
                            </span>
                        ) : (
                            <span className="text-[10px] font-mono font-bold text-accent uppercase tracking-widest block">
                                QUOTATION RECEIVED
                            </span>
                        )}
                        <span className="text-xs font-bold text-earth-text/50">
                            &bull; Ref REQ-{req.request_id}
                        </span>
                    </div>
                    <h3 className="text-lg font-extrabold text-earth-text font-heading">
                        {req.clothing_category || "Custom Garment"}
                    </h3>
                    <p className="text-xs text-earth-text/70 mt-1 mb-4">
                        From:{" "}
                        {shopNames[shopReq.shop_id] ||
                            `Tailor Shop #${shopReq.shop_id}`}{" "}
                        &bull; Valid quotation for your request.
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                        <div className="bg-warm-beige border border-accent/20 p-3 rounded-xl">
                            <span className="text-[10px] uppercase font-bold text-earth-text/60 block mb-1">
                                Initial Requested Budget
                            </span>
                            <span className="text-lg font-black text-earth-text font-mono">
                                {req.target_budget
                                    ? `LKR ${Number(req.target_budget).toLocaleString()}`
                                    : "Open Budget"}
                            </span>
                        </div>
                        <div className="bg-warm-beige border border-accent/20 p-3 rounded-xl">
                            <span className="text-[10px] uppercase font-bold text-earth-text/60 block mb-1">
                                Current Quotation
                            </span>
                            <span className="text-lg font-black text-accent font-mono">
                                {shopReq.offered_price
                                    ? `LKR ${Number(shopReq.offered_price).toLocaleString()}`
                                    : "N/A"}
                            </span>
                        </div>
                    </div>

                    {shopBids.length > 0 && (
                        <div>
                            <h4 className="text-[9px] font-mono font-bold uppercase text-earth-text/50 mb-2">
                                Bid History
                            </h4>
                            <div className="space-y-2 pl-2 border-l-2 border-accent/10">
                                {shopBids.map((b, i) => (
                                    <div
                                        key={b.bid_id || i}
                                        className={`text-xs ${i === 0 ? "text-earth-text font-bold" : "text-earth-text/60"}`}
                                    >
                                        <div className="flex items-center gap-2">
                                            <span className="w-1.5 h-1.5 rounded-full bg-accent/40 -ml-2.75" />
                                            <span className="font-mono">
                                                LKR{" "}
                                                {Number(
                                                    b.bid_amount,
                                                ).toLocaleString()}
                                            </span>
                                            <span className="text-[9px] font-mono opacity-70">
                                                (
                                                {b.created_at
                                                    ? new Date(
                                                          b.created_at,
                                                      ).toLocaleDateString()
                                                    : "Just now"}
                                                )
                                            </span>
                                        </div>
                                        {b.message && (
                                            <p className="ml-3.5 mt-0.5 italic opacity-80 line-clamp-1">
                                                "{b.message}"
                                            </p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <div className="w-full sm:w-48 shrink-0 space-y-2">
                    <button
                        onClick={(event) => {
                            event.stopPropagation();
                            void handleAcceptQuote(shopReq);
                        }}
                        disabled={
                            isAccepting || isDeclining || isCancelling || isRejected
                        }
                        className="w-full py-3 bg-accent text-white rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-accent-hover transition-colors shadow-sm disabled:opacity-50 flex justify-center items-center gap-2"
                    >
                        {isAccepting ? (
                            <>
                                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />{" "}
                                Processing...
                            </>
                        ) : isRejected ? (
                            "Declined"
                        ) : (
                            "Accept & Order"
                        )}
                    </button>
                    {!isRejected && (
                        <button
                            onClick={(event) => {
                                event.stopPropagation();
                                void handleDeclineQuote(shopReq);
                            }}
                            disabled={isDeclining || isAccepting || isCancelling}
                            className="w-full py-2.5 bg-transparent border border-earth-text/20 text-earth-text/70 hover:text-earth-text hover:bg-earth-text/5 rounded-xl text-xs font-bold transition-colors disabled:opacity-50"
                        >
                            {isDeclining ? "Declining..." : "Decline"}
                        </button>
                    )}
                    <button
                        type="button"
                        onClick={(event) => {
                            event.stopPropagation();
                            void handleCancelRequest(req);
                        }}
                        disabled={isAccepting || isDeclining || isCancelling}
                        className="w-full rounded-xl border border-red-600/30 py-2.5 text-xs font-bold text-red-700 transition-colors hover:bg-red-600/10 disabled:opacity-50"
                    >
                        {isCancelling ? "Cancelling..." : "Cancel Request"}
                    </button>
                </div>
            </div>
        );
    };

    const renderOrder = (ord: Order, isActive: boolean) => {
        const progress = isActive ? 60 : 100;

        return (
            <div
                key={ord.order_id}
                role="button"
                tabIndex={0}
                onClick={() => setSelectedCard({ kind: "order", order: ord })}
                onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        setSelectedCard({ kind: "order", order: ord });
                    }
                }}
                className="bg-cream-bg border border-accent/20 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow group"
            >
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-5 border-b border-accent/15 pb-4">
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <span className="text-xs font-mono font-bold text-accent">
                                ORD-{ord.order_id}
                            </span>
                            <span className="text-xs font-bold text-earth-text/50">
                                &bull;{" "}
                                {new Date(ord.created_at).toLocaleDateString()}
                            </span>
                        </div>
                        <h3 className="text-base font-extrabold text-earth-text font-heading group-hover:text-accent transition-colors">
                            Bespoke Order
                        </h3>
                    </div>
                    <div className="text-right">
                        <span className="text-lg font-black text-earth-text block">
                            LKR {Number(ord.accepted_price).toLocaleString()}
                        </span>
                        <span
                            className={`text-[10px] font-mono font-bold uppercase px-2.5 py-1 rounded-full border inline-block mt-1 ${
                                isActive
                                    ? "bg-accent/10 border-accent/30 text-accent"
                                    : "bg-earth-text/10 border-earth-text/20 text-earth-text/60"
                            }`}
                        >
                            {(ord.order_status || "").replace(/_/g, " ")}
                        </span>
                    </div>
                </div>

                <div className="space-y-2">
                    {ord.clothing_request?.target_budget !== null &&
                        ord.clothing_request?.target_budget !== undefined && (
                            <div className="flex justify-between text-xs font-bold text-earth-text/70">
                                <span>Initial Requested Budget</span>
                                <span className="font-mono">
                                    LKR{" "}
                                    {Number(
                                        ord.clothing_request.target_budget,
                                    ).toLocaleString()}
                                </span>
                            </div>
                        )}
                    {ord.clothing_request?.bids &&
                        ord.clothing_request.bids.length > 0 && (
                            <div className="rounded-xl border border-accent/20 bg-warm-beige p-3 space-y-2">
                                <span className="text-[10px] uppercase font-bold tracking-wider text-earth-text/60">
                                    Quotation History
                                </span>
                                {ord.clothing_request.bids
                                    .slice()
                                    .sort(
                                        (a, b) =>
                                            (b.bid_id || 0) - (a.bid_id || 0),
                                    )
                                    .map((bid, index) => (
                                        <div
                                            key={bid.bid_id || index}
                                            className="flex items-center justify-between gap-3 text-xs"
                                        >
                                            <span className="font-mono font-bold text-accent">
                                                LKR{" "}
                                                {Number(
                                                    bid.bid_amount,
                                                ).toLocaleString()}
                                            </span>
                                            <span className="text-earth-text/60">
                                                {bid.message ||
                                                    "Quotation submitted"}
                                            </span>
                                        </div>
                                    ))}
                            </div>
                        )}
                    <div className="flex justify-between text-[11px] font-bold text-earth-text/70">
                        <span>
                            {isActive ? "Fitting Progress" : "Completed"}
                        </span>
                        <span
                            className={
                                isActive
                                    ? "text-accent font-black"
                                    : "text-earth-text font-black"
                            }
                        >
                            {progress}%
                        </span>
                    </div>
                    <div className="w-full h-2.5 bg-warm-beige border border-accent/20 rounded-full overflow-hidden">
                        <div
                            className={`h-full rounded-full transition-all ${isActive ? "bg-accent" : "bg-earth-text/40"}`}
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                </div>
            </div>
        );
    };

    return (
        <main className="max-w-7xl w-full mx-auto px-4 sm:px-8 py-8 flex-1 space-y-8 bg-warm-beige min-h-screen text-earth-text selection:bg-accent selection:text-cream-bg">
            {actionToast && (
                <div
                    className={`fixed top-6 right-6 z-50 text-white text-xs font-bold px-5 py-3 rounded-xl shadow-2xl flex items-center gap-2 ${actionToast.ok ? "bg-emerald-600" : "bg-red-600"}`}
                >
                    {actionToast.msg}
                </div>
            )}

            <div>
                <span className="text-[10px] font-mono tracking-[0.25em] text-earth-text/60 uppercase block mb-1 font-bold">
                    ORDER MANAGEMENT
                </span>
                <h1 className="text-3xl sm:text-4xl font-extrabold text-earth-text tracking-tight font-heading">
                    My Orders
                </h1>
            </div>

            {/* Custom Tabs */}
            <div className="flex items-center gap-2 border-b border-accent/20 pb-0 overflow-x-auto">
                {[
                    {
                        id: "pending",
                        label: "Pending Requests",
                        count: pendingRequests.length,
                    },
                    {
                        id: "quotations",
                        label: "Quotations",
                        count: quotations.length,
                    },
                    {
                        id: "orders",
                        label: "Active Orders",
                        count: activeOrders.length,
                    },
                ].map((tab) => (
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
                            <span
                                className={`px-2 py-0.5 rounded-full text-[10px] ${
                                    activeTab === tab.id
                                        ? "bg-accent/10 text-accent"
                                        : "bg-earth-text/10 text-earth-text/70"
                                }`}
                            >
                                {tab.count}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {/* Tab Contents */}
            <div className="min-h-100">
                {isLoading ? (
                    <Skeleton />
                ) : (
                    <>
                        {/* PENDING TAB */}
                        {activeTab === "pending" && (
                            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                {pendingRequests.length === 0 ? (
                                    <div className="bg-cream-bg border border-accent/20 rounded-2xl p-12 text-center shadow-sm">
                                        <h3 className="text-base font-bold text-earth-text font-heading mb-2">
                                            No pending requests
                                        </h3>
                                        <p className="text-xs text-earth-text/60">
                                            Any requests you make that haven't
                                            received a quotation yet will appear
                                            here.
                                        </p>
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
                                        <h3 className="text-base font-bold text-earth-text font-heading mb-2">
                                            No quotations yet
                                        </h3>
                                        <p className="text-xs text-earth-text/60">
                                            When tailors respond to your
                                            requests with a price, they will
                                            appear here for your approval.
                                        </p>
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
                                    <h3 className="text-xs font-mono font-bold text-earth-text/60 uppercase tracking-widest mb-4">
                                        In Progress
                                    </h3>
                                    {activeOrders.length === 0 ? (
                                        <div className="bg-cream-bg border border-accent/20 rounded-2xl p-8 text-center text-xs text-earth-text/60 shadow-sm">
                                            No active orders right now.
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            {activeOrders.map((o) =>
                                                renderOrder(o, true),
                                            )}
                                        </div>
                                    )}
                                </div>

                                {completedOrders.length > 0 && (
                                    <div>
                                        <h3 className="text-xs font-mono font-bold text-earth-text/60 uppercase tracking-widest mb-4">
                                            Completed
                                        </h3>
                                        <div className="space-y-4">
                                            {completedOrders.map((o) =>
                                                renderOrder(o, false),
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </>
                )}
            </div>
            {selectedCard && (
                <div
                    className="fixed inset-0 z-9999 flex items-center justify-center bg-earth-text/60 p-4 backdrop-blur-md"
                    onClick={() => setSelectedCard(null)}
                >
                    <div
                        className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl border border-accent/30 bg-cream-bg text-earth-text shadow-2xl"
                        onClick={(event) => event.stopPropagation()}
                    >
                        <div className="flex items-center justify-between border-b border-accent/20 bg-warm-beige p-5">
                            <div>
                                <span className="block text-[10px] font-mono font-bold uppercase tracking-widest text-accent">
                                    {selectedCard.kind === "request"
                                        ? "Pending Request"
                                        : selectedCard.kind === "quotation"
                                          ? "Quotation Details"
                                          : "Order Details"}
                                </span>
                                <h2 className="mt-1 text-lg font-extrabold font-heading">
                                    {selectedCard.kind === "order"
                                        ? `Order #${selectedCard.order.order_id}`
                                        : selectedCard.request
                                              .clothing_category ||
                                          "Custom Garment"}
                                </h2>
                            </div>
                            <button
                                type="button"
                                aria-label="Close details"
                                onClick={() => setSelectedCard(null)}
                                className="flex h-8 w-8 items-center justify-center rounded-full border border-accent/20 bg-cream-bg text-earth-text/60 transition hover:border-accent hover:text-earth-text"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="space-y-5 overflow-y-auto p-6">
                            {(() => {
                                const request =
                                    selectedCard.kind === "order"
                                        ? selectedCard.order.clothing_request
                                        : selectedCard.request;
                                const selectedShopRequest =
                                    selectedCard.kind === "quotation"
                                        ? selectedCard.shopRequest
                                        : undefined;
                                const bids =
                                    request?.bids
                                        ?.filter(
                                            (bid) =>
                                                !selectedShopRequest ||
                                                bid.shop_request_id ===
                                                    selectedShopRequest.shop_request_id,
                                        )
                                        .slice()
                                        .sort(
                                            (a, b) =>
                                                (b.bid_id || 0) -
                                                (a.bid_id || 0),
                                        ) || [];
                                const displayedBids =
                                    bids.length > 0
                                        ? bids
                                        : selectedShopRequest?.offered_price
                                          ? [
                                                {
                                                    bid_id: null,
                                                    shop_request_id:
                                                        selectedShopRequest.shop_request_id,
                                                    bid_amount:
                                                        selectedShopRequest.offered_price,
                                                    message:
                                                        "Current quotation",
                                                    created_at: null,
                                                },
                                            ]
                                          : [];
                                const requestedBudget = request?.target_budget;
                                const currentPrice =
                                    selectedCard.kind === "order"
                                        ? selectedCard.order.accepted_price
                                        : selectedShopRequest?.offered_price;
                                const measurementEntries = request?.measurement
                                    ? Object.entries(
                                          request.measurement,
                                      ).filter(
                                          ([key, value]) =>
                                              key !== "notes" &&
                                              value !== null &&
                                              value !== undefined &&
                                              value !== "",
                                      )
                                    : [];

                                return (
                                    <>
                                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                            <div className="rounded-xl border border-accent/20 bg-warm-beige p-4">
                                                <span className="block text-[10px] font-bold uppercase tracking-wider text-earth-text/60">
                                                    Initial Requested Price
                                                </span>
                                                <span className="mt-1 block font-mono text-lg font-black">
                                                    {requestedBudget
                                                        ? `LKR ${Number(requestedBudget).toLocaleString()}`
                                                        : "Open Budget"}
                                                </span>
                                            </div>
                                            <div className="rounded-xl border border-accent/20 bg-warm-beige p-4">
                                                <span className="block text-[10px] font-bold uppercase tracking-wider text-earth-text/60">
                                                    {selectedCard.kind ===
                                                    "order"
                                                        ? "Accepted Price"
                                                        : "Current Price"}
                                                </span>
                                                <span className="mt-1 block font-mono text-lg font-black text-accent">
                                                    {currentPrice
                                                        ? `LKR ${Number(currentPrice).toLocaleString()}`
                                                        : "No quotation yet"}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-3 text-xs text-earth-text/75">
                                            <div>
                                                <span className="block text-[10px] font-bold uppercase tracking-wider text-earth-text/50">
                                                    Request
                                                </span>
                                                REQ-{request?.request_id ?? "-"}
                                            </div>
                                            <div>
                                                <span className="block text-[10px] font-bold uppercase tracking-wider text-earth-text/50">
                                                    Status
                                                </span>
                                                {request?.status?.replace(
                                                    /_/g,
                                                    " ",
                                                ) ??
                                                    (selectedCard.kind ===
                                                    "order"
                                                        ? selectedCard.order.order_status.replace(
                                                              /_/g,
                                                              " ",
                                                          )
                                                        : "-")}
                                            </div>
                                            <div>
                                                <span className="block text-[10px] font-bold uppercase tracking-wider text-earth-text/50">
                                                    Service
                                                </span>
                                                {request?.service_type?.replace(
                                                    /_/g,
                                                    " ",
                                                ) || "-"}
                                            </div>
                                            <div>
                                                <span className="block text-[10px] font-bold uppercase tracking-wider text-earth-text/50">
                                                    Location
                                                </span>
                                                {request?.request_location ||
                                                    "Not specified"}
                                            </div>
                                        </div>

                                        {request?.description && (
                                            <div className="rounded-xl border border-accent/20 bg-warm-beige p-4 text-sm leading-relaxed text-earth-text/80">
                                                {request.description}
                                            </div>
                                        )}

                                        {selectedCard.kind === "request" &&
                                            ((request?.design_images?.length ??
                                                0) > 0 ||
                                                request?.voice_note_url) && (
                                                <div>
                                                    <h3 className="mb-3 text-[10px] font-mono font-bold uppercase tracking-widest text-accent">
                                                        Attachments
                                                    </h3>
                                                    {(request?.design_images
                                                        ?.length ?? 0) > 0 && (
                                                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                                                            {request?.design_images?.map(
                                                                (
                                                                    image,
                                                                    index,
                                                                ) => (
                                                                    <a
                                                                        key={`${image.image_url}-${index}`}
                                                                        href={
                                                                            image.image_url
                                                                        }
                                                                        target="_blank"
                                                                        rel="noreferrer"
                                                                        className="group aspect-square overflow-hidden rounded-xl border border-accent/20 bg-warm-beige"
                                                                    >
                                                                        <img
                                                                            src={
                                                                                image.image_url
                                                                            }
                                                                            alt={`Request inspiration ${index + 1}`}
                                                                            loading="lazy"
                                                                            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                                                                        />
                                                                    </a>
                                                                ),
                                                            )}
                                                        </div>
                                                    )}
                                                    {request?.voice_note_url && (
                                                        <div className="mt-3 rounded-xl border border-accent/20 bg-warm-beige p-4">
                                                            <span className="mb-2 block text-[10px] font-bold uppercase tracking-wider text-earth-text/60">
                                                                Voice Note
                                                            </span>
                                                            <audio
                                                                controls
                                                                preload="metadata"
                                                                src={
                                                                    request.voice_note_url
                                                                }
                                                                className="h-10 w-full"
                                                            >
                                                                Your browser
                                                                does not support
                                                                audio playback.
                                                            </audio>
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                        {(measurementEntries.length > 0 ||
                                            request?.measurement?.notes) && (
                                            <div>
                                                <h3 className="mb-3 text-[10px] font-mono font-bold uppercase tracking-widest text-accent">
                                                    Measurements Sent
                                                </h3>
                                                {measurementEntries.length >
                                                    0 && (
                                                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                                                        {measurementEntries.map(
                                                            ([key, value]) => (
                                                                <div
                                                                    key={key}
                                                                    className="rounded-xl border border-accent/20 bg-warm-beige p-3"
                                                                >
                                                                    <span className="block text-[10px] font-bold capitalize text-earth-text/50">
                                                                        {key.replace(
                                                                            /_/g,
                                                                            " ",
                                                                        )}
                                                                    </span>
                                                                    <span className="mt-1 block font-mono text-sm font-black text-earth-text">
                                                                        {String(
                                                                            value,
                                                                        )}
                                                                    </span>
                                                                </div>
                                                            ),
                                                        )}
                                                    </div>
                                                )}
                                                {request?.measurement
                                                    ?.notes && (
                                                    <p className="mt-3 rounded-xl border border-accent/20 bg-warm-beige p-3 text-xs leading-relaxed text-earth-text/75">
                                                        <span className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-earth-text/50">
                                                            Measurement Notes
                                                        </span>
                                                        {
                                                            request.measurement
                                                                .notes
                                                        }
                                                    </p>
                                                )}
                                            </div>
                                        )}

                                        <div>
                                            <h3 className="mb-3 text-[10px] font-mono font-bold uppercase tracking-widest text-accent">
                                                Bid Chain
                                            </h3>
                                            {displayedBids.length > 0 ? (
                                                <div className="space-y-3 border-l-2 border-accent/20 pl-4">
                                                    {displayedBids.map(
                                                        (bid, index) => (
                                                            <div
                                                                key={
                                                                    bid.bid_id ||
                                                                    index
                                                                }
                                                                className="rounded-xl border border-accent/20 bg-warm-beige p-3"
                                                            >
                                                                <div className="flex items-center justify-between gap-3">
                                                                    <span className="font-mono text-sm font-black text-accent">
                                                                        LKR{" "}
                                                                        {Number(
                                                                            bid.bid_amount,
                                                                        ).toLocaleString()}
                                                                    </span>
                                                                    <span className="text-[10px] text-earth-text/50">
                                                                        {bid.created_at
                                                                            ? new Date(
                                                                                  bid.created_at,
                                                                              ).toLocaleDateString()
                                                                            : "Recent"}
                                                                    </span>
                                                                </div>
                                                                <p className="mt-1 text-xs text-earth-text/75">
                                                                    {bid.message ||
                                                                        "Quotation submitted."}
                                                                </p>
                                                            </div>
                                                        ),
                                                    )}
                                                </div>
                                            ) : (
                                                <p className="rounded-xl border border-dashed border-accent/30 p-4 text-xs text-earth-text/60">
                                                    No bids or quotations have
                                                    been received yet.
                                                </p>
                                            )}
                                        </div>
                                        {selectedCard.kind !== "order" && (
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    void handleCancelRequest(
                                                        selectedCard.request,
                                                    )
                                                }
                                                disabled={
                                                    cancellingRequestId ===
                                                    selectedCard.request
                                                        .request_id
                                                }
                                                className="w-full rounded-xl border border-red-600/30 px-4 py-3 text-xs font-bold text-red-700 transition-colors hover:bg-red-600/10 disabled:opacity-50"
                                            >
                                                {cancellingRequestId ===
                                                selectedCard.request.request_id
                                                    ? "Cancelling..."
                                                    : "Cancel Request"}
                                            </button>
                                        )}
                                    </>
                                );
                            })()}
                        </div>
                    </div>
                </div>
            )}
            <FullPageLock
                isSubmitting={acceptingQuoteId !== null}
                badgeText="ORDER CONFIRMATION"
                title="Accepting Quotation"
                message="Converting quotation into an active commission order..."
            />
        </main>
    );
}
