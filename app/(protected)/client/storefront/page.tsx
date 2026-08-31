"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/firebase/AuthContext";
import { listShops } from "@/lib/api/endpoints/shops";

export default function StorefrontPage() {
    const { role, logout } = useAuth();
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("ALL");
    const [products, setProducts] = useState<Array<{
        id: number | string;
        name: string;
        fabric: string;
        price: string;
        image: string;
        tag: string;
        tailor: string;
        category: string;
    }>>([]);
    const [loading, setLoading] = useState(true);

    const homeUrl = role === "tailor" ? "/tailor/home" : role === "client" ? "/client/home" : "/client/home";

    useEffect(() => {
        const fetchCatalog = async () => {
            setLoading(true);
            try {
                const apiShops = await listShops();
                if (apiShops && apiShops.length > 0) {
                    setProducts(
                        apiShops.map((s) => ({
                            id: s.shop_id,
                            name: `Bespoke Creation by ${s.shop_name}`,
                            fabric: "Super 150s Italian Wool",
                            price: "LKR 185,000",
                            image: s.images && s.images.length > 0 ? s.images[0].image_url : "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=600&q=80",
                            tag: "VERIFIED ATELIER",
                            tailor: `Master ${s.shop_name}`,
                            category: "Italian Wool",
                        }))
                    );
                    setLoading(false);
                    return;
                }
            } catch {
                // Network/Offline fallback: render initial default products
            }

            setProducts([
                {
                    id: 1,
                    name: "Bespoke Navy Double-Breasted Suit",
                    fabric: "Biella Super 150s Wool",
                    price: "LKR 185,000",
                    image: "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=600&q=80",
                    tag: "BESTSELLER",
                    tailor: "Master Alexander Vane",
                    category: "Italian Wool",
                },
                {
                    id: 2,
                    name: "Midnight Black Velvet Tuxedo",
                    fabric: "Italian Velvet & Satin Lapel",
                    price: "LKR 210,000",
                    image: "https://images.unsplash.com/photo-1598033129183-c4f50c736f10?auto=format&fit=crop&w=600&q=80",
                    tag: "ATELIER EXCLUSIVE",
                    tailor: "Master Saville Perera",
                    category: "Velvet Tuxedo",
                },
                {
                    id: 3,
                    name: "Charcoal Cashmere Overcoat",
                    fabric: "Cashmere-Wool Blend",
                    price: "LKR 165,000",
                    image: "https://images.unsplash.com/photo-1617137968427-85924c800a22?auto=format&fit=crop&w=600&q=80",
                    tag: "SEASONAL",
                    tailor: "Master Bandara",
                    category: "Cashmere",
                },
                {
                    id: 4,
                    name: "Pure Egyptian Cotton Bespoke Shirt",
                    fabric: "200s Two-Ply Cotton",
                    price: "LKR 45,000",
                    image: "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=600&q=80",
                    tag: "ESSENTIAL",
                    tailor: "Master Marcus Silva",
                    category: "Shirting",
                },
                {
                    id: 5,
                    name: "Emerald Green Silk Dinner Jacket",
                    fabric: "Mulberry Silk & Peak Lapel",
                    price: "LKR 195,000",
                    image: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=600&q=80",
                    tag: "LIMITED EDITION",
                    tailor: "Master Devinda Cooray",
                    category: "Velvet Tuxedo",
                },
            ]);
            setLoading(false);
        };

        fetchCatalog();
    }, []);

    const filteredProducts = products.filter((p) => {
        const matchesQuery =
            p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.fabric.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.tag.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.tailor.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesCategory = selectedCategory === "ALL" || p.category === selectedCategory;

        return matchesQuery && matchesCategory;
    });

    return (
        <main className="max-w-7xl w-full mx-auto px-4 sm:px-8 py-8 flex-1 space-y-8 bg-warm-beige min-h-screen text-earth-text selection:bg-accent selection:text-cream-bg">
            {/* Header Banner & Live Search Input */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 bg-cream-bg border border-accent/20 rounded-2xl p-6 sm:p-8 shadow-md">
                <div className="space-y-2">
                    <span className="text-[10px] font-mono tracking-[0.25em] text-earth-text/60 uppercase block font-bold">
                        CURATED ATELIER CATALOG
                    </span>
                    <h1 className="text-3xl sm:text-5xl font-extrabold text-earth-text tracking-tight font-heading">
                        Bespoke Storefront
                    </h1>
                    <p className="text-xs sm:text-sm text-earth-text/70 max-w-xl leading-relaxed font-medium">
                        Handcrafted tailored garments, rare Italian fabrics, and custom fitting packages by Sri Lanka&apos;s master tailors.
                    </p>
                </div>

                {/* LIVE SEARCH BAR */}
                <div className="w-full md:w-80 space-y-2">
                    <label className="block text-[10px] font-mono text-earth-text/70 uppercase tracking-widest font-bold">
                        Search Garments &amp; Fabrics
                    </label>
                    <div className="relative">
                        <svg className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search by suit, tuxedo, fabric..."
                            className="w-full pl-10 pr-9 py-3 bg-warm-beige/60 border border-accent/30 focus:border-accent rounded-xl text-xs font-medium text-earth-text placeholder-earth-text/50 focus:outline-none transition-all shadow-inner"
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery("")}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-earth-text/60 hover:text-earth-text text-xs font-bold"
                            >
                                &times;
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* FABRIC / CATEGORY FILTER CHIPS */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
                <span className="text-[10px] font-mono text-earth-text/60 uppercase font-bold mr-2 shrink-0">Filter Category:</span>
                {["ALL", "Italian Wool", "Velvet Tuxedo", "Cashmere", "Shirting"].map((cat) => (
                    <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-bold tracking-wider uppercase transition-all shrink-0 ${selectedCategory === cat
                                ? "bg-accent text-cream-bg shadow-sm"
                                : "bg-cream-bg border border-accent/30 text-earth-text/80 hover:text-earth-text hover:border-accent"
                            }`}
                    >
                        {cat}
                    </button>
                ))}
            </div>

            {/* PRODUCTS GRID */}
            {filteredProducts.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {filteredProducts.map((item) => (
                        <div key={item.id} className="bg-cream-bg border border-accent/20 hover:border-accent/40 rounded-2xl p-5 shadow-md space-y-4 group transition-all flex flex-col justify-between">
                            <div className="space-y-4">
                                <div className="relative w-full h-72 rounded-xl overflow-hidden bg-warm-beige">
                                    <img src={item.image} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                                    <span className="absolute top-3 left-3 bg-accent text-cream-bg text-[9px] font-mono font-bold uppercase tracking-widest px-3 py-1 rounded-full shadow-sm">
                                        {item.tag}
                                    </span>
                                </div>
                                <div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-[10px] font-mono text-earth-text/60 uppercase font-bold">{item.fabric}</span>
                                        <span className="text-[10px] font-mono text-earth-text/70 font-bold">✂️ {item.tailor}</span>
                                    </div>
                                    <h3 className="text-base font-extrabold text-earth-text mt-1 font-heading group-hover:text-accent transition-colors">{item.name}</h3>
                                    <p className="text-sm font-black text-accent mt-2">{item.price}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-2 pt-2">
                                <Link
                                    href="/client/biddingRequest"
                                    className="w-full text-center py-3 rounded-xl bg-accent text-cream-bg text-xs font-bold uppercase tracking-wider shadow-sm hover:bg-earth-text transition-colors block"
                                >
                                    COMMISSION &rarr;
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="bg-cream-bg border border-accent/20 rounded-2xl p-12 text-center space-y-3 shadow-sm">
                    <span className="text-2xl">🔍</span>
                    <h3 className="text-base font-bold text-earth-text font-heading">No Garments Found</h3>
                    <p className="text-xs text-earth-text/70 font-medium">
                        No bespoke items matched &quot;{searchQuery}&quot;. Try adjusting your search query or category filter.
                    </p>
                    <button
                        onClick={() => {
                            setSearchQuery("");
                            setSelectedCategory("ALL");
                        }}
                        className="px-4 py-2 bg-accent text-cream-bg font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all shadow-sm hover:bg-earth-text"
                    >
                        Reset Search Filters
                    </button>
                </div>
            )}
        </main>
    );
}
