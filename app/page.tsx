"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FirebaseError } from "firebase/app";
import { signInWithPopup } from "firebase/auth";

import { FitiApiError } from "@/lib/api/client";
import { getMyRole } from "@/lib/api/endpoints/auth";
import { useAuth } from "@/lib/firebase/AuthContext";
import { auth, googleProvider } from "@/lib/firebase/config";
import ThemeToggle from "@/components/ThemeToggle";
import Logo from "@/components/Logo";

// --- DATA STRUCTURES FOR FITI TEXTILE & TAILORING E-COMMERCE ---

const HERO_SLIDES = [
    {
        tag: "NEW BESPOKE COLLECTION 2026",
        title: "Live Beautifully. Every Day.",
        subtitle: "Curated luxury fabrics and elite tailor craftsmanship for the modern lifestyle. Quality, comfort & elegance — all in one place.",
        primaryCta: "Shop Fabrics",
        primaryLink: "/register",
        secondaryCta: "Explore Tailors",
        secondaryLink: "/tailors",
        image: "/images/orders/navy_double_suit.jpg",
    },
    {
        tag: "ITALIAN WOOL & SILK EDIT",
        title: "Crafted Elegance. Pure Distinction.",
        subtitle: "Experience Super 150s wools, pure silk velvet, and Egyptian Giza cottons sourced directly from world-renowned textile mills.",
        primaryCta: "Start Custom Order",
        primaryLink: "/register",
        secondaryCta: "View Fabrics",
        secondaryLink: "#fabrics",
        image: "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=1600&q=88",
    },
    {
        tag: "MASTER ARTISAN NETWORK",
        title: "Tailored Specifically For You.",
        subtitle: "Connect directly with verified master ateliers across Sri Lanka. Compare proposals, refine measurements, and track your fitting.",
        primaryCta: "Find an Atelier",
        primaryLink: "/tailors",
        secondaryCta: "How It Works",
        secondaryLink: "#process",
        image: "https://images.unsplash.com/photo-1617137968427-85924c800a22?auto=format&fit=crop&w=1600&q=88",
    },
];

const CATEGORIES = [
    { name: "New Arrivals", badge: "NEW", img: "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=400&q=80" },
    { name: "Fine Wool", img: "/images/orders/navy_double_suit.jpg" },
    { name: "Italian Silk", img: "https://images.unsplash.com/photo-1598033129183-c4f50c736f10?auto=format&fit=crop&w=400&q=80" },
    { name: "Pure Linen", img: "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=400&q=80" },
    { name: "Cashmere Coats", img: "https://images.unsplash.com/photo-1617137968427-85924c800a22?auto=format&fit=crop&w=400&q=80" },
    { name: "Custom Shirts", img: "https://images.unsplash.com/photo-1598033129183-c4f50c736f10?auto=format&fit=crop&w=400&q=80" },
    { name: "Suit Accessories", img: "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=400&q=80" },
    { name: "Bespoke Suits", img: "/images/orders/cashmere_belted_coat.jpg" },
];

const PROCESS_STEPS = [
    { number: "01", title: "Describe the garment", text: "Share style preferences, fabric choices, budget, and timeline." },
    { number: "02", title: "Compare proposals", text: "Review offers from verified ateliers before choosing your maker." },
    { number: "03", title: "Refine the fit", text: "Discuss measurements and fittings directly with your tailor." },
    { number: "04", title: "Follow the making", text: "Track your commission from accepted proposal through final delivery." },
];

const FAQS = [
    { question: "Can I supply my own fabric?", answer: "Yes. Select client-provided fabric when posting your request and include cloth details in your brief." },
    { question: "Are fittings remote or in person?", answer: "Both options are supported. Choose online consultation or a physical atelier visit." },
    { question: "How do I choose a tailor?", answer: "Compare proposals, portfolios, pricing, and ratings from verified master ateliers." },
    { question: "What happens after I post a request?", answer: "Matching ateliers review your brief and send competitive proposals directly to your dashboard." },
];

export default function HomePage() {
    const router = useRouter();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const { setRole } = useAuth();
    const [currentSlide, setCurrentSlide] = useState(0);
    const [openFaq, setOpenFaq] = useState<number | null>(0);

    // Auto-advance hero carousel
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % HERO_SLIDES.length);
        }, 6000);
        return () => clearInterval(timer);
    }, []);

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
            if (
                err instanceof FirebaseError &&
                err.code !== "auth/popup-closed-by-user" &&
                err.code !== "auth/cancelled-popup-request"
            ) {
                setError("Google sign-in failed. Check your connection and try again.");
            } else if (!(err instanceof FirebaseError)) {
                setError("Sign-in could not be completed. Please try again.");
            }
        } finally {
            setLoading(false);
        }
    };

    const slide = HERO_SLIDES[currentSlide];

    return (
        <div className="min-h-screen relative font-sans text-earth-text selection:bg-accent selection:text-cream-bg bg-warm-beige">

            {/* -------------------------------------------------------------
             * HEADER NAVIGATION BAR (FLOATING GLASS NAV WITH LOGO)
             * ------------------------------------------------------------- */}
            <header className="sticky top-0 z-50 w-full bg-cream-bg/90 backdrop-blur-md border-b border-accent/40 shadow-xs transition-all">
                <div className="max-w-[1440px] mx-auto px-4 sm:px-8 lg:px-12 h-20 flex items-center justify-between gap-4">

                    {/* Logo & Main Nav */}
                    <div className="flex items-center gap-8 lg:gap-12">
                        <Link href="/" className="flex items-center gap-2 group">
                            <Logo
                                width={180}
                                height={60}
                                priority
                                className="h-10 sm:h-12 w-auto object-contain transition-transform group-hover:scale-105"
                            />
                        </Link>

                        <nav className="hidden xl:flex items-center gap-7 text-xs font-semibold text-earth-text tracking-wide">
                            <div className="relative group cursor-pointer flex items-center gap-1 hover:text-accent transition-colors">
                                <span>Shop</span>
                                <svg className="w-3.5 h-3.5 text-accent group-hover:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                            </div>
                            <div className="relative group cursor-pointer flex items-center gap-1 hover:text-accent transition-colors">
                                <span>Categories</span>
                                <svg className="w-3.5 h-3.5 text-accent group-hover:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                            </div>
                            <Link href="#fabrics" className="hover:text-accent transition-colors">Fabrics</Link>
                            <Link href="/tailors" className="hover:text-accent transition-colors">Ateliers</Link>
                            <Link href="#process" className="hover:text-accent transition-colors">How It Works</Link>
                        </nav>
                    </div>


                    {/* Right Utility Navigation */}
                    <div className="flex items-center gap-3 sm:gap-4">
                        <ThemeToggle />
                        <Link
                            href="/login"
                            className="bg-accent hover:bg-earth-text text-cream-bg text-xs font-semibold px-5 py-2.5 rounded-full transition-all shadow-xs hover:shadow-md cursor-pointer"
                        >
                            Start Request
                        </Link>
                    </div>
                </div>
            </header>

            {/* -------------------------------------------------------------
             * MAIN CONTENT WRAPPER WITH FOREGROUND Z-INDEX
             * ------------------------------------------------------------- */}
            <main className="relative z-10 max-w-[1440px] mx-auto px-4 sm:px-8 lg:px-12 pt-8 pb-24 space-y-12 sm:space-y-16">

                {/* ---------------------------------------------------------
                 * 1. HERO CAROUSEL BANNER (LOGIN STYLE FLOATING CONTAINER WITH TORN PAPER EDGE)
                 * --------------------------------------------------------- */}
                <section className="relative w-full rounded-3xl bg-cream-bg overflow-hidden border border-accent/40 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.5)] min-h-[500px] lg:min-h-[560px] grid grid-cols-1 lg:grid-cols-12 items-stretch">

                    {/* LEFT COLUMN: HERO CONTENT WITH TORN PAPER SVG */}
                    <div className="lg:col-span-6 p-8 sm:p-12 lg:p-16 flex flex-col justify-between relative z-20 bg-cream-bg">

                        {/* TORN PAPER SVG EDGE */}
                        <svg
                            className="absolute top-0 -right-7 h-full w-8 z-30 text-cream-bg fill-current hidden lg:block pointer-events-none drop-shadow-[4px_0_6px_rgba(0,0,0,0.15)]"
                            viewBox="0 0 30 600"
                            preserveAspectRatio="none"
                        >
                            <path d="M0,0 L0,600 L14,600 Q2,570 20,540 Q6,510 24,480 Q4,450 18,420 Q28,390 10,360 Q2,330 22,300 Q8,270 26,240 Q4,210 18,180 Q28,150 10,120 Q0,90 22,60 Q8,30 26,0 Z" />
                        </svg>

                        <div>
                            <div className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.25em] text-accent mb-4">
                                <span className="h-2 w-2 rounded-full bg-accent" />
                                {slide.tag}
                            </div>

                            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-light text-earth-text leading-[1.1] tracking-tight mb-6">
                                {slide.title.split('.')[0]}.
                                {slide.title.split('.')[1] && (
                                    <span className="block font-black text-earth-text">{slide.title.split('.')[1]}.</span>
                                )}
                            </h1>

                            <p className="text-xs sm:text-sm text-earth-text/90 leading-relaxed max-w-md font-medium mb-8">
                                {slide.subtitle}
                            </p>

                            {error && (
                                <div className="mb-6 rounded-xl border border-rose-400 bg-rose-100 px-4 py-3 text-xs text-rose-900 font-semibold">
                                    {error}
                                </div>
                            )}

                            {/* Action Buttons */}
                            <div className="flex flex-wrap items-center gap-4">
                                <Link
                                    href={slide.primaryLink}
                                    className="bg-accent hover:bg-earth-text text-cream-bg text-xs font-bold px-7 py-3.5 rounded-full transition-all flex items-center gap-2 group shadow-md"
                                >
                                    <span>{slide.primaryCta}</span>
                                    <span className="group-hover:translate-x-1 transition-transform">→</span>
                                </Link>

                                <Link
                                    href={slide.secondaryLink}
                                    className="bg-card-bg hover:bg-accent hover:text-cream-bg text-earth-text border border-accent/50 text-xs font-bold px-7 py-3.5 rounded-full transition-all shadow-xs"
                                >
                                    {slide.secondaryCta}
                                </Link>

                                <button
                                    type="button"
                                    onClick={handleGoogleLogin}
                                    disabled={loading}
                                    className="bg-cream-bg hover:bg-accent hover:text-cream-bg text-earth-text border border-accent text-xs font-bold px-5 py-3.5 rounded-full transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                                >
                                    <span className="w-4 h-4 rounded-full bg-accent text-[10px] font-black text-cream-bg flex items-center justify-center">G</span>
                                    <span>{loading ? "Connecting..." : "Quick Google Sign In"}</span>
                                </button>
                            </div>
                        </div>

                        {/* Slide Switcher Dots */}
                        <div className="flex items-center gap-2 mt-8">
                            {HERO_SLIDES.map((_, idx) => (
                                <button
                                    key={idx}
                                    type="button"
                                    onClick={() => setCurrentSlide(idx)}
                                    aria-label={`Go to slide ${idx + 1}`}
                                    className={`h-2 rounded-full transition-all cursor-pointer ${currentSlide === idx ? "w-8 bg-earth-text" : "w-2 bg-accent/40 hover:bg-accent"
                                        }`}
                                />
                            ))}
                        </div>
                    </div>

                    {/* RIGHT COLUMN: HERO SLIDE IMAGE */}
                    <div className="lg:col-span-6 relative h-[320px] sm:h-[420px] lg:h-full min-h-[480px] w-full overflow-hidden">
                        <Image
                            src={slide.image}
                            alt="FITI Bespoke Textile & Suit"
                            fill
                            priority
                            sizes="(min-width: 1024px) 50vw, 100vw"
                            className="object-cover object-center transition-all duration-1000 ease-out"
                        />

                        {/* Floating Navigation Controls */}
                        <div className="absolute inset-y-0 inset-x-4 flex items-center justify-between pointer-events-none">
                            <button
                                type="button"
                                onClick={() => setCurrentSlide((prev) => (prev === 0 ? HERO_SLIDES.length - 1 : prev - 1))}
                                aria-label="Previous slide"
                                className="p-3 rounded-full bg-cream-bg/90 backdrop-blur-md text-earth-text hover:bg-accent hover:text-cream-bg transition-all shadow-md pointer-events-auto cursor-pointer"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" /></svg>
                            </button>
                            <button
                                type="button"
                                onClick={() => setCurrentSlide((prev) => (prev + 1) % HERO_SLIDES.length)}
                                aria-label="Next slide"
                                className="p-3 rounded-full bg-cream-bg/90 backdrop-blur-md text-earth-text hover:bg-accent hover:text-cream-bg transition-all shadow-md pointer-events-auto cursor-pointer"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" /></svg>
                            </button>
                        </div>
                    </div>

                </section>

                {/* ---------------------------------------------------------
                 * 2. TRUST / VALUE PROPOSITION BAR (SAGE GREEN CARD BG)
                 * --------------------------------------------------------- */}
                <section className="w-full bg-card-bg border border-accent/40 rounded-2xl p-6 sm:p-8 shadow-md">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-center sm:text-left">

                        <div className="flex items-center gap-4 px-2">
                            <div className="w-12 h-12 rounded-full bg-cream-bg flex items-center justify-center shrink-0 border border-accent text-accent shadow-2xs">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" /></svg>
                            </div>
                            <div>
                                <h3 className="text-xs font-bold text-earth-text">Express Swatch Delivery</h3>
                                <p className="text-[11px] text-earth-text/80 mt-0.5 font-medium">Fabric samples sent to your door</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-4 px-2">
                            <div className="w-12 h-12 rounded-full bg-cream-bg flex items-center justify-center shrink-0 border border-accent text-accent shadow-2xs">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                            </div>
                            <div>
                                <h3 className="text-xs font-bold text-earth-text">30-Day Fit Guarantee</h3>
                                <p className="text-[11px] text-earth-text/80 mt-0.5 font-medium">Complimentary alteration policy</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-4 px-2">
                            <div className="w-12 h-12 rounded-full bg-cream-bg flex items-center justify-center shrink-0 border border-accent text-accent shadow-2xs">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                            </div>
                            <div>
                                <h3 className="text-xs font-bold text-earth-text">Verified Master Ateliers</h3>
                                <p className="text-[11px] text-earth-text/80 mt-0.5 font-medium">100% hand-picked tailors</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-4 px-2">
                            <div className="w-12 h-12 rounded-full bg-cream-bg flex items-center justify-center shrink-0 border border-accent text-accent shadow-2xs">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                            </div>
                            <div>
                                <h3 className="text-xs font-bold text-earth-text">Personal Styling Concierge</h3>
                                <p className="text-[11px] text-earth-text/80 mt-0.5 font-medium">Direct fitting &amp; fabric support</p>
                            </div>
                        </div>

                    </div>
                </section>

                {/* ---------------------------------------------------------
                 * 3. CIRCULAR CATEGORIES CAROUSEL
                 * --------------------------------------------------------- */}
                <section className="w-full bg-cream-bg/95 p-6 rounded-2xl border border-accent/40 shadow-xs">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-lg font-bold text-earth-text tracking-tight">Explore Categories</h2>
                        <Link href="/register" className="text-xs font-bold text-accent hover:text-earth-text flex items-center gap-1 transition-colors">
                            <span>View All Categories</span>
                            <span>→</span>
                        </Link>
                    </div>

                    <div className="grid grid-cols-4 sm:grid-cols-4 md:grid-cols-8 gap-4 sm:gap-6 text-center">
                        {CATEGORIES.map((cat, idx) => (
                            <div key={idx} className="group cursor-pointer flex flex-col items-center">
                                <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden border-2 border-accent group-hover:border-earth-text p-0.5 transition-all duration-300 shadow-2xs mb-2">
                                    <div className="relative w-full h-full rounded-full overflow-hidden bg-card-bg">
                                        <Image
                                            src={cat.img}
                                            alt={cat.name}
                                            fill
                                            sizes="80px"
                                            className="object-cover group-hover:scale-110 transition-transform duration-500"
                                        />
                                    </div>
                                    {cat.badge && (
                                        <span className="absolute bottom-0 left-1/2 -translate-x-1/2 bg-accent text-cream-bg text-[8px] font-black uppercase px-2 py-0.5 rounded-full shadow-xs">
                                            {cat.badge}
                                        </span>
                                    )}
                                </div>
                                <span className="text-[11px] font-semibold text-earth-text group-hover:text-accent transition-colors leading-tight">
                                    {cat.name}
                                </span>
                            </div>
                        ))}
                    </div>
                </section>

                {/* ---------------------------------------------------------
                 * 4. PROMOTIONAL GRID (SAGE GREEN BG CARDS)
                 * --------------------------------------------------------- */}
                <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

                    {/* Card 1: New Arrivals */}
                    <div className="bg-card-bg border border-accent/40 rounded-2xl p-6 flex flex-col justify-between relative overflow-hidden group hover:shadow-lg transition-all h-[280px]">
                        <div className="z-10 max-w-[60%]">
                            <h3 className="text-lg font-bold text-earth-text leading-snug">New Arrivals</h3>
                            <p className="text-[11px] text-earth-text/80 mt-1 font-medium">Discover the latest imported luxury weaves.</p>
                            <Link href="/register" className="inline-flex items-center gap-1 text-xs font-bold text-earth-text mt-4 hover:text-accent">
                                <span>Shop Now</span>
                                <span>→</span>
                            </Link>
                        </div>
                        <div className="absolute right-0 bottom-0 w-36 h-48 overflow-hidden rounded-tl-2xl border-l border-t border-accent/30">
                            <Image
                                src="/images/orders/navy_double_suit.jpg"
                                alt="New Arrivals"
                                fill
                                sizes="144px"
                                priority
                                className="object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                        </div>
                    </div>

                    {/* Card 2: Trending Now */}
                    <div className="bg-card-bg border border-accent/40 rounded-2xl p-6 flex flex-col justify-between relative overflow-hidden group hover:shadow-lg transition-all h-[280px]">
                        <div className="z-10 max-w-[60%]">
                            <h3 className="text-lg font-bold text-earth-text leading-snug">Trending Now</h3>
                            <p className="text-[11px] text-earth-text/80 mt-1 font-medium">Shop our most loved bespoke suit cuts.</p>
                            <Link href="/register" className="inline-flex items-center gap-1 text-xs font-bold text-earth-text mt-4 hover:text-accent">
                                <span>Shop Now</span>
                                <span>→</span>
                            </Link>
                        </div>
                        <div className="absolute right-0 bottom-0 w-36 h-48 overflow-hidden rounded-tl-2xl border-l border-t border-accent/30">
                            <Image
                                src="https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=600&q=80"
                                alt="Trending Tailoring"
                                fill
                                sizes="144px"
                                className="object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                        </div>
                    </div>

                    {/* Card 3: Best Sellers */}
                    <div className="bg-card-bg border border-accent/40 rounded-2xl p-6 flex flex-col justify-between relative overflow-hidden group hover:shadow-lg transition-all h-[280px]">
                        <div className="z-10 max-w-[60%]">
                            <h3 className="text-lg font-bold text-earth-text leading-snug">Best Sellers</h3>
                            <p className="text-[11px] text-earth-text/80 mt-1 font-medium">Customer favorite fabrics worth buying.</p>
                            <Link href="/register" className="inline-flex items-center gap-1 text-xs font-bold text-earth-text mt-4 hover:text-accent">
                                <span>Shop Now</span>
                                <span>→</span>
                            </Link>
                        </div>
                        <div className="absolute right-0 bottom-0 w-36 h-48 overflow-hidden rounded-tl-2xl border-l border-t border-accent/30">
                            <Image
                                src="https://images.unsplash.com/photo-1598033129183-c4f50c736f10?auto=format&fit=crop&w=600&q=80"
                                alt="Best Sellers"
                                fill
                                sizes="144px"
                                className="object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                        </div>
                    </div>

                    {/* Card 4: Dark Promotional Card (Accent Background) */}
                    <div className="bg-accent text-cream-bg rounded-2xl p-6 flex flex-col justify-between relative overflow-hidden group shadow-lg h-[280px]">
                        <div className="z-10">
                            <span className="text-[9px] font-black uppercase tracking-[0.25em] text-cream-bg/80 block mb-2">
                                LIMITED TIME OFFER
                            </span>
                            <h3 className="text-3xl font-light leading-tight">
                                Up to <span className="font-extrabold text-cream-bg">30% Off</span>
                            </h3>
                            <p className="text-xs text-cream-bg/90 mt-2 font-medium">
                                On selected bespoke tailoring packages &amp; fabric lengths.
                            </p>
                        </div>

                        <div className="z-10 mt-6">
                            <Link
                                href="/register"
                                className="bg-cream-bg text-earth-text hover:bg-earth-text hover:text-cream-bg text-xs font-bold px-5 py-2.5 rounded-full inline-flex items-center gap-2 transition-all shadow-xs"
                            >
                                <span>Shop The Sale</span>
                                <span>→</span>
                            </Link>
                        </div>

                        <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-earth-text/30 rounded-full blur-xl pointer-events-none" />
                    </div>

                </section>

                {/* ---------------------------------------------------------
                 * 5. FEATURED COLLECTIONS GRID
                 * --------------------------------------------------------- */}
                <section className="w-full space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-2xl sm:text-3xl font-bold text-accent tracking-tight drop-shadow-xs">Featured Collections</h2>
                        <Link href="/register" className="text-xs font-bold text-card-bg hover:text-cream-bg flex items-center gap-1 transition-colors">
                            <span>View All Collections</span>
                            <span>→</span>
                        </Link>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                        {/* Left Main Large Feature Card */}
                        <div className="lg:col-span-7 bg-card-bg rounded-3xl overflow-hidden border border-accent/40 relative min-h-[380px] lg:min-h-[440px] flex flex-col justify-end p-8 sm:p-12 group shadow-lg">
                            <Image
                                src="https://images.unsplash.com/photo-1617137968427-85924c800a22?auto=format&fit=crop&w=1400&q=88"
                                alt="Bespoke Collection"
                                fill
                                sizes="(min-width: 1024px) 58vw, 100vw"
                                className="object-cover group-hover:scale-105 transition-transform duration-700 brightness-95"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-earth-text/95 via-earth-text/40 to-transparent z-10" />

                            <div className="relative z-20 max-w-md text-cream-bg">
                                <span className="text-[10px] font-black uppercase tracking-[0.25em] text-card-bg block mb-2">
                                    SUMMER BESPOKE EDIT
                                </span>
                                <h3 className="text-3xl sm:text-4xl font-light leading-tight mb-3">
                                    Effortless <span className="font-extrabold block">Essentials.</span>
                                </h3>
                                <p className="text-xs text-cream-bg/90 leading-relaxed font-medium mb-6">
                                    Light, breathable Super 150s wools &amp; pure linens made for everyday sophistication.
                                </p>
                                <Link
                                    href="/register"
                                    className="bg-accent hover:bg-cream-bg hover:text-earth-text text-cream-bg text-xs font-bold px-6 py-3 rounded-full inline-flex items-center gap-2 transition-all shadow-md"
                                >
                                    <span>Shop Now</span>
                                    <span>→</span>
                                </Link>
                            </div>
                        </div>

                        {/* Right Stacked 2 Cards */}
                        <div className="lg:col-span-5 flex flex-col gap-6">

                            {/* Top Right Card */}
                            <div className="bg-card-bg rounded-3xl p-6 sm:p-8 border border-accent/40 relative overflow-hidden flex flex-col justify-between min-h-[200px] lg:min-h-[208px] group shadow-md">
                                <div className="z-10 max-w-[65%]">
                                    <h4 className="text-lg font-bold text-earth-text">Custom Shirting</h4>
                                    <p className="text-xs text-earth-text/80 mt-1 font-medium">Egyptian Giza 87 cottons &amp; tailored fits.</p>
                                    <Link href="/register" className="inline-flex items-center gap-1 text-xs font-bold text-earth-text mt-4 hover:text-accent">
                                        <span>Shop Now</span>
                                        <span>→</span>
                                    </Link>
                                </div>
                                <div className="absolute right-0 bottom-0 w-44 h-full overflow-hidden border-l border-accent/30">
                                    <Image
                                        src="https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=600&q=80"
                                        alt="Custom Shirting"
                                        fill
                                        sizes="176px"
                                        className="object-cover object-left group-hover:scale-105 transition-transform duration-500"
                                    />
                                </div>
                            </div>

                            {/* Bottom Right Card */}
                            <div className="bg-card-bg rounded-3xl p-6 sm:p-8 border border-accent/40 relative overflow-hidden flex flex-col justify-between min-h-[200px] lg:min-h-[208px] group shadow-md">
                                <div className="z-10 max-w-[65%]">
                                    <h4 className="text-lg font-bold text-earth-text">Silk &amp; Accessories</h4>
                                    <p className="text-xs text-earth-text/80 mt-1 font-medium">Hand-rolled pocket squares &amp; ties.</p>
                                    <Link href="/register" className="inline-flex items-center gap-1 text-xs font-bold text-earth-text mt-4 hover:text-accent">
                                        <span>Shop Now</span>
                                        <span>→</span>
                                    </Link>
                                </div>
                                <div className="absolute right-0 bottom-0 w-44 h-full overflow-hidden border-l border-accent/30">
                                    <Image
                                        src="https://images.unsplash.com/photo-1598033129183-c4f50c736f10?auto=format&fit=crop&w=600&q=80"
                                        alt="Silk Accessories"
                                        fill
                                        sizes="176px"
                                        className="object-cover object-left group-hover:scale-105 transition-transform duration-500"
                                    />
                                </div>
                            </div>

                        </div>

                    </div>
                </section>

                {/* ---------------------------------------------------------
                 * 7. "QUALITY YOU CAN TRUST" ABOUT BANNER
                 * --------------------------------------------------------- */}
                <section className="w-full bg-card-bg rounded-3xl border border-accent/40 overflow-hidden shadow-lg">
                    <div className="grid grid-cols-1 lg:grid-cols-12 items-center">

                        <div className="lg:col-span-5 relative h-64 lg:h-96 w-full border-r border-accent/30">
                            <Image
                                src="https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=1000&q=88"
                                alt="Master Tailor Craftsmanship"
                                fill
                                sizes="(min-width: 1024px) 42vw, 100vw"
                                className="object-cover"
                            />
                        </div>

                        <div className="lg:col-span-7 p-8 sm:p-12 lg:p-16">
                            <span className="text-[10px] font-black uppercase tracking-[0.25em] text-earth-text/80 block mb-2">
                                ABOUT US
                            </span>
                            <h2 className="text-3xl sm:text-4xl font-light text-earth-text leading-tight mb-4">
                                Quality You Can <span className="font-extrabold">Trust.</span>
                            </h2>
                            <p className="text-xs sm:text-sm text-earth-text/90 leading-relaxed font-medium max-w-lg mb-6">
                                We believe in thoughtful design, premium materials, and garments that make a lasting difference. Every fabric length is inspected for thread density, weave integrity, and color fastness.
                            </p>
                            <Link
                                href="#process"
                                className="inline-flex items-center gap-1.5 text-xs font-bold text-earth-text hover:text-accent"
                            >
                                <span>Learn More</span>
                                <span>→</span>
                            </Link>
                        </div>

                    </div>
                </section>

                {/* ---------------------------------------------------------
                 * 8. HOW IT WORKS (COMMISSION PROCESS)
                 * --------------------------------------------------------- */}
                <section id="process" className="w-full pt-6">
                    <div className="border-b border-accent/40 pb-6 mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                        <div>
                            <span className="text-[10px] font-black uppercase tracking-[0.25em] text-earth-text/80 block mb-1">
                                FROM BRIEF TO WARDROBE
                            </span>
                            <h2 className="text-2xl sm:text-3xl font-bold text-accent tracking-tight drop-shadow-xs">
                                One Request. Four Clear Steps.
                            </h2>
                        </div>
                        <p className="text-xs text-earth-text/90 font-medium max-w-md">
                            FITI keeps fabric selection, tailor proposals, and measurement communication seamless in one place.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {PROCESS_STEPS.map((step) => (
                            <div key={step.number} className="bg-card-bg border border-accent/40 rounded-2xl p-6 flex flex-col justify-between shadow-md">
                                <div>
                                    <span className="text-3xl font-light italic text-accent block mb-4">{step.number}</span>
                                    <h3 className="text-sm font-bold text-earth-text mb-2">{step.title}</h3>
                                    <p className="text-xs text-earth-text/80 leading-relaxed font-medium">{step.text}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* ---------------------------------------------------------
                 * 9. FREQUENTLY ASKED QUESTIONS (ACCORDION)
                 * --------------------------------------------------------- */}
                <section id="faq" className="w-full bg-card-bg rounded-3xl p-8 sm:p-12 border border-accent/40 shadow-lg">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                        <div className="lg:col-span-4">
                            <span className="text-[10px] font-black uppercase tracking-[0.25em] text-accent block mb-2">
                                BEFORE YOU BEGIN
                            </span>
                            <h2 className="text-2xl sm:text-3xl font-bold text-earth-text leading-tight">
                                Questions, Clearly Answered.
                            </h2>
                        </div>

                        <div className="lg:col-span-8 space-y-4">
                            {FAQS.map((faq, idx) => {
                                const isOpen = openFaq === idx;
                                return (
                                    <div key={idx} className="bg-cream-bg border border-accent/40 rounded-2xl overflow-hidden transition-all shadow-2xs">
                                        <button
                                            type="button"
                                            onClick={() => setOpenFaq(isOpen ? null : idx)}
                                            className="w-full p-5 text-left flex items-center justify-between text-xs sm:text-sm font-bold text-earth-text cursor-pointer"
                                        >
                                            <span>{faq.question}</span>
                                            <span className="text-base text-accent">{isOpen ? "−" : "+"}</span>
                                        </button>
                                        {isOpen && (
                                            <div className="px-5 pb-5 text-xs text-earth-text/90 leading-relaxed font-medium border-t border-accent/20 mt-1 pt-3">
                                                {faq.answer}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </section>

            </main>

            {/* -------------------------------------------------------------
             * 11. MAIN SITE FOOTER
             * ------------------------------------------------------------- */}
            <footer className="relative z-10 w-full bg-cream-bg border-t border-accent/40 py-12 px-4 sm:px-8 lg:px-12 text-earth-text text-xs">
                <div className="max-w-[1440px] mx-auto grid grid-cols-1 md:grid-cols-5 gap-8 mb-12">

                    <div className="md:col-span-2 space-y-4">
                        <Logo
                            width={160}
                            height={50}
                            className="h-9 w-auto object-contain"
                        />
                        <p className="text-earth-text/80 leading-relaxed max-w-sm">
                            FITI is Sri Lanka&apos;s premier bespoke tailoring &amp; textile marketplace. Connecting clients with verified master artisans for garments crafted to perfection.
                        </p>
                    </div>

                    <div>
                        <h4 className="font-bold text-earth-text mb-4 uppercase tracking-wider text-[11px]">Shop Fabrics</h4>
                        <ul className="space-y-2.5 text-earth-text/80 font-medium">
                            <li><Link href="#fabrics" className="hover:text-accent transition-colors">Super 150s Wool</Link></li>
                            <li><Link href="#fabrics" className="hover:text-accent transition-colors">Italian Velvet &amp; Silk</Link></li>
                            <li><Link href="#fabrics" className="hover:text-accent transition-colors">Egyptian Giza Cotton</Link></li>
                            <li><Link href="#fabrics" className="hover:text-accent transition-colors">Cashmere Blends</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="font-bold text-earth-text mb-4 uppercase tracking-wider text-[11px]">Bespoke Services</h4>
                        <ul className="space-y-2.5 text-earth-text/80 font-medium">
                            <li><Link href="/tailors" className="hover:text-accent transition-colors">Find a Master Tailor</Link></li>
                            <li><Link href="#process" className="hover:text-accent transition-colors">Commission Process</Link></li>
                            <li><Link href="/register" className="hover:text-accent transition-colors">Post a Fitting Request</Link></li>
                            <li><Link href="/login" className="hover:text-accent transition-colors">Tailor Shop Portal</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="font-bold text-earth-text mb-4 uppercase tracking-wider text-[11px]">Support &amp; Legal</h4>
                        <ul className="space-y-2.5 text-earth-text/80 font-medium">
                            <li><Link href="#faq" className="hover:text-accent transition-colors">Help &amp; FAQ</Link></li>
                            <li><Link href="/privacy" className="hover:text-accent transition-colors">Privacy Policy</Link></li>
                            <li><Link href="/terms" className="hover:text-accent transition-colors">Terms of Service</Link></li>
                            <li><Link href="/contact" className="hover:text-accent transition-colors">Contact Styling Team</Link></li>
                        </ul>
                    </div>

                </div>

                <div className="max-w-[1440px] mx-auto pt-6 border-t border-accent/30 flex flex-col sm:flex-row items-center justify-between gap-4 text-earth-text/70 text-[11px] font-medium">
                    <p>© 2026 FITI Bespoke Marketplace. All rights reserved.</p>
                    <div className="flex items-center gap-6">
                        <Link href="/privacy" className="hover:text-accent transition-colors">Privacy</Link>
                        <Link href="/terms" className="hover:text-accent transition-colors">Terms</Link>
                        <Link href="/contact" className="hover:text-accent transition-colors">Contact</Link>
                    </div>
                </div>
            </footer>

        </div>
    );
}