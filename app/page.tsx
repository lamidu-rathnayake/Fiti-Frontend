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

const BEST_SELLERS = [
    {
        id: 1,
        title: "Super 150s Wool Navy Double Suit",
        category: "Bespoke Suiting",
        price: "$389.99",
        originalPrice: "$450.00",
        rating: 5.0,
        reviews: 142,
        image: "/images/orders/navy_double_suit.jpg",
        tag: "Top Rated",
    },
    {
        id: 2,
        title: "Bespoke Cashmere Belted Coat",
        category: "Outerwear",
        price: "$420.00",
        originalPrice: "$490.00",
        rating: 4.9,
        reviews: 98,
        image: "/images/orders/cashmere_belted_coat.jpg",
        tag: "Best Seller",
    },
    {
        id: 3,
        title: "Charcoal Herringbone 3-Piece Suit",
        category: "Tailored Suiting",
        price: "$349.99",
        originalPrice: "$399.00",
        rating: 4.8,
        reviews: 76,
        image: "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=800&q=80",
        tag: "Limited",
    },
    {
        id: 4,
        title: "Pure Silk Velvet Dinner Jacket",
        category: "Evening Wear",
        price: "$299.99",
        originalPrice: "$350.00",
        rating: 4.9,
        reviews: 115,
        image: "https://images.unsplash.com/photo-1598033129183-c4f50c736f10?auto=format&fit=crop&w=800&q=80",
    },
    {
        id: 5,
        title: "Giza 87 Egyptian Cotton Shirting",
        category: "Luxury Shirting",
        price: "$89.99",
        originalPrice: "$110.00",
        rating: 4.7,
        reviews: 210,
        image: "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=800&q=80",
    },
    {
        id: 6,
        title: "Hand-Rolled Silk Pocket Square & Tie",
        category: "Accessories",
        price: "$59.99",
        originalPrice: "$75.00",
        rating: 5.0,
        reviews: 84,
        image: "https://images.unsplash.com/photo-1617137968427-85924c800a22?auto=format&fit=crop&w=800&q=80",
    },
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
    const { setRole } = useAuth();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [currentSlide, setCurrentSlide] = useState(0);
    const [searchQuery, setSearchQuery] = useState("");
    const [wishlist, setWishlist] = useState<number[]>([1, 4]);
    const [openFaq, setOpenFaq] = useState<number | null>(0);

    // Auto-advance hero carousel
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % HERO_SLIDES.length);
        }, 6000);
        return () => clearInterval(timer);
    }, []);

    const toggleWishlist = (id: number) => {
        setWishlist((prev) =>
            prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
        );
    };

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
        <div className="min-h-screen relative font-sans text-[#4e220f] selection:bg-[#9d6638] selection:text-[#f7f1de] bg-[#f7f1e1]">

            {/* -------------------------------------------------------------
             * FULL BACKGROUND PHOTO WITH DARK OVERLAY & BACKDROP BLUR
             * (Matches Login Page Background Style)
             * ------------------------------------------------------------- */}
            {/* <div className="fixed inset-0 z-0 pointer-events-none">
                <Image
                    src="/images/orders/navy_double_suit.jpg"
                    alt="FITI Bespoke Atelier Background"
                    fill
                    className="object-cover brightness-[0.4] scale-105"
                    priority
                />
                <div className="absolute inset-0 bg-[#4e220f]/30 backdrop-blur-[4px]" />
            </div> */}

            {/* -------------------------------------------------------------
             * HEADER NAVIGATION BAR (FLOATING GLASS NAV WITH LOGO)
             * ------------------------------------------------------------- */}
            <header className="sticky top-0 z-50 w-full bg-[#f7f1de]/90 backdrop-blur-md border-b border-[#9d6638]/40 shadow-sm transition-all">
                <div className="max-w-[1440px] mx-auto px-4 sm:px-8 lg:px-12 h-20 flex items-center justify-between gap-4">

                    {/* Logo & Main Nav */}
                    <div className="flex items-center gap-8 lg:gap-12">
                        <Link href="/" className="flex items-center gap-2 group">
                            <Image
                                src="/logo_light.png"
                                alt="FITI Atelier"
                                width={180}
                                height={60}
                                priority
                                className="h-10 sm:h-12 w-auto object-contain transition-transform group-hover:scale-105"
                            />
                        </Link>

                        <nav className="hidden xl:flex items-center gap-7 text-xs font-semibold text-[#4e220f] tracking-wide">
                            <div className="relative group cursor-pointer flex items-center gap-1 hover:text-[#9d6638] transition-colors">
                                <span>Shop</span>
                                <svg className="w-3.5 h-3.5 text-[#9d6638] group-hover:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                            </div>
                            <div className="relative group cursor-pointer flex items-center gap-1 hover:text-[#9d6638] transition-colors">
                                <span>Categories</span>
                                <svg className="w-3.5 h-3.5 text-[#9d6638] group-hover:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                            </div>
                            <Link href="#fabrics" className="hover:text-[#9d6638] transition-colors">Fabrics</Link>
                            <Link href="/tailors" className="hover:text-[#9d6638] transition-colors">Ateliers</Link>
                            <Link href="#process" className="hover:text-[#9d6638] transition-colors">How It Works</Link>
                        </nav>
                    </div>

                    {/* Center Search Input */}
                    <div className="hidden md:flex flex-1 max-w-md mx-4">
                        <div className="relative w-full">
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search for fabrics, tailors, custom suits..."
                                className="w-full bg-[#B0BA99] border border-[#9d6638]/50 rounded-full py-2.5 pl-5 pr-11 text-xs text-[#4e220f] placeholder-[#4e220f]/60 focus:outline-none focus:border-[#4e220f] shadow-xs transition-all"
                            />
                            <button type="button" aria-label="Search" className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#4e220f] hover:text-[#9d6638] transition-colors">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                            </button>
                        </div>
                    </div>

                    {/* Right Utility Navigation */}
                    <div className="flex items-center gap-4 sm:gap-6">

                        <Link
                            href="/login"
                            className="bg-[#9d6638] hover:bg-[#4e220f] text-[#f7f1de] text-xs font-semibold px-5 py-2.5 rounded-full transition-all shadow-xs hover:shadow-md cursor-pointer ml-1"
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
                <section className="relative w-full rounded-3xl bg-[#f7f1de] overflow-hidden border border-[#9d6638]/40 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.5)] min-h-[500px] lg:min-h-[560px] grid grid-cols-1 lg:grid-cols-12 items-stretch">

                    {/* LEFT COLUMN: HERO CONTENT WITH TORN PAPER SVG */}
                    <div className="lg:col-span-6 p-8 sm:p-12 lg:p-16 flex flex-col justify-between relative z-20 bg-[#f7f1de]">

                        {/* TORN PAPER SVG EDGE */}
                        <svg
                            className="absolute top-0 -right-7 h-full w-8 z-30 text-[#f7f1de] fill-current hidden lg:block pointer-events-none drop-shadow-[4px_0_6px_rgba(0,0,0,0.15)]"
                            viewBox="0 0 30 600"
                            preserveAspectRatio="none"
                        >
                            <path d="M0,0 L0,600 L14,600 Q2,570 20,540 Q6,510 24,480 Q4,450 18,420 Q28,390 10,360 Q2,330 22,300 Q8,270 26,240 Q4,210 18,180 Q28,150 10,120 Q0,90 22,60 Q8,30 26,0 Z" />
                        </svg>

                        <div>
                            <div className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.25em] text-[#9d6638] mb-4">
                                <span className="h-2 w-2 rounded-full bg-[#9d6638]" />
                                {slide.tag}
                            </div>

                            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-light text-[#4e220f] leading-[1.1] tracking-tight mb-6">
                                {slide.title.split('.')[0]}.
                                {slide.title.split('.')[1] && (
                                    <span className="block font-black text-[#4e220f]">{slide.title.split('.')[1]}.</span>
                                )}
                            </h1>

                            <p className="text-xs sm:text-sm text-[#4e220f]/90 leading-relaxed max-w-md font-medium mb-8">
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
                                    className="bg-[#9d6638] hover:bg-[#4e220f] text-[#f7f1de] text-xs font-bold px-7 py-3.5 rounded-full transition-all flex items-center gap-2 group shadow-md"
                                >
                                    <span>{slide.primaryCta}</span>
                                    <span className="group-hover:translate-x-1 transition-transform">→</span>
                                </Link>

                                <Link
                                    href={slide.secondaryLink}
                                    className="bg-[#B0BA99] hover:bg-[#9d6638] hover:text-[#f7f1de] text-[#4e220f] border border-[#9d6638]/50 text-xs font-bold px-7 py-3.5 rounded-full transition-all shadow-xs"
                                >
                                    {slide.secondaryCta}
                                </Link>

                                <button
                                    type="button"
                                    onClick={handleGoogleLogin}
                                    disabled={loading}
                                    className="bg-[#f7f1de] hover:bg-[#9d6638] hover:text-[#f7f1de] text-[#4e220f] border border-[#9d6638] text-xs font-bold px-5 py-3.5 rounded-full transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                                >
                                    <span className="w-4 h-4 rounded-full bg-[#9d6638] text-[10px] font-black text-[#f7f1de] flex items-center justify-center">G</span>
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
                                    className={`h-2 rounded-full transition-all cursor-pointer ${currentSlide === idx ? "w-8 bg-[#4e220f]" : "w-2 bg-[#9d6638]/40 hover:bg-[#9d6638]"
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
                                className="p-3 rounded-full bg-[#f7f1de]/90 backdrop-blur-md text-[#4e220f] hover:bg-[#9d6638] hover:text-[#f7f1de] transition-all shadow-md pointer-events-auto cursor-pointer"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" /></svg>
                            </button>
                            <button
                                type="button"
                                onClick={() => setCurrentSlide((prev) => (prev + 1) % HERO_SLIDES.length)}
                                aria-label="Next slide"
                                className="p-3 rounded-full bg-[#f7f1de]/90 backdrop-blur-md text-[#4e220f] hover:bg-[#9d6638] hover:text-[#f7f1de] transition-all shadow-md pointer-events-auto cursor-pointer"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" /></svg>
                            </button>
                        </div>
                    </div>

                </section>

                {/* ---------------------------------------------------------
                 * 2. TRUST / VALUE PROPOSITION BAR (SAGE GREEN CARD BG #B0BA99)
                 * --------------------------------------------------------- */}
                <section className="w-full bg-[#B0BA99] border border-[#9d6638]/40 rounded-2xl p-6 sm:p-8 shadow-md">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-center sm:text-left">

                        <div className="flex items-center gap-4 px-2">
                            <div className="w-12 h-12 rounded-full bg-[#f7f1de] flex items-center justify-center shrink-0 border border-[#9d6638] text-[#9d6638] shadow-2xs">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" /></svg>
                            </div>
                            <div>
                                <h3 className="text-xs font-bold text-[#4e220f]">Express Swatch Delivery</h3>
                                <p className="text-[11px] text-[#4e220f]/80 mt-0.5 font-medium">Fabric samples sent to your door</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-4 px-2">
                            <div className="w-12 h-12 rounded-full bg-[#f7f1de] flex items-center justify-center shrink-0 border border-[#9d6638] text-[#9d6638] shadow-2xs">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                            </div>
                            <div>
                                <h3 className="text-xs font-bold text-[#4e220f]">30-Day Fit Guarantee</h3>
                                <p className="text-[11px] text-[#4e220f]/80 mt-0.5 font-medium">Complimentary alteration policy</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-4 px-2">
                            <div className="w-12 h-12 rounded-full bg-[#f7f1de] flex items-center justify-center shrink-0 border border-[#9d6638] text-[#9d6638] shadow-2xs">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                            </div>
                            <div>
                                <h3 className="text-xs font-bold text-[#4e220f]">Verified Master Ateliers</h3>
                                <p className="text-[11px] text-[#4e220f]/80 mt-0.5 font-medium">100% hand-picked tailors</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-4 px-2">
                            <div className="w-12 h-12 rounded-full bg-[#f7f1de] flex items-center justify-center shrink-0 border border-[#9d6638] text-[#9d6638] shadow-2xs">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                            </div>
                            <div>
                                <h3 className="text-xs font-bold text-[#4e220f]">Personal Styling Concierge</h3>
                                <p className="text-[11px] text-[#4e220f]/80 mt-0.5 font-medium">Direct fitting &amp; fabric support</p>
                            </div>
                        </div>

                    </div>
                </section>

                {/* ---------------------------------------------------------
                 * 3. CIRCULAR CATEGORIES CAROUSEL
                 * --------------------------------------------------------- */}
                <section className="w-full bg-[#f7f1de]/95 p-6 rounded-2xl border border-[#9d6638]/40 shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-lg font-bold text-[#4e220f] tracking-tight">Explore Categories</h2>
                        <Link href="/register" className="text-xs font-bold text-[#9d6638] hover:text-[#4e220f] flex items-center gap-1 transition-colors">
                            <span>View All Categories</span>
                            <span>→</span>
                        </Link>
                    </div>

                    <div className="grid grid-cols-4 sm:grid-cols-4 md:grid-cols-8 gap-4 sm:gap-6 text-center">
                        {CATEGORIES.map((cat, idx) => (
                            <div key={idx} className="group cursor-pointer flex flex-col items-center">
                                <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden border-2 border-[#9d6638] group-hover:border-[#4e220f] p-0.5 transition-all duration-300 shadow-2xs mb-2">
                                    <div className="relative w-full h-full rounded-full overflow-hidden bg-[#B0BA99]">
                                        <Image
                                            src={cat.img}
                                            alt={cat.name}
                                            fill
                                            sizes="80px"
                                            className="object-cover group-hover:scale-110 transition-transform duration-500"
                                        />
                                    </div>
                                    {cat.badge && (
                                        <span className="absolute bottom-0 left-1/2 -translate-x-1/2 bg-[#9d6638] text-[#f7f1de] text-[8px] font-black uppercase px-2 py-0.5 rounded-full shadow-xs">
                                            {cat.badge}
                                        </span>
                                    )}
                                </div>
                                <span className="text-[11px] font-semibold text-[#4e220f] group-hover:text-[#9d6638] transition-colors leading-tight">
                                    {cat.name}
                                </span>
                            </div>
                        ))}
                    </div>
                </section>

                {/* ---------------------------------------------------------
                 * 4. PROMOTIONAL GRID (SAGE GREEN BG #B0BA99 CARDS)
                 * --------------------------------------------------------- */}
                <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

                    {/* Card 1: New Arrivals */}
                    <div className="bg-[#B0BA99] border border-[#9d6638]/40 rounded-2xl p-6 flex flex-col justify-between relative overflow-hidden group hover:shadow-lg transition-all h-[280px]">
                        <div className="z-10 max-w-[60%]">
                            <h3 className="text-lg font-bold text-[#4e220f] leading-snug">New Arrivals</h3>
                            <p className="text-[11px] text-[#4e220f]/80 mt-1 font-medium">Discover the latest imported luxury weaves.</p>
                            <Link href="/register" className="inline-flex items-center gap-1 text-xs font-bold text-[#4e220f] mt-4 hover:text-[#9d6638]">
                                <span>Shop Now</span>
                                <span>→</span>
                            </Link>
                        </div>
                        <div className="absolute right-0 bottom-0 w-36 h-48 overflow-hidden rounded-tl-2xl border-l border-t border-[#9d6638]/30">
                            <Image
                                src="/images/orders/navy_double_suit.jpg"
                                alt="New Arrivals"
                                fill
                                className="object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                        </div>
                    </div>

                    {/* Card 2: Trending Now */}
                    <div className="bg-[#B0BA99] border border-[#9d6638]/40 rounded-2xl p-6 flex flex-col justify-between relative overflow-hidden group hover:shadow-lg transition-all h-[280px]">
                        <div className="z-10 max-w-[60%]">
                            <h3 className="text-lg font-bold text-[#4e220f] leading-snug">Trending Now</h3>
                            <p className="text-[11px] text-[#4e220f]/80 mt-1 font-medium">Shop our most loved bespoke suit cuts.</p>
                            <Link href="/register" className="inline-flex items-center gap-1 text-xs font-bold text-[#4e220f] mt-4 hover:text-[#9d6638]">
                                <span>Shop Now</span>
                                <span>→</span>
                            </Link>
                        </div>
                        <div className="absolute right-0 bottom-0 w-36 h-48 overflow-hidden rounded-tl-2xl border-l border-t border-[#9d6638]/30">
                            <Image
                                src="https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=600&q=80"
                                alt="Trending Tailoring"
                                fill
                                className="object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                        </div>
                    </div>

                    {/* Card 3: Best Sellers */}
                    <div className="bg-[#B0BA99] border border-[#9d6638]/40 rounded-2xl p-6 flex flex-col justify-between relative overflow-hidden group hover:shadow-lg transition-all h-[280px]">
                        <div className="z-10 max-w-[60%]">
                            <h3 className="text-lg font-bold text-[#4e220f] leading-snug">Best Sellers</h3>
                            <p className="text-[11px] text-[#4e220f]/80 mt-1 font-medium">Customer favorite fabrics worth buying.</p>
                            <Link href="/register" className="inline-flex items-center gap-1 text-xs font-bold text-[#4e220f] mt-4 hover:text-[#9d6638]">
                                <span>Shop Now</span>
                                <span>→</span>
                            </Link>
                        </div>
                        <div className="absolute right-0 bottom-0 w-36 h-48 overflow-hidden rounded-tl-2xl border-l border-t border-[#9d6638]/30">
                            <Image
                                src="https://images.unsplash.com/photo-1598033129183-c4f50c736f10?auto=format&fit=crop&w=600&q=80"
                                alt="Best Sellers"
                                fill
                                className="object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                        </div>
                    </div>

                    {/* Card 4: Dark Promotional Card (#9d6638 Accent Background) */}
                    <div className="bg-[#9d6638] text-[#f7f1de] rounded-2xl p-6 flex flex-col justify-between relative overflow-hidden group shadow-lg h-[280px]">
                        <div className="z-10">
                            <span className="text-[9px] font-black uppercase tracking-[0.25em] text-[#f7f1de]/80 block mb-2">
                                LIMITED TIME OFFER
                            </span>
                            <h3 className="text-3xl font-light leading-tight">
                                Up to <span className="font-extrabold text-[#f7f1de]">30% Off</span>
                            </h3>
                            <p className="text-xs text-[#f7f1de]/90 mt-2 font-medium">
                                On selected bespoke tailoring packages &amp; fabric lengths.
                            </p>
                        </div>

                        <div className="z-10 mt-6">
                            <Link
                                href="/register"
                                className="bg-[#f7f1de] text-[#4e220f] hover:bg-[#4e220f] hover:text-[#f7f1de] text-xs font-bold px-5 py-2.5 rounded-full inline-flex items-center gap-2 transition-all shadow-xs"
                            >
                                <span>Shop The Sale</span>
                                <span>→</span>
                            </Link>
                        </div>

                        <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-[#4e220f]/30 rounded-full blur-xl pointer-events-none" />
                    </div>

                </section>

                {/* ---------------------------------------------------------
                 * 5. FEATURED COLLECTIONS GRID
                 * --------------------------------------------------------- */}
                <section className="w-full space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold text-[#f7f1de] tracking-tight drop-shadow-sm">Featured Collections</h2>
                        <Link href="/register" className="text-xs font-bold text-[#B0BA99] hover:text-[#f7f1de] flex items-center gap-1 transition-colors">
                            <span>View All Collections</span>
                            <span>→</span>
                        </Link>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                        {/* Left Main Large Feature Card */}
                        <div className="lg:col-span-7 bg-[#B0BA99] rounded-3xl overflow-hidden border border-[#9d6638]/40 relative min-h-[380px] lg:min-h-[440px] flex flex-col justify-end p-8 sm:p-12 group shadow-lg">
                            <Image
                                src="https://images.unsplash.com/photo-1617137968427-85924c800a22?auto=format&fit=crop&w=1400&q=88"
                                alt="Bespoke Collection"
                                fill
                                className="object-cover group-hover:scale-105 transition-transform duration-700 brightness-95"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-[#4e220f]/95 via-[#4e220f]/40 to-transparent z-10" />

                            <div className="relative z-20 max-w-md text-[#f7f1de]">
                                <span className="text-[10px] font-black uppercase tracking-[0.25em] text-[#B0BA99] block mb-2">
                                    SUMMER BESPOKE EDIT
                                </span>
                                <h3 className="text-3xl sm:text-4xl font-light leading-tight mb-3">
                                    Effortless <span className="font-extrabold block">Essentials.</span>
                                </h3>
                                <p className="text-xs text-[#f7f1de]/90 leading-relaxed font-medium mb-6">
                                    Light, breathable Super 150s wools &amp; pure linens made for everyday sophistication.
                                </p>
                                <Link
                                    href="/register"
                                    className="bg-[#9d6638] hover:bg-[#f7f1de] hover:text-[#4e220f] text-[#f7f1de] text-xs font-bold px-6 py-3 rounded-full inline-flex items-center gap-2 transition-all shadow-md"
                                >
                                    <span>Shop Now</span>
                                    <span>→</span>
                                </Link>
                            </div>
                        </div>

                        {/* Right Stacked 2 Cards */}
                        <div className="lg:col-span-5 flex flex-col gap-6">

                            {/* Top Right Card */}
                            <div className="bg-[#B0BA99] rounded-3xl p-6 sm:p-8 border border-[#9d6638]/40 relative overflow-hidden flex flex-col justify-between min-h-[200px] lg:min-h-[208px] group shadow-md">
                                <div className="z-10 max-w-[65%]">
                                    <h4 className="text-lg font-bold text-[#4e220f]">Custom Shirting</h4>
                                    <p className="text-xs text-[#4e220f]/80 mt-1 font-medium">Egyptian Giza 87 cottons &amp; tailored fits.</p>
                                    <Link href="/register" className="inline-flex items-center gap-1 text-xs font-bold text-[#4e220f] mt-4 hover:text-[#9d6638]">
                                        <span>Shop Now</span>
                                        <span>→</span>
                                    </Link>
                                </div>
                                <div className="absolute right-0 bottom-0 w-44 h-full overflow-hidden border-l border-[#9d6638]/30">
                                    <Image
                                        src="https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=600&q=80"
                                        alt="Custom Shirting"
                                        fill
                                        className="object-cover object-left group-hover:scale-105 transition-transform duration-500"
                                    />
                                </div>
                            </div>

                            {/* Bottom Right Card */}
                            <div className="bg-[#B0BA99] rounded-3xl p-6 sm:p-8 border border-[#9d6638]/40 relative overflow-hidden flex flex-col justify-between min-h-[200px] lg:min-h-[208px] group shadow-md">
                                <div className="z-10 max-w-[65%]">
                                    <h4 className="text-lg font-bold text-[#4e220f]">Silk &amp; Accessories</h4>
                                    <p className="text-xs text-[#4e220f]/80 mt-1 font-medium">Hand-rolled pocket squares &amp; ties.</p>
                                    <Link href="/register" className="inline-flex items-center gap-1 text-xs font-bold text-[#4e220f] mt-4 hover:text-[#9d6638]">
                                        <span>Shop Now</span>
                                        <span>→</span>
                                    </Link>
                                </div>
                                <div className="absolute right-0 bottom-0 w-44 h-full overflow-hidden border-l border-[#9d6638]/30">
                                    <Image
                                        src="https://images.unsplash.com/photo-1598033129183-c4f50c736f10?auto=format&fit=crop&w=600&q=80"
                                        alt="Silk Accessories"
                                        fill
                                        className="object-cover object-left group-hover:scale-105 transition-transform duration-500"
                                    />
                                </div>
                            </div>

                        </div>

                    </div>
                </section>

                {/* ---------------------------------------------------------
                 * 6. BEST SELLERS PRODUCT GRID (SAGE GREEN CARDS #B0BA99)
                 * --------------------------------------------------------- */}

                {/*
                <section className="w-full space-y-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-xl font-bold text-[#f7f1de] tracking-tight drop-shadow-sm">Best Sellers</h2>
                            <p className="text-xs text-[#B0BA99] font-medium mt-0.5">Most requested fabrics &amp; tailor commissions</p>
                        </div>
                        <Link href="/register" className="text-xs font-bold text-[#B0BA99] hover:text-[#f7f1de] flex items-center gap-1 transition-colors">
                            <span>View All Products</span>
                            <span>→</span>
                        </Link>
                    </div> */}
                {/*
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-5">
                        {BEST_SELLERS.map((item) => {
                            const isLiked = wishlist.includes(item.id);
                            return (
                                <div key={item.id} className="bg-[#B0BA99] border border-[#9d6638]/40 rounded-2xl p-3 flex flex-col justify-between group hover:shadow-lg transition-all">

                                    <div className="relative w-full aspect-square bg-[#f7f1de] rounded-xl overflow-hidden mb-3 border border-[#9d6638]/30">
                                        <Image
                                            src={item.image}
                                            alt={item.title}
                                            fill
                                            sizes="(min-width: 1024px) 16vw, 33vw"
                                            className="object-cover group-hover:scale-105 transition-transform duration-500"
                                        />

                                        <button
                                            type="button"
                                            onClick={() => toggleWishlist(item.id)}
                                            aria-label="Toggle wishlist"
                                            className="absolute top-2.5 right-2.5 w-7 h-7 rounded-full bg-[#f7f1de]/90 backdrop-blur-xs flex items-center justify-center text-[#4e220f] hover:text-[#9d6638] transition-colors shadow-2xs cursor-pointer z-10"
                                        >
                                            <svg className={`w-4 h-4 ${isLiked ? "fill-[#9d6638] text-[#9d6638]" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                            </svg>
                                        </button>

                                        {item.tag && (
                                            <span className="absolute top-2.5 left-2.5 bg-[#9d6638] text-[#f7f1de] text-[8px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full shadow-xs">
                                                {item.tag}
                                            </span>
                                        )}
                                    </div>

                                    <div>
                                        <h3 className="text-xs font-bold text-[#4e220f] line-clamp-1 group-hover:text-[#9d6638] transition-colors">
                                            {item.title}
                                        </h3>
                                        <div className="flex items-center justify-between mt-1">
                                            <span className="text-xs font-extrabold text-[#4e220f]">{item.price}</span>
                                            <span className="text-[10px] text-[#4e220f]/60 line-through">{item.originalPrice}</span>
                                        </div>

                                        <div className="flex items-center gap-1 mt-2 text-[10px] text-[#4e220f]/80">
                                            <div className="flex text-[#9d6638]">
                                                {"★".repeat(Math.floor(item.rating))}
                                            </div>
                                            <span className="font-semibold text-[#4e220f]">({item.reviews})</span>
                                        </div>
                                    </div>

                                </div>
                            );
                        })}
                    </div>
                </section>
*/}
                {/* ---------------------------------------------------------
                 * 7. "QUALITY YOU CAN TRUST" ABOUT BANNER
                 * --------------------------------------------------------- */}
                <section className="w-full bg-[#B0BA99] rounded-3xl border border-[#9d6638]/40 overflow-hidden shadow-lg">
                    <div className="grid grid-cols-1 lg:grid-cols-12 items-center">

                        <div className="lg:col-span-5 relative h-64 lg:h-96 w-full border-r border-[#9d6638]/30">
                            <Image
                                src="https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=1000&q=88"
                                alt="Master Tailor Craftsmanship"
                                fill
                                className="object-cover"
                            />
                        </div>

                        <div className="lg:col-span-7 p-8 sm:p-12 lg:p-16">
                            <span className="text-[10px] font-black uppercase tracking-[0.25em] text-[#4e220f]/80 block mb-2">
                                ABOUT US
                            </span>
                            <h2 className="text-3xl sm:text-4xl font-light text-[#4e220f] leading-tight mb-4">
                                Quality You Can <span className="font-extrabold">Trust.</span>
                            </h2>
                            <p className="text-xs sm:text-sm text-[#4e220f]/90 leading-relaxed font-medium max-w-lg mb-6">
                                We believe in thoughtful design, premium materials, and garments that make a lasting difference. Every fabric length is inspected for thread density, weave integrity, and color fastness.
                            </p>
                            <Link
                                href="#process"
                                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#4e220f] hover:text-[#9d6638]"
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
                    <div className="border-b border-[#9d6638]/40 pb-6 mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                        <div>
                            <span className="text-[10px] font-black uppercase tracking-[0.25em] text-[#B0BA99] block mb-1">
                                FROM BRIEF TO WARDROBE
                            </span>
                            <h2 className="text-2xl sm:text-3xl font-bold text-[#f7f1de] tracking-tight drop-shadow-sm">
                                One Request. Four Clear Steps.
                            </h2>
                        </div>
                        <p className="text-xs text-[#B0BA99] font-medium max-w-md">
                            FITI keeps fabric selection, tailor proposals, and measurement communication seamless in one place.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {PROCESS_STEPS.map((step) => (
                            <div key={step.number} className="bg-[#B0BA99] border border-[#9d6638]/40 rounded-2xl p-6 flex flex-col justify-between shadow-md">
                                <div>
                                    <span className="text-3xl font-light italic text-[#9d6638] block mb-4">{step.number}</span>
                                    <h3 className="text-sm font-bold text-[#4e220f] mb-2">{step.title}</h3>
                                    <p className="text-xs text-[#4e220f]/80 leading-relaxed font-medium">{step.text}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* ---------------------------------------------------------
                 * 9. FREQUENTLY ASKED QUESTIONS (ACCORDION)
                 * --------------------------------------------------------- */}
                <section id="faq" className="w-full bg-[#B0BA99] rounded-3xl p-8 sm:p-12 border border-[#9d6638]/40 shadow-lg">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                        <div className="lg:col-span-4">
                            <span className="text-[10px] font-black uppercase tracking-[0.25em] text-[#9d6638] block mb-2">
                                BEFORE YOU BEGIN
                            </span>
                            <h2 className="text-2xl sm:text-3xl font-bold text-[#4e220f] leading-tight">
                                Questions, Clearly Answered.
                            </h2>
                        </div>

                        <div className="lg:col-span-8 space-y-4">
                            {FAQS.map((faq, idx) => {
                                const isOpen = openFaq === idx;
                                return (
                                    <div key={idx} className="bg-[#f7f1de] border border-[#9d6638]/40 rounded-2xl overflow-hidden transition-all shadow-2xs">
                                        <button
                                            type="button"
                                            onClick={() => setOpenFaq(isOpen ? null : idx)}
                                            className="w-full p-5 text-left flex items-center justify-between text-xs sm:text-sm font-bold text-[#4e220f] cursor-pointer"
                                        >
                                            <span>{faq.question}</span>
                                            <span className="text-base text-[#9d6638]">{isOpen ? "−" : "+"}</span>
                                        </button>
                                        {isOpen && (
                                            <div className="px-5 pb-5 text-xs text-[#4e220f]/90 leading-relaxed font-medium border-t border-[#9d6638]/20 mt-1 pt-3">
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
            <footer className="relative z-10 w-full bg-[#f7f1de] border-t border-[#9d6638]/40 py-12 px-4 sm:px-8 lg:px-12 text-[#4e220f] text-xs">
                <div className="max-w-[1440px] mx-auto grid grid-cols-1 md:grid-cols-5 gap-8 mb-12">

                    <div className="md:col-span-2 space-y-4">
                        <Image
                            src="/logo_light.png"
                            alt="FITI Atelier"
                            width={160}
                            height={50}
                            className="h-9 w-auto object-contain"
                        />
                        <p className="text-[#4e220f]/80 leading-relaxed max-w-sm">
                            FITI is Sri Lanka&apos;s premier bespoke tailoring &amp; textile marketplace. Connecting clients with verified master artisans for garments crafted to perfection.
                        </p>
                    </div>

                    <div>
                        <h4 className="font-bold text-[#4e220f] mb-4 uppercase tracking-wider text-[11px]">Shop Fabrics</h4>
                        <ul className="space-y-2.5 text-[#4e220f]/80 font-medium">
                            <li><Link href="#fabrics" className="hover:text-[#9d6638] transition-colors">Super 150s Wool</Link></li>
                            <li><Link href="#fabrics" className="hover:text-[#9d6638] transition-colors">Italian Velvet &amp; Silk</Link></li>
                            <li><Link href="#fabrics" className="hover:text-[#9d6638] transition-colors">Egyptian Giza Cotton</Link></li>
                            <li><Link href="#fabrics" className="hover:text-[#9d6638] transition-colors">Cashmere Blends</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="font-bold text-[#4e220f] mb-4 uppercase tracking-wider text-[11px]">Bespoke Services</h4>
                        <ul className="space-y-2.5 text-[#4e220f]/80 font-medium">
                            <li><Link href="/tailors" className="hover:text-[#9d6638] transition-colors">Find a Master Tailor</Link></li>
                            <li><Link href="#process" className="hover:text-[#9d6638] transition-colors">Commission Process</Link></li>
                            <li><Link href="/register" className="hover:text-[#9d6638] transition-colors">Post a Fitting Request</Link></li>
                            <li><Link href="/login" className="hover:text-[#9d6638] transition-colors">Tailor Shop Portal</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="font-bold text-[#4e220f] mb-4 uppercase tracking-wider text-[11px]">Support &amp; Legal</h4>
                        <ul className="space-y-2.5 text-[#4e220f]/80 font-medium">
                            <li><Link href="#faq" className="hover:text-[#9d6638] transition-colors">Help &amp; FAQ</Link></li>
                            <li><Link href="/privacy" className="hover:text-[#9d6638] transition-colors">Privacy Policy</Link></li>
                            <li><Link href="/terms" className="hover:text-[#9d6638] transition-colors">Terms of Service</Link></li>
                            <li><Link href="/contact" className="hover:text-[#9d6638] transition-colors">Contact Styling Team</Link></li>
                        </ul>
                    </div>

                </div>

                <div className="max-w-[1440px] mx-auto pt-6 border-t border-[#9d6638]/30 flex flex-col sm:flex-row items-center justify-between gap-4 text-[#4e220f]/70 text-[11px] font-medium">
                    <p>© 2026 FITI Bespoke Marketplace. All rights reserved.</p>
                    <div className="flex items-center gap-6">
                        <Link href="/privacy" className="hover:text-[#9d6638] transition-colors">Privacy</Link>
                        <Link href="/terms" className="hover:text-[#9d6638] transition-colors">Terms</Link>
                        <Link href="/contact" className="hover:text-[#9d6638] transition-colors">Contact</Link>
                    </div>
                </div>
            </footer>

        </div>
    );
}