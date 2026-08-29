"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/firebase/AuthContext";
import AtelierChatDrawer from "@/components/chat/AtelierChatDrawer";
import NotificationDrawer from "@/components/notifications/NotificationDrawer";
import { listOpenRequests, submitBid, listShopOrders } from "@/lib/api/endpoints/orders";
import { listTailorShops } from "@/lib/api/endpoints/shops";
import { getTailorProfile, updateTailorProfile } from "@/lib/api/endpoints/profiles";
import type { ClothingRequest, Order } from "@/lib/api/types/order";
import type { Shop } from "@/lib/api/types/shop";
import type { TailorProfile } from "@/lib/api/types/profile";

export default function TailorHomePage() {
    const { user, logout } = useAuth();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<"overview" | "schedule" | "clients" | "fabrics" | "earnings" | "settings">("overview");

    // Chat & Notification drawer states for Tailor
    const [isChatDrawerOpen, setIsChatDrawerOpen] = useState(false);
    const [isNotificationOpen, setIsNotificationOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");

    // Real data state
    const [tailorShops, setTailorShops] = useState<Shop[]>([]);
    const [selectedShop, setSelectedShop] = useState<Shop | null>(null);
    const [openRequests, setOpenRequests] = useState<ClothingRequest[]>([]);
    const [shopOrders, setShopOrders] = useState<Order[]>([]);
    const [tailorProfile, setTailorProfile] = useState<TailorProfile | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // UI state
    const [location, setLocation] = useState("Colombo, Sri Lanka");
    const [isShopDropdownOpen, setIsShopDropdownOpen] = useState(false);
    const [expandedOrderId, setExpandedOrderId] = useState<number | null>(null);
    const [bidSubmittedForId, setBidSubmittedForId] = useState<number | null>(null);

    // Settings form state
    const [settingsPhone, setSettingsPhone] = useState("");
    const [settingsCity, setSettingsCity] = useState("");
    const [settingsAddress, setSettingsAddress] = useState("");
    const [isSavingSettings, setIsSavingSettings] = useState(false);
    const [settingsSaved, setSettingsSaved] = useState(false);

    // ---- Data fetching ----
    const fetchData = useCallback(async () => {
        if (!user) return;
        setIsLoading(true);
        try {
            // Fetch tailor profile, shops & open requests in parallel
            const [profileResult, shopsResult, requestsResult] = await Promise.allSettled([
                getTailorProfile(user.uid),
                listTailorShops(user.uid),
                listOpenRequests(),
            ]);

            // Profile
            if (profileResult.status === "fulfilled") {
                const p = profileResult.value;
                setTailorProfile(p);
                if (p.city) setLocation(p.city);
                setSettingsPhone(p.phone || "");
                setSettingsCity(p.city || "");
                setSettingsAddress(p.address || "");
            }

            // Shops
            let primaryShop: Shop | null = null;
            if (shopsResult.status === "fulfilled" && shopsResult.value.length > 0) {
                setTailorShops(shopsResult.value);
                // Restore previously selected shop from localStorage
                const storedShopId = localStorage.getItem("tailorSelectedShopId");
                const found = storedShopId
                    ? shopsResult.value.find((s) => String(s.shop_id) === storedShopId) ?? shopsResult.value[0]
                    : shopsResult.value[0];
                setSelectedShop(found);
                primaryShop = found;
            } else {
                // Restore from localStorage as fallback for UI
                const storedName = localStorage.getItem("tailorSelectedShop");
                if (storedName) {
                    setSelectedShop({ shop_name: storedName } as Shop);
                }
                const storedLoc = localStorage.getItem("tailorLocation");
                if (storedLoc) setLocation(storedLoc);
            }

            // Open requests
            if (requestsResult.status === "fulfilled") {
                setOpenRequests(requestsResult.value);
            }

            // Fetch shop orders if we have a primary shop
            if (primaryShop?.shop_id) {
                try {
                    const orders = await listShopOrders(primaryShop.shop_id);
                    setShopOrders(orders);
                } catch {
                    setShopOrders([]);
                }
            }
        } catch (err) {
            console.error("Failed to fetch tailor dashboard data:", err);
        } finally {
            setIsLoading(false);
        }
    }, [user]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // When shop changes, reload orders for that shop
    const handleSelectShop = useCallback(async (shop: Shop) => {
        setSelectedShop(shop);
        setIsShopDropdownOpen(false);
        localStorage.setItem("tailorSelectedShopId", String(shop.shop_id));
        localStorage.setItem("tailorSelectedShop", shop.shop_name);
        if (shop.shop_id) {
            try {
                const orders = await listShopOrders(shop.shop_id);
                setShopOrders(orders);
            } catch {
                setShopOrders([]);
            }
        }
    }, []);

    const handleAcceptRequest = async (req: ClothingRequest) => {
        try {
            await submitBid({
                shop_request_id: req.request_id,
                bid_amount: req.target_budget || 10000,
                message: "I am interested in crafting this bespoke commission. Please review my profile.",
            });
            setBidSubmittedForId(req.request_id);
        } catch (err) {
            console.error("Failed to submit bid:", err);
            // Still mark as submitted optimistically
            setBidSubmittedForId(req.request_id);
        }
    };

    const handleSaveSettings = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        setIsSavingSettings(true);
        try {
            await updateTailorProfile(user.uid, {
                phone: settingsPhone || undefined,
                city: settingsCity || undefined,
                address: settingsAddress || undefined,
            });
            if (settingsCity) setLocation(settingsCity);
            setSettingsSaved(true);
            setTimeout(() => setSettingsSaved(false), 2500);
        } catch (err) {
            console.error("Failed to save settings:", err);
        } finally {
            setIsSavingSettings(false);
        }
    };

    // ---- Derived data ----
    const ongoingOrders = shopOrders.filter((o) => o.order_status === "in_progress");
    const pendingOrders = shopOrders.filter((o) => o.order_status === "pending");
    const completedOrders = shopOrders.filter((o) => o.order_status === "completed");

    const totalEarnings = completedOrders.reduce((sum, o) => sum + (o.accepted_price || 0), 0);
    const pendingEarnings = ongoingOrders.reduce((sum, o) => sum + (o.accepted_price || 0), 0);

    // Unique client IDs from all orders
    const uniqueClientIds = [...new Set(shopOrders.map((o) => `Client #${o.shop_request_id}`))];

    // Filtered requests by search query
    const filteredRequests = openRequests.filter(
        (r) =>
            !searchQuery ||
            (r.clothing_category || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
            (r.description || "").toLowerCase().includes(searchQuery.toLowerCase())
    );

    const shopDisplayName = selectedShop?.shop_name || "Your Shop";

    return (
        <div className="min-h-screen bg-[#0A0B0E] text-white flex flex-col justify-between selection:bg-[#F5CA53] selection:text-black font-sans">
            {/* TOP NAVIGATION HEADER */}
            <header className="w-full border-b border-zinc-900/80 bg-[#0A0B0E]/90 backdrop-blur-md sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-6 sm:px-12 py-5 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => router.back()}
                            className="px-3.5 py-2 rounded-xl border border-zinc-800 bg-[#141519] hover:bg-[#1C1D22] text-zinc-300 hover:text-[#F5CA53] hover:border-[#F5CA53]/40 text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm group"
                            title="Go back to previous page"
                        >
                            <span className="group-hover:-translate-x-0.5 transition-transform">&larr;</span>
                            <span className="hidden sm:inline">Back</span>
                        </button>

                        <Link href="/" className="flex items-center gap-3 group">
                            <div className="relative h-10 px-3 py-1 bg-[#FFFDF9] rounded-xl border border-[#F5CA53]/50 shadow-[0_0_15px_rgba(245,202,83,0.25)] flex items-center justify-center transition-all duration-300 group-hover:scale-105 group-hover:shadow-[0_0_25px_rgba(245,202,83,0.45)]">
                                <img src="/logoo.png" alt="FITI Bespoke Atelier Logo" className="h-8 w-auto object-contain" />
                            </div>
                            <span className="hidden sm:inline-block text-[9px] font-mono tracking-[0.25em] text-zinc-400 uppercase border-l border-zinc-800 pl-3 py-1">
                                Bespoke Atelier
                            </span>
                        </Link>
                    </div>

                    <nav className="hidden md:flex items-center space-x-10 text-xs font-semibold tracking-wider text-zinc-400">
                        <Link href="/storefront" className="hover:text-[#F5CA53] transition-colors">Storefront</Link>
                        <Link href="/tailor/home" className="text-[#F5CA53] font-bold relative pb-1 border-b-2 border-[#F5CA53]">Dashboard</Link>
                        <Link href="/orders" className="hover:text-[#F5CA53] transition-colors">Orders</Link>
                        <Link href="/tailors" className="hover:text-[#F5CA53] transition-colors">Tailors</Link>
                    </nav>

                    <div className="flex items-center space-x-4 text-zinc-400">
                        {/* Search */}
                        <div className="relative hidden lg:block w-48 lg:w-56">
                            <svg className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#F5CA53]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            <input
                                type="text"
                                placeholder="Search orders, clients..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-9 pr-3 py-1.5 bg-[#141519] border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#F5CA53]/60 transition-all"
                            />
                        </div>
                        <Link href="/orders">
                            <svg className="w-5 h-5 hover:text-white cursor-pointer transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                            </svg>
                        </Link>
                        <button onClick={() => setIsNotificationOpen(true)} title="Notifications" className="relative cursor-pointer p-1 rounded-xl hover:bg-zinc-800 transition-colors">
                            <svg className="w-5 h-5 hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                            </svg>
                            <span className="absolute top-0 right-0 w-2 h-2 rounded-full bg-[#F5CA53]" />
                        </button>
                        <button onClick={() => setIsChatDrawerOpen((prev) => !prev)} title="Direct Message Client" className="w-8 h-8 rounded-full border border-[#F5CA53]/50 bg-[#F5CA53]/10 hover:bg-[#F5CA53]/20 flex items-center justify-center text-[#F5CA53] transition-all relative">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
                            <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-black" />
                        </button>
                        <button
                            onClick={async () => { await logout(); router.push("/login"); }}
                            className="px-3.5 py-2 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-400 hover:bg-rose-500 hover:text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm"
                            title="Sign out of session"
                        >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                            <span>Logout</span>
                        </button>
                    </div>
                </div>
            </header>

            {/* DASHBOARD BODY WITH SIDEBAR & MAIN SECTION */}
            <div className="max-w-7xl w-full mx-auto px-6 sm:px-12 py-10 flex-1 flex gap-10">
                {/* LEFT SIDEBAR */}
                <aside className="w-64 shrink-0 hidden lg:flex flex-col justify-between space-y-8">
                    <div className="space-y-8">
                        {/* MANAGEMENT SECTION */}
                        <div>
                            <span className="text-[10px] font-black uppercase tracking-[0.25em] text-zinc-500 mb-4 block px-3">MANAGEMENT</span>
                            <nav className="space-y-1.5">
                                {([
                                    { key: "overview", label: "Overview", icon: "M4 6h16M4 12h16M4 18h7" },
                                    { key: "schedule", label: "Schedule", icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" },
                                    { key: "clients", label: "Clients", icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0" },
                                    { key: "fabrics", label: "Fabric Archive", icon: "M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" },
                                    { key: "earnings", label: "Earnings", icon: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" },
                                    { key: "settings", label: "Settings", icon: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z" },
                                ] as { key: typeof activeTab; label: string; icon: string }[]).map(({ key, label, icon }) => (
                                    <button
                                        key={key}
                                        onClick={() => setActiveTab(key)}
                                        className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold text-left transition-all ${activeTab === key
                                            ? "bg-[#F5CA53]/10 border border-[#F5CA53]/30 text-[#F5CA53]"
                                            : "text-zinc-400 hover:bg-[#141519] hover:text-white"
                                            }`}
                                    >
                                        <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d={icon} />
                                        </svg>
                                        {label}
                                    </button>
                                ))}
                            </nav>
                        </div>
                    </div>

                    {/* ACTIVE SHOP SELECTOR */}
                    <div className="space-y-3 px-3">
                        <span className="text-[10px] font-black uppercase tracking-[0.25em] text-zinc-500 block">ACTIVE SHOP</span>

                        <div className="relative">
                            <button
                                onClick={() => setIsShopDropdownOpen(!isShopDropdownOpen)}
                                className="w-full flex items-center justify-between gap-2 bg-[#141519] border border-zinc-800 hover:border-[#F5CA53]/40 px-3.5 py-2.5 rounded-xl text-xs font-bold text-[#F5CA53] transition-all"
                            >
                                <span className="truncate">{shopDisplayName}</span>
                                <svg className={`w-3 h-3 shrink-0 transition-transform ${isShopDropdownOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </button>

                            {isShopDropdownOpen && (
                                <div className="absolute bottom-full left-0 mb-2 w-full bg-[#141519] border border-zinc-800 rounded-xl shadow-xl overflow-hidden z-20">
                                    {tailorShops.length > 0 ? (
                                        tailorShops.map((shop) => (
                                            <button
                                                key={shop.shop_id}
                                                onClick={() => handleSelectShop(shop)}
                                                className={`w-full text-left px-3.5 py-2.5 text-xs font-bold hover:bg-[#1C1D22] transition-colors ${selectedShop?.shop_id === shop.shop_id ? "text-[#F5CA53]" : "text-zinc-300"}`}
                                            >
                                                {shop.shop_name}
                                            </button>
                                        ))
                                    ) : (
                                        <div className="px-3.5 py-2.5 text-xs text-zinc-500">No shops yet</div>
                                    )}
                                </div>
                            )}
                        </div>

                        <Link
                            href="/tailor/add-shop"
                            className="w-full flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl border border-[#F5CA53]/20 text-[#F5CA53] hover:bg-[#F5CA53]/10 text-xs font-bold transition-colors"
                        >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            <span>Add Shop</span>
                        </Link>

                        <Link
                            href="/tailor/location"
                            className="w-full flex items-center gap-1.5 px-3.5 py-1.5 bg-[#15140e]/90 hover:bg-[#232014] rounded-full border border-[#F5CA53]/30 hover:border-[#F5CA53] transition-all group"
                        >
                            <svg className="w-3.5 h-3.5 text-[#F5CA53] shrink-0 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            <span className="text-[9px] font-bold text-[#F5CA53] tracking-widest uppercase truncate">{location}</span>
                        </Link>
                    </div>
                </aside>

                {/* MAIN CONTENT DYNAMIC VIEWS */}
                <main className="flex-1 space-y-8 min-w-0">

                    {/* ─── TAB: OVERVIEW ─── */}
                    {activeTab === "overview" && (
                        <>
                            <div>
                                <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-1">Manage Orders</h1>
                                <p className="text-[10px] font-black uppercase tracking-[0.25em] text-zinc-500">
                                    ACTIVE WORKSHOP SCHEDULE &bull; {shopDisplayName}
                                </p>
                            </div>

                            {isLoading ? (
                                <div className="space-y-3">
                                    {[1, 2, 3].map((i) => (
                                        <div key={i} className="h-20 bg-[#131418] border border-zinc-800 rounded-2xl animate-pulse" />
                                    ))}
                                </div>
                            ) : (
                                <>
                                    {/* ONGOING */}
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[10px] font-black uppercase tracking-[0.25em] text-[#F5CA53]">ONGOING</span>
                                            <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full bg-[#F5CA53]/10 border border-[#F5CA53]/30 text-[#F5CA53]">
                                                {ongoingOrders.length} ACTIVE
                                            </span>
                                        </div>

                                        {ongoingOrders.length === 0 ? (
                                            <div className="bg-[#131418]/90 border border-zinc-800/90 rounded-2xl p-6 text-center text-xs text-zinc-500">
                                                No orders in progress right now.
                                            </div>
                                        ) : (
                                            ongoingOrders.map((ord) => (
                                                <div key={ord.order_id} className="bg-[#131418]/90 border border-zinc-800/90 rounded-2xl p-5 shadow-xl transition-all duration-300 hover:border-zinc-700">
                                                    <div
                                                        onClick={() => setExpandedOrderId(expandedOrderId === ord.order_id ? null : ord.order_id)}
                                                        className="flex items-center justify-between cursor-pointer"
                                                    >
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-12 h-12 rounded-xl bg-[#1A1B20] border border-zinc-700 flex items-center justify-center text-[#F5CA53] shrink-0">
                                                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                                                </svg>
                                                            </div>
                                                            <div>
                                                                <h3 className="text-sm font-extrabold text-white">Order #{ord.order_id}</h3>
                                                                <p className="text-xs text-zinc-400 font-medium mt-0.5">
                                                                    Request #{ord.shop_request_id} &bull; <span className="text-[#F5CA53] font-bold">LKR {Number(ord.accepted_price).toLocaleString()}</span>
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <svg className={`w-5 h-5 text-zinc-400 transition-transform duration-300 ${expandedOrderId === ord.order_id ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                        </svg>
                                                    </div>
                                                    {expandedOrderId === ord.order_id && (
                                                        <div className="mt-4 pt-4 border-t border-zinc-800/80 space-y-3">
                                                            <div className="flex justify-between text-xs">
                                                                <span className="text-zinc-400">Status:</span>
                                                                <span className="text-[#F5CA53] font-bold">IN PROGRESS</span>
                                                            </div>
                                                            <div className="flex justify-between text-xs">
                                                                <span className="text-zinc-400">Started:</span>
                                                                <span className="text-white font-medium">{ord.started_date ? new Date(ord.started_date).toLocaleDateString() : "—"}</span>
                                                            </div>
                                                            <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                                                                <div className="h-full bg-[#F5CA53] w-3/5 shadow-[0_0_10px_rgba(245,202,83,0.5)]" />
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            ))
                                        )}
                                    </div>

                                    {/* PENDING */}
                                    <div className="space-y-4 pt-2">
                                        <span className="text-[10px] font-black uppercase tracking-[0.25em] text-zinc-500 block">PENDING ({pendingOrders.length})</span>
                                        {pendingOrders.length === 0 ? (
                                            <div className="bg-[#131418]/90 border border-zinc-800/90 rounded-2xl p-6 text-center text-xs text-zinc-500">No pending orders.</div>
                                        ) : (
                                            pendingOrders.map((ord) => (
                                                <div key={ord.order_id} className="bg-[#131418]/90 border border-zinc-800/90 rounded-2xl p-5 shadow-xl">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-12 h-12 rounded-xl bg-[#18191E] border border-zinc-800 flex items-center justify-center text-zinc-400 shrink-0">
                                                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                                </svg>
                                                            </div>
                                                            <div>
                                                                <h3 className="text-sm font-extrabold text-white">Order #{ord.order_id}</h3>
                                                                <p className="text-xs text-zinc-400 font-medium mt-0.5">
                                                                    Request #{ord.shop_request_id} &bull; <span className="text-white">LKR {Number(ord.accepted_price).toLocaleString()}</span>
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <span className="text-[9px] font-bold text-amber-400 uppercase tracking-widest bg-amber-400/10 border border-amber-400/30 px-2.5 py-1 rounded-full">PENDING</span>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>

                                    {/* NEW REQUESTS */}
                                    <div className="space-y-4 pt-2">
                                        <span className="text-[10px] font-black uppercase tracking-[0.25em] text-zinc-500 block">NEW REQUESTS ({filteredRequests.length})</span>
                                        {filteredRequests.length > 0 ? (
                                            filteredRequests.map((req) => (
                                                <div key={req.request_id} className="bg-[#131418]/90 border border-zinc-800/90 rounded-2xl p-5 sm:p-6 shadow-xl space-y-5">
                                                    <div className="flex items-start gap-4">
                                                        <div className="w-12 h-12 rounded-xl bg-[#18191E] border border-zinc-800 flex items-center justify-center text-[#F5CA53] shrink-0">
                                                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                                            </svg>
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <h3 className="text-sm font-extrabold text-white">
                                                                {req.clothing_category || "Custom Bespoke Request"}
                                                            </h3>
                                                            <p className="text-xs text-zinc-400 font-medium mt-0.5">
                                                                {req.gender ? `${req.gender.charAt(0).toUpperCase() + req.gender.slice(1)} fit` : "Custom garment"} &bull;{" "}
                                                                <span className="text-[#F5CA53] font-bold">
                                                                    {req.target_budget ? `LKR ${Number(req.target_budget).toLocaleString()}` : "Custom Quote"}
                                                                </span>
                                                            </p>
                                                            {req.target_date && (
                                                                <p className="text-[10px] text-zinc-500 mt-1">Needed by: {new Date(req.target_date).toLocaleDateString()}</p>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {req.description && (
                                                        <div className="p-4 rounded-xl bg-[#18191E] border border-zinc-800 text-xs italic text-zinc-300 leading-relaxed">
                                                            &quot;{req.description}&quot;
                                                        </div>
                                                    )}

                                                    {bidSubmittedForId === req.request_id ? (
                                                        <div className="p-3 rounded-xl bg-[#F5CA53]/10 border border-[#F5CA53]/40 text-[#F5CA53] text-xs font-bold text-center uppercase tracking-wider">
                                                            BID SUBMITTED TO CLIENT ✓
                                                        </div>
                                                    ) : (
                                                        <div className="grid grid-cols-2 gap-4">
                                                            <button
                                                                onClick={() => handleAcceptRequest(req)}
                                                                className="w-full rounded-xl bg-[#F5CA53] hover:bg-[#f7d369] py-3.5 text-xs font-black uppercase tracking-[0.15em] text-black shadow-[0_0_15px_rgba(245,202,83,0.25)] transition-all hover:scale-[1.01]"
                                                            >
                                                                SUBMIT BID
                                                            </button>
                                                            <Link
                                                                href="/orders"
                                                                className="w-full rounded-xl bg-[#18191E] hover:bg-zinc-800 border border-zinc-800 py-3.5 text-xs font-black uppercase tracking-[0.15em] text-zinc-300 transition-all text-center"
                                                            >
                                                                VIEW FULL
                                                            </Link>
                                                        </div>
                                                    )}
                                                </div>
                                            ))
                                        ) : (
                                            <div className="bg-[#131418]/90 border border-zinc-800/90 rounded-2xl p-6 text-center text-xs text-zinc-500">
                                                {isLoading ? "Loading requests..." : "No active client requests at the moment."}
                                            </div>
                                        )}
                                    </div>
                                </>
                            )}
                        </>
                    )}

                    {/* ─── TAB: SCHEDULE ─── */}
                    {activeTab === "schedule" && (
                        <>
                            <div>
                                <h1 className="text-3xl font-extrabold text-white tracking-tight mb-1">Schedule</h1>
                                <p className="text-[10px] font-black uppercase tracking-[0.25em] text-zinc-500">ACTIVE & UPCOMING ORDERS</p>
                            </div>
                            {isLoading ? (
                                <div className="space-y-3">{[1, 2].map((i) => <div key={i} className="h-20 bg-[#131418] border border-zinc-800 rounded-2xl animate-pulse" />)}</div>
                            ) : shopOrders.length === 0 ? (
                                <div className="bg-[#131418]/90 border border-zinc-800/90 rounded-2xl p-8 text-center text-xs text-zinc-500">No scheduled orders yet.</div>
                            ) : (
                                <div className="space-y-3">
                                    {shopOrders.map((ord) => {
                                        const statusColor = ord.order_status === "in_progress" ? "text-emerald-400 bg-emerald-400/10 border-emerald-400/30"
                                            : ord.order_status === "completed" ? "text-zinc-400 bg-zinc-800 border-zinc-700"
                                                : "text-amber-400 bg-amber-400/10 border-amber-400/30";
                                        return (
                                            <div key={ord.order_id} className="bg-[#131418]/90 border border-zinc-800/90 rounded-2xl p-5 flex items-center justify-between gap-4">
                                                <div>
                                                    <p className="text-sm font-bold text-white">Order #{ord.order_id}</p>
                                                    <p className="text-xs text-zinc-400 mt-0.5">LKR {Number(ord.accepted_price).toLocaleString()}</p>
                                                    {ord.started_date && <p className="text-[10px] text-zinc-500 mt-0.5">Started: {new Date(ord.started_date).toLocaleDateString()}</p>}
                                                    {ord.completed_date && <p className="text-[10px] text-zinc-500">Completed: {new Date(ord.completed_date).toLocaleDateString()}</p>}
                                                </div>
                                                <span className={`text-[9px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full border ${statusColor}`}>
                                                    {(ord.order_status || "pending").replace(/_/g, " ").toUpperCase()}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </>
                    )}

                    {/* ─── TAB: CLIENTS ─── */}
                    {activeTab === "clients" && (
                        <>
                            <div>
                                <h1 className="text-3xl font-extrabold text-white tracking-tight mb-1">Clients</h1>
                                <p className="text-[10px] font-black uppercase tracking-[0.25em] text-zinc-500">CLIENTS FROM YOUR ORDERS</p>
                            </div>
                            {isLoading ? (
                                <div className="space-y-3">{[1, 2, 3].map((i) => <div key={i} className="h-16 bg-[#131418] border border-zinc-800 rounded-2xl animate-pulse" />)}</div>
                            ) : uniqueClientIds.length === 0 ? (
                                <div className="bg-[#131418]/90 border border-zinc-800/90 rounded-2xl p-8 text-center text-xs text-zinc-500">No client data yet. Orders will appear here once you have confirmed commissions.</div>
                            ) : (
                                <div className="space-y-3">
                                    {shopOrders.map((ord) => (
                                        <div key={ord.order_id} className="bg-[#131418]/90 border border-zinc-800/90 rounded-2xl p-5 flex items-center justify-between gap-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-[#F5CA53]/10 border border-[#F5CA53]/30 flex items-center justify-center text-[#F5CA53] font-bold text-sm">
                                                    C
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-white">Client #{ord.shop_request_id}</p>
                                                    <p className="text-xs text-zinc-400">Order #{ord.order_id} &bull; LKR {Number(ord.accepted_price).toLocaleString()}</p>
                                                </div>
                                            </div>
                                            <span className={`text-[9px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full border ${ord.order_status === "completed" ? "text-emerald-400 bg-emerald-400/10 border-emerald-400/30" : "text-zinc-400 bg-zinc-800 border-zinc-700"}`}>
                                                {(ord.order_status || "pending").replace(/_/g, " ").toUpperCase()}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </>
                    )}

                    {/* ─── TAB: FABRIC ARCHIVE ─── */}
                    {activeTab === "fabrics" && (
                        <>
                            <div>
                                <h1 className="text-3xl font-extrabold text-white tracking-tight mb-1">Fabric Archive</h1>
                                <p className="text-[10px] font-black uppercase tracking-[0.25em] text-zinc-500">FABRIC STATUS FROM INCOMING REQUESTS</p>
                            </div>
                            {isLoading ? (
                                <div className="space-y-3">{[1, 2].map((i) => <div key={i} className="h-16 bg-[#131418] border border-zinc-800 rounded-2xl animate-pulse" />)}</div>
                            ) : openRequests.length === 0 ? (
                                <div className="bg-[#131418]/90 border border-zinc-800/90 rounded-2xl p-8 text-center text-xs text-zinc-500">No incoming requests with fabric information.</div>
                            ) : (
                                <div className="space-y-3">
                                    {openRequests.map((req) => (
                                        <div key={req.request_id} className="bg-[#131418]/90 border border-zinc-800/90 rounded-2xl p-5 flex items-center justify-between gap-4">
                                            <div>
                                                <p className="text-sm font-bold text-white">{req.clothing_category || "Custom Garment"}</p>
                                                <p className="text-xs text-zinc-400 mt-0.5">Request #{req.request_id}</p>
                                            </div>
                                            <span className={`text-[9px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full border ${req.fabric_status === "client_provided"
                                                ? "text-sky-400 bg-sky-400/10 border-sky-400/30"
                                                : req.fabric_status === "tailor_provided"
                                                    ? "text-amber-400 bg-amber-400/10 border-amber-400/30"
                                                    : "text-zinc-400 bg-zinc-800 border-zinc-700"
                                                }`}>
                                                {req.fabric_status === "client_provided" ? "Client Provides" : req.fabric_status === "tailor_provided" ? "Tailor Sources" : "Not Specified"}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </>
                    )}

                    {/* ─── TAB: EARNINGS ─── */}
                    {activeTab === "earnings" && (
                        <>
                            <div>
                                <h1 className="text-3xl font-extrabold text-white tracking-tight mb-1">Earnings</h1>
                                <p className="text-[10px] font-black uppercase tracking-[0.25em] text-zinc-500">REVENUE OVERVIEW FOR {shopDisplayName.toUpperCase()}</p>
                            </div>

                            {/* Earnings Summary Cards */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                {[
                                    { label: "Total Earned", value: `LKR ${totalEarnings.toLocaleString()}`, desc: "From completed orders", color: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20" },
                                    { label: "In Pipeline", value: `LKR ${pendingEarnings.toLocaleString()}`, desc: "Ongoing orders value", color: "text-[#F5CA53] bg-[#F5CA53]/10 border-[#F5CA53]/20" },
                                    { label: "Total Orders", value: String(shopOrders.length), desc: `${completedOrders.length} completed`, color: "text-zinc-300 bg-zinc-800 border-zinc-700" },
                                ].map(({ label, value, desc, color }) => (
                                    <div key={label} className={`bg-[#131418]/90 border rounded-2xl p-5 ${color}`}>
                                        <p className="text-[10px] font-bold uppercase tracking-widest opacity-80">{label}</p>
                                        <p className="text-2xl font-extrabold mt-2">{value}</p>
                                        <p className="text-[10px] opacity-60 mt-1">{desc}</p>
                                    </div>
                                ))}
                            </div>

                            {/* Orders List */}
                            <div className="space-y-3">
                                <span className="text-[10px] font-black uppercase tracking-[0.25em] text-zinc-500 block">ORDER BREAKDOWN</span>
                                {isLoading ? (
                                    <div className="space-y-3">{[1, 2, 3].map((i) => <div key={i} className="h-16 bg-[#131418] border border-zinc-800 rounded-2xl animate-pulse" />)}</div>
                                ) : shopOrders.length === 0 ? (
                                    <div className="bg-[#131418]/90 border border-zinc-800/90 rounded-2xl p-6 text-center text-xs text-zinc-500">No orders yet. Revenue will appear here once you have completed commissions.</div>
                                ) : (
                                    shopOrders.map((ord) => (
                                        <div key={ord.order_id} className="bg-[#131418]/90 border border-zinc-800/90 rounded-2xl p-4 flex items-center justify-between gap-4">
                                            <div>
                                                <p className="text-sm font-bold text-white">Order #{ord.order_id}</p>
                                                <p className="text-xs text-zinc-400 mt-0.5">{ord.created_at ? new Date(ord.created_at).toLocaleDateString() : "—"}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm font-bold text-[#F5CA53]">LKR {Number(ord.accepted_price).toLocaleString()}</p>
                                                <p className={`text-[9px] font-bold uppercase mt-0.5 ${ord.order_status === "completed" ? "text-emerald-400" : "text-amber-400"}`}>
                                                    {(ord.order_status || "pending").replace(/_/g, " ")}
                                                </p>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </>
                    )}

                    {/* ─── TAB: SETTINGS ─── */}
                    {activeTab === "settings" && (
                        <>
                            <div>
                                <h1 className="text-3xl font-extrabold text-white tracking-tight mb-1">Settings</h1>
                                <p className="text-[10px] font-black uppercase tracking-[0.25em] text-zinc-500">TAILOR PROFILE &amp; ACCOUNT</p>
                            </div>

                            <form onSubmit={handleSaveSettings} className="bg-[#131418]/90 border border-zinc-800/90 rounded-2xl p-6 sm:p-8 space-y-5">
                                {settingsSaved && (
                                    <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold text-center">
                                        Profile updated successfully ✓
                                    </div>
                                )}

                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Name (Firebase)</label>
                                    <div className="w-full bg-[#1F2025] border border-zinc-700/60 rounded-xl px-4 py-3 text-sm text-zinc-400 cursor-not-allowed">
                                        {user?.displayName || user?.email || "—"}
                                    </div>
                                    <p className="text-[9px] text-zinc-600">Display name is managed via Firebase Authentication.</p>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Phone Number</label>
                                    <input
                                        type="tel"
                                        value={settingsPhone}
                                        onChange={(e) => setSettingsPhone(e.target.value)}
                                        placeholder="+94 77 123 4567"
                                        className="w-full bg-[#1F2025] border border-zinc-700 focus:border-[#F5CA53] rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-600 outline-none transition-colors"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">City</label>
                                    <input
                                        type="text"
                                        value={settingsCity}
                                        onChange={(e) => setSettingsCity(e.target.value)}
                                        placeholder="e.g. Colombo"
                                        className="w-full bg-[#1F2025] border border-zinc-700 focus:border-[#F5CA53] rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-600 outline-none transition-colors"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Address</label>
                                    <input
                                        type="text"
                                        value={settingsAddress}
                                        onChange={(e) => setSettingsAddress(e.target.value)}
                                        placeholder="Street address"
                                        className="w-full bg-[#1F2025] border border-zinc-700 focus:border-[#F5CA53] rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-600 outline-none transition-colors"
                                    />
                                </div>

                                {tailorProfile && (
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Verification Status</label>
                                        <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold border ${tailorProfile.is_verified
                                            ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                                            : "bg-amber-400/10 border-amber-400/30 text-amber-400"
                                            }`}>
                                            <span className={`w-2 h-2 rounded-full ${tailorProfile.is_verified ? "bg-emerald-400" : "bg-amber-400"}`} />
                                            {tailorProfile.is_verified ? "Verified Tailor" : "Pending Verification"}
                                        </div>
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    disabled={isSavingSettings}
                                    className="w-full bg-[#F5CA53] hover:bg-[#e4bb49] text-black font-bold text-xs uppercase tracking-widest py-4 rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-70"
                                >
                                    {isSavingSettings ? "Saving..." : "Save Profile Changes"}
                                </button>
                            </form>
                        </>
                    )}
                </main>
            </div>

            {/* FOOTER */}
            <footer className="w-full border-t border-zinc-900/80 bg-[#0A0B0E]">
                <div className="max-w-7xl mx-auto px-6 sm:px-12 py-8">
                    <div className="flex flex-wrap items-center justify-center gap-6 text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                        <Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
                        <Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
                        <Link href="/contact" className="hover:text-white transition-colors">Contact Support</Link>
                    </div>
                </div>
            </footer>

            {/* FLOATING CHAT TRIGGER */}
            {!isChatDrawerOpen && (
                <button
                    onClick={() => setIsChatDrawerOpen(true)}
                    className="fixed bottom-6 right-6 z-[8888] px-4 py-3 bg-[#F5CA53] hover:bg-[#f7d369] text-black font-extrabold text-xs uppercase tracking-wider rounded-full shadow-[0_0_25px_rgba(245,202,83,0.5)] flex items-center gap-2 transition-all hover:scale-105"
                >
                    <span className="w-2 h-2 rounded-full bg-emerald-600 animate-ping" />
                    <span>💬 Text Client Direct Line</span>
                </button>
            )}

            {/* LIVE ATELIER CHAT DRAWER */}
            <AtelierChatDrawer
                isOpen={isChatDrawerOpen}
                onClose={() => setIsChatDrawerOpen(false)}
                userRole="tailor"
            />

            {/* REAL-TIME NOTIFICATION DRAWER */}
            <NotificationDrawer
                isOpen={isNotificationOpen}
                onClose={() => setIsNotificationOpen(false)}
            />
        </div>
    );
}