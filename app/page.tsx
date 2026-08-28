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

export default function HomePage() {
    const router = useRouter();
    const { setRole } = useAuth();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

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

    return (
        <div className="min-h-screen bg-[#0A0B0E] text-white flex flex-col justify-between relative overflow-x-hidden selection:bg-[#F5CA53] selection:text-black font-sans">

            {/* AMBIENT BACKGROUND GLOW RECTANGLES */}
            <div className="fixed top-0 left-1/4 w-[600px] h-[500px] bg-[#F5CA53]/10 blur-[180px] rounded-full pointer-events-none animate-pulse-glow z-0" />
            <div className="fixed bottom-10 right-10 w-[500px] h-[400px] bg-[#C5A059]/10 blur-[160px] rounded-full pointer-events-none z-0" />

            {/* TOP NAVIGATION BAR */}
            <header className="w-full border-b border-zinc-900/90 bg-[#0A0B0E]/80 backdrop-blur-xl sticky top-0 z-50 transition-all duration-300">
                <div className="max-w-7xl mx-auto px-6 sm:px-12 py-4 flex items-center justify-between">
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
                            Bespoke Atelier
                        </span>
                    </Link>

                    {/* Navigation Links */}
                    <nav className="hidden md:flex items-center space-x-8 text-xs font-semibold tracking-wider text-zinc-400">
                        <Link href="#features" className="hover:text-[#F5CA53] transition-colors relative py-1 group">
                            Dashboard
                            <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-[#F5CA53] transition-all duration-300 group-hover:w-full" />
                        </Link>
                        <Link href="#how-it-works" className="hover:text-[#F5CA53] transition-colors relative py-1 group">
                            Process
                            <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-[#F5CA53] transition-all duration-300 group-hover:w-full" />
                        </Link>
                        <Link href="#categories" className="hover:text-[#F5CA53] transition-colors relative py-1 group">
                            Shops &amp; Fabrics
                            <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-[#F5CA53] transition-all duration-300 group-hover:w-full" />
                        </Link>
                    </nav>

                    {/* Right User Actions */}
                    <div className="flex items-center space-x-3">
                        <Link
                            href="/client/home"
                            className="hidden sm:inline-flex px-3.5 py-2 text-xs font-bold text-[#F5CA53] bg-[#18191E] border border-zinc-800 hover:border-[#F5CA53] rounded-xl transition-all"
                        >
                            Client Dash &rarr;
                        </Link>
                        <Link
                            href="/tailor/home"
                            className="hidden sm:inline-flex px-3.5 py-2 text-xs font-bold text-[#F5CA53] bg-[#18191E] border border-zinc-800 hover:border-[#F5CA53] rounded-xl transition-all"
                        >
                            Seller Dash &rarr;
                        </Link>
                        <Link
                            href="/login"
                            className="px-5 py-2 text-xs font-bold uppercase tracking-wider text-black bg-[#F5CA53] rounded-xl hover:bg-[#f7d369] transition-all duration-300 shadow-[0_0_15px_rgba(245,202,83,0.3)] transform hover:scale-[1.02]"
                        >
                            Sign In
                        </Link>
                    </div>
                </div>
            </header>

            {/* HERO SECTION */}
            <section className="flex-1 flex flex-col justify-center px-4 sm:px-6 pt-12 pb-20 relative z-10 animate-fade-in-up">
                <div className="max-w-5xl w-full mx-auto space-y-12">

                    {/* Floating Bespoke Status Pill */}
                    <div className="flex justify-center">
                        <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-[#16171D] border border-[#F5CA53]/30 shadow-[0_4px_20px_rgba(245,202,83,0.15)] animate-float backdrop-blur-md">
                            <span className="w-2 h-2 rounded-full bg-[#F5CA53] animate-ping" />
                            <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#FFE28A]">
                                Verified Bespoke Marketplace
                            </span>
                        </div>
                    </div>

                    {/* Hero Headline & Subtitle */}
                    <div className="text-center space-y-4 max-w-3xl mx-auto">
                        <h1 className="text-4xl sm:text-6xl font-serif font-black tracking-tight leading-tight">
                            Crafted for Distinction. <br />
                            <span className="gold-gradient-text">Tailored for You.</span>
                        </h1>
                        <p className="text-xs sm:text-sm text-zinc-400 max-w-xl mx-auto leading-relaxed">
                            Connect directly with Sri Lanka’s premier master tailors, request bespoke suits and athletic wear, and track every stitch from consultation to delivery.
                        </p>
                    </div>

                    {/* Hero Card Container (Glassmorphic) */}
                    <div className="glass-card stitch-border rounded-[32px] p-8 sm:p-12 max-w-lg w-full mx-auto relative overflow-hidden">
                        {/* Internal Ambient Glow */}
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-24 bg-[#F5CA53]/15 blur-2xl pointer-events-none" />

                        {/* Top Tag */}
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[#FFE28A] text-center mb-2 block">
                            Atelier Gateway
                        </span>

                        {/* Card Subheading */}
                        <h2 className="text-2xl sm:text-3xl font-serif font-bold text-white text-center mb-6">
                            Welcome to FITI
                        </h2>

                        {/* Display Error if any */}
                        {error && (
                            <div className="mb-6 rounded-xl border border-rose-900/50 bg-rose-950/40 px-4 py-3 text-xs font-medium text-rose-400 text-center animate-fade-in-up">
                                {error}
                            </div>
                        )}

                        {/* Action Buttons */}
                        <div className="space-y-4 relative z-10">
                            {/* Log In Button */}
                            <Link
                                href="/login"
                                className="w-full btn-gold-shimmer text-black font-extrabold text-xs uppercase tracking-[0.2em] py-4 px-6 rounded-xl text-center block"
                            >
                                Sign In
                            </Link>

                            {/* Register Button */}
                            <Link
                                href="/register"
                                className="w-full bg-[#18191E] border border-zinc-800 hover:border-[#F5CA53]/60 text-[#F5CA53] hover:text-yellow-300 font-extrabold text-xs uppercase tracking-[0.2em] py-4 px-6 rounded-xl hover:bg-zinc-800/90 transition-all duration-300 transform hover:scale-[1.01] active:scale-[0.98] text-center block shadow-md"
                            >
                                Create Account
                            </Link>

                            {/* Divider Line */}
                            <div className="relative flex items-center justify-center my-6">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-zinc-800/90" />
                                </div>
                                <span className="relative bg-[#131418] px-4 text-[9px] font-black tracking-[0.25em] text-zinc-500 uppercase">
                                    OR CONTINUE WITH
                                </span>
                            </div>

                            {/* Google Sign In Button */}
                            <button
                                type="button"
                                onClick={handleGoogleLogin}
                                disabled={loading}
                                className="w-full bg-[#18191E] border border-zinc-800 hover:border-zinc-700 text-zinc-200 font-bold text-xs py-3.5 px-6 rounded-xl hover:bg-zinc-800/90 transition-all duration-300 flex items-center justify-center gap-3 transform hover:scale-[1.01] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
                            >
                                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                                    <path
                                        fill="#4285F4"
                                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                    />
                                    <path
                                        fill="#34A853"
                                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                    />
                                    <path
                                        fill="#FBBC05"
                                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.85z"
                                    />
                                    <path
                                        fill="#EA4335"
                                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84C6.71 7.3 9.14 5.38 12 5.38z"
                                    />
                                </svg>
                                <span>{loading ? "Authenticating..." : "Sign up with Google"}</span>
                            </button>
                        </div>
                    </div>

                    {/* FEATURE CARDS ROW WITH RICH VISUAL IMAGES & HOVER GLOWS */}
                    <div id="features" className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl w-full mx-auto pt-6">

                        {/* Card 1: Bespoke Tailoring */}
                        <div className="relative group overflow-hidden rounded-2xl border border-zinc-800/90 bg-[#121317] p-6 h-60 flex flex-col justify-end transition-all duration-500 hover:border-[#F5CA53]/60 hover:shadow-[0_15px_45px_rgba(245,202,83,0.2)] cursor-pointer transform hover:-translate-y-1">
                            <img
                                src="https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=800&q=80"
                                alt="Bespoke Precision Tailoring"
                                className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 brightness-90"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent z-10" />

                            <div className="relative z-20">
                                <span className="text-[10px] font-black tracking-[0.25em] uppercase text-[#F5CA53] mb-1 block">
                                    Craftsmanship
                                </span>
                                <h3 className="text-xl font-serif font-bold text-white tracking-wide">
                                    Precision Tailoring
                                </h3>
                                <p className="text-[11px] text-zinc-300 mt-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                    Custom measurements &amp; verified master artisans.
                                </p>
                            </div>
                        </div>

                        {/* Card 2: Performance Training */}
                        <div className="relative group overflow-hidden rounded-2xl border border-zinc-800/90 bg-[#121317] p-6 h-60 flex flex-col justify-end transition-all duration-500 hover:border-[#F5CA53]/60 hover:shadow-[0_15px_45px_rgba(245,202,83,0.2)] cursor-pointer transform hover:-translate-y-1">
                            <img
                                src="https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=800&q=80"
                                alt="Elite Performance Apparel"
                                className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 brightness-90"
                            />
                            <div className="absolute top-4 left-4 z-20 text-[9px] font-mono text-zinc-300/90 bg-black/70 backdrop-blur-md px-3 py-1 rounded-md border border-white/10">
                                FITI Performance Labs
                            </div>
                            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent z-10" />

                            <div className="relative z-20">
                                <span className="text-[10px] font-black tracking-[0.25em] uppercase text-[#F5CA53] mb-1 block">
                                    Performance
                                </span>
                                <h3 className="text-xl font-serif font-bold text-white tracking-wide">
                                    Athletic Apparel
                                </h3>
                                <p className="text-[11px] text-zinc-300 mt-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                    High-durability tailored activewear.
                                </p>
                            </div>
                        </div>

                        {/* Card 3: Exclusive Curated Shops */}
                        <div className="relative group overflow-hidden rounded-2xl border border-zinc-800/90 bg-[#121317] p-6 h-60 flex flex-col justify-end transition-all duration-500 hover:border-[#F5CA53]/60 hover:shadow-[0_15px_45px_rgba(245,202,83,0.2)] cursor-pointer transform hover:-translate-y-1">
                            <img
                                src="https://images.unsplash.com/photo-1567401893414-76b7b1e5a7a5?auto=format&fit=crop&w=800&q=80"
                                alt="Exclusive Curated Shops"
                                className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 brightness-90"
                            />
                            <div className="absolute top-4 right-4 z-20 text-[9px] font-serif font-bold tracking-widest text-[#F5CA53] bg-black/70 backdrop-blur-md px-3 py-1 rounded-md border border-[#F5CA53]/30 uppercase">
                                Verified Atelier
                            </div>
                            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent z-10" />

                            <div className="relative z-20">
                                <span className="text-[10px] font-black tracking-[0.25em] uppercase text-[#F5CA53] mb-1 block">
                                    Curated
                                </span>
                                <h3 className="text-xl font-serif font-bold text-white tracking-wide">
                                    Master Shops
                                </h3>
                                <p className="text-[11px] text-zinc-300 mt-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                    Direct access to top tailoring houses.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* STATS & METRICS DISPLAY */}
            <section className="w-full border-y border-zinc-900 bg-[#0C0D11]/90 backdrop-blur-md py-14 px-6 relative z-10">
                <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
                    <div className="space-y-1 group cursor-default">
                        <p className="text-4xl sm:text-5xl font-serif font-extrabold gold-gradient-text transition-transform duration-300 group-hover:scale-110">50+</p>
                        <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest">Verified Atelier Shops</p>
                    </div>
                    <div className="space-y-1 group cursor-default">
                        <p className="text-4xl sm:text-5xl font-serif font-extrabold gold-gradient-text transition-transform duration-300 group-hover:scale-110">1,500+</p>
                        <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest">Garments Crafted</p>
                    </div>
                    <div className="space-y-1 group cursor-default">
                        <p className="text-4xl sm:text-5xl font-serif font-extrabold gold-gradient-text transition-transform duration-300 group-hover:scale-110">4.9 ★</p>
                        <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest">Client Satisfaction</p>
                    </div>
                    <div className="space-y-1 group cursor-default">
                        <p className="text-4xl sm:text-5xl font-serif font-extrabold gold-gradient-text transition-transform duration-300 group-hover:scale-110">100%</p>
                        <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest">Precision Fit Guarantee</p>
                    </div>
                </div>
            </section>

            {/* HOW IT WORKS SECTION */}
            <section id="how-it-works" className="w-full py-24 px-6 max-w-6xl mx-auto relative z-10">
                <div className="text-center mb-16 space-y-3">
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[#F5CA53]">
                        Seamless Atelier Workflow
                    </span>
                    <h2 className="text-3xl sm:text-5xl font-serif font-bold text-white">
                        How FITI Operates
                    </h2>
                    <p className="text-xs sm:text-sm text-zinc-400 max-w-xl mx-auto leading-relaxed">
                        From custom measurement profiles to real-time tailor bids and doorstep delivery.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    {/* Step 1 */}
                    <div className="glass-card rounded-2xl p-7 relative hover:border-[#F5CA53]/60 transition-all duration-300 transform hover:-translate-y-1 group">
                        <span className="text-4xl font-serif font-black gold-gradient-text mb-4 block group-hover:scale-110 transition-transform">01</span>
                        <h4 className="text-lg font-serif font-bold text-white mb-2">Submit Request</h4>
                        <p className="text-xs text-zinc-400 leading-relaxed">
                            Specify fabric, budget, design screenshots, or voice audio notes.
                        </p>
                    </div>

                    {/* Step 2 */}
                    <div className="glass-card rounded-2xl p-7 relative hover:border-[#F5CA53]/60 transition-all duration-300 transform hover:-translate-y-1 group">
                        <span className="text-4xl font-serif font-black gold-gradient-text mb-4 block group-hover:scale-110 transition-transform">02</span>
                        <h4 className="text-lg font-serif font-bold text-white mb-2">Receive Bids</h4>
                        <p className="text-xs text-zinc-400 leading-relaxed">
                            Tailor shops submit competitive quotes and estimated turnaround times.
                        </p>
                    </div>

                    {/* Step 3 */}
                    <div className="glass-card rounded-2xl p-7 relative hover:border-[#F5CA53]/60 transition-all duration-300 transform hover:-translate-y-1 group">
                        <span className="text-4xl font-serif font-black gold-gradient-text mb-4 block group-hover:scale-110 transition-transform">03</span>
                        <h4 className="text-lg font-serif font-bold text-white mb-2">Track Stitching</h4>
                        <p className="text-xs text-zinc-400 leading-relaxed">
                            Monitor live order status updates and direct tailor consultations.
                        </p>
                    </div>

                    {/* Step 4 */}
                    <div className="glass-card rounded-2xl p-7 relative hover:border-[#F5CA53]/60 transition-all duration-300 transform hover:-translate-y-1 group">
                        <span className="text-4xl font-serif font-black gold-gradient-text mb-4 block group-hover:scale-110 transition-transform">04</span>
                        <h4 className="text-lg font-serif font-bold text-white mb-2">Bespoke Fitting</h4>
                        <p className="text-xs text-zinc-400 leading-relaxed">
                            Receive your tailor-made garment delivered directly to your doorstep.
                        </p>
                    </div>
                </div>
            </section>

            {/* CURATED CATEGORIES SECTION */}
            <section id="categories" className="w-full py-20 px-6 bg-[#0B0C0F] border-t border-zinc-900 relative z-10">
                <div className="max-w-6xl mx-auto space-y-12">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                        <div>
                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[#F5CA53] mb-2 block">
                                Craftsmanship &amp; Performance
                            </span>
                            <h2 className="text-3xl sm:text-4xl font-serif font-bold text-white">
                                Specialized Categories
                            </h2>
                        </div>
                        <Link
                            href="/register"
                            className="text-xs font-bold text-[#F5CA53] hover:underline flex items-center gap-1 group"
                        >
                            Explore Marketplace <span className="group-hover:translate-x-1 transition-transform">&rarr;</span>
                        </Link>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Category 1 */}
                        <div className="glass-card rounded-2xl p-8 hover:border-[#F5CA53]/60 transition-all duration-300 group">
                            <div className="w-14 h-14 rounded-2xl bg-[#F5CA53]/10 text-[#F5CA53] flex items-center justify-center mb-6 group-hover:bg-[#F5CA53] group-hover:text-black transition-all duration-300 shadow-[0_0_20px_rgba(245,202,83,0.15)]">
                                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-serif font-bold text-white mb-2">Bespoke Suits &amp; Tuxedos</h3>
                            <p className="text-xs text-zinc-400 leading-relaxed">
                                Made-to-measure suits crafted from fine wools for weddings, galas, and executive style.
                            </p>
                        </div>

                        {/* Category 2 */}
                        <div className="glass-card rounded-2xl p-8 hover:border-[#F5CA53]/60 transition-all duration-300 group">
                            <div className="w-14 h-14 rounded-2xl bg-[#F5CA53]/10 text-[#F5CA53] flex items-center justify-center mb-6 group-hover:bg-[#F5CA53] group-hover:text-black transition-all duration-300 shadow-[0_0_20px_rgba(245,202,83,0.15)]">
                                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-serif font-bold text-white mb-2">Athletic Performance</h3>
                            <p className="text-xs text-zinc-400 leading-relaxed">
                                Custom fitness gear engineered for movement, durability, and high-performance training.
                            </p>
                        </div>

                        {/* Category 3 */}
                        <div className="glass-card rounded-2xl p-8 hover:border-[#F5CA53]/60 transition-all duration-300 group">
                            <div className="w-14 h-14 rounded-2xl bg-[#F5CA53]/10 text-[#F5CA53] flex items-center justify-center mb-6 group-hover:bg-[#F5CA53] group-hover:text-black transition-all duration-300 shadow-[0_0_20px_rgba(245,202,83,0.15)]">
                                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-serif font-bold text-white mb-2">Master Tailor Shops</h3>
                            <p className="text-xs text-zinc-400 leading-relaxed">
                                Verified artisan houses offering custom alterations, alterations, and consultations.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* CALL TO ACTION BANNER */}
            <section className="w-full py-20 px-6 relative z-10">
                <div className="max-w-5xl mx-auto rounded-[36px] border border-[#F5CA53]/40 bg-gradient-to-br from-[#16171D] via-[#111216] to-[#0A0B0E] p-10 sm:p-16 text-center relative overflow-hidden shadow-[0_25px_60px_rgba(0,0,0,0.9)] glass-card">
                    <div className="absolute top-0 right-0 w-80 h-80 bg-[#F5CA53]/15 blur-3xl rounded-full pointer-events-none animate-pulse-glow" />

                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[#F5CA53] mb-3 block">
                        Join Sri Lanka's Atelier Platform
                    </span>
                    <h2 className="text-3xl sm:text-5xl font-serif font-bold text-white tracking-tight mb-4">
                        Ready to Experience Bespoke Luxury?
                    </h2>
                    <p className="text-xs sm:text-sm text-zinc-400 max-w-xl mx-auto mb-10 leading-relaxed">
                        Register as a client to order custom garments, or join as a verified tailor shop to showcase your artistry.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Link
                            href="/register"
                            className="w-full sm:w-auto btn-gold-shimmer text-black font-extrabold text-xs uppercase tracking-widest py-4 px-8 rounded-xl block"
                        >
                            Get Started as Client
                        </Link>
                        <Link
                            href="/register"
                            className="w-full sm:w-auto bg-transparent border border-zinc-700 hover:border-[#F5CA53] text-[#F5CA53] font-bold text-xs uppercase tracking-widest py-4 px-8 rounded-xl hover:bg-[#F5CA53]/10 transition-all duration-300 block"
                        >
                            Join as Tailor Shop
                        </Link>
                    </div>
                </div>
            </section>

            {/* BOTTOM FOOTER */}
            <footer className="w-full border-t border-zinc-900/80 bg-[#0A0B0E] py-8 px-6 sm:px-12 relative z-20">
                <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex flex-col sm:flex-row items-center sm:space-x-4 space-y-1 sm:space-y-0 text-center sm:text-left">
                        <span className="text-base font-serif font-black tracking-widest gold-gradient-text">
                            FITI
                        </span>
                        <span className="text-[11px] text-zinc-500">
                            &copy; {new Date().getFullYear()} FITI Bespoke Fitness &amp; Tailoring. All rights reserved.
                        </span>
                    </div>

                    <div className="flex items-center space-x-6 text-xs text-zinc-400">
                        <Link href="/privacy" className="hover:text-white transition-colors">
                            Privacy Policy
                        </Link>
                        <Link href="/terms" className="hover:text-white transition-colors">
                            Terms of Service
                        </Link>
                        <Link href="/contact" className="hover:text-white transition-colors">
                            Contact Us
                        </Link>
                    </div>
                </div>
            </footer>
        </div>
    );
}
