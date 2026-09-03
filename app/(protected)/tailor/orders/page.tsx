"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/firebase/AuthContext";
import {
    listShopOrders,
    listShopRequests,
    listOpenRequests,
    cancelRequest,
    submitBid,
    updateOrderStatus,
} from "@/lib/api/endpoints/orders";
import { listTailorShops } from "@/lib/api/endpoints/shops";
import type { ClothingRequest, Order } from "@/lib/api/types/order";
import FullPageLock from "@/components/FullPageLock";

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
        notes?: string;
    };
    designNotes: string;
    images: string[];
    status: string;
    progress?: number;
    clientPhone?: string;
    clientCity?: string;
}

export default function TailorOrdersPage() {
    const { user } = useAuth();

    const [previewImage, setPreviewImage] = useState<string | null>(null);
    const [quotePrice, setQuotePrice] = useState<string>("");
    const [quoteMessage, setQuoteMessage] = useState<string>("");
    const [activeTab, setActiveTab] = useState<"requests" | "quoted" | "ongoing" | "complete">("requests");
    const [selectedOrder, setSelectedOrder] = useState<OrderDetail | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isActionSubmitting, setIsActionSubmitting] = useState(false);
    const [isDbConnected, setIsDbConnected] = useState(false);

    const [shopName, setShopName] = useState("");
    const [requests, setRequests] = useState<OrderDetail[]>([]);
    const [pendingQuotes, setPendingQuotes] = useState<OrderDetail[]>([]);
    const [ongoingOrders, setOngoingOrders] = useState<OrderDetail[]>([]);
    const [completeOrders, setCompleteOrders] = useState<OrderDetail[]>([]);

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

        const clientName = req.client?.display_name
            ? req.client.display_name
            : req.client_id ? (req.client_id.length > 15 ? req.client_id.substring(0, 10) + "..." : req.client_id) : "Client";

        return {
            id: `REQ-${req.request_id}`,
            rawId: req.request_id,
            title: req.clothing_category || "Bespoke Commission",
            client: clientName,
            date: req.created_at ? new Date(req.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—",
            targetDate: req.target_date ? new Date(req.target_date).toLocaleDateString("en-US", { month: "2-digit", day: "2-digit", year: "numeric" }) : "TBD",
            budget: req.target_budget ? `LKR ${Number(req.target_budget).toLocaleString()}` : "Custom Quote",
            garmentType,
            fitPreference: isFemale ? "Women's Fit" : req.gender === "unisex" ? "Unisex" : req.gender === "male" ? "Men's Fit" : "Not specified",
            materialSourcing: req.fabric_status === "client_provided" ? "Providing Fabric" : req.fabric_status ? "Need Sourcing" : "Not specified",
            measurements: {
                chest: req.measurement?.chest ? String(req.measurement.chest) : "Not specified",
                waist: req.measurement?.waist ? String(req.measurement.waist) : "Not specified",
                sleeve: req.measurement?.sleeve ? String(req.measurement.sleeve) : "Not specified",
                neck: req.measurement?.neck ? String(req.measurement.neck) : "Not specified",
                shoulder: req.measurement?.shoulder ? String(req.measurement.shoulder) : "Not specified",
                notes: req.measurement?.notes || "",
            },
            designNotes: req.description || "No design notes provided.",
            images: req.design_images && req.design_images.length > 0 ? req.design_images.map(img => img.image_url) : [defaultImg],
            status: "REQUESTED",
            clientPhone: req.client?.phone || "",
            clientCity: req.request_location || req.client?.city || "",
        };
    };

    const mapOrderToOrderDetail = (ord: Order): OrderDetail => {
        const orderStatus = ord.order_status;
        const statusLabel = orderStatus === "in_progress" ? "IN FITTING" : (orderStatus || "pending").replace(/_/g, " ").toUpperCase();

        const req = ord.clothing_request;
        const clientName = req?.client?.display_name
            ? req.client.display_name
            : req?.client_id ? (req.client_id.length > 15 ? req.client_id.substring(0, 10) + "..." : req.client_id) : `Client #${ord.shop_request_id}`;

        const isFemale = req?.gender === "female";
        const garmentTypeStr = req?.clothing_category
            ? req.clothing_category.charAt(0).toUpperCase() + req.clothing_category.slice(1)
            : "Suit";

        let garmentType: "Suit" | "Shirt" | "Overcoat" | "Trousers" = "Suit";
        if (garmentTypeStr.includes("Shirt") || garmentTypeStr.includes("shirt")) garmentType = "Shirt";
        else if (garmentTypeStr.includes("Coat") || garmentTypeStr.includes("coat")) garmentType = "Overcoat";
        else if (garmentTypeStr.includes("Trouser") || garmentTypeStr.includes("Pant") || garmentTypeStr.includes("trouser") || garmentTypeStr.includes("pant")) garmentType = "Trousers";

        return {
            id: `ORD-${ord.order_id}`,
            rawId: ord.order_id,
            title: `Order #${ord.order_id}`,
            client: clientName,
            date: ord.created_at ? new Date(ord.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—",
            targetDate: ord.completed_date ? new Date(ord.completed_date).toLocaleDateString("en-US", { month: "2-digit", day: "2-digit", year: "numeric" }) : "TBD",
            budget: ord.accepted_price ? `LKR ${Number(ord.accepted_price).toLocaleString()}` : "Pending",
            garmentType,
            fitPreference: isFemale ? "Women's Fit" : req?.gender === "unisex" ? "Unisex" : req?.gender === "male" ? "Men's Fit" : "Not specified",
            materialSourcing: req?.fabric_status === "client_provided" ? "Providing Fabric" : req?.fabric_status ? "Need Sourcing" : "Not specified",
            measurements: {
                chest: req?.measurement?.chest ? String(req.measurement.chest) : "Not specified",
                waist: req?.measurement?.waist ? String(req.measurement.waist) : "Not specified",
                sleeve: req?.measurement?.sleeve ? String(req.measurement.sleeve) : "Not specified",
                neck: req?.measurement?.neck ? String(req.measurement.neck) : "Not specified",
                shoulder: req?.measurement?.shoulder ? String(req.measurement.shoulder) : "Not specified",
                notes: req?.measurement?.notes || "",
            },
            designNotes: req?.description || "No additional design notes on file for this order.",
            images: req?.design_images && req.design_images.length > 0 ? req.design_images.map(img => img.image_url) : [],
            status: statusLabel,
            progress: orderStatus === "completed" ? 100 : orderStatus === "in_progress" ? 60 : 20,
            clientPhone: req?.client?.phone || "",
            clientCity: req?.request_location || req?.client?.city || "",
        };
    };

    const fetchTailorData = useCallback(async () => {
        setIsLoading(true);
        try {
            let shopId: number | null = null;
            if (user) {
                try {
                    const tailorShops = await listTailorShops(user.uid);
                    if (tailorShops && tailorShops.length > 0) {
                        shopId = tailorShops[0].shop_id;
                    }
                } catch {
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

            const allReqsMap = new Map<number, ClothingRequest>();
            if (openReqs.status === "fulfilled" && openReqs.value) {
                openReqs.value.forEach(r => allReqsMap.set(r.request_id, r));
            }
            if (shopReqs.status === "fulfilled" && shopReqs.value) {
                shopReqs.value.forEach(sr => {
                    if (sr.clothing_request) {
                        allReqsMap.set(sr.request_id, sr.clothing_request);
                    }
                });
            }

            const newInqs: OrderDetail[] = [];
            const quoted: OrderDetail[] = [];

            Array.from(allReqsMap.values()).forEach(req => {
                const mySr = shopId ? req.shop_requests?.find(sr => sr.shop_id === shopId) : null;
                const isBidding = req.request_type === "bidding";

                if (mySr && mySr.status === "quoted") {
                    const mapped = mapRequestToOrderDetail(req);
                    mapped.rawId = mySr.shop_request_id;
                    mapped.status = "QUOTED";
                    quoted.push(mapped);
                } else if ((mySr && mySr.status === "pending") || (!mySr && isBidding)) {
                    const mapped = mapRequestToOrderDetail(req);
                    if (mySr) {
                        mapped.rawId = mySr.shop_request_id;
                    }
                    newInqs.push(mapped);
                }
            });

            setRequests(newInqs);
            setPendingQuotes(quoted);

            if (shopOrders.status === "fulfilled" && shopOrders.value) {
                const ongoing: OrderDetail[] = [];
                const complete: OrderDetail[] = [];
                shopOrders.value.forEach((ord) => {
                    const mapped = mapOrderToOrderDetail(ord);
                    if (ord.order_status === "in_progress") {
                        ongoing.push(mapped);
                    } else if (ord.order_status === "completed") {
                        complete.push(mapped);
                    }
                });
                setOngoingOrders(ongoing);
                setCompleteOrders(complete);
            } else {
                setOngoingOrders([]);
                setCompleteOrders([]);
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

    useEffect(() => {
        const lastSelected = localStorage.getItem("tailorSelectedShop");
        if (lastSelected) setShopName(lastSelected);
        fetchTailorData();
    }, [fetchTailorData]);

    const handleIssueQuotation = async (req: OrderDetail) => {
        if (!quotePrice) return;
        setIsActionSubmitting(true);
        try {
            await submitBid({
                shop_request_id: req.rawId,
                bid_amount: Number(quotePrice),
                message: quoteMessage || "Quotation submitted.",
            });
            setSelectedOrder(null);
            setQuotePrice("");
            setQuoteMessage("");
        } catch (err) {
            console.error("Failed to issue quotation:", err);
        } finally {
            await fetchTailorData();
            setIsActionSubmitting(false);
        }
    };

    const handleDeny = async (req: OrderDetail) => {
        setIsActionSubmitting(true);
        try {
            await cancelRequest(req.rawId);
        } catch (err) {
            console.error("Failed to decline request:", err);
        } finally {
            await fetchTailorData();
            setIsActionSubmitting(false);
        }
    };

    const handleCompleteOrder = async (ord: OrderDetail) => {
        setIsActionSubmitting(true);
        try {
            await updateOrderStatus(ord.rawId, "completed");
        } catch (err) {
            console.error("Failed to complete order:", err);
        } finally {
            await fetchTailorData();
            setIsActionSubmitting(false);
        }
    };

    const renderOrderAtelierDetails = (order: OrderDetail) => (
        <div className="space-y-4 pt-4 border-t border-accent/20 text-left">
            {order.status === "REQUESTED" && (
                <div className="bg-warm-beige rounded-2xl p-4 border border-accent/30 space-y-4 mt-4 relative overflow-hidden">
                    <div>
                        <span className="text-[10px] font-mono font-bold uppercase tracking-[0.25em] text-accent block mb-0.5">Issue Quotation</span>
                        <p className="text-[11px] text-earth-text/70 font-medium">Submit your bid and message to the client directly.</p>
                    </div>

                    <div className="space-y-3">
                        <div>
                            <label className="text-[9px] font-mono font-bold tracking-[0.2em] uppercase text-earth-text/60 block mb-1.5">OFFERED PRICE (LKR)</label>
                            <input
                                type="number"
                                value={quotePrice}
                                onChange={(e) => setQuotePrice(e.target.value)}
                                placeholder="e.g. 15000"
                                className="w-full bg-cream-bg border border-accent/20 focus:border-accent/60 px-3.5 py-2.5 rounded-xl text-xs text-earth-text font-bold font-mono outline-none shadow-sm transition-colors"
                            />
                        </div>
                        <div>
                            <label className="text-[9px] font-mono font-bold tracking-[0.2em] uppercase text-earth-text/60 block mb-1.5">MESSAGE TO CLIENT</label>
                            <textarea
                                value={quoteMessage}
                                onChange={(e) => setQuoteMessage(e.target.value)}
                                placeholder="e.g. I can tailor this suit in 2 weeks. The fabric is included in the price."
                                rows={3}
                                className="w-full bg-cream-bg border border-accent/20 focus:border-accent/60 px-3.5 py-2.5 rounded-xl text-xs text-earth-text font-sans outline-none shadow-sm transition-colors resize-none"
                            />
                        </div>
                        <button
                            onClick={() => handleIssueQuotation(order)}
                            disabled={!quotePrice}
                            className="w-full bg-accent disabled:opacity-50 text-cream-bg font-bold text-xs uppercase tracking-wider py-3.5 rounded-xl hover:bg-accent-hover transition-all shadow-sm flex items-center justify-center gap-1.5"
                        >
                            Submit Quotation
                            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" /></svg>
                        </button>
                    </div>
                </div>
            )}

            <div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-[0.25em] text-earth-text/60 block mb-0.5">Request Details</span>
                <p className="text-[11px] text-earth-text/70 font-medium">Live specifics for this bespoke commission.</p>
            </div>

            <div className="bg-warm-beige rounded-2xl p-4 border border-accent/20 space-y-3">
                <div>
                    <label className="text-[9px] font-mono font-bold tracking-[0.2em] uppercase text-earth-text/60 block mb-1.5">TARGET DATE</label>
                    <div className="w-full bg-cream-bg border-b border-accent/30 px-3.5 py-2.5 rounded-lg text-xs text-earth-text font-mono font-bold">
                        {order.targetDate}
                    </div>
                </div>
                <div>
                    <label className="text-[9px] font-mono font-bold tracking-[0.2em] uppercase text-earth-text/60 block mb-1.5">LOCATION & CONTACT</label>
                    <div className="w-full bg-cream-bg border-b border-accent/30 px-3.5 py-2.5 rounded-lg text-xs text-earth-text font-medium flex flex-col gap-1">
                        <span className="flex items-center gap-1.5"><svg className="w-3.5 h-3.5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg> {order.clientCity || "Not specified"}</span>
                        <span className="flex items-center gap-1.5"><svg className="w-3.5 h-3.5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg> {order.clientPhone || "Not specified"}</span>
                    </div>
                </div>
                <div>
                    <label className="text-[9px] font-mono font-bold tracking-[0.2em] uppercase text-earth-text/60 block mb-1.5">BUDGET</label>
                    <div className="w-full bg-cream-bg border-b border-accent/30 px-3.5 py-2.5 rounded-lg text-xs text-accent font-black font-mono">
                        {order.budget}
                    </div>
                </div>
            </div>

            <div className="bg-warm-beige rounded-2xl p-4 border border-accent/20 space-y-4">
                <div>
                    <label className="text-[9px] font-mono font-bold tracking-[0.2em] uppercase text-earth-text/60 block mb-2">GARMENT TYPE</label>
                    <div className="flex flex-wrap gap-2">
                        {["Suit", "Shirt", "Overcoat", "Trousers"].map((type) => {
                            const isSelected = order.garmentType === type;
                            return (
                                <span
                                    key={type}
                                    className={`px-4 py-1.5 rounded-full text-xs font-mono font-bold transition-all ${isSelected
                                        ? "bg-accent text-cream-bg shadow-sm"
                                        : "bg-cream-bg text-earth-text/70 border border-accent/20"
                                        }`}
                                >
                                    {type}
                                </span>
                            );
                        })}
                    </div>
                </div>

                <div>
                    <label className="text-[9px] font-mono font-bold tracking-[0.2em] uppercase text-earth-text/60 block mb-2">FIT PREFERENCE</label>
                    <div className="flex flex-wrap gap-2">
                        {["Men's Fit", "Women's Fit", "Unisex"].map((fit) => {
                            const isSelected = order.fitPreference === fit;
                            return (
                                <span
                                    key={fit}
                                    className={`px-4 py-1.5 rounded-full text-xs font-mono font-bold transition-all ${isSelected
                                        ? "bg-accent text-cream-bg shadow-sm"
                                        : "bg-cream-bg text-earth-text/70 border border-accent/20"
                                        }`}
                                >
                                    {fit}
                                </span>
                            );
                        })}
                        {order.fitPreference === "Not specified" && (
                            <span className="px-4 py-1.5 rounded-full text-xs font-mono font-medium bg-cream-bg text-earth-text/50 border border-dashed border-accent/30">
                                Not specified
                            </span>
                        )}
                    </div>
                </div>

                <div>
                    <label className="text-[9px] font-mono font-bold tracking-[0.2em] uppercase text-earth-text/60 block mb-2">MATERIAL SOURCING</label>
                    <div className="grid grid-cols-2 gap-3">
                        <div className={`p-3.5 rounded-xl border flex flex-col items-center justify-center text-center transition-all ${order.materialSourcing === "Providing Fabric"
                            ? "bg-accent text-cream-bg border-accent font-bold shadow-sm"
                            : "bg-cream-bg border-accent/20 text-earth-text/70"
                            }`}>
                            <svg className="w-5 h-5 mb-1 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" /></svg>
                            <span className="text-[11px] font-mono font-bold">Providing Fabric</span>
                        </div>
                        <div className={`p-3.5 rounded-xl border flex flex-col items-center justify-center text-center transition-all ${order.materialSourcing === "Need Sourcing"
                            ? "bg-accent text-cream-bg border-accent font-bold shadow-sm"
                            : "bg-cream-bg border-accent/20 text-earth-text/70"
                            }`}>
                            <svg className="w-5 h-5 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                            <span className="text-[11px] font-mono font-bold">Need Sourcing</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-warm-beige rounded-2xl p-4 border border-accent/20 space-y-4">
                <div className="flex justify-between items-center">
                    <label className="text-[9px] font-mono font-bold tracking-[0.2em] uppercase text-earth-text/60">KEY MEASUREMENTS</label>
                    <span className="text-[10px] font-mono bg-cream-bg border border-accent/20 px-2.5 py-0.5 rounded text-earth-text/70 font-bold">
                        {order.garmentType.toUpperCase()} ▾
                    </span>
                </div>

                <div className="grid grid-cols-2 gap-3 font-mono">
                    <div>
                        <span className="text-[9px] font-mono text-earth-text/60 font-bold block mb-1">CHEST (CM)</span>
                        <div className="bg-cream-bg border-b-2 border-accent/40 px-3 py-2 rounded text-xs text-earth-text font-bold">
                            {order.measurements.chest}
                        </div>
                    </div>
                    <div>
                        <span className="text-[9px] font-mono text-earth-text/60 font-bold block mb-1">WAIST (CM)</span>
                        <div className="bg-cream-bg border-b-2 border-accent/40 px-3 py-2 rounded text-xs text-earth-text font-bold">
                            {order.measurements.waist}
                        </div>
                    </div>
                    <div>
                        <span className="text-[9px] font-mono text-earth-text/60 font-bold block mb-1">SLEEVE (CM)</span>
                        <div className="bg-cream-bg border-b-2 border-accent/40 px-3 py-2 rounded text-xs text-earth-text font-bold">
                            {order.measurements.sleeve}
                        </div>
                    </div>
                    <div>
                        <span className="text-[9px] font-mono text-earth-text/60 font-bold block mb-1">NECK (CM)</span>
                        <div className="bg-cream-bg border-b-2 border-accent/40 px-3 py-2 rounded text-xs text-earth-text font-bold">
                            {order.measurements.neck}
                        </div>
                    </div>
                    <div className="col-span-2">
                        <span className="text-[9px] font-mono text-earth-text/60 font-bold block mb-1">SHOULDER (CM)</span>
                        <div className="bg-cream-bg border-b-2 border-accent/40 px-3 py-2 rounded text-xs text-earth-text font-bold">
                            {order.measurements.shoulder}
                        </div>
                    </div>
                </div>
                {order.measurements.notes && (
                    <div className="mt-4 p-3 bg-cream-bg border border-accent/20 rounded-xl">
                        <span className="text-[9px] font-mono text-earth-text/60 font-bold block mb-1">MEASUREMENT NOTES</span>
                        <p className="text-xs text-earth-text/80 leading-relaxed font-sans">{order.measurements.notes}</p>
                    </div>
                )}
                <p className="text-[10px] text-earth-text/50 italic mt-2">Measurements not on file yet appear as &quot;Not specified&quot;.</p>

                <div>
                    <label className="text-[9px] font-mono font-bold tracking-[0.2em] uppercase text-earth-text/60 block mb-2">REFERENCE PHOTOS</label>
                    {order.images && order.images.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {order.images.map((imgUrl, i) => (
                                <div
                                    key={i}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setPreviewImage(imgUrl);
                                    }}
                                    className="group relative rounded-2xl overflow-hidden border border-accent/30 bg-cream-bg aspect-[4/3] shadow-sm cursor-pointer hover:border-accent transition-all"
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
                        <div className="border border-dashed border-accent/40 bg-cream-bg/50 rounded-2xl p-6 flex flex-col items-center justify-center text-center space-y-2">
                            <div className="w-10 h-10 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center text-accent">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                            </div>
                            <div>
                                <span className="text-xs font-bold text-earth-text block">No Reference Image</span>
                                <span className="text-[10px] text-earth-text/60">No sketches attached to this order.</span>
                            </div>
                        </div>
                    )}
                </div>

                <div>
                    <label className="text-[9px] font-mono font-bold tracking-[0.2em] uppercase text-earth-text/60 block mb-1.5">DESIGN NOTES</label>
                    <div className="bg-cream-bg border border-accent/20 rounded-xl p-3.5 text-xs text-earth-text/80 leading-relaxed font-sans">
                        {order.designNotes}
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-warm-beige text-earth-text flex flex-col justify-between selection:bg-accent selection:text-cream-bg font-sans">
            <FullPageLock
                isSubmitting={isActionSubmitting}
                title="Processing Order Action"
                message="Submitting quotation and updating commission status..."
            />
            {previewImage && (
                <div
                    onClick={() => setPreviewImage(null)}
                    className="fixed inset-0 bg-earth-text/60 backdrop-blur-md z-[9999] flex items-center justify-center p-4"
                >
                    <div className="relative max-w-lg w-full bg-cream-bg rounded-3xl overflow-hidden border border-accent/40 shadow-2xl p-2">
                        <img src={previewImage} alt="Enlarged Reference" className="w-full rounded-2xl object-cover max-h-[75vh]" />
                        <div className="p-4 flex items-center justify-between">
                            <span className="text-xs font-mono text-accent font-bold">Client Reference Photo</span>
                            <button
                                onClick={() => setPreviewImage(null)}
                                className="px-3 py-1 bg-warm-beige text-earth-text text-xs font-bold rounded-lg border border-accent/30 hover:bg-accent hover:text-cream-bg transition-all"
                            >
                                Close ✕
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <main className="max-w-7xl w-full mx-auto px-4 sm:px-8 py-12 flex-1 space-y-8">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                    <div>
                        <p className="text-[10px] font-mono font-bold uppercase tracking-[0.25em] text-earth-text/60 mb-0.5">
                            {shopName || "Your Shop"} Dashboard
                        </p>
                        <h1 className="text-3xl sm:text-4xl font-extrabold text-earth-text tracking-tight font-heading">Manage Orders</h1>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-cream-bg rounded-full border border-accent/20 text-[10px] text-earth-text/70 shadow-sm">
                        <span className={`w-2 h-2 rounded-full ${isDbConnected ? "bg-emerald-600 shadow-sm" : "bg-amber-600"}`}></span>
                        <span className="font-bold font-mono uppercase tracking-wider">{isDbConnected ? "Live" : "Connecting"}</span>
                    </div>
                </div>

                <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none text-xs">
                    <button
                        onClick={() => setActiveTab("requests")}
                        className={`px-4 py-2 rounded-full font-bold transition-all whitespace-nowrap ${activeTab === "requests"
                            ? "bg-accent text-cream-bg shadow-sm"
                            : "bg-cream-bg text-earth-text/70 border border-accent/20 hover:text-earth-text"
                            }`}
                    >
                        New Inquiries ({requests.length})
                    </button>
                    <button
                        onClick={() => setActiveTab("quoted")}
                        className={`px-4 py-2 rounded-full font-bold transition-all whitespace-nowrap ${activeTab === "quoted"
                            ? "bg-accent text-cream-bg shadow-sm"
                            : "bg-cream-bg text-earth-text/70 border border-accent/20 hover:text-earth-text"
                            }`}
                    >
                        Pending Quotations ({pendingQuotes.length})
                    </button>
                    <button
                        onClick={() => setActiveTab("ongoing")}
                        className={`px-4 py-2 rounded-full font-bold transition-all whitespace-nowrap ${activeTab === "ongoing"
                            ? "bg-accent text-cream-bg shadow-sm"
                            : "bg-cream-bg text-earth-text/70 border border-accent/20 hover:text-earth-text"
                            }`}
                    >
                        On Going ({ongoingOrders.length})
                    </button>
                    <button
                        onClick={() => setActiveTab("complete")}
                        className={`px-4 py-2 rounded-full font-bold transition-all whitespace-nowrap ${activeTab === "complete"
                            ? "bg-accent text-cream-bg shadow-sm"
                            : "bg-cream-bg text-earth-text/70 border border-accent/20 hover:text-earth-text"
                            }`}
                    >
                        Complete ({completeOrders.length})
                    </button>
                </div>

                {activeTab === "requests" && (
                    <div className="space-y-4 p-2 rounded-[28px]">
                        <h2 className="text-[11px] font-mono font-bold tracking-[0.2em] uppercase text-accent">New Inquiries ({requests.length})</h2>

                        {requests.length === 0 ? (
                            <div className="bg-cream-bg border border-accent/20 rounded-2xl p-8 text-center text-xs text-earth-text/60 shadow-sm font-medium">
                                {isLoading ? "Loading requests…" : "No open client requests right now."}
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {requests.map((req) => (
                                    <div key={req.id} className="bg-cream-bg border border-accent/20 hover:border-accent/50 rounded-2xl p-5 shadow-sm hover:shadow-md relative overflow-hidden transition-all">
                                        <div className="absolute top-0 left-0 w-1.5 h-full bg-accent"></div>
                                        <div onClick={() => setSelectedOrder(req)} className="flex justify-between items-start cursor-pointer group">
                                            <div className="flex items-center gap-3">
                                                {req.images && req.images[0] && (
                                                    <img src={req.images[0]} alt="Reference thumbnail" className="w-12 h-12 rounded-xl object-cover border border-accent/30 shrink-0" />
                                                )}
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <h3 className="text-base font-extrabold text-earth-text font-heading group-hover:text-accent transition-colors">{req.garmentType}</h3>
                                                    </div>
                                                    <div className="text-[11px] text-earth-text/70 mt-1 space-y-0.5 font-medium">
                                                        <p className="flex items-center gap-1.5"><svg className="w-3 h-3 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg> {req.clientCity || "Location not specified"}</p>
                                                        <p className="flex items-center gap-1.5"><svg className="w-3 h-3 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg> {req.clientPhone || "Phone not specified"}</p>
                                                        <p className="flex items-center gap-1.5"><svg className="w-3 h-3 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg> {req.date}</p>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <span className="text-xs font-mono font-bold text-accent bg-warm-beige px-3 py-1 rounded-xl border border-accent/20 inline-block">{req.budget}</span>
                                                <span className="text-[10px] font-bold text-earth-text/50 group-hover:text-accent transition-colors mt-1 block">
                                                    Open Details ↗
                                                </span>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-3 pt-3 mt-3 border-t border-accent/15">
                                            <button
                                                onClick={(e) => { e.stopPropagation(); setSelectedOrder(req); }}
                                                className="w-full bg-accent hover:bg-accent-hover text-cream-bg font-bold text-xs uppercase tracking-wider py-3 rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5"
                                            >
                                                Issue Quote
                                                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" /></svg>
                                            </button>
                                            <button
                                                onClick={() => handleDeny(req)}
                                                className="w-full bg-warm-beige text-earth-text font-bold text-xs uppercase tracking-wider py-3 rounded-xl hover:bg-earth-text/10 border border-accent/20 transition-all"
                                            >
                                                Deny
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {activeTab === "quoted" && (
                    <div className="space-y-4 p-2 rounded-[28px]">
                        <h2 className="text-[11px] font-mono font-bold tracking-[0.2em] uppercase text-earth-text/60">Pending Quotations ({pendingQuotes.length})</h2>

                        {pendingQuotes.length === 0 ? (
                            <div className="bg-cream-bg border border-accent/20 rounded-2xl p-8 text-center text-xs text-earth-text/60 shadow-sm font-medium">
                                {isLoading ? "Loading…" : "No pending quotations."}
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {pendingQuotes.map((ord) => (
                                    <div key={ord.id} className="bg-cream-bg border border-accent/20 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all">
                                        <div onClick={() => setSelectedOrder(ord)} className="flex justify-between items-start cursor-pointer group">
                                            <div className="flex items-center gap-3">
                                                {ord.images && ord.images[0] && (
                                                    <img src={ord.images[0]} alt="Reference thumbnail" className="w-12 h-12 rounded-xl object-cover border border-accent/30 shrink-0" />
                                                )}
                                                <div>
                                                    <h3 className="text-base font-extrabold text-earth-text font-heading group-hover:text-accent transition-colors">{ord.title}</h3>
                                                    <p className="text-xs text-earth-text/70 mt-0.5 font-medium">Client: {ord.client} &bull; {ord.date}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <span className="text-[9px] font-mono font-bold text-accent uppercase tracking-widest bg-accent/10 border border-accent/20 px-2.5 py-1 rounded-full">{ord.status}</span>
                                                <span className="text-[10px] font-bold text-earth-text/50 group-hover:text-accent transition-colors mt-1 block">
                                                    Open Details ↗
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {activeTab === "ongoing" && (
                    <div className="space-y-4 p-2 rounded-[28px]">
                        <h2 className="text-[11px] font-mono font-bold tracking-[0.2em] uppercase text-earth-text/60">On Going ({ongoingOrders.length})</h2>

                        {ongoingOrders.length === 0 ? (
                            <div className="bg-cream-bg border border-accent/20 rounded-2xl p-8 text-center text-xs text-earth-text/60 shadow-sm font-medium">
                                {isLoading ? "Loading…" : "No orders in progress."}
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {ongoingOrders.map((ord) => (
                                    <div key={ord.id} className="bg-cream-bg border border-accent/20 hover:border-emerald-700/50 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all">
                                        <div onClick={() => setSelectedOrder(ord)} className="flex justify-between items-start cursor-pointer group">
                                            <div className="flex items-center gap-3">
                                                {ord.images && ord.images[0] && (
                                                    <img src={ord.images[0]} alt="Reference thumbnail" className="w-12 h-12 rounded-xl object-cover border border-accent/30 shrink-0" />
                                                )}
                                                <div>
                                                    <h3 className="text-base font-extrabold text-earth-text font-heading group-hover:text-accent transition-colors">{ord.title}</h3>
                                                    <p className="text-xs text-earth-text/70 mt-0.5 font-medium">Client: {ord.client} &bull; <span className="font-mono text-earth-text/50">{ord.id}</span></p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <span className="text-[9px] font-mono font-bold text-emerald-800 uppercase tracking-widest bg-emerald-600/10 border border-emerald-600/20 px-2.5 py-1 rounded-full">{ord.status}</span>
                                                <span className="text-[10px] font-bold text-earth-text/50 group-hover:text-accent transition-colors mt-1 block">
                                                    Open Details ↗
                                                </span>
                                            </div>
                                        </div>

                                        <div className="space-y-3 pt-3 mt-3 border-t border-accent/15">
                                            <div className="space-y-1.5">
                                                <div className="flex justify-between items-center text-xs font-bold">
                                                    <span className="text-earth-text/70">Fitting Timeline</span>
                                                    <span className="text-earth-text font-mono">{ord.progress ?? 0}%</span>
                                                </div>
                                                <div className="w-full h-2 bg-warm-beige rounded-full border border-accent/20 overflow-hidden">
                                                    <div className="h-full bg-accent transition-all duration-500" style={{ width: `${ord.progress ?? 0}%` }}></div>
                                                </div>
                                            </div>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleCompleteOrder(ord); }}
                                                className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs uppercase tracking-wider py-2.5 rounded-xl transition-all shadow-sm"
                                            >
                                                Mark as Complete
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {activeTab === "complete" && (
                    <div className="space-y-4 p-2 rounded-[28px]">
                        <h2 className="text-[11px] font-mono font-bold tracking-[0.2em] uppercase text-earth-text/60">Complete ({completeOrders.length})</h2>

                        {completeOrders.length === 0 ? (
                            <div className="bg-cream-bg border border-accent/20 rounded-2xl p-8 text-center text-xs text-earth-text/60 shadow-sm font-medium">
                                {isLoading ? "Loading…" : "No completed orders."}
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {completeOrders.map((ord) => (
                                    <div key={ord.id} className="bg-cream-bg border border-accent/20 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all">
                                        <div onClick={() => setSelectedOrder(ord)} className="flex justify-between items-start cursor-pointer group">
                                            <div className="flex items-center gap-3">
                                                {ord.images && ord.images[0] && (
                                                    <img src={ord.images[0]} alt="Reference thumbnail" className="w-12 h-12 rounded-xl object-cover border border-accent/30 shrink-0" />
                                                )}
                                                <div>
                                                    <h3 className="text-base font-extrabold text-earth-text font-heading group-hover:text-accent transition-colors">{ord.title}</h3>
                                                    <p className="text-xs text-earth-text/70 mt-0.5 font-medium">Client: {ord.client} &bull; <span className="font-mono text-earth-text/50">{ord.id}</span></p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <span className="text-[9px] font-mono font-bold text-earth-text/70 uppercase tracking-widest bg-warm-beige border border-accent/20 px-2.5 py-1 rounded-full">{ord.status}</span>
                                                <span className="text-[10px] font-bold text-earth-text/50 group-hover:text-accent transition-colors mt-1 block">
                                                    Open Details ↗
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </main>

            {/* POPUP MODAL */}
            {selectedOrder && (
                <div className="fixed inset-0 bg-earth-text/60 backdrop-blur-md z-[9999] flex items-center justify-center p-4 sm:p-6" onClick={() => setSelectedOrder(null)}>
                    <div
                        className="bg-cream-bg w-full max-w-2xl max-h-[90vh] rounded-3xl border border-accent/30 shadow-2xl flex flex-col overflow-hidden text-earth-text"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="p-5 border-b border-accent/20 flex justify-between items-center bg-warm-beige">
                            <div className="flex items-center gap-3">
                                <span className="text-accent bg-accent/10 px-2.5 py-1 rounded-lg text-xs font-bold font-mono border border-accent/20">{selectedOrder.id}</span>
                                <h3 className="text-lg font-extrabold text-earth-text font-heading">{selectedOrder.title}</h3>
                            </div>
                            <button
                                onClick={() => setSelectedOrder(null)}
                                className="w-8 h-8 flex items-center justify-center rounded-full bg-cream-bg text-earth-text/60 hover:text-earth-text border border-accent/20 hover:border-accent transition-colors"
                            >
                                ✕
                            </button>
                        </div>
                        <div className="p-6 overflow-y-auto custom-scrollbar relative">
                            {renderOrderAtelierDetails(selectedOrder)}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
