"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FirebaseError } from "firebase/app";
import { signInWithPopup } from "firebase/auth";

import AtelierChatDrawer from "@/components/chat/AtelierChatDrawer";
import { FitiApiError } from "@/lib/api/client";
import { getMyRole } from "@/lib/api/endpoints/auth";
import { useAuth } from "@/lib/firebase/AuthContext";
import { auth, googleProvider } from "@/lib/firebase/config";

const FABRICS = [
    {
        name: "Super 150s Wool",
        use: "Four-season Suiting",
        description: "Fine, breathable drape for tailored jackets.",
        color: "#4e220f",
        weight: "260g/m",
        image: "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=1400&q=85",
    },
    {
        name: "Silk Velvet",
        use: "Evening & Tuxedo",
        description: "Plush silk pile for statement eveningwear.",
        color: "#9d6638",
        weight: "310g/m",
        image: "https://images.unsplash.com/photo-1598033129183-c4f50c736f10?auto=format&fit=crop&w=1400&q=85",
    },
    {
        name: "Cashmere Blend",
        use: "Overcoats",
        description: "Soft structure and warmth for winter coats.",
        color: "#B0BA99",
        weight: "440g/m",
        image: "https://images.unsplash.com/photo-1617137968427-85924c800a22?auto=format&fit=crop&w=1400&q=85",
    },
    {
        name: "Giza 87 Cotton",
        use: "Bespoke Shirting",
        description: "Silky hand feel and durability for fine shirting.",
        color: "#f7f1de",
        weight: "120g/m",
        image: "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=1400&q=85",
    },
] as const;

const PROCESS_STEPS = [
    { num: "01", title: "Brief", subtitle: "Submit your design & fit." },
    { num: "02", title: "Bid", subtitle: "Compare tailor proposals." },
    { num: "03", title: "Fit", subtitle: "Consult directly with your tailor." },
    { num: "04", title: "Wear", subtitle: "Handcrafted delivery." },
] as const;

const FAQS = [
    { question: "Can I supply my own fabric?", answer: "Yes. Select 'Client Provided Fabric' when posting your request." },
    { question: "Are fittings remote or in-person?", answer: "Both. Choose virtual fitting support or schedule an in-person session." },
    { question: "How are tailors verified?", answer: "Every atelier is audited for craft quality and portfolio history before joining." },
    { question: "How does payment work?", answer: "Funds are released in milestones as fitting stages are approved." },
] as const;

export default function HomePage() {
    const router = useRouter();
    const { setRole } = useAuth();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [selectedFabric, setSelectedFabric] = useState(0);
    const [openFaq, setOpenFaq] = useState<number | null>(0);
    const [isChatDrawerOpen, setIsChatDrawerOpen] = useState(false);

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add("is-visible");
                        observer.unobserve(entry.target);
                    }
                });
            },
            { threshold: 0.1 }
        );

        document.querySelectorAll(".reveal, .reveal-scale").forEach((el) => observer.observe(el));
        return () => observer.disconnect();
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
            if (err instanceof FirebaseError && !err.code.includes("popup-closed")) {
                setError("Sign-in failed. Try again.");
            }
        } finally {
            setLoading(false);
        }
    };

    const fabric = FABRICS[selectedFabric];

    return (
        <div className="fiti-landing min-h-screen bg-[#f7f1de] text-[#4e220f] selection:bg-[#9d6638] selection:text-[#f7f1de]">
            {/* Header */}
            <header className="fixed inset-x-0 top-0 z-50 border-b border-[#9d6638]/20 bg-[#f7f1de]/90 backdrop-blur-md">
                <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
                    <Link href="/" className="flex items-center gap-2">
                        <span className="flex h-8 w-8 items-center justify-center border border-[#9d6638] bg-[#B0BA99]">
                            <Image src="/logoo.png" alt="FITI" width={22} height={22} className="h-5 w-auto" />
                        </span>
                        <span className="font-extrabold text-xl tracking-wider text-[#4e220f]">FITI</span>
                    </Link>

                    <nav className="hidden items-center gap-8 text-xs font-bold uppercase tracking-wider text-[#4e220f]/80 md:flex">
                        <Link href="#process" className="hover:text-[#9d6638]">Process</Link>
                        <Link href="#fabrics" className="hover:text-[#9d6638]">Fabrics</Link>
                        <Link href="#faq" className="hover:text-[#9d6638]">FAQ</Link>
                    </nav>

                    <div className="flex items-center gap-3">
                        <Link href="/login" className="text-xs font-bold text-[#4e220f] hover:text-[#9d6638]">Sign In</Link>
                        <Link href="/register" className="btn-gold-shimmer px-4 py-2 text-xs uppercase font-extrabold">Commission</Link>
                    </div>
                </div>
            </header>

            <main className="pt-16">
                {/* Hero */}
                <section className="px-6 py-20 md:py-28 max-w-5xl mx-auto text-center">
                    <div className="reveal inline-block px-3 py-1 text-[10px] uppercase font-extrabold tracking-widest text-[#9d6638] bg-[#B0BA99]/30 rounded-full mb-6">
                        Bespoke Tailoring Marketplace
                    </div>

                    <h1 className="reveal delay-100 text-5xl md:text-7xl font-extrabold tracking-tight leading-tight text-[#4e220f]">
                        Crafted for you.
                    </h1>

                    <p className="reveal delay-200 mt-4 text-base md:text-lg max-w-xl mx-auto text-[#4e220f]/80 font-medium">
                        Connect with master tailors. Submit your request, compare proposals, and get custom garments made to fit.
                    </p>

                    {error && <p className="mt-4 text-xs text-red-700">{error}</p>}

                    <div className="reveal delay-300 mt-8 flex flex-wrap justify-center gap-4">
                        <Link href="/register" className="btn-gold-shimmer px-6 py-3 text-xs uppercase font-bold tracking-wider">
                            Get Started
                        </Link>
                        <button
                            type="button"
                            onClick={handleGoogleLogin}
                            disabled={loading}
                            className="px-6 py-3 text-xs uppercase font-bold tracking-wider border border-[#9d6638] bg-[#B0BA99]/40 hover:bg-[#B0BA99] text-[#4e220f]"
                        >
                            {loading ? "Connecting..." : "Google Sign-In"}
                        </button>
                    </div>

                    {/* Stats */}
                    <div className="reveal delay-400 mt-14 grid grid-cols-3 gap-4 border-t border-[#9d6638]/20 pt-8 text-center max-w-xl mx-auto">
                        <div>
                            <p className="text-2xl font-black text-[#9d6638]">100%</p>
                            <p className="text-[10px] uppercase font-bold text-[#4e220f]/70">Verified Tailors</p>
                        </div>
                        <div>
                            <p className="text-2xl font-black text-[#9d6638]">24h</p>
                            <p className="text-[10px] uppercase font-bold text-[#4e220f]/70">Avg Proposals</p>
                        </div>
                        <div>
                            <p className="text-2xl font-black text-[#9d6638]">4.9★</p>
                            <p className="text-[10px] uppercase font-bold text-[#4e220f]/70">Rating</p>
                        </div>
                    </div>
                </section>

                {/* Process */}
                <section id="process" className="py-20 px-6 bg-[#B0BA99]/20 border-y border-[#9d6638]/20">
                    <div className="max-w-5xl mx-auto">
                        <h2 className="reveal text-3xl font-extrabold text-center text-[#4e220f]">How it works</h2>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-12">
                            {PROCESS_STEPS.map((s, i) => (
                                <div key={s.num} className={`reveal delay-${(i + 1) * 100} glass-card p-6 rounded-none`}>
                                    <span className="text-2xl font-black text-[#9d6638]">{s.num}</span>
                                    <h3 className="text-base font-bold text-[#4e220f] mt-2">{s.title}</h3>
                                    <p className="text-xs text-[#4e220f]/80 mt-1">{s.subtitle}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Fabrics */}
                <section id="fabrics" className="py-20 px-6 max-w-5xl mx-auto">
                    <h2 className="reveal text-3xl font-extrabold text-center text-[#4e220f] mb-10">Cloth Selection</h2>
                    <div className="grid md:grid-cols-12 gap-6 items-center border border-[#9d6638]/30 bg-[#B0BA99] p-6">
                        <div className="md:col-span-5 space-y-2">
                            {FABRICS.map((f, idx) => (
                                <button
                                    key={f.name}
                                    type="button"
                                    onClick={() => setSelectedFabric(idx)}
                                    className={`w-full p-4 text-left font-bold text-xs uppercase tracking-wider transition-all ${
                                        selectedFabric === idx
                                            ? "bg-[#9d6638] text-[#f7f1de]"
                                            : "hover:bg-[#9d6638]/20 text-[#4e220f]"
                                    }`}
                                >
                                    {f.name}
                                </button>
                            ))}
                        </div>
                        <div className="md:col-span-7 relative h-72 w-full overflow-hidden border border-[#9d6638]/30">
                            <Image src={fabric.image} alt={fabric.name} fill className="object-cover" />
                            <div className="absolute inset-0 bg-gradient-to-t from-[#4e220f]/80 via-transparent to-transparent" />
                            <div className="absolute bottom-4 left-4 right-4 p-4 bg-[#f7f1de]">
                                <p className="text-[10px] font-extrabold uppercase text-[#9d6638]">{fabric.use} • {fabric.weight}</p>
                                <p className="text-sm font-bold text-[#4e220f]">{fabric.description}</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* FAQ */}
                <section id="faq" className="py-20 px-6 bg-[#B0BA99]/20 border-t border-[#9d6638]/20">
                    <div className="max-w-3xl mx-auto">
                        <h2 className="reveal text-3xl font-extrabold text-center text-[#4e220f] mb-8">FAQ</h2>
                        <div className="space-y-3">
                            {FAQS.map((faq, idx) => {
                                const isOpen = openFaq === idx;
                                return (
                                    <div key={faq.question} className="border border-[#9d6638]/30 bg-[#f7f1de]">
                                        <button
                                            type="button"
                                            onClick={() => setOpenFaq(isOpen ? null : idx)}
                                            className="w-full p-4 text-left text-xs font-bold uppercase tracking-wider flex justify-between items-center text-[#4e220f]"
                                        >
                                            <span>{faq.question}</span>
                                            <span>{isOpen ? "−" : "+"}</span>
                                        </button>
                                        {isOpen && (
                                            <p className="px-4 pb-4 text-xs text-[#4e220f]/80 border-t border-[#9d6638]/10 pt-2">
                                                {faq.answer}
                                            </p>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </section>

                {/* CTA */}
                <section className="py-16 px-6 bg-[#9d6638] text-[#f7f1de] text-center">
                    <h2 className="text-3xl font-extrabold">Ready to order?</h2>
                    <p className="mt-2 text-xs text-[#f7f1de]/90">Post your request and get atelier bids today.</p>
                    <div className="mt-6 flex justify-center gap-4">
                        <Link href="/register" className="btn-gold-shimmer px-6 py-3 text-xs uppercase font-bold !bg-[#4e220f] !text-[#f7f1de]">
                            Create Account
                        </Link>
                    </div>
                </section>
            </main>

            {/* Footer */}
            <footer className="bg-[#4e220f] text-[#f7f1de]/70 py-8 text-center text-xs">
                <p>© {new Date().getFullYear()} FITI Marketplace. Minimal & Bespoke.</p>
            </footer>

            {/* Chat Floating Button */}
            {!isChatDrawerOpen && (
                <button
                    type="button"
                    onClick={() => setIsChatDrawerOpen(true)}
                    className="fixed bottom-6 right-6 z-[80] bg-[#9d6638] px-4 py-2.5 text-xs font-bold text-[#f7f1de] uppercase tracking-wider shadow-lg"
                >
                    Chat
                </button>
            )}

            <AtelierChatDrawer
                isOpen={isChatDrawerOpen}
                onClose={() => setIsChatDrawerOpen(false)}
                userRole="client"
            />
        </div>
    );
}