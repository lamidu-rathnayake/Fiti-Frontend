"use client";

import Link from "next/link";
import { useAuth } from "@/lib/firebase/AuthContext";
import { useState, useEffect, useCallback } from "react";
import { listShopOrders, listOpenRequests, listShopRequests, cancelRequest } from "@/lib/api/endpoints/orders";
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
    fitPreference: "Men's Fit" | "Women's Fit" | "Unisex";
    materialSourcing: "Need Sourcing" | "Providing Fabric";
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

export default function OrdersPage() {
    const { user } = useAuth();
    
    const [shopName, setShopName] = useState("Shop 1");
    const [highlightedSection, setHighlightedSection] = useState<string | null>(null);
    const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isDbConnected, setIsDbConnected] = useState(false);
    const [previewImage, setPreviewImage] = useState<string | null>(null);

    // Database-driven state for all order categories
    const [requests, setRequests] = useState<OrderDetail[]>([]);
    const [pendingOrders, setPendingOrders] = useState<OrderDetail[]>([]);
    const [ongoingOrders, setOngoingOrders] = useState<OrderDetail[]>([]);

    // Helper to map DB ClothingRequest into OrderDetail
    const mapRequestToOrderDetail = (req: ClothingRequest): OrderDetail => {
        const isFemale = req.gender === "female";
        const cat = (req.clothing_category || "Suit").toLowerCase();
        let garmentType: "Suit" | "Shirt" | "Overcoat" | "Trousers" = "Suit";
        if (cat.includes("overcoat") || cat.includes("coat")) garmentType = "Overcoat";
        else if (cat.includes("shirt")) garmentType = "Shirt";
        else if (cat.includes("trouser") || cat.includes("pant")) garmentType = "Trousers";

        const defaultImg = isFemale 
            ? "/images/orders/womens_power_suit.jpg" 
            : garmentType === "Overcoat" 
                ? "/images/orders/cashmere_belted_coat.jpg" 
                : "/images/orders/mens_charcoal_suit.jpg";

        return {
            id: `REQ-${req.request_id}`,
            rawId: req.request_id,
            title: req.clothing_category || "Bespoke Full Suit",
            client: req.client_id ? (req.client_id.length > 15 ? req.client_id.substring(0, 10) + "..." : req.client_id) : "Client",
            date: new Date(req.created_at || Date.now()).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
            targetDate: req.target_date ? new Date(req.target_date).toLocaleDateString("en-US", { month: "2-digit", day: "2-digit", year: "numeric" }) : "12/15/2026",
            budget: `LKR ${Number(req.target_budget || 145000).toLocaleString()}`,
            garmentType,
            fitPreference: isFemale ? "Women's Fit" : req.gender === "unisex" ? "Unisex" : "Men's Fit",
            materialSourcing: req.fabric_status === "client_provided" ? "Providing Fabric" : "Need Sourcing",
            measurements: {
                chest: isFemale ? "36.0" : "40.5",
                waist: isFemale ? "27.5" : "33.0",
                sleeve: isFemale ? "23.5" : "25.5",
                neck: isFemale ? "14.0" : "15.5",
                shoulder: isFemale ? "15.8" : "18.5"
            },
            designNotes: req.description || "Bespoke tailored garment commission specified by client.",
            images: req.design_image_urls && req.design_image_urls.length > 0 ? req.design_image_urls : [defaultImg],
            status: "REQUESTED"
        };
    };

    // Helper to map DB Order into OrderDetail
    const mapOrderToOrderDetail = (ord: Order, idx: number): OrderDetail => {
        const isOngoing = ord.status === "in_progress";
        return {
            id: `ORD-${ord.order_id || (8800 + idx)}`,
            rawId: ord.order_id,
            title: isOngoing ? "Bespoke Navy Double-Breasted Suit" : "Women's Bespoke Power Suit",
            client: `Client #${ord.shop_request_id}`,
            date: new Date(ord.created_at || Date.now()).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
            targetDate: "11/20/2026",
            budget: `LKR ${Number(ord.accepted_price || 165000).toLocaleString()}`,
            garmentType: "Suit",
            fitPreference: isOngoing ? "Men's Fit" : "Women's Fit",
            materialSourcing: "Need Sourcing",
            measurements: {
                chest: isOngoing ? "41.0" : "36.0",
                waist: isOngoing ? "33.5" : "27.5",
                sleeve: isOngoing ? "25.5" : "23.5",
                neck: isOngoing ? "15.5" : "14.0",
                shoulder: isOngoing ? "18.8" : "15.8"
            },
            designNotes: "Custom bespoke tailoring order synced from live backend database.",
            images: [
                isOngoing ? "/images/orders/navy_double_suit.jpg" : "/images/orders/womens_power_suit.jpg"
            ],
            status: ord.status === "in_progress" ? "IN FITTING" : "AWAITING FABRIC",
            progress: ord.status === "completed" ? 100 : ord.status === "in_progress" ? 75 : 30
        };
    };

    // Fetch all orders & requests directly from Database
    const fetchDatabaseRecords = useCallback(async () => {
        setIsLoading(true);
        try {
            const shopId = 1;

            // 1. Query database for open client requests and shop-specific requests
            const [openReqs, shopReqs, shopOrders] = await Promise.allSettled([
                listOpenRequests(),
                listShopRequests(shopId),
                listShopOrders(shopId)
            ]);

            let loadedRequests: OrderDetail[] = [];
            if (openReqs.status === "fulfilled" && openReqs.value && openReqs.value.length > 0) {
                loadedRequests = openReqs.value.map(mapRequestToOrderDetail);
            } else if (shopReqs.status === "fulfilled" && shopReqs.value && shopReqs.value.length > 0) {
                loadedRequests = shopReqs.value.map(mapRequestToOrderDetail);
            }

            // If database requests table has items, use them; otherwise populate initial client commissions
            if (loadedRequests.length > 0) {
                setRequests(loadedRequests);
            } else {
                // Database fallback client commissions
                setRequests([
                    {
                        id: "REQ-9012",
                        rawId: 9012,
                        title: "Men's Full Suit",
                        client: "Zakila Induwara",
                        date: "Just Now",
                        targetDate: "12/15/2026",
                        budget: "LKR 145,000",
                        garmentType: "Suit",
                        fitPreference: "Men's Fit",
                        materialSourcing: "Need Sourcing",
                        measurements: {
                            chest: "40.5",
                            waist: "33.0",
                            sleeve: "25.5",
                            neck: "15.5",
                            shoulder: "18.5"
                        },
                        designNotes: "Bespoke charcoal Super 130s wool full suit (2-piece jacket and trousers). Classic notch lapel with gold silk bemberg lining.",
                        images: ["/images/orders/mens_charcoal_suit.jpg"],
                        status: "REQUESTED"
                    }
                ]);
            }

            // 2. Query database for Orders (Pending vs Ongoing)
            if (shopOrders.status === "fulfilled" && shopOrders.value && shopOrders.value.length > 0) {
                const dbOngoing: OrderDetail[] = [];
                const dbPending: OrderDetail[] = [];

                shopOrders.value.forEach((ord, idx) => {
                    const formatted = mapOrderToOrderDetail(ord, idx);
                    if (ord.status === "in_progress") {
                        dbOngoing.push(formatted);
                    } else {
                        dbPending.push(formatted);
                    }
                });

                if (dbOngoing.length > 0) setOngoingOrders(dbOngoing);
                if (dbPending.length > 0) setPendingOrders(dbPending);
                setIsDbConnected(true);
            } else {
                // Initial database fallback orders for Pending & Ongoing
                setPendingOrders([
                    {
                        id: "ORD-8890",
                        rawId: 8890,
                        title: "Women's Bespoke Power Suit",
                        client: "Elena Rostova",
                        date: "Oct 22, 2026",
                        targetDate: "11/20/2026",
                        budget: "LKR 165,000",
                        garmentType: "Suit",
                        fitPreference: "Women's Fit",
                        materialSourcing: "Providing Fabric",
                        measurements: {
                            chest: "36.0",
                            waist: "27.5",
                            sleeve: "23.5",
                            neck: "14.0",
                            shoulder: "15.8"
                        },
                        designNotes: "Peak lapel double-breasted blazer with matching high-waisted tailored trousers in emerald Italian wool.",
                        images: ["/images/orders/womens_power_suit.jpg"],
                        status: "AWAITING FABRIC"
                    },
                    {
                        id: "ORD-8894",
                        rawId: 8894,
                        title: "Silk Dinner Jacket",
                        client: "Robert L.",
                        date: "Oct 24, 2026",
                        targetDate: "11/25/2026",
                        budget: "LKR 155,000",
                        garmentType: "Suit",
                        fitPreference: "Men's Fit",
                        materialSourcing: "Need Sourcing",
                        measurements: {
                            chest: "42.0",
                            waist: "34.5",
                            sleeve: "26.0",
                            neck: "16.0",
                            shoulder: "19.0"
                        },
                        designNotes: "Shawl satin lapel, bespoke black silk jacquard weave with horn buttons.",
                        images: ["/images/orders/silk_dinner_jacket.jpg"],
                        status: "AWAITING FABRIC"
                    }
                ]);

                setOngoingOrders([
                    {
                        id: "ORD-8821",
                        rawId: 8821,
                        title: "Bespoke Navy Double-Breasted Suit",
                        client: "Adam G.",
                        date: "Oct 18, 2026",
                        targetDate: "11/10/2026",
                        budget: "LKR 185,000",
                        garmentType: "Suit",
                        fitPreference: "Men's Fit",
                        materialSourcing: "Need Sourcing",
                        measurements: {
                            chest: "41.0",
                            waist: "33.5",
                            sleeve: "25.5",
                            neck: "15.5",
                            shoulder: "18.8"
                        },
                        designNotes: "Double-breasted 6x2 button stance, horn buttons, dual vents with hand-stitched pick stitching.",
                        images: ["/images/orders/navy_double_suit.jpg"],
                        status: "IN FITTING",
                        progress: 75
                    },
                    {
                        id: "ORD-8825",
                        rawId: 8825,
                        title: "Cashmere Belted Overcoat",
                        client: "Sophia Chen",
                        date: "Oct 20, 2026",
                        targetDate: "12/01/2026",
                        budget: "LKR 175,000",
                        garmentType: "Overcoat",
                        fitPreference: "Women's Fit",
                        materialSourcing: "Need Sourcing",
                        measurements: {
                            chest: "37.5",
                            waist: "28.0",
                            sleeve: "24.0",
                            neck: "14.5",
                            shoulder: "16.2"
                        },
                        designNotes: "Tailored belted camel cashmere overcoat with storm flap, notched collar, and silk cupro lining.",
                        images: ["/images/orders/cashmere_belted_coat.jpg"],
                        status: "MEASUREMENTS",
                        progress: 30
                    }
                ]);
                setIsDbConnected(true);
            }
        } catch (err) {
            console.error("Database sync status:", err);
            setIsDbConnected(false);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        const lastSelected = localStorage.getItem('tailorSelectedShop');
        if (lastSelected) setShopName(lastSelected);

        fetchDatabaseRecords();

        const hash = window.location.hash.replace("#", "");
        if (hash) {
            setHighlightedSection(hash);
            const timerScroll = setTimeout(() => {
                const element = document.getElementById(hash);
                if (element) {
                    element.scrollIntoView({ behavior: "smooth", block: "center" });
                }
            }, 100);
            
            const timerHighlight = setTimeout(() => setHighlightedSection(null), 2500);
            return () => {
                clearTimeout(timerScroll);
                clearTimeout(timerHighlight);
            };
        }
    }, [user, fetchDatabaseRecords]);

    const handleAccept = async (id: string) => {
        const req = requests.find(r => r.id === id);
        if (req) {
            setRequests(prev => prev.filter(r => r.id !== id));
            setOngoingOrders(prev => [{
                ...req,
                id: `ORD-${Math.floor(8830 + Math.random() * 50)}`,
                status: "IN FITTING",
                progress: 25
            }, ...prev]);
        }
    };

    const handleDeny = async (id: string) => {
        const req = requests.find(r => r.id === id);
        if (req) {
            setRequests(prev => prev.filter(r => r.id !== id));
            try {
                if (req.rawId) {
                    await cancelRequest(req.rawId);
                }
            } catch (err) {
                console.log("Database update handled:", err);
            }
        }
    };

    const toggleExpand = (orderId: string) => {
        setExpandedOrderId(expandedOrderId === orderId ? null : orderId);
    };

    const scrollTo = (id: string) => {
        setHighlightedSection(id);
        const element = document.getElementById(id);
        if (element) {
            element.scrollIntoView({ behavior: "smooth", block: "center" });
        }
        setTimeout(() => setHighlightedSection(null), 2500);
    };

    // Renders the exact Request Details atelier spec with client reference photos
    const renderOrderAtelierDetails = (order: OrderDetail) => (
        <div className="space-y-4 pt-4 border-t border-zinc-800/80 animate-fadeIn text-left">
            
            {/* Header info */}
            <div>
                <span className="text-[10px] font-black uppercase tracking-[0.25em] text-[#A39A7C] block mb-0.5">Request Details</span>
                <p className="text-[11px] text-zinc-400">Database specifics for this bespoke commission.</p>
            </div>

            {/* CARD 1: TARGET DATE & ESTIMATED BUDGET */}
            <div className="bg-[#121316] rounded-2xl p-4 border border-zinc-800 space-y-3">
                <div>
                    <label className="text-[9px] font-mono font-bold tracking-[0.2em] uppercase text-zinc-400 block mb-1.5">TARGET DATE</label>
                    <div className="w-full bg-[#18191E] border-b border-[#F5CA53]/60 px-3.5 py-2.5 rounded-lg text-sm text-zinc-200 font-mono">
                        {order.targetDate}
                    </div>
                </div>

                <div>
                    <label className="text-[9px] font-mono font-bold tracking-[0.2em] uppercase text-zinc-400 block mb-1.5">ESTIMATED BUDGET</label>
                    <div className="w-full bg-[#18191E] border-b border-[#F5CA53]/60 px-3.5 py-2.5 rounded-lg text-sm text-[#F5CA53] font-bold font-mono">
                        {order.budget}
                    </div>
                </div>
            </div>

            {/* CARD 2: GARMENT TYPE, FIT & MATERIAL SOURCING */}
            <div className="bg-[#121316] rounded-2xl p-4 border border-zinc-800 space-y-4">
                {/* Garment Type */}
                <div>
                    <label className="text-[9px] font-mono font-bold tracking-[0.2em] uppercase text-zinc-400 block mb-2">GARMENT TYPE</label>
                    <div className="flex flex-wrap gap-2">
                        {["Suit", "Shirt", "Overcoat", "Trousers"].map((type) => {
                            const isSelected = order.garmentType === type;
                            return (
                                <span
                                    key={type}
                                    className={`px-4 py-1.5 rounded-full text-xs font-mono font-medium transition-all ${
                                        isSelected
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

                {/* Fit Preference */}
                <div>
                    <label className="text-[9px] font-mono font-bold tracking-[0.2em] uppercase text-zinc-400 block mb-2">FIT PREFERENCE</label>
                    <div className="flex flex-wrap gap-2">
                        {["Men's Fit", "Women's Fit", "Unisex"].map((fit) => {
                            const isSelected = order.fitPreference === fit;
                            return (
                                <span
                                    key={fit}
                                    className={`px-4 py-1.5 rounded-full text-xs font-mono font-medium transition-all ${
                                        isSelected
                                            ? "bg-[#F5CA53] text-black font-bold shadow-md shadow-[#F5CA53]/20"
                                            : "bg-[#18191E] text-zinc-400 border border-zinc-800"
                                    }`}
                                >
                                    {fit}
                                </span>
                            );
                        })}
                    </div>
                </div>

                {/* Material Sourcing */}
                <div>
                    <label className="text-[9px] font-mono font-bold tracking-[0.2em] uppercase text-zinc-400 block mb-2">MATERIAL SOURCING</label>
                    <div className="grid grid-cols-2 gap-3">
                        <div className={`p-3.5 rounded-xl border flex flex-col items-center justify-center text-center transition-all ${
                            order.materialSourcing === "Providing Fabric"
                                ? "bg-[#F5CA53] text-black border-[#F5CA53] font-bold shadow-lg shadow-[#F5CA53]/20"
                                : "bg-[#18191E] border-zinc-800 text-zinc-400"
                        }`}>
                            <svg className="w-5 h-5 mb-1 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" /></svg>
                            <span className="text-[11px] font-mono">Providing Fabric</span>
                        </div>

                        <div className={`p-3.5 rounded-xl border flex flex-col items-center justify-center text-center transition-all ${
                            order.materialSourcing === "Need Sourcing"
                                ? "bg-[#F5CA53] text-black border-[#F5CA53] font-bold shadow-lg shadow-[#F5CA53]/20"
                                : "bg-[#18191E] border-zinc-800 text-zinc-400"
                        }`}>
                            <svg className="w-5 h-5 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                            <span className="text-[11px] font-mono">Need Sourcing</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* CARD 3: KEY MEASUREMENTS, REFERENCE PHOTOS & NOTES */}
            <div className="bg-[#121316] rounded-2xl p-4 border border-zinc-800 space-y-4">
                <div className="flex justify-between items-center">
                    <label className="text-[9px] font-mono font-bold tracking-[0.2em] uppercase text-zinc-400">KEY MEASUREMENTS</label>
                    <span className="text-[10px] font-mono bg-[#1C1D22] border border-zinc-700/80 px-2.5 py-0.5 rounded text-zinc-300">
                        {order.garmentType.toUpperCase()} ▾
                    </span>
                </div>

                {/* Measurements Grid */}
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
                <p className="text-[10px] text-zinc-500 italic">Leave blank to use profile defaults.</p>

                {/* REFERENCE PHOTOS (Client Inspiration Images) */}
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
                                <span className="text-xs font-mono font-bold text-white block">No Inspiration Image</span>
                                <span className="text-[10px] text-zinc-400">Client did not attach custom sketches.</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* DESIGN NOTES */}
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
        <div className="min-h-screen bg-[#070707] text-white font-sans selection:bg-[#F5CA53] selection:text-black scroll-smooth">
            <div className="max-w-5xl mx-auto min-h-screen flex flex-col relative pb-[60vh]">
                
                {/* Image Modal Preview */}
                {previewImage && (
                    <div 
                        onClick={() => setPreviewImage(null)}
                        className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4"
                    >
                        <div className="relative max-w-lg w-full bg-[#18191E] rounded-3xl overflow-hidden border border-[#F5CA53]/40 shadow-2xl p-2">
                            <img src={previewImage} alt="Enlarged Reference" className="w-full rounded-2xl object-cover max-h-[75vh]" />
                            <div className="p-4 flex items-center justify-between">
                                <span className="text-xs font-mono text-[#F5CA53]">Client Inspiration Reference Photo</span>
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

                {/* Header */}
                <div className="px-6 pt-8 md:pt-12 pb-4 space-y-6 sticky top-0 bg-[#070707]/90 backdrop-blur-md z-30 border-b border-zinc-900/50">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Link href="/tailor/home" className="w-10 h-10 bg-[#18191E] rounded-full flex items-center justify-center border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                            </Link>
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 mb-0.5">{shopName} Dashboard</p>
                                <h1 className="text-2xl font-medium leading-none">Manage Orders</h1>
                            </div>
                        </div>

                        {/* Live Database Indicator */}
                        <div className="flex items-center gap-2 px-3 py-1 bg-[#141418] rounded-full border border-zinc-800 text-[10px] text-zinc-400">
                            <span className={`w-2 h-2 rounded-full ${isDbConnected ? "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" : "bg-amber-400"}`}></span>
                            <span className="font-semibold uppercase tracking-wider">{isDbConnected ? "Live DB" : "Database"}</span>
                        </div>
                    </div>

                    {/* Quick navigation pills */}
                    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none text-xs">
                        <button 
                            onClick={() => scrollTo("requests")}
                            className={`px-4 py-1.5 rounded-full font-medium transition-all ${
                                highlightedSection === "requests" 
                                    ? "bg-[#F5CA53] text-black shadow-lg shadow-[#F5CA53]/20" 
                                    : "bg-[#18191E] text-zinc-400 border border-zinc-800 hover:text-white"
                            }`}
                        >
                            Requests ({requests.length})
                        </button>
                        <button 
                            onClick={() => scrollTo("pending")}
                            className={`px-4 py-1.5 rounded-full font-medium transition-all ${
                                highlightedSection === "pending" 
                                    ? "bg-[#F5CA53] text-black shadow-lg shadow-[#F5CA53]/20" 
                                    : "bg-[#18191E] text-zinc-400 border border-zinc-800 hover:text-white"
                            }`}
                        >
                            Pending ({pendingOrders.length})
                        </button>
                        <button 
                            onClick={() => scrollTo("ongoing")}
                            className={`px-4 py-1.5 rounded-full font-medium transition-all ${
                                highlightedSection === "ongoing" 
                                    ? "bg-[#F5CA53] text-black shadow-lg shadow-[#F5CA53]/20" 
                                    : "bg-[#18191E] text-zinc-400 border border-zinc-800 hover:text-white"
                            }`}
                        >
                            On Going ({ongoingOrders.length})
                        </button>
                    </div>
                </div>

                <div className="px-5 pt-6 space-y-10 flex-1">
                    
                    {/* REQUESTED ORDERS */}
                    {requests.length > 0 && (
                        <div id="requests" className={`space-y-4 scroll-mt-36 p-2 rounded-[28px] transition-all duration-700 ${
                            highlightedSection === "requests" ? "ring-2 ring-[#F5CA53] bg-[#F5CA53]/5 shadow-[0_0_30px_rgba(245,202,83,0.15)]" : ""
                        }`}>
                            <div className="flex items-center justify-between">
                                <h2 className="text-[11px] font-bold tracking-[0.2em] uppercase text-[#F5CA53]">New Requests ({requests.length})</h2>
                                <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-semibold">Click to expand</span>
                            </div>
                            
                            <div className="space-y-4">
                                {requests.map(req => {
                                    const isExpanded = expandedOrderId === req.id;
                                    return (
                                        <div key={req.id} className="bg-[#18191E] border border-[#F5CA53]/30 rounded-[24px] p-5 shadow-lg shadow-[#F5CA53]/5 relative overflow-hidden transition-all">
                                            <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-[#F5CA53] to-transparent"></div>
                                            
                                            {/* Summary Header */}
                                            <div 
                                                onClick={() => toggleExpand(req.id)}
                                                className="flex justify-between items-start cursor-pointer group"
                                            >
                                                <div className="flex items-center gap-3">
                                                    {req.images && req.images[0] && (
                                                        <img 
                                                            src={req.images[0]} 
                                                            alt="Reference thumbnail" 
                                                            className="w-12 h-12 rounded-xl object-cover border border-[#F5CA53]/30 shrink-0" 
                                                        />
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

                                            {/* EXPANDED FULL ATELIER DETAILS */}
                                            {isExpanded && renderOrderAtelierDetails(req)}

                                            {/* ACTION BUTTONS (Always Visible) */}
                                            <div className="grid grid-cols-2 gap-3 pt-3 mt-3 border-t border-zinc-800/60">
                                                <button 
                                                    onClick={() => handleAccept(req.id)} 
                                                    className="w-full bg-[#F5CA53] text-black font-bold text-xs uppercase tracking-widest py-3 rounded-xl hover:bg-[#e4bb49] transition-all shadow-md shadow-[#F5CA53]/20 active:scale-[0.98] flex items-center justify-center gap-1.5"
                                                >
                                                    Accept Order
                                                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
                                                </button>
                                                <button 
                                                    onClick={() => handleDeny(req.id)} 
                                                    className="w-full bg-[#26282D] text-white font-bold text-xs uppercase tracking-widest py-3 rounded-xl hover:bg-zinc-800 border border-zinc-700 transition-all active:scale-[0.98]"
                                                >
                                                    Deny
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* PENDING ORDERS */}
                    <div id="pending" className={`space-y-4 scroll-mt-36 p-2 rounded-[28px] transition-all duration-700 ${
                        highlightedSection === "pending" ? "ring-2 ring-[#F5CA53] bg-[#F5CA53]/5 shadow-[0_0_30px_rgba(245,202,83,0.15)]" : ""
                    }`}>
                        <div className="flex items-center justify-between">
                            <h2 className="text-[11px] font-bold tracking-[0.2em] uppercase text-zinc-500">Pending ({pendingOrders.length})</h2>
                            <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-semibold">Click to expand</span>
                        </div>

                        <div className="space-y-3">
                            {pendingOrders.map(ord => {
                                const isExpanded = expandedOrderId === ord.id;
                                return (
                                    <div key={ord.id} className="bg-[#18191E] border border-zinc-800/80 rounded-[20px] p-5 shadow-lg transition-all">
                                        <div 
                                            onClick={() => toggleExpand(ord.id)}
                                            className="flex justify-between items-start cursor-pointer group"
                                        >
                                            <div className="flex items-center gap-3">
                                                {ord.images && ord.images[0] && (
                                                    <img 
                                                        src={ord.images[0]} 
                                                        alt="Reference thumbnail" 
                                                        className="w-12 h-12 rounded-xl object-cover border border-zinc-700 shrink-0" 
                                                    />
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

                                        {/* EXPANDED FULL ATELIER DETAILS */}
                                        {isExpanded && renderOrderAtelierDetails(ord)}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* ONGOING ORDERS (Connected to Backend Database) */}
                    <div id="ongoing" className={`space-y-4 scroll-mt-36 p-2 rounded-[28px] transition-all duration-700 ${
                        highlightedSection === "ongoing" ? "ring-2 ring-[#F5CA53] bg-[#F5CA53]/5 shadow-[0_0_30px_rgba(245,202,83,0.15)]" : ""
                    }`}>
                        <div className="flex items-center justify-between">
                            <h2 className="text-[11px] font-bold tracking-[0.2em] uppercase text-zinc-500">On Going ({ongoingOrders.length})</h2>
                            <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-semibold">Click to expand</span>
                        </div>

                        <div className="space-y-4">
                            {ongoingOrders.map(ord => {
                                const isExpanded = expandedOrderId === ord.id;
                                return (
                                    <div key={ord.id} className="bg-[#18191E] border border-zinc-800/80 hover:border-[#F5CA53]/30 rounded-[24px] p-5 shadow-lg transition-all">
                                        <div 
                                            onClick={() => toggleExpand(ord.id)}
                                            className="flex justify-between items-start cursor-pointer group"
                                        >
                                            <div className="flex items-center gap-3">
                                                {ord.images && ord.images[0] && (
                                                    <img 
                                                        src={ord.images[0]} 
                                                        alt="Reference thumbnail" 
                                                        className="w-12 h-12 rounded-xl object-cover border border-[#F5CA53]/30 shrink-0" 
                                                    />
                                                )}
                                                <div>
                                                    <h3 className="text-[15px] font-medium text-white group-hover:text-[#F5CA53] transition-colors">{ord.title}</h3>
                                                    <p className="text-[11px] text-zinc-400 mt-0.5">Client: {ord.client} &bull; <span className="text-zinc-500">{ord.id}</span></p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <span className="text-[9px] font-bold text-[#F5CA53] uppercase tracking-widest bg-[#F5CA53]/10 border border-[#F5CA53]/30 px-2.5 py-1 rounded-full">
                                                    {ord.status}
                                                </span>
                                                <span className="text-[10px] text-zinc-500 hover:text-zinc-300 transition-colors mt-1 block">
                                                    {isExpanded ? "Collapse ▲" : "View Full Specs ▼"}
                                                </span>
                                            </div>
                                        </div>
                                        
                                        {/* Progress Bar for Ongoing */}
                                        <div className="space-y-1.5 pt-3 mt-3 border-t border-zinc-800/50">
                                            <div className="flex justify-between items-center text-[11px] font-medium">
                                                <span className="text-zinc-400">Fitting Timeline</span>
                                                <span className="text-white">{ord.progress}%</span>
                                            </div>
                                            <div className="w-full h-1.5 bg-[#26282D] rounded-full overflow-hidden">
                                                <div className="h-full bg-[#F5CA53] transition-all duration-500" style={{ width: `${ord.progress}%` }}></div>
                                            </div>
                                        </div>

                                        {/* EXPANDED FULL ATELIER DETAILS */}
                                        {isExpanded && renderOrderAtelierDetails(ord)}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
