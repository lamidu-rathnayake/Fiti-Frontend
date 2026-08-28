"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { useAuth } from "@/lib/firebase/AuthContext";
import { getClientProfile } from "@/lib/api/endpoints/profiles";
import { listNearbyShops } from "@/lib/api/endpoints/shops";
import type { Shop } from "@/lib/api/types/shop";
import AtelierChatDrawer from "@/components/chat/AtelierChatDrawer";
import NotificationDrawer from "@/components/notifications/NotificationDrawer";

const LocationPicker = dynamic(() => import("@/components/map/LocationPicker"), {
    ssr: false,
    loading: () => (
        <div className="w-full h-full bg-[#131418] animate-pulse flex items-center justify-center text-zinc-500 text-xs font-mono">
            Loading Atelier Map...
        </div>
    ),
});

const LOCATION_PRESETS = [
    { label: "Main Road, Colombo 12", lat: 6.9385, lng: 79.8542 },
    { label: "Cinnamon Gardens, Colombo 07", lat: 6.9102, lng: 79.8653 },
    { label: "Nugegoda Highlevel Rd", lat: 6.8745, lng: 79.8864 },
    { label: "Kandy City Center", lat: 7.2906, lng: 80.6337 },
    { label: "Galle Fort, Galle", lat: 6.0305, lng: 80.2170 },
    { label: "Pettah Commercial Zone", lat: 6.9355, lng: 79.8510 },
];

export default function ClientHomePage() {
    const { user, logout } = useAuth();
    const router = useRouter();
    const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
    const [selectedAddress, setSelectedAddress] = useState<string>("Main Road, Colombo 12");
    const [nearbyShops, setNearbyShops] = useState<Shop[]>([]);
    const [loadingShops, setLoadingShops] = useState(true);
    const [locationInitialized, setLocationInitialized] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");

    // Manual location selection modal states
    const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
    const [customAddressInput, setCustomAddressInput] = useState("");

    // Live texting / Chat drawer states
    const [isChatDrawerOpen, setIsChatDrawerOpen] = useState(false);
    const [isNotificationOpen, setIsNotificationOpen] = useState(false);
    const [chatContactName, setChatContactName] = useState<string>("Master Alexander Vane");

    useEffect(() => {
        const initLocation = async () => {
            if (user) {
                try {
                    const profile = await getClientProfile(user.uid);
                    if (profile.latitude && profile.longitude) {
                        const savedLoc = { lat: profile.latitude, lng: profile.longitude };
                        setLocation(savedLoc);
                        loadNearbyShops(savedLoc.lat, savedLoc.lng);
                        setLocationInitialized(true);
                        return;
                    }
                } catch {
                    // Fall back to default location
                }
            }

            if ("geolocation" in navigator) {
                navigator.geolocation.getCurrentPosition(
                    (pos) => {
                        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
                        setLocation(loc);
                        loadNearbyShops(loc.lat, loc.lng);
                        setLocationInitialized(true);
                    },
                    () => {
                        loadNearbyShops(6.9271, 79.8612);
                        setLocationInitialized(true);
                    }
                );
            } else {
                loadNearbyShops(6.9271, 79.8612);
                setLocationInitialized(true);
            }
        };

        initLocation();
    }, [user]);

    const loadNearbyShops = async (lat: number, lng: number) => {
        setLoadingShops(true);
        try {
            const shops = await listNearbyShops({ lat, lng, radius_km: 25 });
            setNearbyShops(shops);
        } catch {
            setNearbyShops([]);
        } finally {
            setLoadingShops(false);
        }
    };

    const handleApplyLocation = (newAddress: string, coords?: { lat: number; lng: number }) => {
        setSelectedAddress(newAddress);
        if (coords) {
            setLocation(coords);
            loadNearbyShops(coords.lat, coords.lng);
        } else if (location) {
            loadNearbyShops(location.lat, location.lng);
        }
        setIsLocationModalOpen(false);
    };

    return (
        <div className="min-h-screen bg-[#07080A] text-white flex flex-col justify-between selection:bg-[#F5CA53] selection:text-black font-sans relative">
            {/* TOP NAVIGATION HEADER */}
            <header className="w-full border-b border-zinc-900/90 bg-[#0A0B0E]/95 backdrop-blur-xl sticky top-0 z-50 transition-all duration-300">
                <div className="max-w-7xl mx-auto px-4 sm:px-8 py-4 flex items-center justify-between gap-4">
                    {/* Left: Back button & Atelier Logo */}
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
                                <img
                                    src="/logoo.png"
                                    alt="FITI Atelier Digital Logo"
                                    className="h-7 w-auto object-contain"
                                />
                            </div>
                            <span className="font-extrabold tracking-widest text-sm text-white uppercase font-heading hidden sm:inline-block">
                                ATELIER DIGITAL
                            </span>
                        </Link>
                    </div>

                    {/* Middle Navigation Links */}
                    <nav className="hidden lg:flex items-center space-x-8 text-xs font-bold tracking-wider text-zinc-400">
                        <Link href="/storefront" className="hover:text-[#F5CA53] transition-colors">
                            Storefront
                        </Link>
                        <Link href="/client/home" className="text-white font-extrabold relative pb-1 border-b-2 border-[#F5CA53]">
                            Dashboard
                        </Link>
                        <Link href="/orders" className="hover:text-[#F5CA53] transition-colors">
                            Orders
                        </Link>
                        <Link href="/tailors" className="hover:text-[#F5CA53] transition-colors">
                            Tailors
                        </Link>
                    </nav>

                    {/* Right User Actions & Search Bar */}
                    <div className="flex items-center space-x-3">
                        {/* Search Input Box */}
                        <div className="relative hidden md:block w-48 lg:w-56">
                            <svg className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#F5CA53]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            <input
                                type="text"
                                placeholder="Find a tailor..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter" && searchQuery.trim()) {
                                        router.push(`/tailors?q=${encodeURIComponent(searchQuery.trim())}`);
                                    }
                                }}
                                className="w-full pl-9 pr-3 py-1.5 bg-[#141519] border border-zinc-800 focus:border-[#F5CA53] rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none transition-all"
                            />
                        </div>

                        {/* Cart / Shopping Bag Icon */}
                        <Link href="/storefront" title="Shopping Bag" className="w-9 h-9 rounded-xl border border-zinc-800 bg-[#141519] hover:border-zinc-700 flex items-center justify-center text-zinc-400 hover:text-white transition-all">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                            </svg>
                        </Link>

                        {/* Notification Bell */}
                        <button
                            onClick={() => setIsNotificationOpen(true)}
                            title="Notifications"
                            className="w-9 h-9 rounded-xl border border-zinc-800 bg-[#141519] hover:border-[#F5CA53]/50 flex items-center justify-center text-zinc-400 hover:text-[#F5CA53] transition-all relative"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                            </svg>
                            <span className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-[#F5CA53]" />
                        </button>

                        {/* Live Chat / Texting Icon */}
                        <button
                            onClick={() => setIsChatDrawerOpen((prev) => !prev)}
                            title="Direct Message Tailor"
                            className="w-9 h-9 rounded-xl border border-[#F5CA53]/50 bg-[#F5CA53]/10 hover:bg-[#F5CA53]/20 flex items-center justify-center text-[#F5CA53] transition-all relative"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
                            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-black" />
                        </button>

                        {/* Logout Button */}
                        <button
                            onClick={async () => {
                                await logout();
                                router.push("/login");
                            }}
                            className="px-3.5 py-1.5 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-400 hover:bg-rose-500 hover:text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm"
                            title="Sign out"
                        >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                            <span>Logout</span>
                        </button>
                    </div>
                </div>
            </header>

            {/* MAIN DASHBOARD BODY */}
            <main className="max-w-7xl w-full mx-auto px-4 sm:px-8 py-8 flex-1 space-y-8">
                {/* EXCLUSIVE ACCESS WELCOME GREETING */}
                <div>
                    <span className="text-[10px] font-mono tracking-[0.3em] uppercase text-zinc-400 block mb-1">
                        EXCLUSIVE ACCESS
                    </span>
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-heading">
                        Welcome back, <span className="text-[#F5CA53]">{user?.displayName || "Mr. Adam"}</span>
                    </h1>
                </div>

                {/* MAP / ATELIER LOCATION HERO DISPLAY */}
                <div className="w-full h-80 sm:h-96 rounded-2xl bg-[#0F1014] border border-zinc-800/90 relative overflow-hidden shadow-2xl group">
                    {/* Dark Custom Map View */}
                    {locationInitialized && (
                        <div className="w-full h-full relative z-0">
                            <LocationPicker
                                defaultLocation={location || undefined}
                                onChange={(loc) => {
                                    setLocation(loc);
                                    setSelectedAddress(`Lat: ${loc.lat.toFixed(4)}, Lng: ${loc.lng.toFixed(4)}`);
                                }}
                            />
                        </div>
                    )}

                    {/* FLOATING CURRENT SELECTION OVERLAY CARD */}
                    <div className="absolute bottom-6 left-6 z-[500] max-w-sm w-full bg-[#121318]/95 border border-zinc-800/90 rounded-2xl p-4 shadow-2xl backdrop-blur-xl flex items-center justify-between gap-4">
                        <div>
                            <span className="text-[9px] font-mono tracking-[0.2em] uppercase text-zinc-400 block mb-1">
                                CURRENT SELECTION
                            </span>
                            <p className="text-sm font-extrabold text-white leading-tight font-heading">
                                {selectedAddress}
                            </p>
                        </div>

                        <button
                            onClick={() => {
                                setCustomAddressInput(selectedAddress);
                                setIsLocationModalOpen(true);
                            }}
                            className="px-4 py-2 bg-[#F5CA53] hover:bg-[#f7d369] text-black font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all shadow-[0_0_15px_rgba(245,202,83,0.3)] shrink-0 transform hover:scale-105"
                        >
                            CHANGE
                        </button>
                    </div>
                </div>

                {/* NEARBY BEST STORES SECTION */}
                <div className="space-y-4 pt-2">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="w-1 h-4 bg-[#F5CA53] rounded-full" />
                            <h2 className="text-base font-extrabold text-white tracking-wide font-heading">
                                Nearby Best Stores
                            </h2>
                        </div>
                        <Link href="/tailors" className="text-xs font-mono tracking-widest text-zinc-400 hover:text-[#F5CA53] uppercase transition-colors">
                            View All &rarr;
                        </Link>
                    </div>

                    {/* 3 STORE CARDS GRID */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                        {loadingShops ? (
                            <div className="col-span-3 text-center py-10 font-mono text-xs text-zinc-500 animate-pulse">
                                Discovering nearby bespoke ateliers...
                            </div>
                        ) : nearbyShops.length > 0 ? (
                            nearbyShops
                                .filter((shop) =>
                                    shop.shop_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                    (shop.city && shop.city.toLowerCase().includes(searchQuery.toLowerCase())) ||
                                    (shop.specialty && shop.specialty.toLowerCase().includes(searchQuery.toLowerCase())) ||
                                    (shop.shop_bio && shop.shop_bio.toLowerCase().includes(searchQuery.toLowerCase()))
                                )
                                .slice(0, 3)
                                .map((shop) => (
                                <div key={shop.shop_id} className="bg-[#121318] border border-zinc-800/80 hover:border-[#F5CA53]/50 rounded-2xl p-5 flex flex-col justify-between transition-all duration-300 hover:shadow-[0_0_25px_rgba(245,202,83,0.12)] group">
                                    <div className="flex gap-3">
                                        <div className="w-14 h-14 rounded-xl bg-zinc-900 border border-zinc-800 overflow-hidden shrink-0">
                                            <img
                                                src={shop.images && shop.images.length > 0 ? shop.images[0].image_url : "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=200&q=80"}
                                                alt={shop.shop_name}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                            />
                                        </div>
                                        <div>
                                            <div className="flex items-center justify-between">
                                                <h3 className="text-sm font-extrabold text-white group-hover:text-[#F5CA53] transition-colors font-heading">
                                                    {shop.shop_name}
                                                </h3>
                                                <span className="text-[10px] font-bold text-[#F5CA53] flex items-center gap-1">
                                                    <span>&#9733;</span> {shop.average_rating ? shop.average_rating.toFixed(1) : "4.9"}
                                                </span>
                                            </div>
                                            <p className="text-xs text-zinc-400 mt-1 line-clamp-2 leading-relaxed">
                                                {shop.shop_bio || shop.specialty || "Master tailors specializing in modern silhouettes and sharp architectural cuts."}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="space-y-3 pt-3 mt-4 border-t border-zinc-800/80">
                                        <div className="flex items-center justify-between text-[10px]">
                                            <span className="font-mono text-zinc-500 flex items-center gap-1">
                                                <span>📍</span> {shop.city}
                                            </span>
                                            <span className="font-mono tracking-wider uppercase px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 font-bold border border-zinc-700">
                                                BESPOKE
                                            </span>
                                        </div>

                                        <div className="grid grid-cols-2 gap-2">
                                            <button
                                                onClick={() => {
                                                    setChatContactName(`Master ${shop.shop_name}`);
                                                    setIsChatDrawerOpen(true);
                                                }}
                                                className="w-full py-2 rounded-xl bg-[#18191E] border border-[#F5CA53]/50 hover:bg-[#F5CA53]/10 text-[#F5CA53] text-[11px] font-bold uppercase tracking-wider flex items-center justify-center gap-1 transition-all"
                                            >
                                                <span>💬 Text</span>
                                            </button>
                                            <Link
                                                href="/client/request"
                                                className="w-full text-center py-2 rounded-xl bg-[#F5CA53] text-black text-[11px] font-bold uppercase tracking-wider shadow-[0_0_12px_rgba(245,202,83,0.2)] hover:scale-[1.01] transition-transform block"
                                            >
                                                Book &rarr;
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <>
                                {/* Default Atelier Shop Display */}
                                <div className="bg-[#121318] border border-zinc-800/80 hover:border-[#F5CA53]/50 rounded-2xl p-5 flex flex-col justify-between transition-all duration-300 hover:shadow-[0_0_25px_rgba(245,202,83,0.12)] group">
                                    <div className="flex gap-3">
                                        <div className="w-14 h-14 rounded-xl bg-zinc-900 border border-zinc-800 overflow-hidden shrink-0">
                                            <img
                                                src="https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=200&q=80"
                                                alt="Carnage Tailors"
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                            />
                                        </div>
                                        <div>
                                            <div className="flex items-center justify-between">
                                                <h3 className="text-sm font-extrabold text-white group-hover:text-[#F5CA53] transition-colors font-heading">
                                                    Carnage Tailors
                                                </h3>
                                                <span className="text-[10px] font-bold text-[#F5CA53] flex items-center gap-1">
                                                    <span>&#9733;</span> 4.9
                                                </span>
                                            </div>
                                            <p className="text-xs text-zinc-400 mt-1 line-clamp-2 leading-relaxed">
                                                Master tailors specializing in modern silhouettes and sharp architectural cuts.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="space-y-3 pt-3 mt-4 border-t border-zinc-800/80">
                                        <div className="flex items-center justify-between text-[10px]">
                                            <span className="font-mono text-zinc-500 flex items-center gap-1">
                                                <span>📍</span> Colombo 12
                                            </span>
                                            <span className="font-mono tracking-wider uppercase px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 font-bold border border-zinc-700">
                                                BESPOKE
                                            </span>
                                        </div>

                                        <div className="grid grid-cols-2 gap-2">
                                            <button
                                                onClick={() => {
                                                    setChatContactName("Master Marcus Silva");
                                                    setIsChatDrawerOpen(true);
                                                }}
                                                className="w-full py-2 rounded-xl bg-[#18191E] border border-[#F5CA53]/50 hover:bg-[#F5CA53]/10 text-[#F5CA53] text-[11px] font-bold uppercase tracking-wider flex items-center justify-center gap-1 transition-all"
                                            >
                                                <span>💬 Text</span>
                                            </button>
                                            <Link
                                                href="/client/request"
                                                className="w-full text-center py-2 rounded-xl bg-[#F5CA53] text-black text-[11px] font-bold uppercase tracking-wider shadow-[0_0_12px_rgba(245,202,83,0.2)] hover:scale-[1.01] transition-transform block"
                                            >
                                                Book &rarr;
                                            </Link>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-[#121318] border border-zinc-800/80 hover:border-[#F5CA53]/50 rounded-2xl p-5 flex flex-col justify-between transition-all duration-300 hover:shadow-[0_0_25px_rgba(245,202,83,0.12)] group">
                                    <div className="flex gap-3">
                                        <div className="w-14 h-14 rounded-xl bg-zinc-900 border border-zinc-800 overflow-hidden shrink-0">
                                            <img
                                                src="https://images.unsplash.com/photo-1598033129183-c4f50c736f10?auto=format&fit=crop&w=200&q=80"
                                                alt="Hercules Tailors"
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                            />
                                        </div>
                                        <div>
                                            <div className="flex items-center justify-between">
                                                <h3 className="text-sm font-extrabold text-white group-hover:text-[#F5CA53] transition-colors font-heading">
                                                    Hercules Tailors
                                                </h3>
                                                <span className="text-[10px] font-bold text-[#F5CA53] flex items-center gap-1">
                                                    <span>&#9733;</span> 4.7
                                                </span>
                                            </div>
                                            <p className="text-xs text-zinc-400 mt-1 line-clamp-2 leading-relaxed">
                                                Heritage fabrics meet contemporary Italian cuts for the modern gentleman.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="space-y-3 pt-3 mt-4 border-t border-zinc-800/80">
                                        <div className="flex items-center justify-between text-[10px]">
                                            <span className="font-mono text-zinc-500 flex items-center gap-1">
                                                <span>📍</span> Nugegoda
                                            </span>
                                            <span className="font-mono tracking-wider uppercase px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 font-bold border border-zinc-700">
                                                MADE-TO-MEASURE
                                            </span>
                                        </div>

                                        <div className="grid grid-cols-2 gap-2">
                                            <button
                                                onClick={() => {
                                                    setChatContactName("Master Devinda Cooray");
                                                    setIsChatDrawerOpen(true);
                                                }}
                                                className="w-full py-2 rounded-xl bg-[#18191E] border border-[#F5CA53]/50 hover:bg-[#F5CA53]/10 text-[#F5CA53] text-[11px] font-bold uppercase tracking-wider flex items-center justify-center gap-1 transition-all"
                                            >
                                                <span>💬 Text</span>
                                            </button>
                                            <Link
                                                href="/client/request"
                                                className="w-full text-center py-2 rounded-xl bg-[#F5CA53] text-black text-[11px] font-bold uppercase tracking-wider shadow-[0_0_12px_rgba(245,202,83,0.2)] hover:scale-[1.01] transition-transform block"
                                            >
                                                Book &rarr;
                                            </Link>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-[#121318] border border-zinc-800/80 hover:border-[#F5CA53]/50 rounded-2xl p-5 flex flex-col justify-between transition-all duration-300 hover:shadow-[0_0_25px_rgba(245,202,83,0.12)] group">
                                    <div className="flex gap-3">
                                        <div className="w-14 h-14 rounded-xl bg-zinc-900 border border-zinc-800 overflow-hidden shrink-0">
                                            <img
                                                src="https://images.unsplash.com/photo-1617137984095-74e4e5e3613f?auto=format&fit=crop&w=200&q=80"
                                                alt="House of Tailors"
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                            />
                                        </div>
                                        <div>
                                            <div className="flex items-center justify-between">
                                                <h3 className="text-sm font-extrabold text-white group-hover:text-[#F5CA53] transition-colors font-heading">
                                                    House of Tailors
                                                </h3>
                                                <span className="text-[10px] font-bold text-[#F5CA53] flex items-center gap-1">
                                                    <span>&#9733;</span> 4.8
                                                </span>
                                            </div>
                                            <p className="text-xs text-zinc-400 mt-1 line-clamp-2 leading-relaxed">
                                                Quiet luxury with a focus on sustainable fine wools and artisanal finishes.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="space-y-3 pt-3 mt-4 border-t border-zinc-800/80">
                                        <div className="flex items-center justify-between text-[10px]">
                                            <span className="font-mono text-zinc-500 flex items-center gap-1">
                                                <span>📍</span> Colombo 07
                                            </span>
                                            <span className="font-mono tracking-wider uppercase px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 font-bold border border-zinc-700">
                                                LIMITED RUN
                                            </span>
                                        </div>

                                        <div className="grid grid-cols-2 gap-2">
                                            <button
                                                onClick={() => {
                                                    setChatContactName("Master Alexander Vane");
                                                    setIsChatDrawerOpen(true);
                                                }}
                                                className="w-full py-2 rounded-xl bg-[#18191E] border border-[#F5CA53]/50 hover:bg-[#F5CA53]/10 text-[#F5CA53] text-[11px] font-bold uppercase tracking-wider flex items-center justify-center gap-1 transition-all"
                                            >
                                                <span>💬 Text</span>
                                            </button>
                                            <Link
                                                href="/client/request"
                                                className="w-full text-center py-2 rounded-xl bg-[#F5CA53] text-black text-[11px] font-bold uppercase tracking-wider shadow-[0_0_12px_rgba(245,202,83,0.2)] hover:scale-[1.01] transition-transform block"
                                            >
                                                Book &rarr;
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* FEATURE SHOWCASE CARDS (3 COLUMNS) */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-5 pt-4">
                    {/* Card 1: The Bespoke Process (Wide Dark Image Card) */}
                    <Link
                        href="/tailors"
                        className="md:col-span-6 bg-[#121318] border border-zinc-800/80 hover:border-[#F5CA53]/60 rounded-2xl p-6 sm:p-8 flex flex-col justify-end relative overflow-hidden group min-h-[220px] transition-all"
                    >
                        <div className="absolute inset-0 bg-cover bg-center opacity-30 group-hover:opacity-40 transition-opacity" style={{ backgroundImage: `url('https://images.unsplash.com/photo-1558769132-cb1aea458c5e?auto=format&fit=crop&w=800&q=80')` }} />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#0A0B0E] via-[#0A0B0E]/60 to-transparent" />

                        <div className="relative z-10">
                            <h3 className="text-lg font-extrabold text-white mb-2 font-heading group-hover:text-[#F5CA53] transition-colors flex items-center gap-2">
                                <span>The Bespoke Process</span>
                                <span>&rarr;</span>
                            </h3>
                            <p className="text-xs text-zinc-300 leading-relaxed max-w-md">
                                Experience the journey from a single thread to a masterpiece designed exclusively for you.
                            </p>
                        </div>
                    </Link>

                    {/* Card 2: Authentic Heritage (Solid Gold Card) */}
                    <Link
                        href="/tailors"
                        className="md:col-span-3 bg-[#F5CA53] hover:bg-[#f7d369] rounded-2xl p-6 flex flex-col justify-between text-black shadow-[0_0_25px_rgba(245,202,83,0.2)] group hover:scale-[1.01] transition-transform min-h-[220px]"
                    >
                        <div className="w-10 h-10 rounded-full border border-black/20 bg-black/10 flex items-center justify-center text-black">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                            </svg>
                        </div>

                        <div>
                            <h3 className="text-base font-extrabold font-heading mb-1 text-black">
                                Authentic Heritage &rarr;
                            </h3>
                            <span className="text-[10px] font-mono tracking-widest uppercase font-bold text-black/70 block">
                                CERTIFIED ARTISANS
                            </span>
                        </div>
                    </Link>

                    {/* Card 3: Consultation (Dark Card with Icon) */}
                    <button
                        onClick={() => {
                            setChatContactName("Master Alexander Vane");
                            setIsChatDrawerOpen(true);
                        }}
                        className="md:col-span-3 bg-[#121318] border border-zinc-800/80 rounded-2xl p-6 flex flex-col justify-between items-center text-center group hover:border-[#F5CA53]/50 transition-all min-h-[220px]"
                    >
                        <div className="w-12 h-12 rounded-full border border-zinc-700 bg-zinc-800/80 flex items-center justify-center text-[#F5CA53] mt-2 group-hover:scale-110 transition-transform">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                            </svg>
                        </div>

                        <div className="mb-2">
                            <h3 className="text-base font-extrabold text-white font-heading mb-1 group-hover:text-[#F5CA53] transition-colors">
                                Consultation 💬
                            </h3>
                            <p className="text-xs text-zinc-400">
                                Click to text a master tailor for advice
                            </p>
                        </div>
                    </button>
                </div>
            </main>

            {/* MANUAL LOCATION SELECTION MODAL */}
            {isLocationModalOpen && (
                <div className="fixed inset-0 z-[1000] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
                    <div className="bg-[#121318] border border-zinc-800 rounded-2xl max-w-lg w-full p-6 sm:p-8 space-y-6 shadow-2xl relative">
                        <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
                            <div>
                                <span className="text-[10px] font-mono tracking-[0.25em] text-[#F5CA53] uppercase block">
                                    LOCATION SELECTION
                                </span>
                                <h3 className="text-lg font-extrabold text-white font-heading">
                                    Change Delivery &amp; Atelier Area
                                </h3>
                            </div>
                            <button
                                onClick={() => setIsLocationModalOpen(false)}
                                className="w-8 h-8 rounded-full border border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-white flex items-center justify-center text-sm transition-all"
                            >
                                &times;
                            </button>
                        </div>

                        {/* Custom Address Input */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider block">
                                Enter Manual Address or Area:
                            </label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={customAddressInput}
                                    onChange={(e) => setCustomAddressInput(e.target.value)}
                                    placeholder="e.g. Main Road, Colombo 12"
                                    className="flex-1 px-4 py-2.5 bg-[#1A1B22] border border-zinc-800 focus:border-[#F5CA53] rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none transition-all"
                                />
                                <button
                                    onClick={() => handleApplyLocation(customAddressInput || "Main Road, Colombo 12")}
                                    className="px-5 py-2.5 bg-[#F5CA53] hover:bg-[#f7d369] text-black font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md"
                                >
                                    Apply
                                </button>
                            </div>
                        </div>

                        {/* Popular Preset Quick Chips */}
                        <div className="space-y-3 pt-2 border-t border-zinc-800/80">
                            <span className="text-[10px] font-mono tracking-widest text-zinc-400 uppercase block">
                                Popular Atelier Hubs (Quick Pick):
                            </span>
                            <div className="flex flex-wrap gap-2">
                                {LOCATION_PRESETS.map((preset) => (
                                    <button
                                        key={preset.label}
                                        onClick={() => handleApplyLocation(preset.label, { lat: preset.lat, lng: preset.lng })}
                                        className="px-3 py-2 bg-[#1A1B22] border border-zinc-800 hover:border-[#F5CA53]/60 hover:bg-[#F5CA53]/10 text-zinc-300 hover:text-[#F5CA53] text-xs font-medium rounded-xl transition-all text-left flex items-center gap-1.5"
                                    >
                                        <span>📍</span>
                                        <span>{preset.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Modal Action Footer */}
                        <div className="flex justify-end gap-3 pt-2">
                            <button
                                onClick={() => setIsLocationModalOpen(false)}
                                className="px-4 py-2 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-300 font-bold text-xs rounded-xl transition-all"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ATELIER DIGITAL FOOTER */}
            <footer className="w-full border-t border-zinc-900/90 bg-[#07080A] py-8 px-4 sm:px-8 mt-12 relative z-20">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-xs">
                    <div>
                        <span className="font-extrabold text-sm tracking-widest text-white uppercase font-heading block">
                            ATELIER DIGITAL
                        </span>
                        <p className="text-zinc-500 text-[11px] mt-1 font-mono">
                            &copy; {new Date().getFullYear()} ATELIER DIGITAL. ALL RIGHTS RESERVED.
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-6 text-zinc-400 font-mono text-[11px]">
                        <Link href="/terms" className="hover:text-[#F5CA53] transition-colors">Terms of Service</Link>
                        <Link href="/privacy" className="hover:text-[#F5CA53] transition-colors">Privacy Policy</Link>
                        <Link href="/contact" className="hover:text-[#F5CA53] transition-colors">Contact Support</Link>
                    </div>
                </div>
            </footer>

            {/* FLOATING TEXT / CHAT TRIGGER BUTTON */}
            {!isChatDrawerOpen && (
                <button
                    onClick={() => setIsChatDrawerOpen(true)}
                    className="fixed bottom-6 right-6 z-[8888] px-4 py-3 bg-[#F5CA53] hover:bg-[#f7d369] text-black font-extrabold text-xs uppercase tracking-wider rounded-full shadow-[0_0_25px_rgba(245,202,83,0.5)] flex items-center gap-2 transition-all hover:scale-105"
                >
                    <span className="w-2 h-2 rounded-full bg-emerald-600 animate-ping" />
                    <span>💬 Text Atelier Tailor</span>
                </button>
            )}

            {/* LIVE ATELIER CHAT DRAWER */}
            <AtelierChatDrawer
                isOpen={isChatDrawerOpen}
                onClose={() => setIsChatDrawerOpen(false)}
                initialContactName={chatContactName}
                userRole="client"
            />

            {/* REAL-TIME NOTIFICATION DRAWER */}
            <NotificationDrawer
                isOpen={isNotificationOpen}
                onClose={() => setIsNotificationOpen(false)}
            />
        </div>
    );
}