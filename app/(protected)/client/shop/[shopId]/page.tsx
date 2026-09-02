"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { getShop } from "@/lib/api/endpoints/shops";
import type { Shop } from "@/lib/api/types/shop";
import FullPageLock from "@/components/FullPageLock";

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
            <FullPageLock
                isLoading={true}
                title="Loading Atelier Profile"
                message="Retrieving tailor details and signature services..."
            />
        );
    }

    if (!shop) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center space-y-4">
                <h2 className="text-xl font-bold text-earth-text font-serif">Shop Not Found</h2>
                <p className="text-earth-text/60 text-sm">The atelier you are looking for does not exist.</p>
                <button
                    onClick={() => router.back()}
                    className="px-6 py-2 bg-warm-beige border border-accent/20 text-earth-text rounded-xl hover:border-accent hover:bg-accent hover:text-white transition-all cursor-pointer"
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
        <div className="min-h-screen text-earth-text selection:bg-accent selection:text-white">
            {/* HERO / COVER SECTION */}
            <div className="w-full h-64 sm:h-80 relative overflow-hidden">
                <div
                    className="absolute inset-0 bg-cover bg-center opacity-40"
                    style={{ backgroundImage: `url('${coverImage}')` }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-cream-bg via-cream-bg/60 to-transparent" />

                <div className="absolute bottom-0 left-0 w-full p-6 sm:p-12 max-w-7xl mx-auto flex flex-col sm:flex-row items-end justify-between gap-4">
                    <div>
                        <span className="text-[10px] font-mono tracking-[0.3em] uppercase text-accent font-bold mb-2 block">
                            CERTIFIED ATELIER
                        </span>
                        <h1 className="text-4xl sm:text-5xl font-bold text-earth-text font-serif tracking-tight">
                            {shop.shop_name}
                        </h1>
                        <p className="text-earth-text/70 mt-2 font-mono text-xs flex items-center gap-2">
                            <span>📍 {shop.city || "Unknown Location"}</span>
                            <span>&bull;</span>
                            <span className="text-accent font-bold">
                                &#9733; {shop.average_rating && shop.average_rating > 0 ? shop.average_rating.toFixed(1) : "New"}
                            </span>
                        </p>
                    </div>

                    <Link
                        href={`/client/directRequest?shop_id=${shop.shop_id}`}
                        className="px-8 py-3 bg-accent text-white font-bold text-xs uppercase tracking-wider rounded-xl hover:bg-accent-hover transition-all shadow-md shrink-0"
                    >
                        Clothing Request &rarr;
                    </Link>
                </div>
            </div>

            <main className="max-w-7xl mx-auto px-6 sm:px-12 py-12 grid grid-cols-1 lg:grid-cols-3 gap-12">
                {/* LEFT COLUMN - ABOUT & INFO */}
                <div className="lg:col-span-1 space-y-8">
                    <section>
                        <h3 className="text-xs font-mono font-bold uppercase tracking-widest text-earth-text/60 mb-4 border-b border-accent/10 pb-2">
                            About the Atelier
                        </h3>
                        <p className="text-earth-text/80 text-sm leading-relaxed">
                            {shop.shop_bio || "Master tailors specializing in modern silhouettes and sharp architectural cuts. Bringing decades of bespoke craftsmanship to every garment."}
                        </p>
                    </section>

                    <section>
                        <h3 className="text-xs font-mono font-bold uppercase tracking-widest text-earth-text/60 mb-4 border-b border-accent/10 pb-2">
                            Specialties
                        </h3>
                        <div className="flex flex-wrap gap-2">
                            {(shop.specialty ? shop.specialty.split(",") : ["Bespoke Suits", "Alterations", "Custom Shirts"]).map((tag, i) => (
                                <span key={i} className="px-3 py-1 bg-warm-beige/50 border border-accent/15 text-earth-text text-[10px] font-mono rounded-lg">
                                    {tag.trim()}
                                </span>
                            ))}
                        </div>
                    </section>

                    <section className="bg-warm-beige/40 p-5 rounded-2xl border border-accent/15 backdrop-blur-sm">
                        <h3 className="text-xs font-serif font-bold uppercase tracking-widest text-accent mb-4">
                            Contact & Location
                        </h3>
                        <ul className="space-y-3 text-sm text-earth-text/70">
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
                            <h3 className="text-xl font-bold text-earth-text font-serif">
                                Signature Services & Gigs
                            </h3>
                        </div>

                        {/* MOCK GIGS GRID */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            {/* Gig 1 */}
                            <div className="bg-warm-beige/40 border border-accent/15 hover:border-accent/40 rounded-2xl p-4 transition-all group flex flex-col backdrop-blur-sm shadow-sm">
                                <div className="h-40 bg-warm-beige rounded-xl mb-4 overflow-hidden relative">
                                    <img src="https://images.unsplash.com/photo-1593032465175-481ac7f401a0?auto=format&fit=crop&w=600&q=80" alt="Bespoke Suit" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                    <div className="absolute top-2 right-2 bg-accent/90 backdrop-blur-sm px-2 py-1 rounded text-[10px] font-bold text-white shadow-sm">
                                        STARTING AT LKR 45,000
                                    </div>
                                </div>
                                <h4 className="text-base font-bold text-earth-text font-serif mb-1">Two-Piece Bespoke Suit</h4>
                                <p className="text-xs text-earth-text/70 mb-4 flex-1">
                                    A fully tailored two-piece suit crafted from premium wool blends. Includes 2 fitting sessions.
                                </p>
                                <Link
                                    href={`/client/directRequest?shop_id=${shop.shop_id}&service=bespoke_suit`}
                                    className="w-full py-2.5 bg-warm-beige text-earth-text text-center rounded-xl text-xs font-bold hover:bg-accent hover:text-white transition-colors border border-accent/20 hover:border-accent"
                                >
                                    Book This Service
                                </Link>
                            </div>

                            {/* Gig 2 */}
                            <div className="bg-warm-beige/40 border border-accent/15 hover:border-accent/40 rounded-2xl p-4 transition-all group flex flex-col backdrop-blur-sm shadow-sm">
                                <div className="h-40 bg-warm-beige rounded-xl mb-4 overflow-hidden relative">
                                    <img src="https://images.unsplash.com/photo-1603252109303-2751441dd157?auto=format&fit=crop&w=600&q=80" alt="Custom Shirt" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                    <div className="absolute top-2 right-2 bg-accent/90 backdrop-blur-sm px-2 py-1 rounded text-[10px] font-bold text-white shadow-sm">
                                        STARTING AT LKR 8,500
                                    </div>
                                </div>
                                <h4 className="text-base font-bold text-earth-text font-serif mb-1">Made-to-Measure Shirt</h4>
                                <p className="text-xs text-earth-text/70 mb-4 flex-1">
                                    Crisp, perfect-fitting cotton shirts customized to your collar and cuff preferences.
                                </p>
                                <Link
                                    href={`/client/directRequest?shop_id=${shop.shop_id}&service=custom_shirt`}
                                    className="w-full py-2.5 bg-warm-beige text-earth-text text-center rounded-xl text-xs font-bold hover:bg-accent hover:text-white transition-colors border border-accent/20 hover:border-accent"
                                >
                                    Book This Service
                                </Link>
                            </div>

                            {/* Gig 3 */}
                            <div className="bg-warm-beige/40 border border-accent/15 hover:border-accent/40 rounded-2xl p-4 transition-all group flex flex-col sm:col-span-2 backdrop-blur-sm shadow-sm">
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="w-16 h-16 bg-warm-beige rounded-xl overflow-hidden shrink-0">
                                        <img src="https://images.unsplash.com/photo-1558769132-cb1aea458c5e?auto=format&fit=crop&w=200&q=80" alt="Alterations" className="w-full h-full object-cover" />
                                    </div>
                                    <div>
                                        <h4 className="text-base font-bold text-earth-text font-serif">Premium Alterations</h4>
                                        <p className="text-xs text-earth-text/70 mt-1">Adjustments for existing garments to achieve the perfect fit.</p>
                                    </div>
                                    <div className="ml-auto text-right">
                                        <div className="text-[10px] text-earth-text/60 uppercase font-bold tracking-widest">From</div>
                                        <div className="text-lg font-bold text-accent font-mono">LKR 2,000</div>
                                    </div>
                                </div>
                                <Link
                                    href={`/client/directRequest?shop_id=${shop.shop_id}&service=alteration`}
                                    className="w-full py-2.5 bg-warm-beige text-earth-text text-center rounded-xl text-xs font-bold hover:bg-accent hover:text-white transition-colors border border-accent/20 hover:border-accent"
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
