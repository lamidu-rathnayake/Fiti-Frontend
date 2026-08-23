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
            {/* Top Navigation Bar */}
            <header className="w-full border-b border-zinc-900/80 bg-[#0A0B0E]/90 backdrop-blur-md sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-6 sm:px-12 py-5 flex items-center justify-between">
                    {/* Brand Logo */}
                    <Link
                        href="/"
                        className="text-xl sm:text-2xl font-black tracking-widest text-[#F5CA53] hover:opacity-90 transition-opacity"
                    >
                        FITI
                    </Link>

                    {/* Navigation Links */}
                    <nav className="hidden md:flex items-center space-x-10 text-xs font-semibold tracking-wider text-zinc-400">
                        <Link href="#features" className="hover:text-[#F5CA53] transition-colors">
                            Dashboard
                        </Link>
                        <Link href="#how-it-works" className="hover:text-[#F5CA53] transition-colors">
                            Orders
                        </Link>
                        <Link href="#categories" className="hover:text-[#F5CA53] transition-colors">
                            Shops
                        </Link>
                        <Link href="#tailoring" className="hover:text-[#F5CA53] transition-colors">
                            Tailoring
                        </Link>
                    </nav>

                    {/* Right User Actions */}
                    <div className="flex items-center space-x-4">
                        <Link
                            href="/login"
                            className="px-5 py-2 text-xs font-bold uppercase tracking-wider text-[#F5CA53] border border-[#F5CA53]/60 rounded-xl hover:bg-[#F5CA53]/15 hover:border-[#F5CA53] transition-all shadow-[0_0_12px_rgba(245,202,83,0.15)]"
                        >
                            Sign In
                        </Link>
                        <Link
                            href="/login"
                            className="p-2 rounded-full border border-zinc-700/80 text-zinc-400 hover:text-[#F5CA53] hover:border-[#F5CA53] transition-colors"
                            aria-label="User Account"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                                />
                            </svg>
                        </Link>
                    </div>
                </div>
            </header>

            {/* HERO SECTION */}
            <section className="flex-1 flex flex-col justify-center px-4 sm:px-6 pt-12 pb-16 relative z-10">
                {/* Background Golden Radial Ambient Glow */}
                <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[400px] bg-[#F5CA53]/10 blur-[150px] rounded-full pointer-events-none" />

                <div className="max-w-5xl w-full mx-auto space-y-10">
                    {/* Hero Card Container */}
                    <div className="bg-[#131418]/90 border border-zinc-800/90 rounded-[28px] p-8 sm:p-12 shadow-[0_25px_60px_rgba(0,0,0,0.85)] backdrop-blur-xl relative overflow-hidden max-w-xl w-full mx-auto">
                        {/* Internal Ambient Glow Accent */}
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-20 bg-[#F5CA53]/15 blur-2xl pointer-events-none" />

                        {/* Top Subtitle */}
                        <span className="text-[11px] font-extrabold uppercase tracking-[0.3em] text-[#E5C158] text-center mb-3 block">
                            Elevate Your Style
                        </span>

                        {/* Main Title */}
                        <h1 className="text-4xl sm:text-5xl font-black text-[#F5D061] text-center tracking-tight mb-8 drop-shadow-md">
                            Welcome to FITI
                        </h1>

                        {/* Display Error if any */}
                        {error && (
                            <div className="mb-6 rounded-xl border border-rose-900/50 bg-rose-950/30 px-4 py-3 text-xs font-medium text-rose-400 text-center">
                                {error}
                            </div>
                        )}

                        {/* Action Buttons */}
                        <div className="space-y-3.5 relative z-10">
                            {/* Log In Button */}
                            <Link
                                href="/login"
                                className="w-full bg-[#F5CA53] hover:bg-[#f7d369] text-black font-extrabold text-xs uppercase tracking-[0.15em] py-3.5 px-6 rounded-xl shadow-[0_4px_25px_rgba(245,202,83,0.3)] transition-all transform hover:scale-[1.01] active:scale-[0.98] text-center block"
                            >
                                Log in
                            </Link>

                            {/* Register Button */}
                            <Link
                                href="/register"
                                className="w-full bg-[#18191E] border border-zinc-800 hover:border-[#F5CA53]/50 text-[#F5CA53] hover:text-yellow-300 font-extrabold text-xs uppercase tracking-[0.15em] py-3.5 px-6 rounded-xl hover:bg-zinc-800/80 transition-all transform hover:scale-[1.01] active:scale-[0.98] text-center block"
                            >
                                Register
                            </Link>

                            {/* Divider Line */}
                            <div className="relative flex items-center justify-center my-6">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-zinc-800/90" />
                                </div>
                                <span className="relative bg-[#131418] px-4 text-[10px] font-extrabold tracking-[0.2em] text-zinc-500 uppercase">
                                    OR CONTINUE WITH
                                </span>
                            </div>

                            {/* Google Sign In */}
                            <button
                                type="button"
                                onClick={handleGoogleLogin}
                                disabled={loading}
                                className="w-full bg-[#18191E] border border-zinc-800 hover:border-zinc-700 text-zinc-200 font-bold text-xs py-3.5 px-6 rounded-xl hover:bg-zinc-800/90 transition-all flex items-center justify-center gap-3 transform hover:scale-[1.01] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
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
                                <span>{loading ? "Signing in..." : "Sign up with Google"}</span>
                            </button>
                        </div>
                    </div>

                    {/* FEATURE CARDS ROW WITH REAL VISIBLE HIGH-RES IMAGES */}
                    <div id="features" className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-5xl w-full mx-auto">
                        {/* Card 1: Bespoke Tailoring */}
                        <div className="relative group overflow-hidden rounded-2xl border border-zinc-800/80 bg-[#121317] p-6 h-52 flex flex-col justify-end transition-all duration-300 hover:border-[#F5CA53]/60 hover:shadow-[0_12px_40px_rgba(245,202,83,0.2)] cursor-pointer">
                            {/* Real Image */}
                            <img
                                src="https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=800&q=80"
                                alt="Bespoke Precision Tailoring"
                                className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 brightness-90"
                            />
                            {/* Dark Gradient Overlay for perfect typography contrast */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent z-10" />

                            {/* Text Details */}
                            <div className="relative z-20">
                                <span className="text-[10px] font-black tracking-[0.25em] uppercase text-[#F5CA53] mb-1 block">
                                    Bespoke
                                </span>
                                <h3 className="text-xl font-bold text-white tracking-wide">
                                    Precision Tailoring
                                </h3>
                            </div>
                        </div>

                        {/* Card 2: Performance Training */}
                        <div className="relative group overflow-hidden rounded-2xl border border-zinc-800/80 bg-[#121317] p-6 h-52 flex flex-col justify-end transition-all duration-300 hover:border-[#F5CA53]/60 hover:shadow-[0_12px_40px_rgba(245,202,83,0.2)] cursor-pointer">
                            {/* Real Image */}
                            <img
                                src="https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=800&q=80"
                                alt="Elite Performance Training"
                                className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 brightness-90"
                            />
                            {/* Watermark Tag from user image */}
                            <div className="absolute top-4 left-4 z-20 text-[9px] font-mono text-zinc-300/80 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-md border border-white/10">
                                Welcome to FITI – Landing
                            </div>
                            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent z-10" />

                            {/* Text Details */}
                            <div className="relative z-20">
                                <span className="text-[10px] font-black tracking-[0.25em] uppercase text-[#F5CA53] mb-1 block">
                                    Performance
                                </span>
                                <h3 className="text-xl font-bold text-white tracking-wide">
                                    Elite Training
                                </h3>
                            </div>
                        </div>

                        {/* Card 3: Exclusive Curated Shops */}
                        <div className="relative group overflow-hidden rounded-2xl border border-zinc-800/80 bg-[#121317] p-6 h-52 flex flex-col justify-end transition-all duration-300 hover:border-[#F5CA53]/60 hover:shadow-[0_12px_40px_rgba(245,202,83,0.2)] cursor-pointer">
                            {/* Real Image */}
                            <img
                                src="https://images.unsplash.com/photo-1567401893414-76b7b1e5a7a5?auto=format&fit=crop&w=800&q=80"
                                alt="Exclusive Curated Shops Gieves and Hawkes"
                                className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 brightness-90"
                            />
                            {/* GIEVES & HAWKES Badge from user image */}
                            <div className="absolute top-4 right-4 z-20 text-[9px] font-serif font-bold tracking-widest text-[#F5CA53] bg-black/70 backdrop-blur-md px-2.5 py-1 rounded-md border border-[#F5CA53]/30 uppercase">
                                GIEVES &amp; HAWKES
                            </div>
                            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent z-10" />

                            {/* Text Details */}
                            <div className="relative z-20">
                                <span className="text-[10px] font-black tracking-[0.25em] uppercase text-[#F5CA53] mb-1 block">
                                    Exclusive
                                </span>
                                <h3 className="text-xl font-bold text-white tracking-wide">
                                    Curated Shops
                                </h3>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* STATS & TRUST BADGES SECTION */}
            <section className="w-full border-y border-zinc-900 bg-[#0C0D11] py-12 px-6">
                <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
                    <div className="space-y-1">
                        <p className="text-3xl sm:text-4xl font-extrabold text-[#F5CA53]">50+</p>
                        <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Verified Tailor Shops</p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-3xl sm:text-4xl font-extrabold text-[#F5CA53]">1,500+</p>
                        <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Custom Garments Crafted</p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-3xl sm:text-4xl font-extrabold text-[#F5CA53]">4.9 ★</p>
                        <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Client Satisfaction</p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-3xl sm:text-4xl font-extrabold text-[#F5CA53]">100%</p>
                        <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Fit Guarantee</p>
                    </div>
                </div>
            </section>

            {/* HOW IT WORKS SECTION */}
            <section id="how-it-works" className="w-full py-20 px-6 max-w-6xl mx-auto">
                <div className="text-center mb-16 space-y-3">
                    <span className="text-[11px] font-black uppercase tracking-[0.25em] text-[#F5CA53]">
                        Seamless Experience
                    </span>
                    <h2 className="text-3xl sm:text-4xl font-extrabold text-white">
                        How FITI Works
                    </h2>
                    <p className="text-xs sm:text-sm text-zinc-400 max-w-xl mx-auto">
                        Connecting elite clients with master tailors and premium fitness wear in four effortless steps.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    {/* Step 1 */}
                    <div className="bg-[#121317] border border-zinc-800/80 rounded-2xl p-6 relative hover:border-[#F5CA53]/40 transition-colors">
                        <span className="text-3xl font-black text-[#F5CA53]/20 mb-4 block">01</span>
                        <h4 className="text-base font-bold text-white mb-2">Explore Marketplace</h4>
                        <p className="text-xs text-zinc-400 leading-relaxed">
                            Discover curated tailor shops, luxury fabrics, and precision athletic apparel.
                        </p>
                    </div>

                    {/* Step 2 */}
                    <div className="bg-[#121317] border border-zinc-800/80 rounded-2xl p-6 relative hover:border-[#F5CA53]/40 transition-colors">
                        <span className="text-3xl font-black text-[#F5CA53]/20 mb-4 block">02</span>
                        <h4 className="text-base font-bold text-white mb-2">Submit Measurements</h4>
                        <p className="text-xs text-zinc-400 leading-relaxed">
                            Input custom measurements or request bespoke guidance directly from master artisans.
                        </p>
                    </div>

                    {/* Step 3 */}
                    <div className="bg-[#121317] border border-zinc-800/80 rounded-2xl p-6 relative hover:border-[#F5CA53]/40 transition-colors">
                        <span className="text-3xl font-black text-[#F5CA53]/20 mb-4 block">03</span>
                        <h4 className="text-base font-bold text-white mb-2">Bespoke Crafting</h4>
                        <p className="text-xs text-zinc-400 leading-relaxed">
                            Track hand-stitching progress and communicate in real-time with your designated tailor.
                        </p>
                    </div>

                    {/* Step 4 */}
                    <div className="bg-[#121317] border border-zinc-800/80 rounded-2xl p-6 relative hover:border-[#F5CA53]/40 transition-colors">
                        <span className="text-3xl font-black text-[#F5CA53]/20 mb-4 block">04</span>
                        <h4 className="text-base font-bold text-white mb-2">Guaranteed Fit</h4>
                        <p className="text-xs text-zinc-400 leading-relaxed">
                            Receive your tailor-made suit or fitness gear delivered right to your doorstep.
                        </p>
                    </div>
                </div>
            </section>

            {/* CURATED CATEGORIES SECTION */}
            <section id="categories" className="w-full py-16 px-6 bg-[#0B0C0F] border-t border-zinc-900">
                <div className="max-w-6xl mx-auto space-y-12">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                        <div>
                            <span className="text-[10px] font-black uppercase tracking-[0.25em] text-[#F5CA53] mb-2 block">
                                Craftsmanship &amp; Performance
                            </span>
                            <h2 className="text-3xl font-extrabold text-white">
                                Curated Categories
                            </h2>
                        </div>
                        <Link
                            href="/register"
                            className="text-xs font-bold text-[#F5CA53] hover:underline flex items-center gap-1"
                        >
                            Explore All Categories &rarr;
                        </Link>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Category 1 */}
                        <div className="rounded-2xl border border-zinc-800/90 bg-[#121318] p-6 hover:border-[#F5CA53]/50 transition-all group">
                            <div className="w-12 h-12 rounded-xl bg-[#F5CA53]/10 text-[#F5CA53] flex items-center justify-center mb-6 group-hover:bg-[#F5CA53] group-hover:text-black transition-colors">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-bold text-white mb-2">Bespoke Suits &amp; Tuxedos</h3>
                            <p className="text-xs text-zinc-400 leading-relaxed">
                                Made-to-measure suits crafted from fine Italian &amp; British wools for gala events, weddings, and executive style.
                            </p>
                        </div>

                        {/* Category 2 */}
                        <div className="rounded-2xl border border-zinc-800/90 bg-[#121318] p-6 hover:border-[#F5CA53]/50 transition-all group">
                            <div className="w-12 h-12 rounded-xl bg-[#F5CA53]/10 text-[#F5CA53] flex items-center justify-center mb-6 group-hover:bg-[#F5CA53] group-hover:text-black transition-colors">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-bold text-white mb-2">Athletic &amp; Gym Performance</h3>
                            <p className="text-xs text-zinc-400 leading-relaxed">
                                Precision-engineered athletic gear designed for maximum movement, durability, and high-performance training.
                            </p>
                        </div>

                        {/* Category 3 */}
                        <div className="rounded-2xl border border-zinc-800/90 bg-[#121318] p-6 hover:border-[#F5CA53]/50 transition-all group">
                            <div className="w-12 h-12 rounded-xl bg-[#F5CA53]/10 text-[#F5CA53] flex items-center justify-center mb-6 group-hover:bg-[#F5CA53] group-hover:text-black transition-colors">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-bold text-white mb-2">Master Tailor Shops</h3>
                            <p className="text-xs text-zinc-400 leading-relaxed">
                                Verified bespoke artisan houses offering custom alterations, signature collections, and personalized consultations.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* CALL TO ACTION BANNER */}
            <section className="w-full py-16 px-6">
                <div className="max-w-5xl mx-auto rounded-[32px] border border-[#F5CA53]/30 bg-gradient-to-br from-[#16171D] via-[#111216] to-[#0A0B0E] p-8 sm:p-14 text-center relative overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.9)]">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-[#F5CA53]/10 blur-3xl rounded-full pointer-events-none" />
                    
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[#F5CA53] mb-3 block">
                        Start Your Journey
                    </span>
                    <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-4">
                        Ready to Elevate Your Style &amp; Performance?
                    </h2>
                    <p className="text-xs sm:text-sm text-zinc-400 max-w-xl mx-auto mb-8 leading-relaxed">
                        Join FITI today as a client to order custom garments, or register as a master tailor to showcase your craftsmanship worldwide.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Link
                            href="/register/client"
                            className="w-full sm:w-auto bg-[#F5CA53] hover:bg-[#f7d369] text-black font-extrabold text-xs uppercase tracking-widest py-3.5 px-8 rounded-xl shadow-[0_4px_20px_rgba(245,202,83,0.3)] transition-all transform hover:scale-[1.02]"
                        >
                            Get Started as Client
                        </Link>
                        <Link
                            href="/register/tailor"
                            className="w-full sm:w-auto bg-transparent border border-zinc-700 hover:border-[#F5CA53] text-[#F5CA53] font-bold text-xs uppercase tracking-widest py-3.5 px-8 rounded-xl hover:bg-[#F5CA53]/10 transition-all"
                        >
                            Join as a Tailor Shop
                        </Link>
                    </div>
                </div>
            </section>

            {/* Bottom Footer */}
            <footer className="w-full border-t border-zinc-900/80 bg-[#0A0B0E] py-7 px-6 sm:px-12 relative z-20">
                <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
                    {/* Left Footer Info */}
                    <div className="flex flex-col sm:flex-row items-center sm:space-x-4 space-y-1 sm:space-y-0 text-center sm:text-left">
                        <span className="text-sm font-black tracking-widest text-[#F5CA53]">
                            FITI
                        </span>
                        <span className="text-[11px] text-zinc-500">
                            &copy; {new Date().getFullYear()} FITI Bespoke Fitness &amp; Tailoring. All rights reserved.
                        </span>
                    </div>

                    {/* Right Footer Links */}
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
                        <Link href="/about" className="hover:text-white transition-colors">
                            About Us
                        </Link>
                    </div>
                </div>
            </footer>
        </div>
    );
}
