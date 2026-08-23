"use client";

import Link from "next/link";
import { useAuth } from "@/lib/firebase/AuthContext";

export default function TailorsPage() {
    const { role } = useAuth();
    const homeUrl = role === "tailor" ? "/tailor/home" : role === "client" ? "/client/home" : "/login";

    const tailors = [
        {
            id: 1,
            name: "Atelier Vane",
            master: "Master Alexander Vane",
            city: "Colombo 07",
            specialty: "Bespoke Italian Suits & Tuxedos",
            rating: "4.9 ★ (128 Reviews)",
            image: "https://images.unsplash.com/photo-1598033129183-c4f50c736f10?auto=format&fit=crop&w=500&q=80",
        },
        {
            id: 2,
            name: "Gieves & Hawkes Ceylon",
            master: "Master Saville Perera",
            city: "Colombo 03",
            specialty: "British Military & Formal Tailoring",
            rating: "5.0 ★ (86 Reviews)",
            image: "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=500&q=80",
        },
        {
            id: 3,
            name: "Kandy Royal Atelier",
            master: "Master Bandara",
            city: "Kandy Central",
            specialty: "Traditional Ceremonial & Modern Cut",
            rating: "4.8 ★ (64 Reviews)",
            image: "https://images.unsplash.com/photo-1617137968427-85924c800a22?auto=format&fit=crop&w=500&q=80",
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
                        <Link href="/storefront" className="hover:text-[#F5CA53] transition-colors">Storefront</Link>
                        <Link href={homeUrl} className="hover:text-[#F5CA53] transition-colors">Dashboard</Link>
                        <Link href="/orders" className="hover:text-[#F5CA53] transition-colors">Orders</Link>
                        <Link href="/tailors" className="text-[#F5CA53] font-bold relative pb-1 border-b-2 border-[#F5CA53]">Tailors</Link>
                    </nav>

                    <div className="flex items-center space-x-5 text-zinc-400">
                        <Link href={homeUrl} className="px-4 py-2 rounded-xl bg-[#F5CA53] text-black text-xs font-bold uppercase tracking-wider">
                            My Account
                        </Link>
                    </div>
                </div>
            </header>

            {/* MAIN DIRECTORY */}
            <main className="max-w-7xl w-full mx-auto px-6 sm:px-12 py-12 flex-1 space-y-10">
                <div>
                    <span className="text-[10px] font-black uppercase tracking-[0.25em] text-[#F5CA53] mb-2 block">
                        MASTER ARTISAN DIRECTORY
                    </span>
                    <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                        Explore Master Tailors
                    </h1>
                    <p className="text-xs sm:text-sm text-zinc-400 mt-2 max-w-lg">
                        Discover top certified bespoke ateliers and master craftsmen in Colombo and Kandy.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {tailors.map((t) => (
                        <div key={t.id} className="bg-[#131418]/90 border border-zinc-800/90 hover:border-[#F5CA53]/50 rounded-[24px] p-6 shadow-2xl space-y-4 transition-all">
                            <div className="w-full h-48 rounded-2xl overflow-hidden bg-zinc-800">
                                <img src={t.image} alt={t.name} className="w-full h-full object-cover" />
                            </div>
                            <div>
                                <span className="text-[10px] font-bold text-[#F5CA53] uppercase block">{t.rating}</span>
                                <h3 className="text-lg font-extrabold text-white mt-1">{t.name}</h3>
                                <p className="text-xs text-zinc-400 mt-0.5">{t.master} &bull; {t.city}</p>
                                <p className="text-xs text-zinc-500 mt-2 font-medium">{t.specialty}</p>
                            </div>
                            <Link
                                href="/client/request"
                                className="w-full block text-center py-3 rounded-xl bg-[#F5CA53] text-black text-xs font-bold uppercase tracking-wider shadow-[0_0_15px_rgba(245,202,83,0.25)] hover:scale-[1.01] transition-transform"
                            >
                                BOOK FITTING &rarr;
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
