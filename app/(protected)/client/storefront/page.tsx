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
        <div className="min-h-screen bg-[#07080A] text-white flex flex-col justify-between selection:bg-[#F5CA53] selection:text-black font-sans">
            {/* MAIN CATALOG */}
            <main className="max-w-7xl w-full mx-auto px-4 sm:px-8 py-12 flex-1 space-y-10">
                {/* Header Banner & Live Search Input */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 bg-[#121318] border border-zinc-800/80 rounded-2xl p-6 sm:p-8 shadow-2xl">
                    <div className="space-y-2">
                        <span className="text-[10px] font-mono tracking-[0.25em] text-[#F5CA53] uppercase block">
                            CURATED ATELIER CATALOG
                        </span>
                        <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight font-heading">
                            Bespoke Storefront
                        </h1>
                        <p className="text-xs sm:text-sm text-zinc-400 max-w-xl leading-relaxed">
                            Handcrafted tailored garments, rare Italian fabrics, and custom fitting packages by Sri Lanka&apos;s master tailors.
                        </p>
                    </div>

                    {/* LIVE SEARCH BAR */}
                    <div className="w-full md:w-80 space-y-2">
                        <label className="block text-[10px] font-mono text-zinc-400 uppercase tracking-widest font-bold">
                            Search Garments &amp; Fabrics
                        </label>
                        <div className="relative">
                            <svg className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#F5CA53]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search by suit, tuxedo, fabric..."
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

                {/* FABRIC / CATEGORY FILTER CHIPS */}
                <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
                    <span className="text-[10px] font-mono text-zinc-500 uppercase font-bold mr-2 shrink-0">Filter Category:</span>
                    {["ALL", "Italian Wool", "Velvet Tuxedo", "Cashmere", "Shirting"].map((cat) => (
                        <button
                            key={cat}
                            onClick={() => setSelectedCategory(cat)}
                            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold tracking-wider uppercase transition-all shrink-0 ${selectedCategory === cat
                                    ? "bg-[#F5CA53] text-black shadow-[0_0_12px_rgba(245,202,83,0.3)]"
                                    : "bg-[#121318] border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700"
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
                            <div key={item.id} className="bg-[#121318] border border-zinc-800/80 hover:border-[#F5CA53]/50 rounded-2xl p-5 shadow-2xl space-y-4 group transition-all flex flex-col justify-between">
                                <div className="space-y-4">
                                    <div className="relative w-full h-72 rounded-xl overflow-hidden bg-zinc-900">
                                        <img src={item.image} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                                        <span className="absolute top-3 left-3 bg-[#F5CA53] text-black text-[9px] font-mono font-black uppercase tracking-widest px-3 py-1 rounded-full shadow-lg">
                                            {item.tag}
                                        </span>
                                    </div>
                                    <div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-[10px] font-mono text-zinc-500 uppercase">{item.fabric}</span>
                                            <span className="text-[10px] font-mono text-zinc-400 font-bold">✂️ {item.tailor}</span>
                                        </div>
                                        <h3 className="text-base font-extrabold text-white mt-0.5 font-heading group-hover:text-[#F5CA53] transition-colors">{item.name}</h3>
                                        <p className="text-sm font-black text-[#F5CA53] mt-2">{item.price}</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 gap-2 pt-2">
                                    <Link
                                        href="/client/request"
                                        className="w-full text-center py-3 rounded-xl bg-[#F5CA53] text-black text-xs font-bold uppercase tracking-wider shadow-[0_0_15px_rgba(245,202,83,0.25)] hover:scale-[1.01] transition-transform block"
                                    >
                                        COMMISSION &rarr;
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="bg-[#121318] border border-zinc-800 rounded-2xl p-12 text-center space-y-3">
                        <span className="text-2xl">🔍</span>
                        <h3 className="text-base font-bold text-white font-heading">No Garments Found</h3>
                        <p className="text-xs text-zinc-400">
                            No bespoke items matched &quot;{searchQuery}&quot;. Try adjusting your search query or category filter.
                        </p>
                        <button
                            onClick={() => {
                                setSearchQuery("");
                                setSelectedCategory("ALL");
                            }}
                            className="px-4 py-2 bg-[#F5CA53] text-black font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all"
                        >
                            Reset Search Filters
                        </button>
                    </div>
                )}
            </main>

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
