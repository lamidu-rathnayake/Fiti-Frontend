"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/firebase/AuthContext";

export default function NewTailoringRequestPage() {
    const router = useRouter();
    const { user, logout } = useAuth();

    const [garmentType, setGarmentType] = useState("TWO-PIECE SUIT");
    const [fabricChoice, setFabricChoice] = useState("BIELLA ITALIAN WOOL");
    const [notes, setNotes] = useState("");
    const [city, setCity] = useState("Colombo");
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitted(true);
        setTimeout(() => {
            router.push("/client/home");
        }, 2000);
    };

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
                        <Link href="/client/home" className="hover:text-[#F5CA53] transition-colors">My Atelier</Link>
                        <Link href="/orders" className="hover:text-[#F5CA53] transition-colors">Orders</Link>
                        <Link href="/tailors" className="hover:text-[#F5CA53] transition-colors">Explore Ateliers</Link>
                    </nav>

                    <div className="flex items-center space-x-5 text-zinc-400">
                        <button
                            onClick={() => logout()}
                            title="Sign out"
                            className="w-8 h-8 rounded-full border border-[#F5CA53]/50 bg-[#F5CA53]/10 flex items-center justify-center text-xs font-bold text-[#F5CA53] hover:bg-[#F5CA53] hover:text-black transition-all"
                        >
                            {user?.displayName ? user.displayName.charAt(0).toUpperCase() : "C"}
                        </button>
                    </div>
                </div>
            </header>

            {/* FORM CONTAINER */}
            <main className="max-w-3xl w-full mx-auto px-6 sm:px-12 py-12 flex-1 space-y-8">
                <div>
                    <span className="text-[10px] font-black uppercase tracking-[0.25em] text-[#F5CA53] mb-2 block">
                        BESPOKE COMMISSION
                    </span>
                    <h1 className="text-3xl sm:text-4xl font-extrabold text-white">
                        New Tailoring Request
                    </h1>
                    <p className="text-xs sm:text-sm text-zinc-400 mt-2">
                        Specify your bespoke garment requirements to connect with top Sri Lankan master tailors.
                    </p>
                </div>

                {submitted ? (
                    <div className="bg-[#131418] border border-[#F5CA53]/40 rounded-[28px] p-8 text-center space-y-4">
                        <div className="w-12 h-12 rounded-full bg-[#F5CA53]/20 border border-[#F5CA53] flex items-center justify-center mx-auto text-[#F5CA53] text-xl font-bold">
                            ✓
                        </div>
                        <h2 className="text-xl font-bold text-white">Request Dispatched!</h2>
                        <p className="text-xs text-zinc-400">
                            Local ateliers in {city} are reviewing your specification. Redirecting to your dashboard...
                        </p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="bg-[#131418]/90 border border-zinc-800/90 rounded-[28px] p-8 sm:p-10 shadow-2xl space-y-6">
                        <div>
                            <label className="block text-[10px] font-black uppercase tracking-widest text-[#F5CA53] mb-2">
                                GARMENT TYPE
                            </label>
                            <select
                                value={garmentType}
                                onChange={(e) => setGarmentType(e.target.value)}
                                className="w-full bg-[#18191E] border border-zinc-800 rounded-xl p-4 text-xs font-bold text-white uppercase focus:border-[#F5CA53] outline-none"
                            >
                                <option value="TWO-PIECE SUIT">TWO-PIECE SUIT (JACKET &amp; TROUSERS)</option>
                                <option value="THREE-PIECE TUXEDO">THREE-PIECE TUXEDO</option>
                                <option value="OVERCOAT / TRENCH">OVERCOAT / TRENCH</option>
                                <option value="BESPOKE SHIRT">BESPOKE SHIRT</option>
                                <option value="ALTERATION &amp; REPAIR">ALTERATION &amp; REPAIR</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-[10px] font-black uppercase tracking-widest text-[#F5CA53] mb-2">
                                FABRIC PREFERENCE
                            </label>
                            <select
                                value={fabricChoice}
                                onChange={(e) => setFabricChoice(e.target.value)}
                                className="w-full bg-[#18191E] border border-zinc-800 rounded-xl p-4 text-xs font-bold text-white uppercase focus:border-[#F5CA53] outline-none"
                            >
                                <option value="BIELLA ITALIAN WOOL">BIELLA ITALIAN WOOL (SUPER 150s)</option>
                                <option value="MIDNIGHT VELVET">MIDNIGHT VELVET</option>
                                <option value="EGYPTIAN COTTON">EGYPTIAN COTTON (SHIRTING)</option>
                                <option value="CLIENT PROVIDED FABRIC">I WILL PROVIDE MY OWN FABRIC</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-[10px] font-black uppercase tracking-widest text-[#F5CA53] mb-2">
                                PREFERRED CITY / LOCATION
                            </label>
                            <input
                                type="text"
                                value={city}
                                onChange={(e) => setCity(e.target.value)}
                                placeholder="e.g. Colombo 07, Kandy"
                                className="w-full bg-[#18191E] border border-zinc-800 rounded-xl p-4 text-xs font-bold text-white focus:border-[#F5CA53] outline-none"
                            />
                        </div>

                        <div>
                            <label className="block text-[10px] font-black uppercase tracking-widest text-[#F5CA53] mb-2">
                                SPECIAL INSTRUCTIONS &amp; FIT NOTES
                            </label>
                            <textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="Describe fit, lapel preference (Peak vs Notch), event date..."
                                rows={4}
                                className="w-full bg-[#18191E] border border-zinc-800 rounded-xl p-4 text-xs font-medium text-white focus:border-[#F5CA53] outline-none resize-none"
                            />
                        </div>

                        <button
                            type="submit"
                            className="w-full py-4 rounded-xl bg-[#F5CA53] hover:bg-[#f7d369] text-xs font-black uppercase tracking-[0.15em] text-black shadow-[0_0_20px_rgba(245,202,83,0.3)] transition-all hover:scale-[1.01]"
                        >
                            DISPATCH REQUEST TO ATELIERS &rarr;
                        </button>
                    </form>
                )}
            </main>

            {/* FOOTER */}
            <footer className="w-full border-t border-zinc-900/80 bg-[#0A0B0E] py-8 px-6 sm:px-12 relative z-20">
                <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
                    <span className="text-sm font-black tracking-widest text-[#F5CA53]">FITI</span>
                    <div className="flex gap-6 text-[10px] uppercase font-bold text-zinc-400">
                        <Link href="/privacy">Privacy</Link>
                        <Link href="/terms">Terms</Link>
                        <Link href="/contact">Contact</Link>
                    </div>
                </div>
            </footer>
        </div>
    );
}
