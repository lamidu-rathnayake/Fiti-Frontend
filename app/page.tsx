"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { auth, googleProvider } from "@/lib/firebase/config";
import { signInWithPopup } from "firebase/auth";
import { FirebaseError } from "firebase/app";
import { useAuth } from "@/lib/firebase/AuthContext";
import { getMyRole } from "@/lib/api/endpoints/auth";
import { FitiApiError } from "@/lib/api/client";
import AtelierChatDrawer from "@/components/chat/AtelierChatDrawer";

export default function HomePage() {
    const router = useRouter();
    const { setRole } = useAuth();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    // Interactive Fabric Selector state
    const [selectedFabric, setSelectedFabric] = useState({
        name: "Biella Super 150s Wool",
        origin: "Biella, Italy",
        desc: "Ultra-fine breathable wool crafted for year-round elegance and flawless drape.",
        color: "#1E2A38",
        image: "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=800&q=80",
    });

    // Interactive FAQ Accordion state
    const [openFaq, setOpenFaq] = useState<number | null>(0);

    // Live Chat Drawer State
    const [isChatDrawerOpen, setIsChatDrawerOpen] = useState(false);
    const [chatTarget, setChatTarget] = useState("Master Alexander Vane");

    const fabricsList = [
        {
            name: "Biella Super 150s Wool",
            origin: "Biella, Italy",
            desc: "Ultra-fine breathable wool crafted for year-round elegance and flawless drape.",
            color: "#1E2A38",
            image: "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=800&q=80",
        },
        {
            name: "Midnight Silk Velvet",
            origin: "Como, Italy",
            desc: "Deep luminous velvet with silk backing for statement evening tuxedos.",
            color: "#0F0F1A",
            image: "https://images.unsplash.com/photo-1598033129183-c4f50c736f10?auto=format&fit=crop&w=800&q=80",
        },
        {
            name: "Scottish Cashmere Blend",
            origin: "Highlands, Scotland",
            desc: "Unmatched warmth and soft texture for executive overcoats and trenches.",
            color: "#2C2B29",
            image: "https://images.unsplash.com/photo-1617137968427-85924c800a22?auto=format&fit=crop&w=800&q=80",
        },
        {
            name: "200s Egyptian Giza Cotton",
            origin: "Nile Delta, Egypt",
            desc: "Silky smooth hand-feel with natural sheen for bespoke dress shirts.",
            color: "#E2E8F0",
            image: "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=800&q=80",
        },
    ];

    const handlePostAuthRedirect = async () => {
        try {
            const data = await getMyRole();
            const role = data.role;

            if (role !== "client" && role !== "tailor") {
                router.replace("/onboarding");
                return;
            }

            setRole(role);
            router.replace(data.target_url || (role === "tailor" ? "/tailor/home" : "/client/home"));
        } catch (err) {
            if (err instanceof FitiApiError && err.status === 404) {
                router.replace("/onboarding");
                return;
            }
            throw err;
        }
    };

    const handleGoogleLogin = async () => {
        setLoading(true);
        setError("");
        try {
            await signInWithPopup(auth, googleProvider);
            await handlePostAuthRedirect();
        } catch (err: unknown) {
            if (err instanceof FirebaseError) {
                if (err.code !== "auth/popup-closed-by-user" && err.code !== "auth/cancelled-popup-request") {
                    setError("Google sign-in failed. Please try again.");
                }
            } else {
                setError("An unexpected error occurred.");
            }
        } finally {
            setLoading(false);
        }
    };

    const faqs = [
        {
            q: "How does FITI ensure a perfect fit for my bespoke garment?",
            a: "Our certified master tailors utilize standardized measurement blueprints combined with dynamic fitting algorithms. You can either visit a local master atelier in Colombo/Kandy or request an in-person measurement specialist.",
        },
        {
            q: "Can I bring my own fabric for a tailor to stitch?",
            a: "Yes! When submitting a tailoring request on FITI, select 'Client Provided Fabric' and specify your fabric meters and specifications.",
        },
        {
            q: "What is the typical turnaround time for a bespoke suit?",
            a: "Standard bespoke tailoring takes 10-14 days including fitting consultations. Express 5-day rush fulfillment is available for urgent wedding or black-tie events.",
        },
        {
            q: "How can I communicate directly with my master tailor?",
            a: "FITI features built-in Atelier Live Messaging. Click the '💬 Text Master Tailor' button anywhere on the platform to exchange notes, fitting photos, and design preferences in real time.",
        },
    ];

    return (
        <div className="min-h-screen bg-[#07080A] text-white flex flex-col justify-between relative overflow-x-hidden selection:bg-[#F5CA53] selection:text-black font-sans">

            {/* AMBIENT BACKGROUND GLOW RECTANGLES */}
            <div className="fixed top-0 left-1/4 w-[600px] h-[500px] bg-[#F5CA53]/10 blur-[180px] rounded-full pointer-events-none animate-pulse-glow z-0" />
            <div className="fixed bottom-10 right-10 w-[500px] h-[400px] bg-[#C5A059]/10 blur-[160px] rounded-full pointer-events-none z-0" />

            {/* TOP NAVIGATION BAR */}
            <header className="w-full border-b border-zinc-900/90 bg-[#0A0B0E]/95 backdrop-blur-xl sticky top-0 z-50 transition-all duration-300">
                <div className="max-w-7xl mx-auto px-4 sm:px-8 py-4 flex items-center justify-between gap-4">
                    {/* Brand Logo */}
                    <Link href="/" className="flex items-center gap-3 group">
                        <div className="relative h-10 px-3 py-1 bg-[#FFFDF9] rounded-xl border border-[#F5CA53]/50 shadow-[0_0_15px_rgba(245,202,83,0.25)] flex items-center justify-center transition-all duration-300 group-hover:scale-105 group-hover:shadow-[0_0_25px_rgba(245,202,83,0.45)]">
                            <img
                                src="/logoo.png"
                                alt="FITI Bespoke Atelier Logo"
                                className="h-8 w-auto object-contain"
                            />
                        </div>
                        <span className="hidden sm:inline-block text-[9px] font-mono tracking-[0.25em] text-zinc-400 uppercase border-l border-zinc-800 pl-3 py-1">
                            ATELIER DIGITAL
                        </span>
                    </Link>

                    {/* Navigation Links */}
                    <nav className="hidden lg:flex items-center space-x-8 text-xs font-bold tracking-wider text-zinc-400">
                        <Link href="/storefront" className="hover:text-[#F5CA53] transition-colors">
                            Storefront
                        </Link>
                        <Link href="/tailors" className="hover:text-[#F5CA53] transition-colors">
                            Tailors
                        </Link>
                        <Link href="#fabrics" className="hover:text-[#F5CA53] transition-colors">
                            Fabrics
                        </Link>
                        <Link href="#faq" className="hover:text-[#F5CA53] transition-colors">
                            FAQ
                        </Link>
                    </nav>

                    {/* Right User Actions */}
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
                            onClick={() => setIsChatDrawerOpen((prev) => !prev)}
                            title="Direct Message Atelier"
                            className="w-9 h-9 rounded-xl border border-[#F5CA53]/50 bg-[#F5CA53]/10 hover:bg-[#F5CA53]/20 flex items-center justify-center text-[#F5CA53] transition-all relative"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
                            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-black" />
                        </button>
                        <Link
                            href="/login"
                            className="px-5 py-2 text-xs font-extrabold uppercase tracking-wider text-black bg-[#F5CA53] rounded-xl hover:bg-[#f7d369] transition-all duration-300 shadow-[0_0_15px_rgba(245,202,83,0.3)] transform hover:scale-[1.02]"
                        >
                            Sign In
                        </Link>
                    </div>
                </div>
            </header>

            {/* HERO SECTION */}
            <section className="flex-1 flex flex-col justify-center px-4 sm:px-6 pt-12 pb-16 relative z-10 animate-fade-in">
                <div className="max-w-5xl w-full mx-auto space-y-10">

                    {/* Floating Bespoke Status Pill */}
                    <div className="flex justify-center">
                        <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-[#16171D] border border-[#F5CA53]/30 shadow-[0_4px_20px_rgba(245,202,83,0.15)] backdrop-blur-md">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                            <span className="text-[10px] font-mono font-bold uppercase tracking-[0.25em] text-[#F5CA53]">
                                Verified Atelier Marketplace &bull; Sri Lanka
                            </span>
                        </div>
                    </div>

                    {/* Hero Headline & Subtitle */}
                    <div className="text-center space-y-4 max-w-3xl mx-auto">
                        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight leading-tight font-heading">
                            Crafted for Distinction. <br />
                            <span className="gold-gradient-text">Tailored Exclusively for You.</span>
                        </h1>
                        <p className="text-xs sm:text-sm text-zinc-400 max-w-xl mx-auto leading-relaxed font-sans">
                            Connect directly with Sri Lanka&apos;s premier master tailors, request bespoke tuxedos and athletic apparel, and text master artisans from fitting to doorstep delivery.
                        </p>
                    </div>

                    {/* Hero Card Container */}
                    <div className="bg-[#121318] border border-zinc-800/90 rounded-3xl p-8 sm:p-12 max-w-lg w-full mx-auto relative overflow-hidden shadow-2xl">
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-24 bg-[#F5CA53]/15 blur-2xl pointer-events-none" />

                        <span className="text-[10px] font-mono font-bold uppercase tracking-[0.3em] text-[#F5CA53] text-center mb-2 block">
                            ATELIER GATEWAY
                        </span>

                        <h2 className="text-2xl sm:text-3xl font-extrabold text-white text-center mb-6 font-heading">
                            Welcome to FITI
                        </h2>

                        {error && (
                            <div className="mb-6 rounded-xl border border-rose-900/50 bg-rose-950/40 px-4 py-3 text-xs font-medium text-rose-400 text-center">
                                {error}
                            </div>
                        )}

                        <div className="space-y-4 relative z-10">
                            <Link
                                href="/login"
                                className="w-full bg-[#F5CA53] hover:bg-[#f7d369] text-black font-extrabold text-xs uppercase tracking-[0.2em] py-4 px-6 rounded-xl text-center block shadow-[0_0_20px_rgba(245,202,83,0.3)] transition-all hover:scale-[1.01]"
                            >
                                Sign In
                            </Link>

                            <Link
                                href="/register"
                                className="w-full bg-[#18191E] border border-zinc-800 hover:border-[#F5CA53]/60 text-[#F5CA53] font-extrabold text-xs uppercase tracking-[0.2em] py-4 px-6 rounded-xl hover:bg-zinc-800/90 transition-all duration-300 text-center block"
                            >
                                Create Account
                            </Link>

                            <div className="relative flex items-center justify-center my-6">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-zinc-800/90" />
                                </div>
                                <span className="relative bg-[#121318] px-4 text-[9px] font-mono tracking-[0.25em] text-zinc-500 uppercase">
                                    OR CONTINUE WITH
                                </span>
                            </div>

                            <button
                                type="button"
                                onClick={handleGoogleLogin}
                                disabled={loading}
                                className="w-full bg-[#18191E] border border-zinc-800 hover:border-zinc-700 text-zinc-200 font-bold text-xs py-3.5 px-6 rounded-xl hover:bg-zinc-800/90 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                            >
                                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.85z" />
                                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84C6.71 7.3 9.14 5.38 12 5.38z" />
                                </svg>
                                <span>{loading ? "Authenticating..." : "Sign up with Google"}</span>
                            </button>
                        </div>
                    </div>

                    {/* FEATURE CARDS ROW WITH RICH VISUAL IMAGES */}
                    <div id="features" className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl w-full mx-auto pt-6">
                        <Link href="/tailors" className="relative group overflow-hidden rounded-2xl border border-zinc-800/90 bg-[#121317] p-6 h-60 flex flex-col justify-end transition-all duration-500 hover:border-[#F5CA53]/60 shadow-xl cursor-pointer">
                            <img
                                src="https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=800&q=80"
                                alt="Bespoke Precision Tailoring"
                                className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 brightness-90"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent z-10" />

                            <div className="relative z-20">
                                <span className="text-[10px] font-mono font-bold tracking-[0.25em] uppercase text-[#F5CA53] mb-1 block">
                                    Craftsmanship
                                </span>
                                <h3 className="text-xl font-extrabold text-white tracking-wide font-heading">
                                    Precision Tailoring &rarr;
                                </h3>
                                <p className="text-xs text-zinc-300 mt-1">
                                    Custom measurements &amp; verified master artisans.
                                </p>
                            </div>
                        </Link>

                        <Link href="/storefront" className="relative group overflow-hidden rounded-2xl border border-zinc-800/90 bg-[#121317] p-6 h-60 flex flex-col justify-end transition-all duration-500 hover:border-[#F5CA53]/60 shadow-xl cursor-pointer">
                            <img
                                src="https://images.unsplash.com/photo-1598033129183-c4f50c736f10?auto=format&fit=crop&w=800&q=80"
                                alt="Elite Performance Apparel"
                                className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 brightness-90"
                            />
                            <div className="absolute top-4 left-4 z-20 text-[9px] font-mono text-zinc-300 bg-black/80 backdrop-blur-md px-3 py-1 rounded-md border border-white/10">
                                FITI Storefront
                            </div>
                            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent z-10" />

                            <div className="relative z-20">
                                <span className="text-[10px] font-mono font-bold tracking-[0.25em] uppercase text-[#F5CA53] mb-1 block">
                                    Curated Catalog
                                </span>
                                <h3 className="text-xl font-extrabold text-white tracking-wide font-heading">
                                    Italian Wools &amp; Tuxedos &rarr;
                                </h3>
                                <p className="text-xs text-zinc-300 mt-1">
                                    Handcrafted luxury garments ready to fit.
                                </p>
                            </div>
                        </Link>

                        <div
                            onClick={() => {
                                setChatTarget("Master Alexander Vane");
                                setIsChatDrawerOpen(true);
                            }}
                            className="relative group overflow-hidden rounded-2xl border border-zinc-800/90 bg-[#121317] p-6 h-60 flex flex-col justify-end transition-all duration-500 hover:border-[#F5CA53]/60 shadow-xl cursor-pointer"
                        >
                            <img
                                src="https://images.unsplash.com/photo-1567401893414-76b7b1e5a7a5?auto=format&fit=crop&w=800&q=80"
                                alt="Exclusive Curated Shops"
                                className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 brightness-90"
                            />
                            <div className="absolute top-4 right-4 z-20 text-[9px] font-mono font-bold text-[#F5CA53] bg-black/80 backdrop-blur-md px-3 py-1 rounded-md border border-[#F5CA53]/30 uppercase">
                                Live Direct Line
                            </div>
                            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent z-10" />

                            <div className="relative z-20">
                                <span className="text-[10px] font-mono font-bold tracking-[0.25em] uppercase text-[#F5CA53] mb-1 block">
                                    Direct Messaging
                                </span>
                                <h3 className="text-xl font-extrabold text-white tracking-wide font-heading">
                                    Text Master Tailor 💬
                                </h3>
                                <p className="text-xs text-zinc-300 mt-1">
                                    Consult real-time with Sri Lankan artisans.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* STATS & METRICS DISPLAY */}
            <section className="w-full border-y border-zinc-900 bg-[#0C0D11]/90 backdrop-blur-md py-14 px-4 sm:px-8 relative z-10">
                <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
                    <div className="space-y-1">
                        <p className="text-4xl sm:text-5xl font-extrabold text-[#F5CA53] font-heading">50+</p>
                        <p className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-widest">Verified Atelier Shops</p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-4xl sm:text-5xl font-extrabold text-[#F5CA53] font-heading">1,500+</p>
                        <p className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-widest">Garments Crafted</p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-4xl sm:text-5xl font-extrabold text-[#F5CA53] font-heading">4.9 ★</p>
                        <p className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-widest">Client Satisfaction</p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-4xl sm:text-5xl font-extrabold text-[#F5CA53] font-heading">100%</p>
                        <p className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-widest">Precision Fit Guarantee</p>
                    </div>
                </div>
            </section>

            {/* INTERACTIVE FABRIC PREVIEW SECTION */}
            <section id="fabrics" className="w-full py-20 px-4 sm:px-8 bg-[#0B0C0F] border-b border-zinc-900 relative z-10">
                <div className="max-w-6xl mx-auto space-y-10">
                    <div className="text-center space-y-2">
                        <span className="text-[10px] font-mono font-bold uppercase tracking-[0.3em] text-[#F5CA53]">
                            LUXURY TEXTILE COLLECTION
                        </span>
                        <h2 className="text-3xl sm:text-4xl font-extrabold text-white font-heading">
                            Interactive Fabric Showcase
                        </h2>
                        <p className="text-xs sm:text-sm text-zinc-400 max-w-lg mx-auto">
                            Click any luxury mill fabric to inspect weave details and origin.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center bg-[#121318] border border-zinc-800/80 rounded-3xl p-6 sm:p-10 shadow-2xl">
                        {/* Left: Fabric List Picker */}
                        <div className="md:col-span-5 space-y-3">
                            {fabricsList.map((f) => (
                                <button
                                    key={f.name}
                                    onClick={() => setSelectedFabric(f)}
                                    className={`w-full text-left p-4 rounded-2xl border transition-all flex items-center justify-between gap-4 ${
                                        selectedFabric.name === f.name
                                            ? "bg-[#18191E] border-[#F5CA53] shadow-[0_0_15px_rgba(245,202,83,0.2)]"
                                            : "bg-[#0E0F13] border-zinc-800/80 hover:border-zinc-700 opacity-70 hover:opacity-100"
                                    }`}
                                >
                                    <div>
                                        <h4 className="text-sm font-extrabold text-white font-heading">{f.name}</h4>
                                        <p className="text-[10px] font-mono text-zinc-400 mt-0.5">📍 {f.origin}</p>
                                    </div>
                                    <div
                                        className="w-6 h-6 rounded-full border border-white/20 shrink-0 shadow"
                                        style={{ backgroundColor: f.color }}
                                    />
                                </button>
                            ))}
                        </div>

                        {/* Right: Selected Fabric Display */}
                        <div className="md:col-span-7 space-y-4">
                            <div className="relative w-full h-72 rounded-2xl overflow-hidden border border-zinc-800 shadow-2xl">
                                <img
                                    src={selectedFabric.image}
                                    alt={selectedFabric.name}
                                    className="w-full h-full object-cover"
                                />
                                <div className="absolute top-4 left-4 bg-black/80 backdrop-blur-md px-3 py-1 rounded-lg border border-[#F5CA53]/40 text-[#F5CA53] text-[10px] font-mono font-bold uppercase">
                                    {selectedFabric.origin}
                                </div>
                            </div>
                            <div>
                                <h3 className="text-xl font-extrabold text-white font-heading">{selectedFabric.name}</h3>
                                <p className="text-xs text-zinc-400 mt-1 leading-relaxed">{selectedFabric.desc}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>



            {/* FREQUENTLY ASKED QUESTIONS (FAQ ACCORDION) */}
            <section id="faq" className="w-full py-20 px-4 sm:px-8 bg-[#0B0C0F] border-t border-zinc-900 relative z-10">
                <div className="max-w-4xl mx-auto space-y-8">
                    <div className="text-center space-y-2">
                        <span className="text-[10px] font-mono font-bold uppercase tracking-[0.3em] text-[#F5CA53]">
                            GOT QUESTIONS?
                        </span>
                        <h2 className="text-3xl sm:text-4xl font-extrabold text-white font-heading">
                            Frequently Asked Questions
                        </h2>
                    </div>

                    <div className="space-y-4">
                        {faqs.map((faq, idx) => (
                            <div
                                key={idx}
                                className="bg-[#121318] border border-zinc-800 rounded-2xl overflow-hidden transition-all"
                            >
                                <button
                                    onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                                    className="w-full p-5 text-left flex items-center justify-between gap-4 font-bold text-sm text-white font-heading hover:text-[#F5CA53]"
                                >
                                    <span>{faq.q}</span>
                                    <span className="text-[#F5CA53] text-lg">{openFaq === idx ? "−" : "+"}</span>
                                </button>
                                {openFaq === idx && (
                                    <div className="px-5 pb-5 text-xs text-zinc-400 leading-relaxed border-t border-zinc-800/80 pt-3">
                                        {faq.a}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CALL TO ACTION BANNER */}
            <section className="w-full py-20 px-4 sm:px-8 relative z-10">
                <div className="max-w-5xl mx-auto rounded-3xl border border-[#F5CA53]/40 bg-gradient-to-br from-[#16171D] via-[#111216] to-[#0A0B0E] p-8 sm:p-14 text-center relative overflow-hidden shadow-2xl">
                    <div className="absolute top-0 right-0 w-80 h-80 bg-[#F5CA53]/15 blur-3xl rounded-full pointer-events-none animate-pulse-glow" />

                    <span className="text-[10px] font-mono font-bold uppercase tracking-[0.3em] text-[#F5CA53] mb-3 block">
                        Join Sri Lanka&apos;s Digital Atelier Platform
                    </span>
                    <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight mb-4 font-heading">
                        Ready to Experience Bespoke Luxury?
                    </h2>
                    <p className="text-xs sm:text-sm text-zinc-400 max-w-xl mx-auto mb-8 leading-relaxed">
                        Register as a client to order custom garments, or join as a verified tailor shop to showcase your artistry.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Link
                            href="/register"
                            className="w-full sm:w-auto bg-[#F5CA53] hover:bg-[#f7d369] text-black font-extrabold text-xs uppercase tracking-widest py-4 px-8 rounded-xl shadow-[0_0_20px_rgba(245,202,83,0.3)] block"
                        >
                            Get Started as Client
                        </Link>
                        <Link
                            href="/register"
                            className="w-full sm:w-auto bg-transparent border border-zinc-700 hover:border-[#F5CA53] text-[#F5CA53] font-bold text-xs uppercase tracking-widest py-4 px-8 rounded-xl hover:bg-[#F5CA53]/10 transition-all block"
                        >
                            Join as Tailor Shop
                        </Link>
                    </div>
                </div>
            </section>

            {/* FLOATING TEXT / CHAT TRIGGER BUTTON */}
            {!isChatDrawerOpen && (
                <button
                    onClick={() => setIsChatDrawerOpen(true)}
                    className="fixed bottom-6 right-6 z-[8888] px-4 py-3 bg-[#F5CA53] hover:bg-[#f7d369] text-black font-extrabold text-xs uppercase tracking-wider rounded-full shadow-[0_0_25px_rgba(245,202,83,0.5)] flex items-center gap-2 transition-all hover:scale-105"
                >
                    <span className="w-2 h-2 rounded-full bg-emerald-600 animate-ping" />
                    <span>💬 Text Master Tailor</span>
                </button>
            )}

            {/* LIVE ATELIER CHAT DRAWER */}
            <AtelierChatDrawer
                isOpen={isChatDrawerOpen}
                onClose={() => setIsChatDrawerOpen(false)}
                initialContactName={chatTarget}
                userRole="client"
            />

            {/* BOTTOM FOOTER */}
            <footer className="w-full border-t border-zinc-900/90 bg-[#07080A] py-8 px-4 sm:px-8 relative z-20">
                <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
                    <span className="font-extrabold text-sm tracking-widest text-white uppercase font-heading">
                        ATELIER DIGITAL
                    </span>
                    <div className="flex gap-6 text-[10px] font-mono uppercase font-bold text-zinc-400">
                        <Link href="/privacy">Privacy Policy</Link>
                        <Link href="/terms">Terms of Service</Link>
                        <Link href="/contact">Contact Support</Link>
                    </div>
                </div>
            </footer>
        </div>
    );
}
