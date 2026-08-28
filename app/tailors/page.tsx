"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/firebase/AuthContext";
import AtelierChatDrawer from "@/components/chat/AtelierChatDrawer";
import { listShops } from "@/lib/api/endpoints/shops";

export default function TailorsPage() {
    const { role, logout, setRole } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();
    const initialQuery = searchParams.get("q") || "";
    const [searchQuery, setSearchQuery] = useState(initialQuery);
    const [selectedCity, setSelectedCity] = useState("ALL");
    const [isChatDrawerOpen, setIsChatDrawerOpen] = useState(false);
    const [chatTarget, setChatTarget] = useState("Master Alexander Vane");
    const [tailors, setTailors] = useState<Array<{
        id: number | string;
        name: string;
        master: string;
        city: string;
        specialty: string;
        rating: string;
        image: string;
        tag: string;
    }>>([]);
    const [loading, setLoading] = useState(true);

    const homeUrl = role === "tailor" ? "/tailor/home" : role === "client" ? "/client/home" : "/client/home";

    useEffect(() => {
        const fetchShops = async () => {
            setLoading(true);
            try {
                const apiShops = await listShops();
                if (apiShops && apiShops.length > 0) {
                    setTailors(
                        apiShops.map((s) => ({
                            id: s.shop_id,
                            name: s.shop_name,
                            master: s.shop_address ? `Master ${s.shop_name}` : "Master Artisan",
                            city: s.city || "Colombo",
                            specialty: s.shop_bio || s.specialty || "Bespoke Custom Tailoring",
                            rating: s.average_rating ? `${s.average_rating.toFixed(1)} ★` : "4.9 ★ (Verified)",
                            image: s.images && s.images.length > 0 ? s.images[0].image_url : "https://images.unsplash.com/photo-1598033129183-c4f50c736f10?auto=format&fit=crop&w=500&q=80",
                            tag: "VERIFIED ATELIER",
                        }))
                    );
                    setLoading(false);
                    return;
                }
            } catch {
                // Network/Offline fallback: render initial default tailors
            }

            setTailors([
                {
                    id: 1,
                    name: "Atelier Vane",
                    master: "Master Alexander Vane",
                    city: "Colombo 07",
                    specialty: "Bespoke Italian Suits & Tuxedos",
                    rating: "4.9 ★ (128 Reviews)",
                    image: "https://images.unsplash.com/photo-1598033129183-c4f50c736f10?auto=format&fit=crop&w=500&q=80",
                    tag: "VERIFIED MASTER",
                },
                {
                    id: 2,
                    name: "Gieves & Hawkes Ceylon",
                    master: "Master Saville Perera",
                    city: "Colombo 03",
                    specialty: "British Military & Formal Tailoring",
                    rating: "5.0 ★ (86 Reviews)",
                    image: "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=500&q=80",
                    tag: "ROYAL WARRANT",
                },
                {
                    id: 3,
                    name: "Kandy Royal Atelier",
                    master: "Master Bandara",
                    city: "Kandy Central",
                    specialty: "Traditional Ceremonial & Modern Cut",
                    rating: "4.8 ★ (64 Reviews)",
                    image: "https://images.unsplash.com/photo-1617137968427-85924c800a22?auto=format&fit=crop&w=500&q=80",
                    tag: "HERITAGE",
                },
                {
                    id: 4,
                    name: "Carnage Bespoke Atelier",
                    master: "Master Marcus Silva",
                    city: "Colombo 12",
                    specialty: "Architectural Silhouette & Slim Cut",
                    rating: "4.9 ★ (104 Reviews)",
                    image: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=500&q=80",
                    tag: "POPULAR",
                },
                {
                    id: 5,
                    name: "Hercules Tailors Ceylon",
                    master: "Master Devinda Cooray",
                    city: "Nugegoda",
                    specialty: "Double-Breasted Suits & Cashmere Coats",
                    rating: "4.7 ★ (78 Reviews)",
                    image: "https://images.unsplash.com/photo-1600091166971-7f9faad6c1e2?auto=format&fit=crop&w=500&q=80",
                    tag: "EXPRESS FITTING",
                },
            ]);
            setLoading(false);
        };

        fetchShops();
    }, []);

    const filteredTailors = tailors.filter((t) => {
        const matchesQuery =
            t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            t.master.toLowerCase().includes(searchQuery.toLowerCase()) ||
            t.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
            t.specialty.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesCity = selectedCity === "ALL" || t.city.toLowerCase().includes(selectedCity.toLowerCase());

        return matchesQuery && matchesCity;
    });

    const handleOpenChat = (masterName: string) => {
        setChatTarget(masterName);
        setIsChatDrawerOpen(true);
    };

    return (
        <div className="min-h-screen bg-[#07080A] text-white flex flex-col justify-between selection:bg-[#F5CA53] selection:text-black font-sans">
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
                        <Link href={homeUrl} className="hover:text-[#F5CA53] transition-colors">
                            Dashboard
                        </Link>
                        <Link href="/orders" className="hover:text-[#F5CA53] transition-colors">
                            Orders
                        </Link>
                        <Link href="/tailors" className="text-white font-extrabold relative pb-1 border-b-2 border-[#F5CA53]">
                            Tailors
                        </Link>
                    </nav>

                    {/* Right Action Buttons */}
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
                            Seller Dash
                        </button>
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

            {/* MAIN DIRECTORY */}
            <main className="max-w-7xl w-full mx-auto px-4 sm:px-8 py-12 flex-1 space-y-10">
                {/* Header Banner & Live Search Input */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 bg-[#121318] border border-zinc-800/80 rounded-2xl p-6 sm:p-8 shadow-2xl">
                    <div className="space-y-2">
                        <span className="text-[10px] font-mono tracking-[0.25em] text-[#F5CA53] uppercase block">
                            MASTER ARTISAN DIRECTORY
                        </span>
                        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight font-heading">
                            Explore Master Tailors
                        </h1>
                        <p className="text-xs sm:text-sm text-zinc-400 max-w-lg leading-relaxed">
                            Search certified bespoke ateliers, master craftsmen, and custom tailors across Sri Lanka.
                        </p>
                    </div>

                    {/* LIVE SEARCH BAR */}
                    <div className="w-full md:w-80 space-y-2">
                        <label className="block text-[10px] font-mono text-zinc-400 uppercase tracking-widest font-bold">
                            Search Tailors &amp; Ateliers
                        </label>
                        <div className="relative">
                            <svg className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#F5CA53]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search by tailor name, city, specialty..."
                                className="w-full pl-10 pr-9 py-3 bg-[#18191E] border border-zinc-800 focus:border-[#F5CA53] rounded-xl text-xs font-medium text-white placeholder-zinc-500 focus:outline-none transition-all shadow-inner"
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
                </div>

                {/* QUICK CITY FILTER CHIPS */}
                <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
                    <span className="text-[10px] font-mono text-zinc-500 uppercase font-bold mr-2 shrink-0">Filter Location:</span>
                    {["ALL", "Colombo 07", "Colombo 03", "Colombo 12", "Kandy", "Nugegoda"].map((city) => (
                        <button
                            key={city}
                            onClick={() => setSelectedCity(city)}
                            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold tracking-wider uppercase transition-all shrink-0 ${
                                selectedCity === city
                                    ? "bg-[#F5CA53] text-black shadow-[0_0_12px_rgba(245,202,83,0.3)]"
                                    : "bg-[#121318] border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700"
                            }`}
                        >
                            {city}
                        </button>
                    ))}
                </div>

                {/* TAILORS GRID */}
                {filteredTailors.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {filteredTailors.map((t) => (
                            <div key={t.id} className="bg-[#121318] border border-zinc-800/80 hover:border-[#F5CA53]/50 rounded-2xl p-6 shadow-2xl space-y-4 transition-all group flex flex-col justify-between">
                                <div className="space-y-4">
                                    <div className="relative w-full h-48 rounded-xl overflow-hidden bg-zinc-900">
                                        <img src={t.image} alt={t.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                        <span className="absolute top-3 left-3 bg-[#F5CA53] text-black text-[9px] font-mono font-black uppercase tracking-widest px-3 py-1 rounded-full shadow-lg">
                                            {t.tag}
                                        </span>
                                    </div>
                                    <div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-[10px] font-mono font-bold text-[#F5CA53] uppercase">{t.rating}</span>
                                            <span className="text-[10px] font-mono text-zinc-400">📍 {t.city}</span>
                                        </div>
                                        <h3 className="text-lg font-extrabold text-white mt-1 font-heading group-hover:text-[#F5CA53] transition-colors">
                                            {t.name}
                                        </h3>
                                        <p className="text-xs text-zinc-400 mt-0.5 font-medium">{t.master}</p>
                                        <p className="text-xs text-zinc-500 mt-2 line-clamp-2 leading-relaxed">{t.specialty}</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-2 pt-2">
                                    <button
                                        onClick={() => handleOpenChat(t.master)}
                                        className="w-full py-2.5 rounded-xl bg-[#18191E] border border-[#F5CA53]/50 hover:bg-[#F5CA53]/10 text-[#F5CA53] text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1 transition-all"
                                    >
                                        <span>💬 Text</span>
                                    </button>
                                    <Link
                                        href="/client/request"
                                        className="w-full text-center py-2.5 rounded-xl bg-[#F5CA53] text-black text-xs font-bold uppercase tracking-wider shadow-[0_0_15px_rgba(245,202,83,0.25)] hover:scale-[1.01] transition-transform block"
                                    >
                                        Fitting &rarr;
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="bg-[#121318] border border-zinc-800 rounded-2xl p-12 text-center space-y-3">
                        <span className="text-2xl">🔍</span>
                        <h3 className="text-base font-bold text-white font-heading">No Tailors Found</h3>
                        <p className="text-xs text-zinc-400">
                            No master ateliers matched &quot;{searchQuery}&quot;. Try clearing your search filter or selecting another location.
                        </p>
                        <button
                            onClick={() => {
                                setSearchQuery("");
                                setSelectedCity("ALL");
                            }}
                            className="px-4 py-2 bg-[#F5CA53] text-black font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all"
                        >
                            Reset Search Filters
                        </button>
                    </div>
                )}
            </main>

            {/* FLOATING TEXT / CHAT TRIGGER BUTTON */}
            {!isChatDrawerOpen && (
                <button
                    onClick={() => setIsChatDrawerOpen(true)}
                    className="fixed bottom-6 right-6 z-[8888] px-4 py-3 bg-[#F5CA53] hover:bg-[#f7d369] text-black font-extrabold text-xs uppercase tracking-wider rounded-full shadow-[0_0_25px_rgba(245,202,83,0.5)] flex items-center gap-2 transition-all hover:scale-105"
                >
                    <span className="w-2 h-2 rounded-full bg-emerald-600 animate-ping" />
                    <span>💬 Text Master Tailor</span>
                </button>
            )}

            {/* LIVE ATELIER CHAT DRAWER */}
            <AtelierChatDrawer
                isOpen={isChatDrawerOpen}
                onClose={() => setIsChatDrawerOpen(false)}
                initialContactName={chatTarget}
                userRole="client"
            />

            {/* FOOTER */}
            <footer className="w-full border-t border-zinc-900/90 bg-[#07080A] py-8 px-4 sm:px-8 relative z-20">
                <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
                    <span className="font-extrabold text-sm tracking-widest text-white uppercase font-heading">
                        ATELIER DIGITAL
                    </span>
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
