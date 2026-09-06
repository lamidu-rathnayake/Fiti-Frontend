import Link from "next/link";

export default function PrivacyPolicyPage() {
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

            <main className="max-w-4xl w-full mx-auto px-6 sm:px-12 py-12 flex-1 space-y-6">
                <span className="text-[10px] font-black uppercase tracking-[0.25em] text-[#F5CA53] block">
                    LEGAL &amp; SECURITY
                </span>
                <h1 className="text-3xl sm:text-4xl font-extrabold text-white">Privacy Policy</h1>
                <div className="bg-[#131418] border border-zinc-800 rounded-2xl p-8 space-y-4 text-xs text-zinc-300 leading-relaxed">
                    <p>At FITI Bespoke Digital Atelier, we prioritize the protection of your personal and measurement data. This Privacy Policy details how we handle client and tailor profile records.</p>
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider pt-2">1. Data Collection</h3>
                    <p>We collect essential information required for bespoke tailoring, including body measurements, fitting notes, address, and contact details (+94 numbers in Sri Lanka).</p>
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider pt-2">2. Confidentiality</h3>
                    <p>Your garment specifications and measurements are encrypted and shared exclusively with certified ateliers selected for your commission.</p>
                </div>
            </main>

            <footer className="w-full border-t border-zinc-900/80 bg-[#0A0B0E] py-8 px-6 sm:px-12">
                <div className="max-w-7xl mx-auto flex items-center justify-between text-xs text-zinc-500">
                    <span>&copy; {new Date().getFullYear()} FITI Bespoke. All rights reserved.</span>
                </div>
            </footer>
        </div>
    );
}
