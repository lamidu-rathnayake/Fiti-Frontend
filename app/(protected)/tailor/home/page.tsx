"use client";

import { useAuth } from "@/lib/firebase/AuthContext";
import Link from "next/link";
import { useState, useEffect } from "react";

const getShopStats = (shopName: string) => {
    if (shopName === "Shop 1") {
        return {
            ongoing: "02",
            pending: "05",
            requests: "01",
            activeItem: "Bespoke Navy Double-Breasted Suit #8821",
            activeStatus: "Fitting",
            progress: "75%"
        };
    }
    
    // Deterministic mock data based on shop name length and characters
    const hash = shopName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    
    const statuses = ["Cutting", "Stitching", "Final Fitting", "Pattern Making"];
    const items = ["Men's Full Suit", "Overcoat Chalk Line", "Silk Dinner Jacket", "Double-Breasted Navy Suit", "Vintage Velvet Blazer"];
    
    return {
        ongoing: `0${(hash % 5) + 1}`,
        pending: `0${(hash % 8) + 2}`,
        requests: `0${(hash % 3) + 1}`,
        activeItem: items[hash % items.length] + ` #${2000 + (hash % 1000)}`,
        activeStatus: statuses[hash % statuses.length],
        progress: `${20 + (hash % 60)}%`
    };
};

export default function TailorHomePage() {
    const { user } = useAuth();
    
    // Shop & location state
    const [shops, setShops] = useState<string[]>(["Shop 1"]);
    const [selectedShop, setSelectedShop] = useState("Shop 1");
    const [location, setLocation] = useState("London, UK");
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    useEffect(() => {
        // Load shops & location from localStorage on mount
        const storedShops = localStorage.getItem('tailorShops');
        if (storedShops) {
            try {
                setShops(JSON.parse(storedShops));
            } catch (e) {
                console.error("Failed to parse shops", e);
            }
        }
        
        const lastSelected = localStorage.getItem('tailorSelectedShop');
        if (lastSelected) {
            setSelectedShop(lastSelected);
        }

        const storedLocation = localStorage.getItem('tailorLocation');
        if (storedLocation) {
            setLocation(storedLocation);
        }
    }, []);

    const handleSelectShop = (shopName: string) => {
        setSelectedShop(shopName);
        setIsDropdownOpen(false);
        localStorage.setItem('tailorSelectedShop', shopName);
    };

    const stats = getShopStats(selectedShop);
    
    return (
        <div className="min-h-screen bg-[#070708] text-white font-sans selection:bg-[#F5CA53] selection:text-black relative overflow-hidden">
            {/* Ambient Gold & Black Luxury Background Glows */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[600px] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#554618]/30 via-[#1e190b]/20 to-transparent pointer-events-none z-0"></div>
            <div className="absolute top-24 -left-32 w-96 h-96 bg-[#F5CA53]/10 rounded-full blur-[130px] pointer-events-none z-0"></div>
            <div className="absolute top-1/2 -right-32 w-96 h-96 bg-[#b88e28]/10 rounded-full blur-[140px] pointer-events-none z-0"></div>

            {/* Responsive container */}
            <div className="max-w-5xl mx-auto min-h-screen flex flex-col relative z-10 pb-28">
                
                {/* Header */}
                <div className="px-6 pt-8 md:pt-12 pb-6 space-y-8">
                    {/* Greeting & Location */}
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.25em] text-[#A39A7C] mb-1">Welcome Back</p>
                            <h1 className="text-3xl font-light tracking-tight leading-none text-white">
                                Mr. <span className="font-semibold text-[#F5CA53] drop-shadow-[0_0_15px_rgba(245,202,83,0.35)]">Adam,</span>
                            </h1>
                        </div>
                        <Link 
                            href="/tailor/location" 
                            title="Change Location"
                            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#15140e]/90 hover:bg-[#232014] backdrop-blur-md rounded-full border border-[#F5CA53]/30 hover:border-[#F5CA53] shadow-[0_0_15px_rgba(245,202,83,0.1)] transition-all group active:scale-95"
                        >
                            <svg className="w-3.5 h-3.5 text-[#F5CA53] group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            <span className="text-[9px] font-bold text-[#F5CA53] tracking-widest uppercase truncate max-w-[120px]">{location}</span>
                            <svg className="w-2.5 h-2.5 text-zinc-500 group-hover:text-[#F5CA53] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                        </Link>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="px-5 space-y-8 flex-1">
                    {/* Order Tracking Card */}
                    <div className="bg-[#141418]/80 backdrop-blur-xl border border-[#F5CA53]/20 rounded-[28px] p-5 shadow-2xl shadow-black/80 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-[#F5CA53]/40 to-transparent"></div>
                        <div className="flex justify-between items-center mb-1">
                            <div className="flex gap-2 items-center relative">
                                <div className="relative">
                                    <button 
                                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                        className="flex items-center gap-2 bg-[#2D2E33] px-3 py-1.5 rounded-[10px] text-xs font-medium text-[#F5CA53] hover:bg-[#3D3E44] transition-colors"
                                    >
                                        {selectedShop}
                                        <svg className={`w-3 h-3 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                                    </button>
                                    
                                    {/* Dropdown Menu */}
                                    {isDropdownOpen && (
                                        <div className="absolute top-full left-0 mt-2 w-32 bg-[#2D2E33] border border-zinc-700 rounded-[10px] shadow-xl overflow-hidden z-20">
                                            {shops.map((shop, index) => (
                                                <button
                                                    key={index}
                                                    onClick={() => handleSelectShop(shop)}
                                                    className={`w-full text-left px-3 py-2 text-xs font-medium hover:bg-[#3D3E44] transition-colors ${selectedShop === shop ? 'text-[#F5CA53]' : 'text-zinc-300'}`}
                                                >
                                                    {shop}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <Link 
                                    href="/tailor/add-shop"
                                    title="Add new shop"
                                    className="w-8 h-8 flex items-center justify-center rounded-[10px] border border-[#F5CA53]/20 text-[#F5CA53] hover:bg-[#F5CA53]/10 transition-colors"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                                </Link>
                            </div>
                            <Link href="/orders" className="text-[10px] font-bold uppercase tracking-widest text-[#F5CA53] flex items-center gap-1.5 mt-4">
                                Dashboard 
                                <svg className="w-3 h-3 stroke-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                            </Link>
                        </div>
                        
                        <h2 className="text-xl font-medium mb-5">Order Tracking</h2>
                        
                        <div className="grid grid-cols-3 gap-3 mb-6">
                            <Link href="/orders#ongoing" className="bg-[#26282D] rounded-2xl p-4 flex flex-col items-center justify-center space-y-1 transition-all hover:bg-zinc-800 hover:scale-[1.02] active:scale-95 cursor-pointer">
                                <span className="text-[26px] font-semibold text-[#F5CA53]">{stats.ongoing}</span>
                                <span className="text-[9px] font-black tracking-widest uppercase text-zinc-400">On Going</span>
                            </Link>
                            <Link href="/orders#pending" className="bg-[#26282D] rounded-2xl p-4 flex flex-col items-center justify-center space-y-1 transition-all hover:bg-zinc-800 hover:scale-[1.02] active:scale-95 cursor-pointer">
                                <span className="text-[26px] font-semibold text-white">{stats.pending}</span>
                                <span className="text-[9px] font-black tracking-widest uppercase text-zinc-400">Pending</span>
                            </Link>
                            <Link href="/orders#requests" className="bg-[#26282D] rounded-2xl p-4 flex flex-col items-center justify-center space-y-1 transition-all hover:bg-zinc-800 hover:scale-[1.02] active:scale-95 cursor-pointer">
                                <span className="text-[26px] font-semibold text-white">{stats.requests}</span>
                                <span className="text-[9px] font-black tracking-widest uppercase text-zinc-400">Requests</span>
                            </Link>
                        </div>

                        <div className="space-y-2 mt-4 pt-5 border-t border-zinc-700/50">
                            <div className="flex justify-between items-center text-[13px]">
                                <span className="text-zinc-300">{stats.activeItem}</span>
                                <span className="text-[#F5CA53]">{stats.activeStatus}</span>
                            </div>
                            <div className="w-full h-1 bg-[#26282D] rounded-full overflow-hidden mt-1">
                                <div 
                                    className="h-full bg-[#F5CA53] transition-all duration-500 ease-out" 
                                    style={{ width: stats.progress }}
                                ></div>
                            </div>
                        </div>
                    </div>

                    {/* Nearby Stores */}
                    <div className="space-y-4">
                        <div className="flex justify-between items-end px-1">
                            <h2 className="text-xl font-medium">Near by best store</h2>
                            <Link href="/tailors" className="text-[13px] font-medium text-[#F5CA53] mb-0.5">See all</Link>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Store 1 */}
                            <div className="bg-[#141418]/80 backdrop-blur-xl border border-zinc-800/80 hover:border-[#F5CA53]/30 rounded-[24px] p-4 flex items-center justify-between transition-all shadow-xl group">
                                <div className="flex items-center gap-4">
                                    <img src="https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=150&q=80" alt="Carnage Tailors" className="w-[60px] h-[60px] rounded-[20px] object-cover border border-[#F5CA53]/20" />
                                    <div>
                                        <h3 className="font-medium text-[15px] group-hover:text-[#F5CA53] transition-colors">Carnage Tailors</h3>
                                        <div className="flex items-center gap-1.5 mt-0.5">
                                            <span className="text-[#F5CA53] text-[10px]">★</span>
                                            <span className="text-xs text-zinc-300">4.9 <span className="text-zinc-500">(1.2k reviews)</span></span>
                                        </div>
                                        <p className="text-[11px] text-zinc-500 mt-0.5">0.4 miles away &bull; Bespoke Specialist</p>
                                    </div>
                                </div>
                                <button className="w-12 h-12 shrink-0 bg-[#F5CA53] rounded-full flex items-center justify-center text-black shadow-lg shadow-[#F5CA53]/20 hover:scale-105 transition-transform mr-1">
                                    <svg className="w-[18px] h-[18px]" fill="currentColor" viewBox="0 0 24 24"><path d="M20.01 15.38c-1.23 0-2.42-.2-3.53-.56a.977.977 0 00-1.01.24l-1.57 1.97c-2.83-1.35-5.48-3.9-6.89-6.83l1.95-1.66c.27-.28.35-.67.24-1.02-.37-1.11-.56-2.3-.56-3.53 0-.54-.45-.99-.99-.99H4.19C3.65 3 3 3.24 3 3.99 3 13.28 10.73 21 20.01 21c.71 0 .99-.63.99-1.18v-3.45c0-.54-.45-.99-.99-.99z"/></svg>
                                </button>
                            </div>

                            {/* Store 2 */}
                            <div className="bg-[#141418]/80 backdrop-blur-xl border border-zinc-800/80 hover:border-[#F5CA53]/30 rounded-[24px] p-4 flex items-center justify-between transition-all shadow-xl group">
                                <div className="flex items-center gap-4">
                                    <img src="https://images.unsplash.com/photo-1598033129183-c4f50c736f10?auto=format&fit=crop&w=150&q=80" alt="Huntsman & Sons" className="w-[60px] h-[60px] rounded-[20px] object-cover border border-[#F5CA53]/20" />
                                    <div>
                                        <h3 className="font-medium text-[15px] group-hover:text-[#F5CA53] transition-colors">Huntsman & Sons</h3>
                                        <div className="flex items-center gap-1.5 mt-0.5">
                                            <span className="text-[#F5CA53] text-[10px]">★</span>
                                            <span className="text-xs text-zinc-300">4.8 <span className="text-zinc-500">(850 reviews)</span></span>
                                        </div>
                                        <p className="text-[11px] text-zinc-500 mt-0.5">0.7 miles away &bull; Classic Savile Row</p>
                                    </div>
                                </div>
                                <button className="w-12 h-12 shrink-0 bg-[#26282D] border border-zinc-700/60 rounded-full flex items-center justify-center text-white hover:scale-105 hover:border-[#F5CA53]/40 transition-all mr-1">
                                    <svg className="w-[18px] h-[18px]" fill="currentColor" viewBox="0 0 24 24"><path d="M20.01 15.38c-1.23 0-2.42-.2-3.53-.56a.977.977 0 00-1.01.24l-1.57 1.97c-2.83-1.35-5.48-3.9-6.89-6.83l1.95-1.66c.27-.28.35-.67.24-1.02-.37-1.11-.56-2.3-.56-3.53 0-.54-.45-.99-.99-.99H4.19C3.65 3 3 3.24 3 3.99 3 13.28 10.73 21 20.01 21c.71 0 .99-.63.99-1.18v-3.45c0-.54-.45-.99-.99-.99z"/></svg>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Floating Bottom Nav */}
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-full max-w-[400px] px-5 z-50">
                    <div className="bg-[#19191D]/90 backdrop-blur-2xl border border-[#F5CA53]/25 rounded-full p-2 flex items-center justify-between shadow-[0_10px_35px_rgba(0,0,0,0.8)]">
                        <Link href="/tailor/home" className="w-[60px] h-[60px] bg-[#F5CA53] rounded-full flex items-center justify-center shrink-0 shadow-[0_0_20px_rgba(245,202,83,0.3)] relative">
                            {/* Decorative dashed ring like in image */}
                            <div className="absolute inset-1 rounded-full border border-dashed border-[#B08922] opacity-50"></div>
                            <svg className="w-6 h-6 text-black z-10" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                                <path d="M20.38 3.46L16 2a4 4 0 01-8 0L3.62 3.46a2 2 0 00-1.34 2.23l.58 3.47a1 1 0 00.99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 002-2V10h2.15a1 1 0 00.99-.84l.58-3.47a2 2 0 00-1.34-2.23z"/>
                            </svg>
                        </Link>
                        
                        <div className="flex-1 flex justify-evenly items-center pr-2">
                            <button className="text-zinc-400 hover:text-white transition-colors p-3">
                                <svg className="w-[22px] h-[22px]" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </button>
                            <button className="text-zinc-400 hover:text-white transition-colors p-3">
                                <svg className="w-[22px] h-[22px]" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                                    {/* Make it look like sliders instead of hamburger */}
                                    <circle cx="8" cy="6" r="2" fill="currentColor"/>
                                    <circle cx="16" cy="12" r="2" fill="currentColor"/>
                                    <circle cx="10" cy="18" r="2" fill="currentColor"/>
                                </svg>
                            </button>
                            <button className="text-zinc-400 hover:text-white transition-colors p-3">
                                <svg className="w-[22px] h-[22px]" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}