"use client";

import Link from "next/link";
import { useAuth } from "@/lib/firebase/AuthContext";

export default function StorefrontPage() {
    const { user, role } = useAuth();

    const homeUrl = role === "tailor" ? "/tailor/home" : role === "client" ? "/client/home" : "/login";

    const products = [
        {
            id: 1,
            name: "Bespoke Navy Double-Breasted Suit",
            fabric: "Biella Super 150s Wool",
            price: "LKR 185,000",
            image: "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=600&q=80",
            tag: "BESTSELLER",
        },
        {
            id: 2,
            name: "Midnight Black Velvet Tuxedo",
            fabric: "Italian Velvet & Satin Lapel",
            price: "LKR 210,000",
            image: "https://images.unsplash.com/photo-1598033129183-c4f50c736f10?auto=format&fit=crop&w=600&q=80",
            tag: "ATELIER EXCLUSIVE",
        },
        {
            id: 3,
            name: "Charcoal Overcoat Fitting",
            fabric: "Cashmere-Wool Blend",
            price: "LKR 165,000",
            image: "https://images.unsplash.com/photo-1617137968427-85924c800a22?auto=format&fit=crop&w=600&q=80",
            tag: "SEASONAL",
        },
    ];

    return (
        <div className="min-h-screen bg-[#0A0B0E] text-white flex flex-col justify-between selection:bg-[#F5CA53] selection:text-black font-sans">
            {/* TOP NAVIGATION HEADER */}
            <header className="w-full border-b border-zinc-900/80 bg-[#0A0B0E]/90 backdrop-blur-md sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-6 sm:px-12 py-5 flex items-center justify-between">
                    <Link href="/" className="text-xl sm:text-2xl font-black tracking-widest text-[#F5CA53] hover:opacity-90 transition-opacity">
                        FITI
                    </Link>

                    <nav className="hidden md:flex items-center space-x-10 text-xs font-semibold tracking-wider text-zinc-400">
                        <Link href="/storefront" className="text-[#F5CA53] font-bold relative pb-1 border-b-2 border-[#F5CA53]">Storefront</Link>
                        <Link href={homeUrl} className="hover:text-[#F5CA53] transition-colors">Dashboard</Link>
                        <Link href="/orders" className="hover:text-[#F5CA53] transition-colors">Orders</Link>
                        <Link href="/tailors" className="hover:text-[#F5CA53] transition-colors">Tailors</Link>
                    </nav>

                    <div className="flex items-center space-x-5 text-zinc-400">
                        <Link href={homeUrl} className="px-4 py-2 rounded-xl bg-[#F5CA53] text-black text-xs font-bold uppercase tracking-wider">
                            My Account
                        </Link>
                    </div>
                </div>
            </header>

            {/* MAIN CATALOG */}
            <main className="max-w-7xl w-full mx-auto px-6 sm:px-12 py-12 flex-1 space-y-10">
                <div>
                    <span className="text-[10px] font-black uppercase tracking-[0.25em] text-[#F5CA53] mb-2 block">
                        CURATED ATELIER CATALOG
                    </span>
                    <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
                        Bespoke Storefront
                    </h1>
                    <p className="text-xs sm:text-sm text-zinc-400 mt-2 max-w-xl">
                        Handcrafted tailored garments, rare Italian fabrics, and custom fitting packages by Sri Lanka&apos;s master tailors.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {products.map((item) => (
                        <div key={item.id} className="bg-[#131418]/90 border border-zinc-800/90 hover:border-[#F5CA53]/50 rounded-[24px] p-5 shadow-2xl space-y-4 group transition-all">
                            <div className="relative w-full h-72 rounded-2xl overflow-hidden bg-zinc-800">
                                <img src={item.image} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                                <span className="absolute top-3 left-3 bg-[#F5CA53] text-black text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full shadow-lg">
                                    {item.tag}
                                </span>
                            </div>
                            <div>
                                <span className="text-[10px] font-bold text-zinc-500 uppercase block">{item.fabric}</span>
                                <h3 className="text-base font-extrabold text-white mt-0.5">{item.name}</h3>
                                <p className="text-sm font-black text-[#F5CA53] mt-2">{item.price}</p>
                            </div>
                            <Link
                                href="/client/request"
                                className="w-full block text-center py-3 rounded-xl bg-[#18191E] border border-zinc-800 group-hover:border-[#F5CA53] text-xs font-bold text-zinc-200 group-hover:text-[#F5CA53] transition-colors uppercase tracking-wider"
                            >
                                COMMISSION THIS FIT &rarr;
                            </Link>
                        </div>
                    ))}
                </div>
            </main>

            {/* FOOTER */}
            <footer className="w-full border-t border-zinc-900/80 bg-[#0A0B0E] py-8 px-6 sm:px-12 relative z-20">
                <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
                    <span className="text-sm font-black tracking-widest text-[#F5CA53]">FITI</span>
                    <div className="flex gap-6 text-[10px] uppercase font-bold text-zinc-400">
                        <Link href="/privacy">Privacy Policy</Link>
                        <Link href="/terms">Terms of Service</Link>
                        <Link href="/contact">Contact Support</Link>
                    </div>
                </div>
            </footer>
        </div>
    );
}
