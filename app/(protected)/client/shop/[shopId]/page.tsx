"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { getShop } from "@/lib/api/endpoints/shops";
import type { Shop } from "@/lib/api/types/shop";

export default function ShopProfilePage() {
    const params = useParams();
    const router = useRouter();
    const shopId = params.shopId as string;

    const [shop, setShop] = useState<Shop | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const fetchShopDetails = useCallback(async () => {
        setIsLoading(true);
        try {
            const data = await getShop(Number(shopId));
            setShop(data);
        } catch (error) {
            console.error("Failed to load shop details:", error);
        } finally {
            setIsLoading(false);
        }
    }, [shopId]);

    useEffect(() => {
        if (shopId) {
            fetchShopDetails();
        }
    }, [shopId, fetchShopDetails]);

    if (isLoading) {
        return (
            <div className="min-h-screen bg-[#07080A] flex items-center justify-center">
                <div className="font-mono text-xs text-[#F5CA53] uppercase tracking-widest animate-pulse">
                    Loading Atelier Profile...
                </div>
            </div>
        );
    }

    if (!shop) {
        return (
            <div className="min-h-screen bg-[#07080A] flex flex-col items-center justify-center space-y-4">
                <h2 className="text-xl font-bold text-white font-heading">Shop Not Found</h2>
                <p className="text-zinc-500 text-sm">The atelier you are looking for does not exist.</p>
                <button
                    onClick={() => router.back()}
                    className="px-6 py-2 bg-[#18191E] border border-zinc-700 text-zinc-300 rounded-xl hover:border-[#F5CA53] hover:text-[#F5CA53] transition-all"
                >
                    &larr; Go Back
                </button>
            </div>
        );
    }

    const coverImage = shop.images && shop.images.length > 0
        ? shop.images[0].image_url
        : "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=1200&q=80";

    return (
        <div className="min-h-screen bg-[#07080A] text-white selection:bg-[#F5CA53] selection:text-black">
            {/* HERO / COVER SECTION */}
            <div className="w-full h-64 sm:h-80 relative overflow-hidden">
                <div
                    className="absolute inset-0 bg-cover bg-center opacity-40"
                    style={{ backgroundImage: `url('${coverImage}')` }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#07080A] via-[#07080A]/60 to-transparent" />

                <div className="absolute bottom-0 left-0 w-full p-6 sm:p-12 max-w-7xl mx-auto flex flex-col sm:flex-row items-end justify-between gap-4">
                    <div>
                        <span className="text-[10px] font-mono tracking-[0.3em] uppercase text-[#F5CA53] mb-2 block">
                            CERTIFIED ATELIER
                        </span>
                        <h1 className="text-4xl sm:text-5xl font-extrabold text-white font-heading tracking-tight">
                            {shop.shop_name}
                        </h1>
                        <p className="text-zinc-400 mt-2 font-mono text-xs flex items-center gap-2">
                            <span>📍 {shop.city || "Unknown Location"}</span>
                            <span>&bull;</span>
                            <span className="text-[#F5CA53] font-bold">
                                &#9733; {shop.average_rating && shop.average_rating > 0 ? shop.average_rating.toFixed(1) : "New"}
                            </span>
                        </p>
                    </div>

                    <Link
                        href={`/client/directRequest?shop_id=${shop.shop_id}`}
                        className="px-8 py-3 bg-[#F5CA53] text-black font-extrabold text-xs uppercase tracking-wider rounded-xl hover:bg-[#f7d369] transition-all shadow-[0_0_20px_rgba(245,202,83,0.25)] shrink-0"
                    >
                        Clothing Request &rarr;
                    </Link>
                </div>
            </div>

            <main className="max-w-7xl mx-auto px-6 sm:px-12 py-12 grid grid-cols-1 lg:grid-cols-3 gap-12">
                {/* LEFT COLUMN - ABOUT & INFO */}
                <div className="lg:col-span-1 space-y-8">
                    <section>
                        <h3 className="text-xs font-mono font-bold uppercase tracking-widest text-zinc-500 mb-4 border-b border-zinc-800 pb-2">
                            About the Atelier
                        </h3>
                        <p className="text-zinc-300 text-sm leading-relaxed">
                            {shop.shop_bio || "Master tailors specializing in modern silhouettes and sharp architectural cuts. Bringing decades of bespoke craftsmanship to every garment."}
                        </p>
                    </section>

                    <section>
                        <h3 className="text-xs font-mono font-bold uppercase tracking-widest text-zinc-500 mb-4 border-b border-zinc-800 pb-2">
                            Specialties
                        </h3>
                        <div className="flex flex-wrap gap-2">
                            {(shop.specialty ? shop.specialty.split(",") : ["Bespoke Suits", "Alterations", "Custom Shirts"]).map((tag, i) => (
                                <span key={i} className="px-3 py-1 bg-[#121318] border border-zinc-800 text-zinc-300 text-[10px] font-mono rounded-lg">
                                    {tag.trim()}
                                </span>
                            ))}
                        </div>
                    </section>

                    <section className="bg-[#121318] p-5 rounded-2xl border border-zinc-800/80">
                        <h3 className="text-xs font-mono font-bold uppercase tracking-widest text-[#F5CA53] mb-4">
                            Contact & Location
                        </h3>
                        <ul className="space-y-3 text-sm text-zinc-400">
                            <li className="flex items-start gap-2">
                                <span className="shrink-0 mt-0.5">📍</span>
                                <span>{shop.shop_address || shop.city || "Address not provided."}</span>
                            </li>
                            <li className="flex items-center gap-2">
                                <span>📞</span>
                                <span>{shop.contact_number || "Contact not provided."}</span>
                            </li>
                            {shop.registration_number && (
                                <li className="flex items-center gap-2">
                                    <span>🏢</span>
                                    <span>Reg: {shop.registration_number}</span>
                                </li>
                            )}
                        </ul>
                    </section>
                </div>

                {/* RIGHT COLUMN - GIGS / PORTFOLIO */}
                <div className="lg:col-span-2 space-y-8">
                    <section>
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-extrabold text-white font-heading">
                                Signature Services & Gigs
                            </h3>
                        </div>

                        {/* MOCK GIGS GRID */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            {/* Gig 1 */}
                            <div className="bg-[#121318] border border-zinc-800/80 hover:border-[#F5CA53]/50 rounded-2xl p-4 transition-all group flex flex-col">
                                <div className="h-40 bg-zinc-900 rounded-xl mb-4 overflow-hidden relative">
                                    <img src="https://images.unsplash.com/photo-1593032465175-481ac7f401a0?auto=format&fit=crop&w=600&q=80" alt="Bespoke Suit" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                    <div className="absolute top-2 right-2 bg-black/80 backdrop-blur-sm px-2 py-1 rounded text-[10px] font-bold text-[#F5CA53] border border-[#F5CA53]/30">
                                        STARTING AT LKR 45,000
                                    </div>
                                </div>
                                <h4 className="text-base font-bold text-white mb-1">Two-Piece Bespoke Suit</h4>
                                <p className="text-xs text-zinc-500 mb-4 flex-1">
                                    A fully tailored two-piece suit crafted from premium wool blends. Includes 2 fitting sessions.
                                </p>
                                <Link
                                    href={`/client/directRequest?shop_id=${shop.shop_id}&service=bespoke_suit`}
                                    className="w-full py-2.5 bg-[#18191E] text-zinc-300 text-center rounded-xl text-xs font-bold hover:bg-[#F5CA53] hover:text-black transition-colors border border-zinc-700 hover:border-[#F5CA53]"
                                >
                                    Book This Service
                                </Link>
                            </div>

                            {/* Gig 2 */}
                            <div className="bg-[#121318] border border-zinc-800/80 hover:border-[#F5CA53]/50 rounded-2xl p-4 transition-all group flex flex-col">
                                <div className="h-40 bg-zinc-900 rounded-xl mb-4 overflow-hidden relative">
                                    <img src="https://images.unsplash.com/photo-1603252109303-2751441dd157?auto=format&fit=crop&w=600&q=80" alt="Custom Shirt" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                    <div className="absolute top-2 right-2 bg-black/80 backdrop-blur-sm px-2 py-1 rounded text-[10px] font-bold text-[#F5CA53] border border-[#F5CA53]/30">
                                        STARTING AT LKR 8,500
                                    </div>
                                </div>
                                <h4 className="text-base font-bold text-white mb-1">Made-to-Measure Shirt</h4>
                                <p className="text-xs text-zinc-500 mb-4 flex-1">
                                    Crisp, perfect-fitting cotton shirts customized to your collar and cuff preferences.
                                </p>
                                <Link
                                    href={`/client/directRequest?shop_id=${shop.shop_id}&service=custom_shirt`}
                                    className="w-full py-2.5 bg-[#18191E] text-zinc-300 text-center rounded-xl text-xs font-bold hover:bg-[#F5CA53] hover:text-black transition-colors border border-zinc-700 hover:border-[#F5CA53]"
                                >
                                    Book This Service
                                </Link>
                            </div>

                            {/* Gig 3 */}
                            <div className="bg-[#121318] border border-zinc-800/80 hover:border-[#F5CA53]/50 rounded-2xl p-4 transition-all group flex flex-col sm:col-span-2">
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="w-16 h-16 bg-zinc-900 rounded-xl overflow-hidden shrink-0">
                                        <img src="https://images.unsplash.com/photo-1558769132-cb1aea458c5e?auto=format&fit=crop&w=200&q=80" alt="Alterations" className="w-full h-full object-cover" />
                                    </div>
                                    <div>
                                        <h4 className="text-base font-bold text-white">Premium Alterations</h4>
                                        <p className="text-xs text-zinc-500 mt-1">Adjustments for existing garments to achieve the perfect fit.</p>
                                    </div>
                                    <div className="ml-auto text-right">
                                        <div className="text-[10px] text-zinc-400 uppercase font-bold tracking-widest">From</div>
                                        <div className="text-lg font-black text-[#F5CA53]">LKR 2,000</div>
                                    </div>
                                </div>
                                <Link
                                    href={`/client/directRequest?shop_id=${shop.shop_id}&service=alteration`}
                                    className="w-full py-2.5 bg-[#18191E] text-zinc-300 text-center rounded-xl text-xs font-bold hover:bg-[#F5CA53] hover:text-black transition-colors border border-zinc-700 hover:border-[#F5CA53]"
                                >
                                    Book Alteration
                                </Link>
                            </div>
                        </div>
                    </section>
                </div>
            </main>
        </div>
    );
}
