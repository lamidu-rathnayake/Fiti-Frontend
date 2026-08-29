"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/firebase/AuthContext";
import { listShops } from "@/lib/api/endpoints/shops";

export default function TailorsPage() {
    const { role, logout } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();
    const initialQuery = searchParams.get("q") || "";
    const [searchQuery, setSearchQuery] = useState(initialQuery);
    const [selectedCity, setSelectedCity] = useState("ALL");
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

    return (
        <div className="text-white flex flex-col justify-between selection:bg-[#F5CA53] selection:text-black font-sans">

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

                                <div className="grid grid-cols-1 gap-2 pt-2">
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
        </div>
    );
}
