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

export default function TailorOrdersPage() {
    const { user } = useAuth();
    
    const [previewImage, setPreviewImage] = useState<string | null>(null);
    const [quotePrice, setQuotePrice] = useState<string>("");
    const [quoteMessage, setQuoteMessage] = useState<string>("");
    const [activeTab, setActiveTab] = useState<"requests" | "quoted" | "ongoing" | "complete">("requests");
    const [selectedOrder, setSelectedOrder] = useState<OrderDetail | null>(null);
    const [isLoading, setIsLoading] = useState(true);
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
            },
            designNotes: req.description || "No design notes provided.",
            images: req.design_images && req.design_images.length > 0 ? req.design_images.map(img => img.image_url) : [defaultImg],
            status: "REQUESTED",
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
            
        // Map string to literal type, fallback to Suit if unknown
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
            },
            designNotes: req?.description || "No additional design notes on file for this order.",
            images: req?.design_images && req.design_images.length > 0 ? req.design_images.map(img => img.image_url) : [],
            status: statusLabel,
            progress: orderStatus === "completed" ? 100 : orderStatus === "in_progress" ? 60 : 20,
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
                    mapped.status = "QUOTED";
                    quoted.push(mapped);
                } else if ((mySr && mySr.status === "pending") || (!mySr && isBidding)) {
                    newInqs.push(mapRequestToOrderDetail(req));
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

    const handleIssueQuotation = async (req: OrderDetail) => {
        try {
            if (!quotePrice) return;
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

    const handleCompleteOrder = async (ord: OrderDetail) => {
        try {
            await updateOrderStatus(ord.rawId, "completed");
        } catch (err) {
            console.error("Failed to complete order:", err);
        } finally {
            fetchTailorData();
        }
    };

    const renderOrderAtelierDetails = (order: OrderDetail) => (
        <div className="space-y-4 pt-4 border-t border-zinc-800/80 animate-fadeIn text-left">
            <div>
                <span className="text-[10px] font-black uppercase tracking-[0.25em] text-[#A39A7C] block mb-0.5">Request Details</span>
                <p className="text-[11px] text-zinc-400">Live specifics for this bespoke commission.</p>
            </div>

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

            {order.status === "REQUESTED" && (
                <div className="bg-[#121316] rounded-2xl p-4 border border-[#F5CA53]/50 space-y-4 mt-4 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-[#F5CA53] to-transparent"></div>
                    <div>
                        <span className="text-[10px] font-black uppercase tracking-[0.25em] text-[#F5CA53] block mb-0.5">Issue Quotation</span>
                        <p className="text-[11px] text-zinc-400">Submit your bid and message to the client directly.</p>
                    </div>

                    <div className="space-y-3">
                        <div>
                            <label className="text-[9px] font-mono font-bold tracking-[0.2em] uppercase text-zinc-400 block mb-1.5">OFFERED PRICE (LKR)</label>
                            <input
                                type="number"
                                value={quotePrice}
                                onChange={(e) => setQuotePrice(e.target.value)}
                                placeholder="e.g. 15000"
                                className="w-full bg-[#18191E] border border-zinc-800 focus:border-[#F5CA53]/60 px-3.5 py-2.5 rounded-lg text-sm text-[#F5CA53] font-bold font-mono outline-none transition-colors"
                            />
                        </div>
                        <div>
                            <label className="text-[9px] font-mono font-bold tracking-[0.2em] uppercase text-zinc-400 block mb-1.5">MESSAGE TO CLIENT</label>
                            <textarea
                                value={quoteMessage}
                                onChange={(e) => setQuoteMessage(e.target.value)}
                                placeholder="e.g. I can tailor this suit in 2 weeks. The fabric is included in the price."
                                rows={3}
                                className="w-full bg-[#18191E] border border-zinc-800 focus:border-[#F5CA53]/60 px-3.5 py-2.5 rounded-lg text-sm text-zinc-200 font-sans outline-none transition-colors resize-none"
                            />
                        </div>
                        <button
                            onClick={() => handleIssueQuotation(order)}
                            disabled={!quotePrice}
                            className="w-full bg-[#F5CA53] disabled:bg-zinc-700 disabled:text-zinc-500 text-black font-bold text-xs uppercase tracking-widest py-3 rounded-xl hover:bg-[#e4bb49] transition-all shadow-md shadow-[#F5CA53]/20 active:scale-[0.98] flex items-center justify-center gap-1.5"
                        >
                            Submit Quotation
                            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" /></svg>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );

    return (
        <div className="min-h-screen bg-[#07080A] text-white flex flex-col justify-between selection:bg-[#F5CA53] selection:text-black font-sans">
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

            <main className="max-w-7xl w-full mx-auto px-4 sm:px-8 py-12 flex-1 space-y-8">
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

                <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none text-xs">
                    <button
                        onClick={() => setActiveTab("requests")}
                        className={`px-4 py-1.5 rounded-full font-medium transition-all whitespace-nowrap ${activeTab === "requests"
                            ? "bg-[#F5CA53] text-black shadow-lg shadow-[#F5CA53]/20"
                            : "bg-[#18191E] text-zinc-400 border border-zinc-800 hover:text-white"
                            }`}
                    >
                        New Inquiries ({requests.length})
                    </button>
                    <button
                        onClick={() => setActiveTab("quoted")}
                        className={`px-4 py-1.5 rounded-full font-medium transition-all whitespace-nowrap ${activeTab === "quoted"
                            ? "bg-[#F5CA53] text-black shadow-lg shadow-[#F5CA53]/20"
                            : "bg-[#18191E] text-zinc-400 border border-zinc-800 hover:text-white"
                            }`}
                    >
                        Pending Quotations ({pendingQuotes.length})
                    </button>
                    <button
                        onClick={() => setActiveTab("ongoing")}
                        className={`px-4 py-1.5 rounded-full font-medium transition-all whitespace-nowrap ${activeTab === "ongoing"
                            ? "bg-[#F5CA53] text-black shadow-lg shadow-[#F5CA53]/20"
                            : "bg-[#18191E] text-zinc-400 border border-zinc-800 hover:text-white"
                            }`}
                    >
                        On Going ({ongoingOrders.length})
                    </button>
                    <button
                        onClick={() => setActiveTab("complete")}
                        className={`px-4 py-1.5 rounded-full font-medium transition-all whitespace-nowrap ${activeTab === "complete"
                            ? "bg-[#F5CA53] text-black shadow-lg shadow-[#F5CA53]/20"
                            : "bg-[#18191E] text-zinc-400 border border-zinc-800 hover:text-white"
                            }`}
                    >
                        Complete ({completeOrders.length})
                    </button>
                </div>

                {activeTab === "requests" && (
                    <div className="space-y-4 p-2 rounded-[28px] animate-fadeIn">
                        <h2 className="text-[11px] font-bold tracking-[0.2em] uppercase text-[#F5CA53]">New Inquiries ({requests.length})</h2>

                        {requests.length === 0 ? (
                            <div className="bg-[#121318] border border-zinc-800/80 rounded-2xl p-6 text-center text-xs text-zinc-500">
                                {isLoading ? "Loading requests…" : "No open client requests right now."}
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {requests.map((req) => (
                                    <div key={req.id} className="bg-[#18191E] border border-[#F5CA53]/30 rounded-[24px] p-5 shadow-lg shadow-[#F5CA53]/5 relative overflow-hidden transition-all">
                                        <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-[#F5CA53] to-transparent"></div>
                                        <div onClick={() => setSelectedOrder(req)} className="flex justify-between items-start cursor-pointer group">
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
                                                <span className="text-[10px] text-zinc-500 hover:text-[#F5CA53] transition-colors mt-1 block">
                                                    Open Details ↗
                                                </span>
                                            </div>
                                        </div>

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
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {activeTab === "quoted" && (
                    <div className="space-y-4 p-2 rounded-[28px] animate-fadeIn">
                        <h2 className="text-[11px] font-bold tracking-[0.2em] uppercase text-zinc-500">Pending Quotations ({pendingQuotes.length})</h2>

                        {pendingQuotes.length === 0 ? (
                            <div className="bg-[#121318] border border-zinc-800/80 rounded-2xl p-6 text-center text-xs text-zinc-500">
                                {isLoading ? "Loading…" : "No pending quotations."}
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {pendingQuotes.map((ord) => (
                                    <div key={ord.id} className="bg-[#18191E] border border-zinc-800/80 rounded-[20px] p-5 shadow-lg transition-all">
                                        <div onClick={() => setSelectedOrder(ord)} className="flex justify-between items-start cursor-pointer group">
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
                                                <span className="text-[10px] text-zinc-500 hover:text-[#F5CA53] transition-colors mt-1 block">
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
                    <div className="space-y-4 p-2 rounded-[28px] animate-fadeIn">
                        <h2 className="text-[11px] font-bold tracking-[0.2em] uppercase text-zinc-500">On Going ({ongoingOrders.length})</h2>

                        {ongoingOrders.length === 0 ? (
                            <div className="bg-[#121318] border border-zinc-800/80 rounded-2xl p-6 text-center text-xs text-zinc-500">
                                {isLoading ? "Loading…" : "No orders in progress."}
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {ongoingOrders.map((ord) => (
                                    <div key={ord.id} className="bg-[#18191E] border border-zinc-800/80 hover:border-[#F5CA53]/30 rounded-[24px] p-5 shadow-lg transition-all">
                                        <div onClick={() => setSelectedOrder(ord)} className="flex justify-between items-start cursor-pointer group">
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
                                                <span className="text-[10px] text-zinc-500 hover:text-[#F5CA53] transition-colors mt-1 block">
                                                    Open Details ↗
                                                </span>
                                            </div>
                                        </div>

                                        <div className="space-y-3 pt-3 mt-3 border-t border-zinc-800/50">
                                            <div className="space-y-1.5">
                                                <div className="flex justify-between items-center text-[11px] font-medium">
                                                    <span className="text-zinc-400">Fitting Timeline</span>
                                                    <span className="text-white">{ord.progress ?? 0}%</span>
                                                </div>
                                                <div className="w-full h-1.5 bg-[#26282D] rounded-full overflow-hidden">
                                                    <div className="h-full bg-[#F5CA53] transition-all duration-500" style={{ width: `${ord.progress ?? 0}%` }}></div>
                                                </div>
                                            </div>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleCompleteOrder(ord); }}
                                                className="w-full bg-[#26282D] text-[#F5CA53] font-bold text-[10px] uppercase tracking-widest py-2 rounded-xl hover:bg-[#F5CA53]/10 border border-[#F5CA53]/30 hover:border-[#F5CA53] transition-all active:scale-[0.98]"
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
                    <div className="space-y-4 p-2 rounded-[28px] animate-fadeIn">
                        <h2 className="text-[11px] font-bold tracking-[0.2em] uppercase text-zinc-500">Complete ({completeOrders.length})</h2>

                        {completeOrders.length === 0 ? (
                            <div className="bg-[#121318] border border-zinc-800/80 rounded-2xl p-6 text-center text-xs text-zinc-500">
                                {isLoading ? "Loading…" : "No completed orders."}
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {completeOrders.map((ord) => (
                                    <div key={ord.id} className="bg-[#18191E] border border-zinc-800/80 hover:border-[#F5CA53]/30 rounded-[24px] p-5 shadow-lg transition-all">
                                        <div onClick={() => setSelectedOrder(ord)} className="flex justify-between items-start cursor-pointer group">
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
                                                <span className="text-[10px] text-zinc-500 hover:text-[#F5CA53] transition-colors mt-1 block">
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
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[999] flex items-center justify-center p-4 sm:p-6" onClick={() => setSelectedOrder(null)}>
                    <div 
                        className="bg-[#121316] w-full max-w-2xl max-h-[90vh] rounded-3xl border border-[#F5CA53]/30 shadow-2xl flex flex-col overflow-hidden animate-fadeIn"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="p-5 border-b border-zinc-800 flex justify-between items-center bg-[#18191E]">
                            <div className="flex items-center gap-3">
                                <span className="text-[#F5CA53] bg-[#F5CA53]/10 px-2.5 py-1 rounded-lg text-xs font-bold font-mono border border-[#F5CA53]/20">{selectedOrder.id}</span>
                                <h3 className="text-lg font-black text-white">{selectedOrder.title}</h3>
                            </div>
                            <button 
                                onClick={() => setSelectedOrder(null)}
                                className="w-8 h-8 flex items-center justify-center rounded-full bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700 transition-colors"
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
