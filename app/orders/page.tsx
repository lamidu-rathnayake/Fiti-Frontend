"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/firebase/AuthContext";
import {
    listShopOrders,
    listShopRequests,
    listOpenRequests,
    listClientOrders,
    cancelRequest,
    submitBid,
} from "@/lib/api/endpoints/orders";
import { listTailorShops } from "@/lib/api/endpoints/shops";
import type { ClothingRequest, Order } from "@/lib/api/types/order";

export interface OrderDetail {
    id: string;
    rawId: number;
    title: string;
    client: string;
    date: string;
    targetDate: string;
    budget: string;
    garmentType: "Suit" | "Shirt" | "Overcoat" | "Trousers";
    fitPreference: "Men's Fit" | "Women's Fit" | "Unisex" | "Not specified";
    materialSourcing: "Need Sourcing" | "Providing Fabric" | "Not specified";
    measurements: {
        chest: string;
        waist: string;
        sleeve: string;
        neck: string;
        shoulder: string;
    };
    designNotes: string;
    images: string[];
    status: string;
    progress?: number;
}

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

export default function OrdersPage() {
    const { user, role, logout, setRole } = useAuth();
    const router = useRouter();

    const isTailorView = role === "tailor";
    const homeUrl = role === "tailor" ? "/tailor/home" : "/client/home";

    // Shared UI state
    const [searchQuery, setSearchQuery] = useState("");
    const [previewImage, setPreviewImage] = useState<string | null>(null);
    const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
    const [highlightedSection, setHighlightedSection] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isDbConnected, setIsDbConnected] = useState(false);

    // Tailor-facing state (shop's own requests/pending/ongoing orders)
    const [shopName, setShopName] = useState("");
    const [requests, setRequests] = useState<OrderDetail[]>([]);
    const [pendingOrders, setPendingOrders] = useState<OrderDetail[]>([]);
    const [ongoingOrders, setOngoingOrders] = useState<OrderDetail[]>([]);

    // Client-facing state (own commissions / open marketplace requests)
    const [clientOrders, setClientOrders] = useState<ClientOrderRow[]>([]);

    const filteredClientOrders = clientOrders.filter(
        (ord) =>
            ord.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
            ord.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            ord.client.toLowerCase().includes(searchQuery.toLowerCase()) ||
            ord.tailor.toLowerCase().includes(searchQuery.toLowerCase()) ||
            ord.status.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // ---- Mapping helpers: shape real API records into OrderDetail ----
    const mapRequestToOrderDetail = (req: ClothingRequest): OrderDetail => {
        const isFemale = req.gender === "female";
        const cat = (req.clothing_category || "").toLowerCase();
        let garmentType: OrderDetail["garmentType"] = "Suit";
        if (cat.includes("overcoat") || cat.includes("coat")) garmentType = "Overcoat";
        else if (cat.includes("shirt")) garmentType = "Shirt";
        else if (cat.includes("trouser") || cat.includes("pant")) garmentType = "Trousers";

        const defaultImg = isFemale
            ? "/images/orders/womens_power_suit.jpg"
            : garmentType === "Overcoat"
                ? "/images/orders/cashmere_belted_coat.jpg"
                : "/images/orders/mens_charcoal_suit.jpg";

        // Measurement fields aren't part of the ClothingRequest shape shown here —
        // read them defensively in case the API returns them, otherwise be honest that we don't have them.
        const anyReq = req as unknown as Record<string, string | number | undefined>;

        return {
            id: `REQ-${req.request_id}`,
            rawId: req.request_id,
            title: req.clothing_category || "Bespoke Commission",
            client: req.client_id ? (req.client_id.length > 15 ? req.client_id.substring(0, 10) + "..." : req.client_id) : "Client",
            date: req.created_at ? new Date(req.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—",
            targetDate: req.target_date ? new Date(req.target_date).toLocaleDateString("en-US", { month: "2-digit", day: "2-digit", year: "numeric" }) : "TBD",
            budget: req.target_budget ? `LKR ${Number(req.target_budget).toLocaleString()}` : "Custom Quote",
            garmentType,
            fitPreference: isFemale ? "Women's Fit" : req.gender === "unisex" ? "Unisex" : req.gender === "male" ? "Men's Fit" : "Not specified",
            materialSourcing: req.fabric_status === "client_provided" ? "Providing Fabric" : req.fabric_status ? "Need Sourcing" : "Not specified",
            measurements: {
                chest: anyReq.chest_measurement ? String(anyReq.chest_measurement) : "Not specified",
                waist: anyReq.waist_measurement ? String(anyReq.waist_measurement) : "Not specified",
                sleeve: anyReq.sleeve_measurement ? String(anyReq.sleeve_measurement) : "Not specified",
                neck: anyReq.neck_measurement ? String(anyReq.neck_measurement) : "Not specified",
                shoulder: anyReq.shoulder_measurement ? String(anyReq.shoulder_measurement) : "Not specified",
            },
            designNotes: req.description || "No design notes provided.",
            images: req.design_image_urls && req.design_image_urls.length > 0 ? req.design_image_urls : [defaultImg],
            status: "REQUESTED",
        };
    };

    const mapOrderToOrderDetail = (ord: Order): OrderDetail => {
        // Backend uses `order_status` — not `status`
        const orderStatus = ord.order_status;
        const statusLabel = orderStatus === "in_progress" ? "IN FITTING" : (orderStatus || "pending").replace(/_/g, " ").toUpperCase();
        return {
            id: `ORD-${ord.order_id}`,
            rawId: ord.order_id,
            title: `Order #${ord.order_id}`,
            client: `Client #${ord.shop_request_id}`,
            date: ord.created_at ? new Date(ord.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—",
            targetDate: ord.completed_date ? new Date(ord.completed_date).toLocaleDateString("en-US", { month: "2-digit", day: "2-digit", year: "numeric" }) : "TBD",
            budget: ord.accepted_price ? `LKR ${Number(ord.accepted_price).toLocaleString()}` : "Pending",
            garmentType: "Suit",
            fitPreference: "Not specified",
            materialSourcing: "Not specified",
            measurements: {
                chest: "Not specified",
                waist: "Not specified",
                sleeve: "Not specified",
                neck: "Not specified",
                shoulder: "Not specified",
            },
            designNotes: "No additional design notes on file for this order.",
            images: [],
            status: statusLabel,
            progress: orderStatus === "completed" ? 100 : orderStatus === "in_progress" ? 60 : 20,
        };
    };

    // ---- Data fetching ----
    const fetchTailorData = useCallback(async () => {
        setIsLoading(true);
        try {
            // Resolve real shop ID from the backend instead of using hardcoded 1
            let shopId: number | null = null;
            if (user) {
                try {
                    const tailorShops = await listTailorShops(user.uid);
                    if (tailorShops && tailorShops.length > 0) {
                        shopId = tailorShops[0].shop_id;
                    }
                } catch {
                    // Could not resolve shop — proceed without shop-specific data
                }
            }

            const openReqsPromise = listOpenRequests();
            const shopReqsPromise = shopId !== null ? listShopRequests(shopId) : Promise.resolve([]);
            const shopOrdersPromise = shopId !== null ? listShopOrders(shopId) : Promise.resolve([]);

            const [openReqs, shopReqs, shopOrders] = await Promise.allSettled([
                openReqsPromise,
                shopReqsPromise,
                shopOrdersPromise,
            ]);

            const loadedRequests: OrderDetail[] =
                openReqs.status === "fulfilled" && openReqs.value && openReqs.value.length > 0
                    ? openReqs.value.map(mapRequestToOrderDetail)
                    : shopReqs.status === "fulfilled" && shopReqs.value && shopReqs.value.length > 0
                        ? shopReqs.value.map(mapRequestToOrderDetail)
                        : [];
            setRequests(loadedRequests);

            if (shopOrders.status === "fulfilled" && shopOrders.value) {
                const ongoing: OrderDetail[] = [];
                const pending: OrderDetail[] = [];
                shopOrders.value.forEach((ord) => {
                    const mapped = mapOrderToOrderDetail(ord);
                    // Backend uses order_status field
                    if (ord.order_status === "in_progress") {
                        ongoing.push(mapped);
                    } else {
                        pending.push(mapped);
                    }
                });
                setOngoingOrders(ongoing);
                setPendingOrders(pending);
            } else {
                setOngoingOrders([]);
                setPendingOrders([]);
            }

            setIsDbConnected(
                openReqs.status === "fulfilled" || shopReqs.status === "fulfilled" || shopOrders.status === "fulfilled"
            );
        } catch (err) {
            console.error("Failed to load tailor orders:", err);
            setIsDbConnected(false);
        } finally {
            setIsLoading(false);
        }
    }, [user]);

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
                        // Backend uses order_status (not status)
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
        if (isTailorView) {
            const lastSelected = localStorage.getItem("tailorSelectedShop");
            if (lastSelected) setShopName(lastSelected);
            fetchTailorData();
        } else {
            fetchClientData();
        }

        const hash = window.location.hash.replace("#", "");
        if (hash) {
            setHighlightedSection(hash);
            const timerScroll = setTimeout(() => {
                document.getElementById(hash)?.scrollIntoView({ behavior: "smooth", block: "center" });
            }, 100);
            const timerHighlight = setTimeout(() => setHighlightedSection(null), 2500);
            return () => {
                clearTimeout(timerScroll);
                clearTimeout(timerHighlight);
            };
        }
    }, [isTailorView, fetchTailorData, fetchClientData]);

    // ---- Tailor actions (persist to the API, then refresh from it) ----
    const handleAccept = async (req: OrderDetail) => {
        try {
            const numericBudget = Number(req.budget.replace(/[^0-9]/g, "")) || 10000;
            await submitBid({
                shop_request_id: req.rawId,
                bid_amount: numericBudget,
                message: "Accepted tailoring commission.",
            });
        } catch (err) {
            console.error("Failed to accept request:", err);
        } finally {
            fetchTailorData();
        }
    };

    const handleDeny = async (req: OrderDetail) => {
        try {
            await cancelRequest(req.rawId);
        } catch (err) {
            console.error("Failed to decline request:", err);
        } finally {
            fetchTailorData();
        }
    };

    const toggleExpand = (orderId: string) => {
        setExpandedOrderId(expandedOrderId === orderId ? null : orderId);
    };

    const scrollTo = (id: string) => {
        setHighlightedSection(id);
        document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "center" });
        setTimeout(() => setHighlightedSection(null), 2500);
    };

    // Full atelier spec details, shared by requests/pending/ongoing cards
    const renderOrderAtelierDetails = (order: OrderDetail) => (
        <div className="space-y-4 pt-4 border-t border-zinc-800/80 animate-fadeIn text-left">
            <div>
                <span className="text-[10px] font-black uppercase tracking-[0.25em] text-[#A39A7C] block mb-0.5">Request Details</span>
                <p className="text-[11px] text-zinc-400">Live specifics for this bespoke commission.</p>
            </div>

            {/* TARGET DATE & BUDGET */}
            <div className="bg-[#121316] rounded-2xl p-4 border border-zinc-800 space-y-3">
                <div>
                    <label className="text-[9px] font-mono font-bold tracking-[0.2em] uppercase text-zinc-400 block mb-1.5">TARGET DATE</label>
                    <div className="w-full bg-[#18191E] border-b border-[#F5CA53]/60 px-3.5 py-2.5 rounded-lg text-sm text-zinc-200 font-mono">
                        {order.targetDate}
                    </div>
                </div>
                <div>
                    <label className="text-[9px] font-mono font-bold tracking-[0.2em] uppercase text-zinc-400 block mb-1.5">BUDGET</label>
                    <div className="w-full bg-[#18191E] border-b border-[#F5CA53]/60 px-3.5 py-2.5 rounded-lg text-sm text-[#F5CA53] font-bold font-mono">
                        {order.budget}
                    </div>
                </div>
            </div>

            {/* GARMENT TYPE, FIT & MATERIAL SOURCING */}
            <div className="bg-[#121316] rounded-2xl p-4 border border-zinc-800 space-y-4">
                <div>
                    <label className="text-[9px] font-mono font-bold tracking-[0.2em] uppercase text-zinc-400 block mb-2">GARMENT TYPE</label>
                    <div className="flex flex-wrap gap-2">
                        {["Suit", "Shirt", "Overcoat", "Trousers"].map((type) => {
                            const isSelected = order.garmentType === type;
                            return (
                                <span
                                    key={type}
                                    className={`px-4 py-1.5 rounded-full text-xs font-mono font-medium transition-all ${isSelected
                                            ? "bg-[#F5CA53] text-black font-bold shadow-md shadow-[#F5CA53]/20"
                                            : "bg-[#18191E] text-zinc-400 border border-zinc-800"
                                        }`}
                                >
                                    {type}
                                </span>
                            );
                        })}
                    </div>
                </div>

                <div>
                    <label className="text-[9px] font-mono font-bold tracking-[0.2em] uppercase text-zinc-400 block mb-2">FIT PREFERENCE</label>
                    <div className="flex flex-wrap gap-2">
                        {["Men's Fit", "Women's Fit", "Unisex"].map((fit) => {
                            const isSelected = order.fitPreference === fit;
                            return (
                                <span
                                    key={fit}
                                    className={`px-4 py-1.5 rounded-full text-xs font-mono font-medium transition-all ${isSelected
                                            ? "bg-[#F5CA53] text-black font-bold shadow-md shadow-[#F5CA53]/20"
                                            : "bg-[#18191E] text-zinc-400 border border-zinc-800"
                                        }`}
                                >
                                    {fit}
                                </span>
                            );
                        })}
                        {order.fitPreference === "Not specified" && (
                            <span className="px-4 py-1.5 rounded-full text-xs font-mono font-medium bg-[#18191E] text-zinc-500 border border-dashed border-zinc-700">
                                Not specified
                            </span>
                        )}
                    </div>
                </div>

                <div>
                    <label className="text-[9px] font-mono font-bold tracking-[0.2em] uppercase text-zinc-400 block mb-2">MATERIAL SOURCING</label>
                    <div className="grid grid-cols-2 gap-3">
                        <div className={`p-3.5 rounded-xl border flex flex-col items-center justify-center text-center transition-all ${order.materialSourcing === "Providing Fabric"
                                ? "bg-[#F5CA53] text-black border-[#F5CA53] font-bold shadow-lg shadow-[#F5CA53]/20"
                                : "bg-[#18191E] border-zinc-800 text-zinc-400"
                            }`}>
                            <svg className="w-5 h-5 mb-1 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" /></svg>
                            <span className="text-[11px] font-mono">Providing Fabric</span>
                        </div>
                        <div className={`p-3.5 rounded-xl border flex flex-col items-center justify-center text-center transition-all ${order.materialSourcing === "Need Sourcing"
                                ? "bg-[#F5CA53] text-black border-[#F5CA53] font-bold shadow-lg shadow-[#F5CA53]/20"
                                : "bg-[#18191E] border-zinc-800 text-zinc-400"
                            }`}>
                            <svg className="w-5 h-5 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                            <span className="text-[11px] font-mono">Need Sourcing</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* MEASUREMENTS, REFERENCE PHOTOS & NOTES */}
            <div className="bg-[#121316] rounded-2xl p-4 border border-zinc-800 space-y-4">
                <div className="flex justify-between items-center">
                    <label className="text-[9px] font-mono font-bold tracking-[0.2em] uppercase text-zinc-400">KEY MEASUREMENTS</label>
                    <span className="text-[10px] font-mono bg-[#1C1D22] border border-zinc-700/80 px-2.5 py-0.5 rounded text-zinc-300">
                        {order.garmentType.toUpperCase()} ▾
                    </span>
                </div>

                <div className="grid grid-cols-2 gap-3 font-mono">
                    <div>
                        <span className="text-[9px] font-mono text-zinc-400 block mb-1">CHEST (IN)</span>
                        <div className="bg-[#18191E] border-b border-[#F5CA53]/50 px-3 py-2 rounded text-sm text-white">
                            {order.measurements.chest}
                        </div>
                    </div>
                    <div>
                        <span className="text-[9px] font-mono text-zinc-400 block mb-1">WAIST (IN)</span>
                        <div className="bg-[#18191E] border-b border-[#F5CA53]/50 px-3 py-2 rounded text-sm text-white">
                            {order.measurements.waist}
                        </div>
                    </div>
                    <div>
                        <span className="text-[9px] font-mono text-zinc-400 block mb-1">SLEEVE (IN)</span>
                        <div className="bg-[#18191E] border-b border-[#F5CA53]/50 px-3 py-2 rounded text-sm text-white">
                            {order.measurements.sleeve}
                        </div>
                    </div>
                    <div>
                        <span className="text-[9px] font-mono text-zinc-400 block mb-1">NECK (IN)</span>
                        <div className="bg-[#18191E] border-b border-[#F5CA53]/50 px-3 py-2 rounded text-sm text-white">
                            {order.measurements.neck}
                        </div>
                    </div>
                    <div className="col-span-2">
                        <span className="text-[9px] font-mono text-zinc-400 block mb-1">SHOULDER (IN)</span>
                        <div className="bg-[#18191E] border-b border-[#F5CA53]/50 px-3 py-2 rounded text-sm text-white">
                            {order.measurements.shoulder}
                        </div>
                    </div>
                </div>
                <p className="text-[10px] text-zinc-500 italic">Measurements not on file yet appear as &quot;Not specified&quot;.</p>

                <div>
                    <label className="text-[9px] font-mono font-bold tracking-[0.2em] uppercase text-zinc-400 block mb-2">REFERENCE PHOTOS</label>
                    {order.images && order.images.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {order.images.map((imgUrl, i) => (
                                <div
                                    key={i}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setPreviewImage(imgUrl);
                                    }}
                                    className="group relative rounded-2xl overflow-hidden border border-[#F5CA53]/30 bg-[#161510] aspect-[4/3] shadow-lg cursor-pointer hover:border-[#F5CA53] transition-all"
                                >
                                    <img
                                        src={imgUrl}
                                        alt="Client Reference Photo"
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                    />
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="border border-dashed border-[#F5CA53]/60 bg-[#161510]/50 rounded-2xl p-6 flex flex-col items-center justify-center text-center space-y-2">
                            <div className="w-10 h-10 rounded-full bg-[#F5CA53]/10 border border-[#F5CA53]/30 flex items-center justify-center text-[#F5CA53]">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                            </div>
                            <div>
                                <span className="text-xs font-mono font-bold text-white block">No Reference Image</span>
                                <span className="text-[10px] text-zinc-400">No sketches attached to this order.</span>
                            </div>
                        </div>
                    )}
                </div>

                <div>
                    <label className="text-[9px] font-mono font-bold tracking-[0.2em] uppercase text-zinc-400 block mb-1.5">DESIGN NOTES</label>
                    <div className="bg-[#18191E] border border-zinc-800 rounded-xl p-3.5 text-xs text-zinc-300 leading-relaxed font-sans">
                        {order.designNotes}
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#07080A] text-white flex flex-col justify-between selection:bg-[#F5CA53] selection:text-black font-sans">
            {/* IMAGE MODAL PREVIEW */}
            {previewImage && (
                <div
                    onClick={() => setPreviewImage(null)}
                    className="fixed inset-0 bg-black/90 backdrop-blur-md z-[9999] flex items-center justify-center p-4"
                >
                    <div className="relative max-w-lg w-full bg-[#18191E] rounded-3xl overflow-hidden border border-[#F5CA53]/40 shadow-2xl p-2">
                        <img src={previewImage} alt="Enlarged Reference" className="w-full rounded-2xl object-cover max-h-[75vh]" />
                        <div className="p-4 flex items-center justify-between">
                            <span className="text-xs font-mono text-[#F5CA53]">Client Reference Photo</span>
                            <button
                                onClick={() => setPreviewImage(null)}
                                className="px-3 py-1 bg-[#26282D] text-white text-xs font-bold rounded-lg border border-zinc-700 hover:bg-zinc-700"
                            >
                                Close ✕
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* TOP NAVIGATION HEADER */}
            <header className="w-full border-b border-zinc-900/90 bg-[#0A0B0E]/95 backdrop-blur-xl sticky top-0 z-50 transition-all duration-300">
                <div className="max-w-7xl mx-auto px-4 sm:px-8 py-4 flex items-center justify-between gap-4">
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
                                <img src="/logoo.png" alt="FITI Atelier Digital Logo" className="h-7 w-auto object-contain" />
                            </div>
                            <span className="font-extrabold tracking-widest text-sm text-white uppercase font-heading hidden sm:inline-block">
                                ATELIER DIGITAL
                            </span>
                        </Link>
                    </div>

                    <nav className="hidden lg:flex items-center space-x-8 text-xs font-bold tracking-wider text-zinc-400">
                        <Link href="/storefront" className="hover:text-[#F5CA53] transition-colors">Storefront</Link>
                        <Link href={homeUrl} className="hover:text-[#F5CA53] transition-colors">Dashboard</Link>
                        <Link href="/orders" className="text-white font-extrabold relative pb-1 border-b-2 border-[#F5CA53]">Orders</Link>
                        <Link href="/tailors" className="hover:text-[#F5CA53] transition-colors">Tailors</Link>
                    </nav>

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
                            Tailor Dash
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
                {isTailorView ? (
                    <>
                        {/* TAILOR VIEW HEADER */}
                        <div className="flex items-center justify-between gap-4 flex-wrap">
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 mb-0.5">
                                    {shopName || "Your Shop"} Dashboard
                                </p>
                                <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight font-heading">Manage Orders</h1>
                            </div>
                            <div className="flex items-center gap-2 px-3 py-1 bg-[#141418] rounded-full border border-zinc-800 text-[10px] text-zinc-400">
                                <span className={`w-2 h-2 rounded-full ${isDbConnected ? "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" : "bg-amber-400"}`}></span>
                                <span className="font-semibold uppercase tracking-wider">{isDbConnected ? "Live" : "Connecting"}</span>
                            </div>
                        </div>

                        {/* QUICK NAV PILLS */}
                        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none text-xs">
                            <button
                                onClick={() => scrollTo("requests")}
                                className={`px-4 py-1.5 rounded-full font-medium transition-all whitespace-nowrap ${highlightedSection === "requests"
                                        ? "bg-[#F5CA53] text-black shadow-lg shadow-[#F5CA53]/20"
                                        : "bg-[#18191E] text-zinc-400 border border-zinc-800 hover:text-white"
                                    }`}
                            >
                                Requests ({requests.length})
                            </button>
                            <button
                                onClick={() => scrollTo("pending")}
                                className={`px-4 py-1.5 rounded-full font-medium transition-all whitespace-nowrap ${highlightedSection === "pending"
                                        ? "bg-[#F5CA53] text-black shadow-lg shadow-[#F5CA53]/20"
                                        : "bg-[#18191E] text-zinc-400 border border-zinc-800 hover:text-white"
                                    }`}
                            >
                                Pending ({pendingOrders.length})
                            </button>
                            <button
                                onClick={() => scrollTo("ongoing")}
                                className={`px-4 py-1.5 rounded-full font-medium transition-all whitespace-nowrap ${highlightedSection === "ongoing"
                                        ? "bg-[#F5CA53] text-black shadow-lg shadow-[#F5CA53]/20"
                                        : "bg-[#18191E] text-zinc-400 border border-zinc-800 hover:text-white"
                                    }`}
                            >
                                On Going ({ongoingOrders.length})
                            </button>
                        </div>

                        {/* NEW REQUESTS */}
                        <div id="requests" className={`space-y-4 scroll-mt-36 p-2 rounded-[28px] transition-all duration-700 ${highlightedSection === "requests" ? "ring-2 ring-[#F5CA53] bg-[#F5CA53]/5 shadow-[0_0_30px_rgba(245,202,83,0.15)]" : ""
                            }`}>
                            <h2 className="text-[11px] font-bold tracking-[0.2em] uppercase text-[#F5CA53]">New Requests ({requests.length})</h2>

                            {requests.length === 0 ? (
                                <div className="bg-[#121318] border border-zinc-800/80 rounded-2xl p-6 text-center text-xs text-zinc-500">
                                    {isLoading ? "Loading requests…" : "No open client requests right now."}
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {requests.map((req) => {
                                        const isExpanded = expandedOrderId === req.id;
                                        return (
                                            <div key={req.id} className="bg-[#18191E] border border-[#F5CA53]/30 rounded-[24px] p-5 shadow-lg shadow-[#F5CA53]/5 relative overflow-hidden transition-all">
                                                <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-[#F5CA53] to-transparent"></div>
                                                <div onClick={() => toggleExpand(req.id)} className="flex justify-between items-start cursor-pointer group">
                                                    <div className="flex items-center gap-3">
                                                        {req.images && req.images[0] && (
                                                            <img src={req.images[0]} alt="Reference thumbnail" className="w-12 h-12 rounded-xl object-cover border border-[#F5CA53]/30 shrink-0" />
                                                        )}
                                                        <div>
                                                            <div className="flex items-center gap-2">
                                                                <h3 className="text-[16px] font-medium text-white group-hover:text-[#F5CA53] transition-colors">{req.title}</h3>
                                                                <span className="text-[9px] bg-[#F5CA53]/10 text-[#F5CA53] px-2 py-0.5 rounded-full border border-[#F5CA53]/30 font-bold uppercase tracking-wider">{req.garmentType}</span>
                                                            </div>
                                                            <p className="text-[11px] text-zinc-400 mt-0.5">Client: <span className="text-zinc-200 font-medium">{req.client}</span> &bull; <span className="text-[#F5CA53]">{req.date}</span></p>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <span className="text-[13px] font-bold text-[#F5CA53] bg-[#26282D] px-3 py-1 rounded-lg border border-zinc-700/50 block">{req.budget}</span>
                                                        <span className="text-[10px] text-zinc-500 hover:text-zinc-300 transition-colors mt-1 block">
                                                            {isExpanded ? "Collapse ▲" : "View Full Specs ▼"}
                                                        </span>
                                                    </div>
                                                </div>

                                                {isExpanded && renderOrderAtelierDetails(req)}

                                                <div className="grid grid-cols-2 gap-3 pt-3 mt-3 border-t border-zinc-800/60">
                                                    <button
                                                        onClick={() => handleAccept(req)}
                                                        className="w-full bg-[#F5CA53] text-black font-bold text-xs uppercase tracking-widest py-3 rounded-xl hover:bg-[#e4bb49] transition-all shadow-md shadow-[#F5CA53]/20 active:scale-[0.98] flex items-center justify-center gap-1.5"
                                                    >
                                                        Accept Order
                                                        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" /></svg>
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeny(req)}
                                                        className="w-full bg-[#26282D] text-white font-bold text-xs uppercase tracking-widest py-3 rounded-xl hover:bg-zinc-800 border border-zinc-700 transition-all active:scale-[0.98]"
                                                    >
                                                        Deny
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* PENDING */}
                        <div id="pending" className={`space-y-4 scroll-mt-36 p-2 rounded-[28px] transition-all duration-700 ${highlightedSection === "pending" ? "ring-2 ring-[#F5CA53] bg-[#F5CA53]/5 shadow-[0_0_30px_rgba(245,202,83,0.15)]" : ""
                            }`}>
                            <h2 className="text-[11px] font-bold tracking-[0.2em] uppercase text-zinc-500">Pending ({pendingOrders.length})</h2>

                            {pendingOrders.length === 0 ? (
                                <div className="bg-[#121318] border border-zinc-800/80 rounded-2xl p-6 text-center text-xs text-zinc-500">
                                    {isLoading ? "Loading…" : "No pending orders."}
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {pendingOrders.map((ord) => {
                                        const isExpanded = expandedOrderId === ord.id;
                                        return (
                                            <div key={ord.id} className="bg-[#18191E] border border-zinc-800/80 rounded-[20px] p-5 shadow-lg transition-all">
                                                <div onClick={() => toggleExpand(ord.id)} className="flex justify-between items-start cursor-pointer group">
                                                    <div className="flex items-center gap-3">
                                                        {ord.images && ord.images[0] && (
                                                            <img src={ord.images[0]} alt="Reference thumbnail" className="w-12 h-12 rounded-xl object-cover border border-zinc-700 shrink-0" />
                                                        )}
                                                        <div>
                                                            <h3 className="text-[15px] font-medium text-white group-hover:text-[#F5CA53] transition-colors">{ord.title}</h3>
                                                            <p className="text-[11px] text-zinc-400 mt-0.5">Client: {ord.client} &bull; {ord.date}</p>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest bg-zinc-800/50 border border-zinc-700 px-2.5 py-1 rounded-full">{ord.status}</span>
                                                        <span className="text-[10px] text-zinc-500 hover:text-zinc-300 transition-colors mt-1 block">
                                                            {isExpanded ? "Collapse ▲" : "View Full Specs ▼"}
                                                        </span>
                                                    </div>
                                                </div>
                                                {isExpanded && renderOrderAtelierDetails(ord)}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* ONGOING */}
                        <div id="ongoing" className={`space-y-4 scroll-mt-36 p-2 rounded-[28px] transition-all duration-700 ${highlightedSection === "ongoing" ? "ring-2 ring-[#F5CA53] bg-[#F5CA53]/5 shadow-[0_0_30px_rgba(245,202,83,0.15)]" : ""
                            }`}>
                            <h2 className="text-[11px] font-bold tracking-[0.2em] uppercase text-zinc-500">On Going ({ongoingOrders.length})</h2>

                            {ongoingOrders.length === 0 ? (
                                <div className="bg-[#121318] border border-zinc-800/80 rounded-2xl p-6 text-center text-xs text-zinc-500">
                                    {isLoading ? "Loading…" : "No orders in progress."}
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {ongoingOrders.map((ord) => {
                                        const isExpanded = expandedOrderId === ord.id;
                                        return (
                                            <div key={ord.id} className="bg-[#18191E] border border-zinc-800/80 hover:border-[#F5CA53]/30 rounded-[24px] p-5 shadow-lg transition-all">
                                                <div onClick={() => toggleExpand(ord.id)} className="flex justify-between items-start cursor-pointer group">
                                                    <div className="flex items-center gap-3">
                                                        {ord.images && ord.images[0] && (
                                                            <img src={ord.images[0]} alt="Reference thumbnail" className="w-12 h-12 rounded-xl object-cover border border-[#F5CA53]/30 shrink-0" />
                                                        )}
                                                        <div>
                                                            <h3 className="text-[15px] font-medium text-white group-hover:text-[#F5CA53] transition-colors">{ord.title}</h3>
                                                            <p className="text-[11px] text-zinc-400 mt-0.5">Client: {ord.client} &bull; <span className="text-zinc-500">{ord.id}</span></p>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <span className="text-[9px] font-bold text-[#F5CA53] uppercase tracking-widest bg-[#F5CA53]/10 border border-[#F5CA53]/30 px-2.5 py-1 rounded-full">{ord.status}</span>
                                                        <span className="text-[10px] text-zinc-500 hover:text-zinc-300 transition-colors mt-1 block">
                                                            {isExpanded ? "Collapse ▲" : "View Full Specs ▼"}
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className="space-y-1.5 pt-3 mt-3 border-t border-zinc-800/50">
                                                    <div className="flex justify-between items-center text-[11px] font-medium">
                                                        <span className="text-zinc-400">Fitting Timeline</span>
                                                        <span className="text-white">{ord.progress ?? 0}%</span>
                                                    </div>
                                                    <div className="w-full h-1.5 bg-[#26282D] rounded-full overflow-hidden">
                                                        <div className="h-full bg-[#F5CA53] transition-all duration-500" style={{ width: `${ord.progress ?? 0}%` }}></div>
                                                    </div>
                                                </div>

                                                {isExpanded && renderOrderAtelierDetails(ord)}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </>
                ) : (
                    <>
                        {/* CLIENT VIEW */}
                        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                            <div>
                                <span className="text-[10px] font-mono tracking-[0.25em] text-[#F5CA53] uppercase block mb-1">
                                    ORDER MANAGEMENT &amp; TRACKING
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
                                        No commissions matched &quot;{searchQuery}&quot;. Try searching by ID, tailor name, or status.
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
                    </>
                )}
            </main>

            {/* FOOTER */}
            <footer className="w-full border-t border-zinc-900/90 bg-[#07080A] py-8 px-4 sm:px-8 relative z-20">
                <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
                    <span className="font-extrabold text-sm tracking-widest text-white uppercase font-heading">ATELIER DIGITAL</span>
                    <div className="flex gap-6 text-[10px] font-mono uppercase font-bold text-zinc-400">
                        <Link href="/privacy" className="hover:text-[#F5CA53] transition-colors">Privacy Policy</Link>
                        <Link href="/terms" className="hover:text-[#F5CA53] transition-colors">Terms of Service</Link>
                        <Link href="/contact" className="hover:text-[#F5CA53] transition-colors">Contact Support</Link>
                    </div>
                </div>
            </footer>
        </div>
    );
}