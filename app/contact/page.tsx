"use client";

import { useState } from "react";
import Link from "next/link";

export default function ContactPage() {
    const [sent, setSent] = useState(false);

    return (
        <div className="min-h-screen bg-[#0A0B0E] text-white flex flex-col justify-between selection:bg-[#F5CA53] selection:text-black font-sans">
            <header className="w-full border-b border-zinc-900/80 bg-[#0A0B0E]/90 backdrop-blur-md sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-6 sm:px-12 py-5 flex items-center justify-between">
                    <Link href="/" className="text-xl sm:text-2xl font-black tracking-widest text-[#F5CA53]">
                        FITI
                    </Link>
                    <Link href="/" className="text-xs font-bold text-zinc-400 hover:text-white uppercase tracking-wider">
                        &larr; Back to Home
                    </Link>
                </div>
            </header>

            <main className="max-w-2xl w-full mx-auto px-6 sm:px-12 py-12 flex-1 space-y-6">
                <span className="text-[10px] font-black uppercase tracking-[0.25em] text-[#F5CA53] block">
                    ATELIER SUPPORT
                </span>
                <h1 className="text-3xl sm:text-4xl font-extrabold text-white">Contact Us</h1>

                {sent ? (
                    <div className="bg-[#131418] border border-[#F5CA53] rounded-2xl p-6 text-center space-y-2">
                        <h3 className="text-base font-bold text-white">Message Dispatched ✓</h3>
                        <p className="text-xs text-zinc-400">Our concierge will contact you shortly.</p>
                    </div>
                ) : (
                    <form onSubmit={(e) => { e.preventDefault(); setSent(true); }} className="bg-[#131418] border border-zinc-800 rounded-2xl p-8 space-y-4">
                        <div>
                            <label className="text-[10px] font-black uppercase text-[#F5CA53] block mb-2">Your Name</label>
                            <input type="text" required placeholder="Full Name" className="w-full bg-[#18191E] border border-zinc-800 rounded-xl p-3.5 text-xs text-white outline-none focus:border-[#F5CA53]" />
                        </div>
                        <div>
                            <label className="text-[10px] font-black uppercase text-[#F5CA53] block mb-2">Email Address</label>
                            <input type="email" required placeholder="you@example.com" className="w-full bg-[#18191E] border border-zinc-800 rounded-xl p-3.5 text-xs text-white outline-none focus:border-[#F5CA53]" />
                        </div>
                        <div>
                            <label className="text-[10px] font-black uppercase text-[#F5CA53] block mb-2">Message</label>
                            <textarea required rows={4} placeholder="How can we assist your bespoke tailoring experience?" className="w-full bg-[#18191E] border border-zinc-800 rounded-xl p-3.5 text-xs text-white outline-none focus:border-[#F5CA53] resize-none" />
                        </div>
                        <button type="submit" className="w-full py-4 rounded-xl bg-[#F5CA53] text-black text-xs font-black uppercase tracking-wider shadow-[0_0_15px_rgba(245,202,83,0.3)]">
                            SEND MESSAGE &rarr;
                        </button>
                    </form>
                )}
            </main>

            <footer className="w-full border-t border-zinc-900/80 bg-[#0A0B0E] py-8 px-6 sm:px-12">
                <div className="max-w-7xl mx-auto flex items-center justify-between text-xs text-zinc-500">
                    <span>&copy; {new Date().getFullYear()} FITI Bespoke. All rights reserved.</span>
                </div>
            </footer>
        </div>
    );
}
