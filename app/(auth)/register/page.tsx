"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
    const router = useRouter();

    const handleRoleSelect = (role: "client" | "tailor") => {
        router.push(`/register/${role}`);
    };

    return (
        <div className="min-h-screen bg-[#0A0B0E] text-white flex flex-col justify-between relative overflow-x-hidden selection:bg-[#F5CA53] selection:text-black font-sans">
            {/* Top Header Bar */}
            <header className="w-full border-b border-zinc-900/80 bg-[#0A0B0E]/90 backdrop-blur-md sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-6 sm:px-12 py-5 flex items-center justify-between">
                    <Link href="/" className="text-xl sm:text-2xl font-black tracking-widest text-[#F5CA53] hover:opacity-90 transition-opacity">
                        FITI
                    </Link>

                    <nav className="hidden md:flex items-center space-x-10 text-xs font-semibold tracking-wider text-zinc-400">
                        <Link href="/" className="hover:text-[#F5CA53] transition-colors">Dashboard</Link>
                        <Link href="/" className="hover:text-[#F5CA53] transition-colors">Orders</Link>
                        <Link href="/" className="hover:text-[#F5CA53] transition-colors">Shops</Link>
                        <Link href="/" className="hover:text-[#F5CA53] transition-colors">Tailoring</Link>
                    </nav>

                    <div className="flex items-center space-x-4">
                        <Link
                            href="/login"
                            className="px-5 py-2 text-xs font-bold uppercase tracking-wider text-black bg-[#F5CA53] hover:bg-[#f7d369] rounded-xl transition-all shadow-[0_0_12px_rgba(245,202,83,0.25)]"
                        >
                            Sign In
                        </Link>
                    </div>
                </div>
            </header>

            {/* MAIN CONTENT: ACCOUNT TYPE SELECTION MODAL CARD */}
            <main className="flex-1 flex items-center justify-center px-4 sm:px-6 py-12 relative z-10">
                {/* Background Ambient Glow */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[400px] bg-[#F5CA53]/10 blur-[150px] rounded-full pointer-events-none" />

                <div className="max-w-4xl w-full mx-auto bg-[#131418]/90 border border-zinc-800/90 rounded-[28px] p-8 sm:p-12 shadow-2xl relative overflow-hidden backdrop-blur-xl flex flex-col items-center">
                    {/* Top Accent Ambient Glow */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-72 h-20 bg-[#F5CA53]/15 blur-2xl pointer-events-none" />

                    {/* HEADER */}
                    <div className="text-center mb-10 relative z-10 max-w-md">
                        <h1 className="text-3xl sm:text-4xl font-extrabold text-[#F5D061] tracking-tight mb-3">
                            Account Type
                        </h1>
                        <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed font-normal">
                            Select your journey into the world of digital bespoke tailoring.
                        </p>
                    </div>

                    {/* CARDS GRID */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full relative z-10 mb-10">
                        {/* CLIENT CARD */}
                        <div
                            onClick={() => handleRoleSelect("client")}
                            className="group relative bg-[#18191E]/90 border border-zinc-800/90 hover:border-[#F5CA53]/60 rounded-2xl p-8 flex flex-col justify-between transition-all duration-300 hover:shadow-[0_0_30px_rgba(245,202,83,0.12)] hover:-translate-y-1 cursor-pointer overflow-hidden"
                        >
                            {/* Watermark Background Icon */}
                            <div className="absolute top-4 right-4 opacity-5 group-hover:opacity-10 transition-opacity pointer-events-none text-zinc-400">
                                <svg className="w-32 h-32" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                                </svg>
                            </div>

                            <div>
                                {/* Icon Circle */}
                                <div className="w-12 h-12 rounded-full border border-[#F5CA53]/50 bg-[#F5CA53]/10 flex items-center justify-center text-[#F5CA53] mb-6 shadow-[0_0_15px_rgba(245,202,83,0.15)] group-hover:scale-110 transition-transform">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                    </svg>
                                </div>

                                <h2 className="text-xl font-extrabold text-white mb-3 group-hover:text-[#F5CA53] transition-colors">
                                    Register as a Client
                                </h2>
                                <p className="text-xs text-zinc-400 leading-relaxed mb-8">
                                    Discover elite tailoring, curated fabrics, and personalized fits designed exclusively for your lifestyle.
                                </p>
                            </div>

                            <div className="text-xs font-black uppercase tracking-[0.15em] text-[#F5CA53] flex items-center gap-2 group-hover:translate-x-1 transition-transform">
                                <span>REGISTER AS A CLIENT</span>
                                <span>&rarr;</span>
                            </div>
                        </div>

                        {/* SELLER / TAILOR CARD */}
                        <div
                            onClick={() => handleRoleSelect("tailor")}
                            className="group relative bg-[#18191E]/90 border border-[#F5CA53]/40 hover:border-[#F5CA53] rounded-2xl p-8 flex flex-col justify-between transition-all duration-300 hover:shadow-[0_0_30px_rgba(245,202,83,0.15)] hover:-translate-y-1 cursor-pointer overflow-hidden"
                        >
                            {/* Watermark Background Icon */}
                            <div className="absolute top-4 right-4 opacity-5 group-hover:opacity-10 transition-opacity pointer-events-none text-[#F5CA53]">
                                <svg className="w-32 h-32" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z" />
                                </svg>
                            </div>

                            <div>
                                {/* Icon Circle */}
                                <div className="w-12 h-12 rounded-full border border-[#F5CA53]/50 bg-[#F5CA53]/10 flex items-center justify-center text-[#F5CA53] mb-6 shadow-[0_0_15px_rgba(245,202,83,0.15)] group-hover:scale-110 transition-transform">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                    </svg>
                                </div>

                                <h2 className="text-xl font-extrabold text-white mb-3 group-hover:text-[#F5CA53] transition-colors">
                                    Register as a Seller
                                </h2>
                                <p className="text-xs text-zinc-400 leading-relaxed mb-8">
                                    Join our artisan network. Showcase your craftsmanship to a global audience of discerning clients.
                                </p>
                            </div>

                            <div className="text-xs font-black uppercase tracking-[0.15em] text-[#F5CA53] flex items-center gap-2 group-hover:translate-x-1 transition-transform">
                                <span>REGISTER AS A SELLER</span>
                                <span>&rarr;</span>
                            </div>
                        </div>
                    </div>

                    {/* BACK TO LOGIN BUTTON */}
                    <Link
                        href="/login"
                        className="relative z-10 inline-flex items-center gap-2 px-6 py-3 rounded-full border border-zinc-800 bg-[#18191E] text-zinc-400 hover:text-white hover:border-zinc-700 text-xs font-black uppercase tracking-[0.15em] transition-all hover:bg-zinc-800"
                    >
                        <span>&larr;</span>
                        <span>BACK TO LOGIN</span>
                    </Link>
                </div>
            </main>

            {/* Bottom Footer */}
            <footer className="w-full border-t border-zinc-900/80 bg-[#0A0B0E] py-7 px-6 sm:px-12 relative z-20">
                <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex flex-col sm:flex-row items-center sm:space-x-4 space-y-1 sm:space-y-0 text-center sm:text-left">
                        <span className="text-sm font-black tracking-widest text-[#F5CA53]">
                            FITI
                        </span>
                        <span className="text-[11px] text-zinc-500">
                            &copy; {new Date().getFullYear()} FITI Bespoke Fitness &amp; Tailoring. All rights reserved.
                        </span>
                    </div>

                    <div className="flex items-center space-x-6 text-xs text-zinc-400">
                        <Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
                        <Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
                        <Link href="/contact" className="hover:text-white transition-colors">Contact Us</Link>
                        <Link href="/about" className="hover:text-white transition-colors">About Us</Link>
                    </div>
                </div>
            </footer>
        </div>
    );
}
