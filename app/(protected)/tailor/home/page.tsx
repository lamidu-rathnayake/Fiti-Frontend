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
import {
    getTailorProfile,
    updateTailorProfile,
} from "@/lib/api/endpoints/profiles";
import type {
    ClothingRequest,
    Order,
    ShopRequest,
} from "@/lib/api/types/order";
import type { Shop } from "@/lib/api/types/shop";
import type { TailorProfile } from "@/lib/api/types/profile";
import FullPageLock from "@/components/FullPageLock";

interface RequestView {
    req: ClothingRequest;
    myShopRequest: ShopRequest | null;
    isBidding: boolean;
    isDirect: boolean;
}

type Tab = "overview" | "pipeline" | "earnings" | "settings";

export default function TailorHomePage() {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState<Tab>("overview");
    const [tailorShops, setTailorShops] = useState<Shop[]>([]);
    const [selectedShop, setSelectedShop] = useState<Shop | null>(null);

    // Data state
    const [openRequests, setOpenRequests] = useState<ClothingRequest[]>([]);
    const [shopOrders, setShopOrders] = useState<Order[]>([]);
    const [tailorProfile, setTailorProfile] = useState<TailorProfile | null>(
        null,
    );

    // UI state
    const [isLoading, setIsLoading] = useState(true);
    const [isShopDropdownOpen, setIsShopDropdownOpen] = useState(false);

    // Action state
    const [submittingBidFor, setSubmittingBidFor] = useState<number | null>(
        null,
    );
    const [completingOrderId, setCompletingOrderId] = useState<number | null>(
        null,
    );
    const [actionToast, setActionToast] = useState<{
        msg: string;
        ok: boolean;
    } | null>(null);
    const [selectedRequestView, setSelectedRequestView] =
        useState<RequestView | null>(null);
    const [selectedOrderView, setSelectedOrderView] = useState<{
        order: Order;
        isActive: boolean;
    } | null>(null);

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
                activeShop = storedId
                    ? (shops.find((s) => String(s.shop_id) === storedId) ??
                      shops[0])
                    : shops[0];
                setSelectedShop(activeShop);
                localStorage.setItem(
                    "tailorSelectedShopId",
                    String(activeShop.shop_id),
                );
            }

            if (reqsRes.status === "fulfilled") {
                setOpenRequests(reqsRes.value);
            }

            if (activeShop?.shop_id) {
                try {
                    const orders = await listShopOrders(activeShop.shop_id);
                    setShopOrders(orders);
                } catch {
                    setShopOrders([]);
                }
            }
        } catch (err) {
            console.error("Failed to load tailor data:", err);
        } finally {
            setIsLoading(false);
        }
    }, [user]);

    useEffect(() => {
        fetchData();
    }, [user, fetchData]);

    const handleSelectShop = useCallback(async (shop: Shop) => {
        setSelectedShop(shop);
        setIsShopDropdownOpen(false);
        localStorage.setItem("tailorSelectedShopId", String(shop.shop_id));
        if (shop.shop_id) {
            setIsLoading(true);
            try {
                const orders = await listShopOrders(shop.shop_id);
                setShopOrders(orders);
            } catch {
                setShopOrders([]);
            }
            setIsLoading(false);
        }
    }, []);

    // ── Pipeline Data Preparation ──

    const newInquiries: RequestView[] = [];
    const pendingClient: RequestView[] = [];
    const activeWorkshop = shopOrders.filter(
        (o) => o.order_status === "in_progress",
    );
    const completedHistory = shopOrders.filter(
        (o) => o.order_status === "completed",
    );

    if (selectedShop) {
        openRequests.forEach((req) => {
            const myShopRequest =
                req.shop_requests?.find(
                    (sr) => sr.shop_id === selectedShop.shop_id,
                ) || null;
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
            if (
                (myShopRequest && myShopRequest.status === "pending") ||
                (!myShopRequest && view.isBidding)
            ) {
                newInquiries.push(view);
            }
        });
    }

    const totalRevenue = completedHistory.reduce(
        (sum, o) => sum + (o.accepted_price || 0),
        0,
    );
    const pipelineValue = activeWorkshop.reduce(
        (sum, o) => sum + (o.accepted_price || 0),
        0,
    );
    const shopDisplayName = selectedShop?.shop_name || "Your Shop";

    // ── Handlers ──

    const handleSubmitQuote = async (view: RequestView) => {
        const srId = view.myShopRequest?.shop_request_id;
        if (!srId) {
            showToast(
                "Cannot bid without a valid shop request context.",
                false,
            );
            return;
        }

        const price = Number(bidPrices[srId]);
        if (!price || price <= 0) return;

        setSubmittingBidFor(srId);
        try {
            await submitBid({
                shop_request_id: srId,
                bid_amount: price,
                message:
                    bidMessages[srId] ||
                    `Quote of LKR ${price.toLocaleString()} submitted.`,
            });
            showToast("Quote submitted successfully!");
            setBidPrices((p) => {
                const n = { ...p };
                delete n[srId];
                return n;
            });
            setBidMessages((p) => {
                const n = { ...p };
                delete n[srId];
                return n;
            });
            await fetchData();
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
            await fetchData();
        } catch (err) {
            console.error("Failed to mark complete:", err);
            showToast("Failed to complete order. Try again.", false);
        } finally {
            setCompletingOrderId(null);
        }
    };

    // ── Render Helpers ──

    const SkeletonCard = () => (
        <div className="h-40 bg-cream-bg border border-accent/20 rounded-2xl animate-pulse" />
    );

    const renderInquiryCard = (view: RequestView) => {
        const { req, myShopRequest, isDirect } = view;
        const srId = myShopRequest?.shop_request_id;
        const isSubmitting = srId != null && submittingBidFor === srId;
        const priceVal = srId != null ? (bidPrices[srId] ?? "") : "";
        const canSubmit = srId != null;

        return (
            <div
                key={req.request_id}
                onClick={() => setSelectedRequestView(view)}
                className="bg-cream-bg border border-accent/20 rounded-2xl overflow-hidden flex flex-col hover:border-accent/50 transition-all shadow-sm relative group cursor-pointer"
            >
                <div
                    className={`absolute top-0 left-0 w-1.5 h-full ${isDirect ? "bg-amber-700" : "bg-accent"}`}
                />
                <div className="p-5 pl-6 flex-1">
                    <div className="flex justify-between items-start mb-2">
                        <div>
                            <span
                                className={`text-[9px] font-mono font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full border mb-1.5 inline-block ${isDirect ? "text-amber-900 bg-amber-700/10 border-amber-700/30" : "text-accent bg-accent/10 border-accent/20"}`}
                            >
                                {isDirect
                                    ? "Direct Inquiry"
                                    : "Bidding Request"}
                            </span>
                            <h4 className="text-base font-extrabold text-earth-text font-heading leading-tight">
                                {req.clothing_category || "Custom Garment"}
                            </h4>
                        </div>
                        <span className="text-xs font-mono font-bold text-accent">
                            #{req.request_id}
                        </span>
                    </div>
                    <p className="text-xs text-earth-text/70 mb-3 font-medium">
                        {req.gender
                            ? `${req.gender.charAt(0).toUpperCase() + req.gender.slice(1)} fit`
                            : "Custom"}{" "}
                        &bull;{" "}
                        {req.target_budget
                            ? `Budget: LKR ${req.target_budget.toLocaleString()}`
                            : "Open Budget"}
                    </p>
                    {req.description && (
                        <p className="text-xs text-earth-text/60 italic line-clamp-2 bg-warm-beige p-3 rounded-xl border border-accent/15">
                            "{req.description}"
                        </p>
                    )}
                </div>

                {canSubmit ? (
                    <div
                        className="p-4 bg-warm-beige border-t border-accent/20 space-y-2.5"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="grid grid-cols-2 gap-2">
                            <input
                                type="number"
                                placeholder="Your Price (LKR)"
                                value={priceVal}
                                onChange={(e) =>
                                    srId != null &&
                                    setBidPrices((p) => ({
                                        ...p,
                                        [srId]: e.target.value,
                                    }))
                                }
                                className="w-full bg-cream-bg border border-accent/20 focus:border-accent/60 rounded-xl px-3 py-2 text-xs text-earth-text placeholder-earth-text/40 outline-none transition-all shadow-sm"
                            />
                            <input
                                type="text"
                                placeholder="Short message..."
                                value={
                                    srId != null
                                        ? (bidMessages[srId] ?? "")
                                        : ""
                                }
                                onChange={(e) =>
                                    srId != null &&
                                    setBidMessages((p) => ({
                                        ...p,
                                        [srId]: e.target.value,
                                    }))
                                }
                                className="w-full bg-cream-bg border border-accent/20 focus:border-accent/60 rounded-xl px-3 py-2 text-xs text-earth-text placeholder-earth-text/40 outline-none transition-all shadow-sm"
                            />
                        </div>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                handleSubmitQuote(view);
                            }}
                            disabled={
                                isSubmitting ||
                                !priceVal ||
                                Number(priceVal) <= 0
                            }
                            className="w-full bg-accent hover:bg-accent-hover text-cream-bg font-bold text-xs uppercase tracking-wider py-2.5 rounded-xl transition-all shadow-sm disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {isSubmitting ? "Submitting..." : "Send Quote"}
                        </button>
                    </div>
                ) : (
                    <div
                        className="p-3 bg-warm-beige border-t border-accent/20 text-center"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <span className="text-xs font-bold text-earth-text/60">
                            Shop request not initialized
                        </span>
                    </div>
                )}
            </div>
        );
    };

    const renderPendingCard = (view: RequestView) => {
        const { req, myShopRequest } = view;
        return (
            <div
                key={req.request_id}
                onClick={() => setSelectedRequestView(view)}
                className="bg-cream-bg border-2 border-accent/30 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all cursor-pointer relative"
            >
                <div className="absolute top-0 left-0 w-1.5 h-full bg-accent" />
                <div className="p-5 pl-6">
                    <div className="flex justify-between items-start mb-2">
                        <h4 className="text-base font-extrabold text-earth-text font-heading leading-tight">
                            {req.clothing_category || "Custom Garment"}
                        </h4>
                        <span className="text-[10px] font-mono uppercase font-bold text-accent bg-accent/10 px-2.5 py-0.5 rounded-full border border-accent/20">
                            Quoted
                        </span>
                    </div>
                    <div className="bg-warm-beige border border-accent/20 rounded-xl p-3 flex justify-between items-center mt-3">
                        <span className="text-[10px] font-mono text-earth-text/60 uppercase font-bold">
                            Your Offer
                        </span>
                        <span className="text-sm font-black text-accent font-mono">
                            LKR{" "}
                            {Number(
                                myShopRequest?.offered_price || 0,
                            ).toLocaleString()}
                        </span>
                    </div>
                    <p className="text-[10px] text-earth-text/60 mt-3 text-center uppercase tracking-wider font-bold">
                        Awaiting Client Approval
                    </p>
                </div>
            </div>
        );
    };

    const renderOrderCard = (ord: Order, isActive: boolean) => {
        return (
            <div
                key={ord.order_id}
                onClick={() => setSelectedOrderView({ order: ord, isActive })}
                className={`bg-cream-bg border border-accent/20 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all cursor-pointer relative hover:border-emerald-700/50 ${!isActive && "opacity-70"}`}
            >
                <div
                    className={`absolute top-0 left-0 w-1.5 h-full ${isActive ? "bg-emerald-600" : "bg-earth-text/40"}`}
                />
                <div className="p-5 pl-6">
                    <div className="flex justify-between items-start mb-1">
                        <h4 className="text-base font-extrabold text-earth-text font-heading leading-tight">
                            Order #{ord.order_id}
                        </h4>
                        <span className="text-xs font-mono font-bold text-earth-text/50">
                            Ref #{ord.shop_request_id}
                        </span>
                    </div>
                    <p className="text-sm font-black text-accent font-mono mb-3">
                        LKR {Number(ord.accepted_price).toLocaleString()}
                    </p>

                    {isActive ? (
                        <div className="bg-emerald-600/10 rounded-xl p-2.5 text-center border border-emerald-600/20">
                            <span className="text-[10px] font-mono text-emerald-800 uppercase font-bold tracking-wider">
                                In Progress
                            </span>
                        </div>
                    ) : (
                        <div className="bg-earth-text/5 rounded-xl p-2.5 text-center border border-earth-text/10">
                            <span className="text-[10px] font-mono text-earth-text/60 uppercase font-bold tracking-wider">
                                Finished
                            </span>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-warm-beige text-earth-text selection:bg-accent selection:text-cream-bg font-sans flex flex-col">
            <FullPageLock
                isSubmitting={
                    submittingBidFor != null || completingOrderId != null
                }
                title="Processing Atelier Request"
                message="Updating order status and transmitting details..."
            />
            {actionToast && (
                <div
                    className={`fixed top-6 right-6 z-50 text-white text-xs font-bold px-5 py-3 rounded-xl shadow-2xl flex items-center gap-2 ${actionToast.ok ? "bg-emerald-600" : "bg-red-600"}`}
                >
                    {actionToast.msg}
                </div>
            )}

            {/* Navigation Header */}
            <header className="h-16 shrink-0 border-b border-accent/20 bg-cream-bg flex items-center px-6 lg:px-12 justify-between shadow-sm">
                <div className="flex items-center gap-8">
                    <span className="text-earth-text font-serif font-black text-xl tracking-tight">
                        Tailor Mode
                    </span>
                    <nav className="hidden sm:flex items-center gap-1">
                        {[
                            { key: "overview", label: "Overview" },
                            { key: "earnings", label: "Earnings" },
                            { key: "settings", label: "Settings" },
                        ].map((t) => (
                            <button
                                key={t.key}
                                onClick={() => setActiveTab(t.key as Tab)}
                                className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all ${activeTab === t.key ? "bg-accent text-cream-bg shadow-sm" : "text-earth-text/60 hover:text-earth-text hover:bg-accent/10"}`}
                            >
                                {t.label}
                            </button>
                        ))}
                    </nav>
                </div>

                <div className="relative">
                    <button
                        onClick={() =>
                            setIsShopDropdownOpen(!isShopDropdownOpen)
                        }
                        className="flex items-center gap-2 bg-warm-beige border border-accent/30 hover:border-accent px-4 py-2 rounded-full text-xs font-bold text-earth-text transition-all shadow-sm"
                    >
                        <span className="truncate max-w-[140px]">
                            {shopDisplayName}
                        </span>
                        <svg
                            className={`w-3.5 h-3.5 text-accent transition-transform ${isShopDropdownOpen ? "rotate-180" : ""}`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 9l-7 7-7-7"
                            />
                        </svg>
                    </button>
                    {isShopDropdownOpen && (
                        <div className="absolute top-full right-0 mt-2 w-52 bg-cream-bg border border-accent/20 rounded-2xl shadow-xl overflow-hidden z-20 py-1.5">
                            {tailorShops.map((shop) => (
                                <button
                                    key={shop.shop_id}
                                    onClick={() => handleSelectShop(shop)}
                                    className="w-full text-left px-4 py-2.5 text-xs font-bold hover:bg-warm-beige transition-colors text-earth-text/80 hover:text-earth-text"
                                >
                                    {shop.shop_name}
                                </button>
                            ))}
                            <div className="h-px bg-accent/15 my-1.5" />
                            <Link
                                href="/tailor/add-shop"
                                className="w-full text-left px-4 py-2 text-xs font-bold text-accent hover:bg-warm-beige transition-colors flex items-center gap-2"
                            >
                                + Add New Shop
                            </Link>
                        </div>
                    )}
                </div>
            </header>

            <main className="flex-1 overflow-hidden flex flex-col bg-warm-beige">
                {/* OVERVIEW TAB */}
                {activeTab === "overview" && (
                    <div className="p-6 lg:p-12 overflow-y-auto custom-scrollbar h-full">
                        <div className="max-w-4xl mx-auto space-y-8">
                            <div>
                                <span className="text-[10px] font-mono tracking-[0.25em] text-earth-text/60 uppercase block mb-1 font-bold">
                                    ATELIER DASHBOARD
                                </span>
                                <h1 className="text-3xl font-extrabold text-earth-text font-heading">
                                    Dashboard Overview
                                </h1>
                                <p className="text-earth-text/70 text-xs mt-1 font-medium">
                                    High-level statistics for {shopDisplayName}
                                </p>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {[
                                    {
                                        label: "New Inquiries",
                                        value: newInquiries.length,
                                        color: "text-earth-text",
                                    },
                                    {
                                        label: "Pending Quotes",
                                        value: pendingClient.length,
                                        color: "text-accent font-mono",
                                    },
                                    {
                                        label: "Active Orders",
                                        value: activeWorkshop.length,
                                        color: "text-emerald-800",
                                    },
                                    {
                                        label: "Completed",
                                        value: completedHistory.length,
                                        color: "text-earth-text/70",
                                    },
                                ].map((stat, i) => (
                                    <div
                                        key={i}
                                        className="bg-cream-bg border border-accent/20 p-5 rounded-2xl shadow-sm"
                                    >
                                        <p className="text-[10px] font-mono font-bold uppercase tracking-widest text-earth-text/60 mb-2">
                                            {stat.label}
                                        </p>
                                        <p
                                            className={`text-3xl font-black ${stat.color}`}
                                        >
                                            {stat.value}
                                        </p>
                                    </div>
                                ))}
                            </div>

                            {/* Section breakdown */}
                            <div className="space-y-6 pt-4">
                                <div>
                                    <h2 className="text-base font-extrabold text-earth-text font-heading mb-4">
                                        New Inquiries ({newInquiries.length})
                                    </h2>
                                    {isLoading ? (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <SkeletonCard />
                                            <SkeletonCard />
                                        </div>
                                    ) : newInquiries.length === 0 ? (
                                        <div className="bg-cream-bg border border-accent/20 rounded-2xl p-8 text-center text-xs text-earth-text/60 shadow-sm font-medium">
                                            No new inquiries at the moment.
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {newInquiries.map(
                                                renderInquiryCard,
                                            )}
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <h2 className="text-base font-extrabold text-earth-text font-heading mb-4">
                                        Pending Client Approval (
                                        {pendingClient.length})
                                    </h2>
                                    {pendingClient.length === 0 ? (
                                        <div className="bg-cream-bg border border-accent/20 rounded-2xl p-8 text-center text-xs text-earth-text/60 shadow-sm font-medium">
                                            No quotations currently awaiting
                                            client response.
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {pendingClient.map(
                                                renderPendingCard,
                                            )}
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <h2 className="text-base font-extrabold text-earth-text font-heading mb-4">
                                        Active Orders ({activeWorkshop.length})
                                    </h2>
                                    {activeWorkshop.length === 0 ? (
                                        <div className="bg-cream-bg border border-accent/20 rounded-2xl p-8 text-center text-xs text-earth-text/60 shadow-sm font-medium">
                                            No active orders in progress.
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {activeWorkshop.map((o) =>
                                                renderOrderCard(o, true),
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* EARNINGS TAB */}
                {activeTab === "earnings" && (
                    <div className="p-6 lg:p-12 overflow-y-auto custom-scrollbar h-full">
                        <div className="max-w-4xl mx-auto space-y-8">
                            <div>
                                <span className="text-[10px] font-mono tracking-[0.25em] text-earth-text/60 uppercase block mb-1 font-bold">
                                    REVENUE REPORT
                                </span>
                                <h1 className="text-3xl font-extrabold text-earth-text font-heading">
                                    Earnings & Revenue
                                </h1>
                                <p className="text-earth-text/70 text-xs mt-1 font-medium">
                                    Financial overview for {shopDisplayName}
                                </p>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="bg-cream-bg border border-accent/20 p-6 rounded-2xl shadow-sm">
                                    <p className="text-[10px] font-mono font-bold uppercase tracking-widest text-earth-text/60 mb-2">
                                        Total Earned
                                    </p>
                                    <p className="text-4xl font-black text-emerald-800 font-mono">
                                        LKR {totalRevenue.toLocaleString()}
                                    </p>
                                </div>
                                <div className="bg-cream-bg border border-accent/20 p-6 rounded-2xl shadow-sm">
                                    <p className="text-[10px] font-mono font-bold uppercase tracking-widest text-earth-text/60 mb-2">
                                        Pipeline Value (In Progress)
                                    </p>
                                    <p className="text-4xl font-black text-accent font-mono">
                                        LKR {pipelineValue.toLocaleString()}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* SETTINGS TAB */}
                {activeTab === "settings" && (
                    <div className="p-6 lg:p-12 overflow-y-auto custom-scrollbar h-full">
                        <div className="max-w-2xl mx-auto space-y-8">
                            <div>
                                <span className="text-[10px] font-mono tracking-[0.25em] text-earth-text/60 uppercase block mb-1 font-bold">
                                    PROFILE MANAGEMENT
                                </span>
                                <h1 className="text-3xl font-extrabold text-earth-text font-heading">
                                    Tailor Settings
                                </h1>
                                <p className="text-earth-text/70 text-xs mt-1 font-medium">
                                    Manage your professional profile and status.
                                </p>
                            </div>

                            <form className="bg-cream-bg border border-accent/20 rounded-2xl p-6 sm:p-8 space-y-5 shadow-sm">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-mono font-bold uppercase tracking-widest text-earth-text/70">
                                        Firebase Email
                                    </label>
                                    <div className="w-full bg-warm-beige border border-accent/20 rounded-xl px-4 py-3 text-xs text-earth-text/60 cursor-not-allowed font-medium">
                                        {user?.email}
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-mono font-bold uppercase tracking-widest text-earth-text/70">
                                        Verification Status
                                    </label>
                                    <div className="w-full bg-emerald-600/10 border border-emerald-600/20 rounded-xl px-4 py-3 text-xs text-emerald-800 flex items-center gap-2 font-bold">
                                        <span className="w-2 h-2 rounded-full bg-emerald-600" />
                                        {tailorProfile?.is_verified
                                            ? "Verified Identity"
                                            : "Pending Verification"}
                                    </div>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* MODAL: Request Details */}
                {selectedRequestView && (
                    <div
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-earth-text/40 backdrop-blur-sm"
                        onClick={() => setSelectedRequestView(null)}
                    >
                        <div
                            className="bg-cream-bg border border-accent/30 w-full max-w-4xl max-h-[90vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden text-earth-text"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Header */}
                            <div className="px-6 py-4 border-b border-accent/20 flex justify-between items-center bg-warm-beige shrink-0">
                                <div className="flex items-center gap-3">
                                    <span className="text-accent font-mono text-xs font-bold">
                                        #{selectedRequestView.req.request_id}
                                    </span>
                                    <h2 className="text-lg font-extrabold text-earth-text font-heading">
                                        {selectedRequestView.req
                                            .clothing_category ||
                                            "Custom Garment Request"}
                                    </h2>
                                </div>
                                <button
                                    onClick={() => setSelectedRequestView(null)}
                                    className="text-earth-text/50 hover:text-earth-text transition-colors p-1"
                                >
                                    <svg
                                        className="w-5 h-5"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M6 18L18 6M6 6l12 12"
                                        />
                                    </svg>
                                </button>
                            </div>

                            {/* Content */}
                            <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
                                {/* Main Details */}
                                <div className="flex-1 p-6 overflow-y-auto custom-scrollbar border-b md:border-b-0 md:border-r border-accent/20 space-y-6">
                                    <div className="space-y-2">
                                        <h3 className="text-[10px] font-mono font-bold text-earth-text/60 uppercase tracking-widest">
                                            Description
                                        </h3>
                                        <p className="text-xs text-earth-text/80 bg-warm-beige p-4 rounded-xl border border-accent/20 leading-relaxed min-h-[100px]">
                                            {selectedRequestView.req
                                                .description ||
                                                "No description provided."}
                                        </p>
                                    </div>

                                    {selectedRequestView.req.design_images &&
                                        selectedRequestView.req.design_images
                                            .length > 0 && (
                                            <div className="mb-6">
                                                <h3 className="text-[10px] font-mono font-bold text-earth-text/60 uppercase tracking-widest mb-3">
                                                    Reference Images
                                                </h3>
                                                <div className="flex gap-3 overflow-x-auto pb-2 snap-x">
                                                    {selectedRequestView.req.design_images.map(
                                                        (img, i) => (
                                                            <img
                                                                key={i}
                                                                src={
                                                                    img.image_url
                                                                }
                                                                alt={`Ref ${i + 1}`}
                                                                className="h-32 w-32 object-cover rounded-xl border border-accent/20 snap-start shadow-sm"
                                                            />
                                                        ),
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-warm-beige p-4 rounded-xl border border-accent/20 flex flex-col justify-center">
                                            <h3 className="text-[10px] font-mono font-bold text-earth-text/60 uppercase tracking-widest mb-1">
                                                Target Budget
                                            </h3>
                                            <p className="text-sm font-black text-accent font-mono">
                                                {selectedRequestView.req
                                                    .target_budget
                                                    ? `LKR ${selectedRequestView.req.target_budget.toLocaleString()}`
                                                    : "Open Budget"}
                                            </p>
                                        </div>
                                        <div className="bg-warm-beige p-4 rounded-xl border border-accent/20 flex flex-col justify-center">
                                            <h3 className="text-[10px] font-mono font-bold text-earth-text/60 uppercase tracking-widest mb-1">
                                                Target Date
                                            </h3>
                                            <p className="text-xs font-bold text-earth-text">
                                                {selectedRequestView.req
                                                    .target_date
                                                    ? new Date(
                                                          selectedRequestView
                                                              .req.target_date,
                                                      ).toLocaleDateString()
                                                    : "Flexible"}
                                            </p>
                                        </div>
                                        <div className="bg-warm-beige p-4 rounded-xl border border-accent/20 flex flex-col justify-center">
                                            <h3 className="text-[10px] font-mono font-bold text-earth-text/60 uppercase tracking-widest mb-1">
                                                Fabric Status
                                            </h3>
                                            <p className="text-xs font-bold text-earth-text capitalize">
                                                {selectedRequestView.req
                                                    .fabric_status
                                                    ? selectedRequestView.req.fabric_status.replace(
                                                          "_",
                                                          " ",
                                                      )
                                                    : "Not specified"}
                                            </p>
                                        </div>
                                        <div className="bg-warm-beige p-4 rounded-xl border border-accent/20 flex flex-col justify-center">
                                            <h3 className="text-[10px] font-mono font-bold text-earth-text/60 uppercase tracking-widest mb-1">
                                                Gender Fit
                                            </h3>
                                            <p className="text-xs font-bold text-earth-text capitalize">
                                                {selectedRequestView.req
                                                    .gender || "Custom"}
                                            </p>
                                        </div>
                                    </div>

                                    {selectedRequestView.req.client && (
                                        <div className="space-y-2 pt-4 border-t border-accent/20">
                                            <h3 className="text-[10px] font-mono font-bold text-earth-text/60 uppercase tracking-widest">
                                                Client Details
                                            </h3>
                                            <div className="bg-warm-beige p-4 rounded-xl border border-accent/20 grid grid-cols-2 gap-4">
                                                <div>
                                                    <h3 className="text-[10px] font-mono font-bold text-earth-text/60 uppercase tracking-widest mb-1">
                                                        Name
                                                    </h3>
                                                    <p className="text-xs font-bold text-earth-text">
                                                        {selectedRequestView.req
                                                            .client
                                                            .display_name ||
                                                            "Unknown Client"}
                                                    </p>
                                                </div>
                                                {selectedRequestView.req.client
                                                    .phone && (
                                                    <div>
                                                        <h3 className="text-[10px] font-mono font-bold text-earth-text/60 uppercase tracking-widest mb-1">
                                                            Contact
                                                        </h3>
                                                        <p className="text-xs font-bold text-earth-text">
                                                            {
                                                                selectedRequestView
                                                                    .req.client
                                                                    .phone
                                                            }
                                                        </p>
                                                    </div>
                                                )}
                                                {selectedRequestView.req.client
                                                    .city && (
                                                    <div className="col-span-2">
                                                        <h3 className="text-[10px] font-mono font-bold text-earth-text/60 uppercase tracking-widest mb-1">
                                                            Location
                                                        </h3>
                                                        <p className="text-xs font-bold text-earth-text">
                                                            {
                                                                selectedRequestView
                                                                    .req.client
                                                                    .city
                                                            }
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {selectedRequestView.req.measurement &&
                                        Object.values(
                                            selectedRequestView.req.measurement,
                                        ).some(
                                            (val) => val !== null && val !== "",
                                        ) && (
                                            <div className="space-y-2 pt-4 border-t border-accent/20">
                                                <h3 className="text-[10px] font-mono font-bold text-earth-text/60 uppercase tracking-widest flex items-center gap-2">
                                                    Measurements
                                                </h3>
                                                <div className="bg-warm-beige p-4 rounded-xl border border-accent/20 grid grid-cols-3 gap-y-4 gap-x-2">
                                                    {[
                                                        "chest",
                                                        "waist",
                                                        "shoulder",
                                                        "sleeve",
                                                        "neck",
                                                        "hip",
                                                        "inseam",
                                                        "length",
                                                    ].map((part) => {
                                                        const val =
                                                            selectedRequestView
                                                                .req
                                                                .measurement![
                                                                part as keyof typeof selectedRequestView.req.measurement
                                                            ];
                                                        if (val == null)
                                                            return null;
                                                        return (
                                                            <div key={part}>
                                                                <h3 className="text-[10px] font-mono font-bold text-earth-text/60 uppercase tracking-widest mb-1">
                                                                    {part}
                                                                </h3>
                                                                <p className="text-xs font-bold text-earth-text font-mono">
                                                                    {val} cm
                                                                </p>
                                                            </div>
                                                        );
                                                    })}
                                                    {selectedRequestView.req
                                                        .measurement.notes && (
                                                        <div className="col-span-3 mt-2">
                                                            <h3 className="text-[10px] font-mono font-bold text-earth-text/60 uppercase tracking-widest mb-1">
                                                                Notes
                                                            </h3>
                                                            <p className="text-xs text-earth-text/80 italic">
                                                                "
                                                                {
                                                                    selectedRequestView
                                                                        .req
                                                                        .measurement
                                                                        .notes
                                                                }
                                                                "
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                </div>

                                {/* Sidebar / Actions */}
                                <div className="w-full md:w-80 p-6 bg-warm-beige overflow-y-auto custom-scrollbar flex flex-col space-y-6 shrink-0">
                                    <div className="space-y-4">
                                        <h3 className="text-[10px] font-mono font-bold text-earth-text/60 uppercase tracking-widest">
                                            Status & Actions
                                        </h3>

                                        {/* Status indicator */}
                                        <div className="flex items-center gap-2">
                                            <div
                                                className={`w-2.5 h-2.5 rounded-full ${selectedRequestView.myShopRequest?.status === "quoted" ? "bg-accent" : "bg-amber-700"}`}
                                            />
                                            <span className="text-xs font-bold text-earth-text">
                                                {selectedRequestView
                                                    .myShopRequest?.status ===
                                                "quoted"
                                                    ? "Quoted / Pending Approval"
                                                    : "New Inquiry"}
                                            </span>
                                        </div>

                                        {/* Action Area */}
                                        {selectedRequestView.myShopRequest
                                            ?.status === "quoted" ? (
                                            <div className="bg-cream-bg border border-accent/20 rounded-xl p-4 shadow-sm">
                                                <h4 className="text-[10px] font-mono font-bold text-earth-text/60 uppercase tracking-widest mb-2">
                                                    Your Submitted Offer
                                                </h4>
                                                <p className="text-xl font-black text-accent font-mono">
                                                    LKR{" "}
                                                    {Number(
                                                        selectedRequestView
                                                            .myShopRequest
                                                            .offered_price || 0,
                                                    ).toLocaleString()}
                                                </p>
                                                <p className="text-xs text-earth-text/70 mt-2">
                                                    Waiting for client to accept
                                                    or reject.
                                                </p>
                                            </div>
                                        ) : (
                                            <div className="bg-cream-bg border border-accent/20 rounded-2xl p-4 space-y-4 shadow-sm">
                                                <div className="space-y-1">
                                                    <label className="text-[10px] font-mono font-bold text-earth-text/70 uppercase tracking-widest">
                                                        Quote Amount (LKR)
                                                    </label>
                                                    <input
                                                        type="number"
                                                        placeholder="e.g. 5000"
                                                        value={
                                                            selectedRequestView
                                                                .myShopRequest
                                                                ?.shop_request_id
                                                                ? (bidPrices[
                                                                      selectedRequestView
                                                                          .myShopRequest
                                                                          .shop_request_id
                                                                  ] ?? "")
                                                                : ""
                                                        }
                                                        onChange={(e) =>
                                                            selectedRequestView
                                                                .myShopRequest
                                                                ?.shop_request_id &&
                                                            setBidPrices(
                                                                (p) => ({
                                                                    ...p,
                                                                    [selectedRequestView
                                                                        .myShopRequest!
                                                                        .shop_request_id]:
                                                                        e.target
                                                                            .value,
                                                                }),
                                                            )
                                                        }
                                                        className="w-full bg-warm-beige border border-accent/20 focus:border-accent/60 rounded-xl px-3 py-2 text-xs text-earth-text placeholder-earth-text/40 outline-none transition-all shadow-sm font-mono"
                                                    />
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="text-[10px] font-mono font-bold text-earth-text/70 uppercase tracking-widest">
                                                        Message to Client
                                                    </label>
                                                    <textarea
                                                        placeholder="Brief description of your offer..."
                                                        value={
                                                            selectedRequestView
                                                                .myShopRequest
                                                                ?.shop_request_id
                                                                ? (bidMessages[
                                                                      selectedRequestView
                                                                          .myShopRequest
                                                                          .shop_request_id
                                                                  ] ?? "")
                                                                : ""
                                                        }
                                                        onChange={(e) =>
                                                            selectedRequestView
                                                                .myShopRequest
                                                                ?.shop_request_id &&
                                                            setBidMessages(
                                                                (p) => ({
                                                                    ...p,
                                                                    [selectedRequestView
                                                                        .myShopRequest!
                                                                        .shop_request_id]:
                                                                        e.target
                                                                            .value,
                                                                }),
                                                            )
                                                        }
                                                        className="w-full bg-warm-beige border border-accent/20 focus:border-accent/60 rounded-xl px-3 py-2 text-xs text-earth-text placeholder-earth-text/40 outline-none transition-all resize-none h-20 shadow-sm"
                                                    />
                                                </div>
                                                <button
                                                    onClick={() => {
                                                        handleSubmitQuote(
                                                            selectedRequestView,
                                                        );
                                                        setSelectedRequestView(
                                                            null,
                                                        );
                                                    }}
                                                    disabled={
                                                        !selectedRequestView
                                                            .myShopRequest
                                                            ?.shop_request_id ||
                                                        submittingBidFor ===
                                                            selectedRequestView
                                                                .myShopRequest
                                                                .shop_request_id
                                                    }
                                                    className="w-full bg-accent hover:bg-accent-hover disabled:opacity-50 text-cream-bg font-bold text-xs uppercase tracking-wider py-3 rounded-xl transition-all shadow-sm"
                                                >
                                                    {submittingBidFor ===
                                                    selectedRequestView
                                                        .myShopRequest
                                                        ?.shop_request_id
                                                        ? "Submitting..."
                                                        : "Send Quote"}
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* MODAL: Order Details */}
                {selectedOrderView && (
                    <div
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-earth-text/40 backdrop-blur-sm"
                        onClick={() => setSelectedOrderView(null)}
                    >
                        <div
                            className="bg-cream-bg border border-accent/30 w-full max-w-2xl max-h-[90vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden text-earth-text"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="px-6 py-4 border-b border-accent/20 flex justify-between items-center bg-warm-beige shrink-0">
                                <div className="flex items-center gap-3">
                                    <span className="text-accent font-mono text-xs font-bold">
                                        #{selectedOrderView.order.order_id}
                                    </span>
                                    <h2 className="text-lg font-extrabold text-earth-text font-heading">
                                        Order Details
                                    </h2>
                                </div>
                                <button
                                    onClick={() => setSelectedOrderView(null)}
                                    className="text-earth-text/50 hover:text-earth-text transition-colors p-1"
                                >
                                    <svg
                                        className="w-5 h-5"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M6 18L18 6M6 6l12 12"
                                        />
                                    </svg>
                                </button>
                            </div>

                            <div className="p-6 overflow-y-auto custom-scrollbar space-y-6">
                                <div className="flex items-center justify-between p-4 bg-warm-beige border border-accent/20 rounded-2xl">
                                    <div>
                                        <p className="text-[10px] font-mono font-bold text-earth-text/60 uppercase tracking-widest mb-1">
                                            Accepted Price
                                        </p>
                                        <p className="text-2xl font-black text-accent font-mono">
                                            LKR{" "}
                                            {Number(
                                                selectedOrderView.order
                                                    .accepted_price,
                                            ).toLocaleString()}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] font-mono font-bold text-earth-text/60 uppercase tracking-widest mb-1">
                                            Status
                                        </p>
                                        <div className="inline-block px-3 py-1 rounded-full border bg-emerald-600/10 border-emerald-600/20">
                                            <p className="text-xs font-bold text-emerald-800 capitalize">
                                                {selectedOrderView.order.order_status.replace(
                                                    "_",
                                                    " ",
                                                )}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-warm-beige p-4 rounded-xl border border-accent/20 flex flex-col justify-center">
                                        <h3 className="text-[10px] font-mono font-bold text-earth-text/60 uppercase tracking-widest mb-1">
                                            Started Date
                                        </h3>
                                        <p className="text-xs font-bold text-earth-text">
                                            {selectedOrderView.order
                                                .started_date
                                                ? new Date(
                                                      selectedOrderView.order
                                                          .started_date,
                                                  ).toLocaleDateString()
                                                : "N/A"}
                                        </p>
                                    </div>
                                    <div className="bg-warm-beige p-4 rounded-xl border border-accent/20 flex flex-col justify-center">
                                        <h3 className="text-[10px] font-mono font-bold text-earth-text/60 uppercase tracking-widest mb-1">
                                            Ref Request ID
                                        </h3>
                                        <p className="text-xs font-mono font-bold text-earth-text">
                                            #
                                            {
                                                selectedOrderView.order
                                                    .shop_request_id
                                            }
                                        </p>
                                    </div>
                                </div>

                                {selectedOrderView.isActive && (
                                    <div className="pt-4 border-t border-accent/20">
                                        <button
                                            onClick={() => {
                                                handleMarkComplete(
                                                    selectedOrderView.order
                                                        .order_id,
                                                );
                                                setSelectedOrderView(null);
                                            }}
                                            disabled={
                                                completingOrderId ===
                                                selectedOrderView.order.order_id
                                            }
                                            className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs uppercase tracking-wider py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
                                        >
                                            {completingOrderId ===
                                            selectedOrderView.order.order_id
                                                ? "Processing..."
                                                : "✓ Mark as Completed"}
                                        </button>
                                        <p className="text-center text-xs text-earth-text/60 mt-3 font-medium">
                                            This action will notify the client
                                            and finalize the order.
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
