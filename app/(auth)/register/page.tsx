"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
    const router = useRouter();

    const handleRoleSelect = (role: "client" | "tailor") => {
        router.push(`/register/${role}`);
    };

    return (
        <div className="min-h-screen relative flex flex-col justify-between overflow-hidden font-sans selection:bg-accent selection:text-cream-bg">
            {/* FULL BACKGROUND PHOTO */}
            <div className="absolute inset-0 z-0">
                <Image
                    src="/images/orders/cashmere_belted_coat.jpg"
                    alt="Cashmere Atelier Background"
                    fill
                    className="object-cover brightness-[0.4] scale-105"
                    priority
                />
                <div className="absolute inset-0 bg-earth-text/20 backdrop-blur-[3px]" />
            </div>

            {/* TOP HEADER */}
            <header className="relative z-20 w-full py-5 px-6 sm:px-12">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <Link href="/" className="group">
                        <Image
                            src="/logo_dark.png"
                            alt="FITI Atelier"
                            width={220}
                            height={70}
                            className="h-14 sm:h-16 w-auto object-contain group-hover:scale-105 transition-transform"
                            priority
                        />
                    </Link>

                    <div className="flex items-center gap-4">
                        <Link
                            href="/login"
                            className="px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-cream-bg bg-accent hover:bg-earth-text rounded-full transition-all shadow-md"
                        >
                            Sign In
                        </Link>
                    </div>
                </div>
            </header>

            {/* MAIN CONTENT: ACCOUNT TYPE SELECTION CARD */}
            <main className="flex-1 flex items-center justify-center px-4 sm:px-6 py-8 relative z-10">
                <div className="max-w-4xl w-full mx-auto bg-cream-bg rounded-3xl p-8 sm:p-12 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.6)] relative overflow-hidden backdrop-blur-xl flex flex-col items-center border border-accent/30">

                    {/* HEADER */}
                    <div className="text-center mb-10 relative z-10 max-w-md">
                        <h1 className="text-3xl sm:text-4xl font-black tracking-wider text-earth-text uppercase mb-3">
                            ACCOUNT TYPE
                        </h1>
                        <p className="text-xs sm:text-sm text-earth-text/80 leading-relaxed font-medium">
                            Select your journey into the world of bespoke tailoring &amp; artisanal craft.
                        </p>
                    </div>

                    {/* CARDS GRID */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full relative z-10 mb-10">
                        {/* CLIENT CARD */}
                        <div
                            onClick={() => handleRoleSelect("client")}
                            className="group relative bg-card-bg/30 border border-accent/40 hover:border-accent rounded-2xl p-8 flex flex-col justify-between transition-all duration-300 hover:shadow-[0_10px_30px_rgba(157,102,56,0.2)] hover:-translate-y-1 cursor-pointer overflow-hidden"
                        >
                            {/* Watermark Background Icon */}
                            <div className="absolute top-4 right-4 opacity-10 group-hover:opacity-20 transition-opacity pointer-events-none text-earth-text">
                                <svg className="w-32 h-32" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                                </svg>
                            </div>

                            <div>
                                {/* Icon Circle */}
                                <div className="w-12 h-12 rounded-full border border-accent/40 bg-cream-bg flex items-center justify-center text-accent mb-6 shadow-sm group-hover:scale-110 transition-transform">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                    </svg>
                                </div>

                                <h2 className="text-xl font-extrabold text-earth-text mb-3 group-hover:text-accent transition-colors">
                                    Register as a Client
                                </h2>
                                <p className="text-xs text-earth-text/80 leading-relaxed mb-8">
                                    Discover elite tailoring, curated fabrics, and personalized fits designed exclusively for your lifestyle.
                                </p>
                            </div>

                            <div className="text-xs font-black uppercase tracking-[0.15em] text-accent group-hover:text-earth-text flex items-center gap-2 group-hover:translate-x-1 transition-transform">
                                <span>REGISTER AS A CLIENT</span>
                                <span>&rarr;</span>
                            </div>
                        </div>

                        {/* SELLER / TAILOR CARD */}
                        <div
                            onClick={() => handleRoleSelect("tailor")}
                            className="group relative bg-card-bg/30 border border-accent/40 hover:border-accent rounded-2xl p-8 flex flex-col justify-between transition-all duration-300 hover:shadow-[0_10px_30px_rgba(157,102,56,0.2)] hover:-translate-y-1 cursor-pointer overflow-hidden"
                        >
                            {/* Watermark Background Icon */}
                            <div className="absolute top-4 right-4 opacity-10 group-hover:opacity-20 transition-opacity pointer-events-none text-accent">
                                <svg className="w-32 h-32" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z" />
                                </svg>
                            </div>

                            <div>
                                {/* Icon Circle */}
                                <div className="w-12 h-12 rounded-full border border-accent/40 bg-cream-bg flex items-center justify-center text-accent mb-6 shadow-sm group-hover:scale-110 transition-transform">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                    </svg>
                                </div>

                                <h2 className="text-xl font-extrabold text-earth-text mb-3 group-hover:text-accent transition-colors">
                                    Register as a Seller
                                </h2>
                                <p className="text-xs text-earth-text/80 leading-relaxed mb-8">
                                    Join our artisan network. Showcase your craftsmanship to a global audience of discerning clients.
                                </p>
                            </div>

                            <div className="text-xs font-black uppercase tracking-[0.15em] text-accent group-hover:text-earth-text flex items-center gap-2 group-hover:translate-x-1 transition-transform">
                                <span>REGISTER AS A SELLER</span>
                                <span>&rarr;</span>
                            </div>
                        </div>
                    </div>

                    {/* BACK TO LOGIN BUTTON */}
                    <Link
                        href="/login"
                        className="relative z-10 inline-flex items-center gap-2 px-6 py-3 rounded-full border border-accent/40 bg-cream-bg text-earth-text hover:text-accent hover:border-accent text-xs font-black uppercase tracking-[0.15em] transition-all hover:bg-card-bg/30"
                    >
                        <span>&larr;</span>
                        <span>BACK TO LOGIN</span>
                    </Link>
                </div>
            </main>

            {/* BOTTOM FOOTER */}
            <footer className="w-full border-t border-accent/20 bg-cream-bg/90 py-5 px-6 sm:px-12 relative z-20 backdrop-blur-md">
                <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex flex-col sm:flex-row items-center sm:space-x-4 space-y-1 sm:space-y-0 text-center sm:text-left">
                        <span className="text-sm font-black tracking-widest text-earth-text">
                            FITI
                        </span>
                        <span className="text-[11px] text-earth-text/70">
                            &copy; {new Date().getFullYear()} FITI Bespoke Fitness &amp; Tailoring. All rights reserved.
                        </span>
                    </div>

                    <div className="flex items-center space-x-6 text-xs text-earth-text/80">
                        <Link href="/privacy" className="hover:text-accent transition-colors">Privacy Policy</Link>
                        <Link href="/terms" className="hover:text-accent transition-colors">Terms of Service</Link>
                        <Link href="/contact" className="hover:text-accent transition-colors">Contact Us</Link>
                        <Link href="/about" className="hover:text-accent transition-colors">About Us</Link>
                    </div>
                </div>
            </footer>
        </div>
    );
}
