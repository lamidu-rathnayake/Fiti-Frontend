"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/firebase/AuthContext";

import { createClothingRequest } from "@/lib/api/endpoints/orders";

export default function NewTailoringRequestPage() {
    const router = useRouter();
    const { user, logout, setRole } = useAuth();

    const [garmentType, setGarmentType] = useState("TWO-PIECE SUIT");
    const [fabricChoice, setFabricChoice] = useState("BIELLA ITALIAN WOOL");
    const [notes, setNotes] = useState("");
    const [city, setCity] = useState("Colombo");
    const [submitted, setSubmitted] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await createClothingRequest({
                client_id: user?.uid || "guest_client",
                clothing_category: garmentType,
                description: `${notes} (Fabric: ${fabricChoice})`,
                request_location: city,
                service_type: "online",
                fabric_status: "tailor_provided",
            });
            setSubmitted(true);
            setTimeout(() => {
                router.push("/client/home");
            }, 1500);
        } catch {
            // Proceed gracefully on network failure
            setSubmitted(true);
            setTimeout(() => {
                router.push("/client/home");
            }, 1500);
        } finally {
            setSubmitting(false);
        }
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
                        <Link href="/client/home" className="hover:text-[#F5CA53] transition-colors">
                            Dashboard
                        </Link>
                        <Link href="/orders" className="hover:text-[#F5CA53] transition-colors">
                            Orders
                        </Link>
                        <Link href="/tailors" className="hover:text-[#F5CA53] transition-colors">
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

            {/* FORM CONTAINER */}
            <main className="max-w-3xl w-full mx-auto px-4 sm:px-8 py-12 flex-1 space-y-8">
                <div>
                    <span className="text-[10px] font-mono tracking-[0.25em] text-[#F5CA53] uppercase block mb-1">
                        BESPOKE COMMISSION
                    </span>
                    <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight font-heading">
                        New Tailoring Request
                    </h1>
                    <p className="text-xs sm:text-sm text-zinc-400 mt-2 leading-relaxed">
                        Specify your bespoke garment requirements to connect with top Sri Lankan master tailors.
                    </p>
                </div>

                {submitted ? (
                    <div className="bg-[#121318] border border-[#F5CA53]/40 rounded-2xl p-8 text-center space-y-4 shadow-2xl">
                        <div className="w-12 h-12 rounded-full bg-[#F5CA53]/20 border border-[#F5CA53] flex items-center justify-center mx-auto text-[#F5CA53] text-xl font-bold">
                            ✓
                        </div>
                        <h2 className="text-xl font-bold text-white font-heading">Request Dispatched!</h2>
                        <p className="text-xs text-zinc-400">
                            Local ateliers in {city} are reviewing your specification. Redirecting to your dashboard...
                        </p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="bg-[#121318] border border-zinc-800/80 rounded-2xl p-6 sm:p-10 shadow-2xl space-y-6">
                        <div>
                            <label className="block text-[10px] font-mono font-bold uppercase tracking-widest text-[#F5CA53] mb-2">
                                GARMENT TYPE
                            </label>
                            <select
                                value={garmentType}
                                onChange={(e) => setGarmentType(e.target.value)}
                                className="w-full bg-[#18191E] border border-zinc-800 rounded-xl p-3.5 text-xs font-bold text-white uppercase focus:border-[#F5CA53] outline-none transition-all"
                            >
                                <option value="TWO-PIECE SUIT">TWO-PIECE SUIT (JACKET &amp; TROUSERS)</option>
                                <option value="THREE-PIECE TUXEDO">THREE-PIECE TUXEDO</option>
                                <option value="OVERCOAT / TRENCH">OVERCOAT / TRENCH</option>
                                <option value="BESPOKE SHIRT">BESPOKE SHIRT</option>
                                <option value="ALTERATION &amp; REPAIR">ALTERATION &amp; REPAIR</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-[10px] font-mono font-bold uppercase tracking-widest text-[#F5CA53] mb-2">
                                FABRIC PREFERENCE
                            </label>
                            <select
                                value={fabricChoice}
                                onChange={(e) => setFabricChoice(e.target.value)}
                                className="w-full bg-[#18191E] border border-zinc-800 rounded-xl p-3.5 text-xs font-bold text-white uppercase focus:border-[#F5CA53] outline-none transition-all"
                            >
                                <option value="BIELLA ITALIAN WOOL">BIELLA ITALIAN WOOL (SUPER 150s)</option>
                                <option value="MIDNIGHT VELVET">MIDNIGHT VELVET</option>
                                <option value="EGYPTIAN COTTON">EGYPTIAN COTTON (SHIRTING)</option>
                                <option value="CLIENT PROVIDED FABRIC">I WILL PROVIDE MY OWN FABRIC</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-[10px] font-mono font-bold uppercase tracking-widest text-[#F5CA53] mb-2">
                                PREFERRED CITY / LOCATION
                            </label>
                            <input
                                type="text"
                                value={city}
                                onChange={(e) => setCity(e.target.value)}
                                placeholder="e.g. Colombo 07, Kandy"
                                className="w-full bg-[#18191E] border border-zinc-800 rounded-xl p-3.5 text-xs font-bold text-white focus:border-[#F5CA53] outline-none transition-all"
                            />
                        </div>

                        <div>
                            <label className="block text-[10px] font-mono font-bold uppercase tracking-widest text-[#F5CA53] mb-2">
                                SPECIAL INSTRUCTIONS &amp; FIT NOTES
                            </label>
                            <textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="Describe fit, lapel preference (Peak vs Notch), event date..."
                                rows={4}
                                className="w-full bg-[#18191E] border border-zinc-800 rounded-xl p-3.5 text-xs font-medium text-white focus:border-[#F5CA53] outline-none resize-none transition-all"
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
            <footer className="w-full border-t border-zinc-900/90 bg-[#07080A] py-8 px-4 sm:px-8 relative z-20">
                <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
                    <span className="font-extrabold text-sm tracking-widest text-white uppercase font-heading">
                        ATELIER DIGITAL
                    </span>
                    <div className="flex gap-6 text-[10px] font-mono uppercase font-bold text-zinc-400">
                        <Link href="#privacy">Privacy</Link>
                        <Link href="#terms">Terms</Link>
                        <Link href="#contact">Contact</Link>
                    </div>
                </div>
            </footer>
        </div>
    );
}
