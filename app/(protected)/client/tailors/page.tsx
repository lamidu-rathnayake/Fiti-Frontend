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
                } else {
                    setTailors([]);
                }
            } catch {
                setTailors([]);
            } finally {
                setLoading(false);
            }
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
        <div className="text-earth-text flex flex-col justify-between selection:bg-accent selection:text-cream-bg font-sans bg-warm-beige min-h-screen">

            {/* MAIN DIRECTORY */}
            <main className="max-w-7xl w-full mx-auto px-4 sm:px-8 py-12 flex-1 space-y-10">
                {/* Header Banner & Live Search Input */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 bg-cream-bg border border-accent/20 rounded-2xl p-6 sm:p-8 shadow-xl">
                    <div className="space-y-2">
                        <span className="text-[10px] font-mono tracking-[0.25em] text-accent uppercase block font-bold">
                            MASTER ARTISAN DIRECTORY
                        </span>
                        <h1 className="text-3xl sm:text-4xl font-extrabold text-earth-text tracking-tight font-heading">
                            Explore Master Tailors
                        </h1>
                        <p className="text-xs sm:text-sm text-earth-text/70 max-w-lg leading-relaxed font-medium">
                            Search certified bespoke ateliers, master craftsmen, and custom tailors across Sri Lanka.
                        </p>
                    </div>

                    {/* LIVE SEARCH BAR */}
                    <div className="w-full md:w-80 space-y-2">
                        <label className="block text-[10px] font-mono text-earth-text/60 uppercase tracking-widest font-bold">
                            Search Tailors &amp; Ateliers
                        </label>
                        <div className="relative">
                            <svg className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search by tailor name, city, specialty..."
                                className="w-full pl-10 pr-9 py-3 bg-warm-beige border border-accent/20 focus:border-accent rounded-xl text-xs font-medium text-earth-text placeholder-earth-text/50 focus:outline-none transition-all shadow-inner"
                            />
                            {searchQuery && (
                                <button
                                    onClick={() => setSearchQuery("")}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-earth-text/50 hover:text-accent text-lg font-bold"
                                >
                                    &times;
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* QUICK CITY FILTER CHIPS */}
                <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
                    <span className="text-[10px] font-mono text-earth-text/60 uppercase font-bold mr-2 shrink-0">Filter Location:</span>
                    {["ALL", "Colombo 07", "Colombo 03", "Colombo 12", "Kandy", "Nugegoda"].map((city) => (
                        <button
                            key={city}
                            onClick={() => setSelectedCity(city)}
                            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold tracking-wider uppercase transition-all shrink-0 ${selectedCity === city
                                ? "bg-accent text-cream-bg shadow-md"
                                : "bg-cream-bg border border-accent/20 text-earth-text/70 hover:text-earth-text hover:border-accent/50"
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
                            <div key={t.id} className="bg-cream-bg border border-accent/20 hover:border-accent/60 rounded-2xl p-6 shadow-xl space-y-4 transition-all group flex flex-col justify-between">
                                <div className="space-y-4">
                                    <div className="relative w-full h-48 rounded-xl overflow-hidden bg-warm-beige">
                                        <img src={t.image} alt={t.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                        <span className="absolute top-3 left-3 bg-accent text-cream-bg text-[9px] font-mono font-black uppercase tracking-widest px-3 py-1 rounded-full shadow-md">
                                            {t.tag}
                                        </span>
                                    </div>
                                    <div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-[10px] font-mono font-bold text-accent uppercase">{t.rating}</span>
                                            <span className="text-[10px] font-mono text-earth-text/60 font-bold">📍 {t.city}</span>
                                        </div>
                                        <h3 className="text-lg font-extrabold text-earth-text mt-1 font-heading group-hover:text-accent transition-colors">
                                            {t.name}
                                        </h3>
                                        <p className="text-xs text-earth-text/70 mt-0.5 font-bold">{t.master}</p>
                                        <p className="text-xs text-earth-text/60 mt-2 line-clamp-2 leading-relaxed font-medium">{t.specialty}</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 gap-2 pt-2">
                                    <Link
                                        href={"/client/shop/" + t.id}
                                        className="w-full text-center py-2.5 rounded-xl bg-accent text-cream-bg text-xs font-bold uppercase tracking-wider shadow-md hover:shadow-lg hover:scale-[1.02] transition-all block"
                                    >
                                        View Profile
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="bg-cream-bg border border-accent/20 rounded-2xl p-12 text-center space-y-3 shadow-xl">
                        <span className="text-2xl">🔍</span>
                        <h3 className="text-base font-bold text-earth-text font-heading">No Tailors Found</h3>
                        <p className="text-xs text-earth-text/70 font-medium">
                            No master ateliers matched &quot;{searchQuery}&quot;. Try clearing your search filter or selecting another location.
                        </p>
                        <button
                            onClick={() => {
                                setSearchQuery("");
                                setSelectedCity("ALL");
                            }}
                            className="px-4 py-2 mt-2 bg-accent text-cream-bg font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all hover:opacity-90 shadow-md"
                        >
                            Reset Search Filters
                        </button>
                    </div>
                )}
            </main>
        </div>
    );
}
