import Link from "next/link";

export default function TermsOfServicePage() {
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
                    TERMS &amp; CONDITIONS
                </span>
                <h1 className="text-3xl sm:text-4xl font-extrabold text-white">Terms of Service</h1>
                <div className="bg-[#131418] border border-zinc-800 rounded-2xl p-8 space-y-4 text-xs text-zinc-300 leading-relaxed">
                    <p>Welcome to FITI Bespoke. By accessing or using our platform, you agree to comply with the terms governing our digital atelier services in Sri Lanka.</p>
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider pt-2">1. Bespoke Commissions</h3>
                    <p>Each bespoke garment is crafted according to client specifications. Fitting appointments must be attended on scheduled dates at specified atelier locations.</p>
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider pt-2">2. Atelier Standards</h3>
                    <p>All registered tailors on FITI adhere to strict hand-tailoring quality benchmarks and fabric authenticity standards.</p>
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
