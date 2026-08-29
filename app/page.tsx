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
        name: "Super 150s wool",
        use: "Four-season suiting",
        description: "Fine wool with a breathable, clean drape for jackets and trousers.",
        color: "#4e220f",
        weight: "260 g/m",
        image: "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=1600&q=88",
    },
    {
        name: "Silk velvet",
        use: "Evening tailoring",
        description: "A light-catching pile for dinner jackets and formal accents.",
        color: "#9d6638",
        weight: "310 g/m",
        image: "https://images.unsplash.com/photo-1598033129183-c4f50c736f10?auto=format&fit=crop&w=1600&q=88",
    },
    {
        name: "Cashmere blend",
        use: "Outerwear",
        description: "Soft structure and lasting warmth for considered overcoats.",
        color: "#B0BA99",
        weight: "440 g/m",
        image: "https://images.unsplash.com/photo-1617137968427-85924c800a22?auto=format&fit=crop&w=1600&q=88",
    },
    {
        name: "Giza 87 cotton",
        use: "Bespoke shirting",
        description: "Long-staple cotton with a smooth hand for everyday shirting.",
        color: "#f7f1de",
        weight: "120 g/m",
        image: "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=1600&q=88",
    },
] as const;

const PROCESS_STEPS = [
    { number: "01", title: "Describe the garment", text: "Share the style, fit, fabric plan, budget, and timeline you have in mind." },
    { number: "02", title: "Compare proposals", text: "Review offers from tailoring shops before choosing who you want to work with." },
    { number: "03", title: "Refine the fit", text: "Discuss measurements, details, and fittings directly with your chosen tailor." },
    { number: "04", title: "Follow the making", text: "Track the commission from accepted proposal through final delivery." },
] as const;

const FAQS = [
    { question: "Can I supply my own fabric?", answer: "Yes. Select client-provided fabric when posting your request and include the cloth details in your brief." },
    { question: "Are fittings remote or in person?", answer: "Both options are supported. Choose online service for a remote consultation or a physical visit for an in-person fitting." },
    { question: "How do I choose a tailor?", answer: "Compare each shop's proposal, profile, price, and approach. Your commission starts only after you accept a proposal." },
    { question: "What happens after I post a request?", answer: "Matching ateliers can review your brief and send proposals. You can compare them from your client dashboard." },
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
            { threshold: 0.12 }
        );

        document.querySelectorAll(".reveal, .reveal-left, .reveal-right, .reveal-scale").forEach((element) => observer.observe(element));
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

    const fabric = FABRICS[selectedFabric];

    return (
        <div className="fiti-landing min-h-screen bg-[#f7f1de] text-[#4e220f] selection:bg-[#9d6638] selection:text-[#f7f1de]">
            {/* Site header */}
            <header className="fixed inset-x-0 top-0 z-50 border-b border-[#4e220f]/15 bg-[#f7f1de]/95 backdrop-blur-md">
                <div className="mx-auto flex h-[72px] max-w-[1440px] items-center justify-between px-5 sm:px-8 lg:px-12">
                    <Link href="/" className="flex items-center" aria-label="FITI home">
                        <Image
                            src="/logoo.png"
                            alt="FITI"
                            width={815}
                            height={381}
                            priority
                            className="h-12 w-auto object-contain"
                        />
                    </Link>

                    <nav className="hidden items-center gap-8 text-[11px] font-bold uppercase tracking-[0.14em] md:flex" aria-label="Main navigation">
                        <Link href="#process" className="transition-colors hover:text-[#9d6638]">How it works</Link>
                        <Link href="/tailors" className="transition-colors hover:text-[#9d6638]">Find a tailor</Link>
                        <Link href="#fabrics" className="transition-colors hover:text-[#9d6638]">Fabric guide</Link>
                        <Link href="#faq" className="transition-colors hover:text-[#9d6638]">Questions</Link>
                    </nav>

                    <div className="flex items-center gap-2 sm:gap-4">
                        <Link href="/login" className="hidden text-xs font-bold transition-colors hover:text-[#9d6638] sm:block">Sign in</Link>
                        <Link href="/register" className="bg-[#9d6638] px-4 py-2.5 text-[11px] font-extrabold uppercase tracking-[0.1em] text-[#f7f1de] transition-colors hover:bg-[#4e220f] sm:px-5">
                            Start a request
                        </Link>
                    </div>
                </div>
            </header>

            <main className="pt-[72px]">
                {/* Hero */}
                <section className="relative min-h-[82svh] overflow-hidden border-b border-[#4e220f]/15">
                    <div className="mx-auto grid min-h-[82svh] max-w-[1440px] lg:grid-cols-[0.9fr_1.1fr]">
                        <div className="relative z-10 flex flex-col justify-center px-5 py-16 sm:px-8 lg:px-12 lg:py-20">
                            <div className="max-w-[650px] animate-fade-in-up">
                                <p className="mb-7 flex items-center gap-3 text-[10px] font-extrabold uppercase tracking-[0.24em] text-[#9d6638]">
                                    <span className="h-px w-10 bg-[#9d6638]" />
                                    Sri Lanka&apos;s tailoring marketplace
                                </p>
                                <h1 className="landing-display text-[3.4rem] leading-[0.84] sm:text-7xl xl:text-[7.7rem]">
                                    Made to fit
                                    <span className="block italic text-[#9d6638]">your life.</span>
                                </h1>
                                <p className="mt-8 max-w-lg text-sm leading-7 text-[#4e220f]/70 sm:text-base">
                                    Describe the garment you want. Compare proposals from local ateliers. Choose the maker who understands your fit.
                                </p>

                                {error ? (
                                    <p role="alert" className="mt-5 border-l-2 border-[#9d6638] bg-[#B0BA99]/35 px-4 py-3 text-sm">
                                        {error}
                                    </p>
                                ) : null}

                                <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                                    <Link href="/register" className="inline-flex min-h-12 items-center justify-center bg-[#4e220f] px-7 text-xs font-extrabold uppercase tracking-[0.12em] text-[#f7f1de] transition-colors hover:bg-[#9d6638]">
                                        Create a tailoring request
                                    </Link>
                                    <button
                                        type="button"
                                        onClick={handleGoogleLogin}
                                        disabled={loading}
                                        className="inline-flex min-h-12 items-center justify-center gap-3 border border-[#9d6638] px-7 text-xs font-bold transition-colors hover:bg-[#B0BA99]/45 disabled:cursor-wait disabled:opacity-60"
                                    >
                                        <span className="flex h-5 w-5 items-center justify-center bg-white text-[11px] font-black text-[#9d6638]">G</span>
                                        {loading ? "Connecting..." : "Continue with Google"}
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="relative min-h-[34svh] overflow-hidden bg-[#B0BA99] lg:min-h-0">
                            <Image
                                src="https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=1800&q=90"
                                alt="Tailor preparing a bespoke jacket in an atelier"
                                fill
                                priority
                                sizes="(min-width: 1024px) 55vw, 100vw"
                                className="object-cover"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-[#4e220f]/45 via-transparent to-transparent" />
                            <div className="landing-ruler absolute inset-y-0 left-0 hidden w-12 bg-[#B0BA99] text-[#4e220f] lg:block" aria-hidden="true">
                                <span>10</span><span>20</span><span>30</span><span>40</span><span>50</span>
                            </div>
                            <div className="absolute bottom-5 left-5 right-5 flex items-end justify-between border-t border-[#f7f1de]/60 pt-4 text-[#f7f1de] sm:bottom-8 sm:left-8 sm:right-8 lg:left-20">
                                <p className="max-w-xs text-xs font-bold uppercase leading-5 tracking-[0.12em]">A direct line between your idea and the hands that make it.</p>
                                <p className="landing-display hidden text-3xl italic sm:block">Cut for one.</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Marketplace benefits */}
                <section className="border-b border-[#4e220f]/20 bg-[#B0BA99]" aria-label="Platform benefits">
                    <div className="mx-auto grid max-w-[1440px] divide-y divide-[#4e220f]/20 px-5 sm:grid-cols-3 sm:divide-x sm:divide-y-0 sm:px-8 lg:px-12">
                        {["Tailoring shops in one place", "Proposals before commitment", "Direct maker communication"].map((item) => (
                            <p key={item} className="py-4 text-center text-[10px] font-extrabold uppercase tracking-[0.16em] sm:px-5">{item}</p>
                        ))}
                    </div>
                </section>

                {/* Commission process */}
                <section id="process" className="px-5 py-24 sm:px-8 lg:px-12 lg:py-32">
                    <div className="mx-auto max-w-[1320px]">
                        <div className="reveal grid gap-8 border-b border-[#4e220f]/25 pb-10 lg:grid-cols-[1fr_0.7fr] lg:items-end">
                            <div>
                                <p className="text-[10px] font-extrabold uppercase tracking-[0.24em] text-[#9d6638]">From brief to wardrobe</p>
                                <h2 className="landing-display mt-4 max-w-3xl text-5xl leading-[0.94] sm:text-7xl">One request. Four clear steps.</h2>
                            </div>
                            <p className="max-w-lg text-sm leading-7 text-[#4e220f]/65 lg:justify-self-end">
                                FITI keeps discovery, proposals, and communication together while the garment stays personal to you and your tailor.
                            </p>
                        </div>

                        <ol className="grid md:grid-cols-2 lg:grid-cols-4">
                            {PROCESS_STEPS.map((step, index) => (
                                <li
                                    key={step.number}
                                    style={{ transitionDelay: `${(index + 1) * 100}ms` }}
                                    className="reveal border-b border-[#4e220f]/20 py-8 md:px-7 md:odd:border-r lg:border-b-0 lg:border-r lg:first:pl-0 lg:last:border-r-0"
                                >
                                    <span className="landing-display text-3xl italic text-[#9d6638]">{step.number}</span>
                                    <h3 className="mt-9 text-base font-extrabold uppercase tracking-[0.08em]">{step.title}</h3>
                                    <p className="mt-3 text-sm leading-6 text-[#4e220f]/65">{step.text}</p>
                                </li>
                            ))}
                        </ol>
                    </div>
                </section>

                {/* Service options */}
                <section className="grid bg-[#4e220f] text-[#f7f1de] lg:grid-cols-2">
                    <div className="reveal-left relative min-h-[500px] overflow-hidden lg:min-h-[720px]">
                        <Image
                            src="https://images.unsplash.com/photo-1617137968427-85924c800a22?auto=format&fit=crop&w=1600&q=90"
                            alt="A tailor fitting a bespoke suit"
                            fill
                            sizes="(min-width: 1024px) 50vw, 100vw"
                            className="object-cover"
                        />
                        <div className="absolute inset-0 bg-[#4e220f]/15" />
                        <p className="absolute bottom-6 left-6 bg-[#f7f1de] px-4 py-2 text-[10px] font-extrabold uppercase tracking-[0.16em] text-[#4e220f]">Built around your fit</p>
                    </div>
                    <div className="reveal-right flex items-center px-5 py-20 sm:px-12 lg:px-16">
                        <div className="max-w-xl">
                            <p className="text-[10px] font-extrabold uppercase tracking-[0.24em] text-[#B0BA99]">Work your way</p>
                            <h2 className="landing-display mt-5 text-5xl leading-[0.94] sm:text-7xl">Online when it suits. In person when it matters.</h2>
                            <p className="mt-7 text-sm leading-7 text-[#f7f1de]/65">
                                Start remotely with your measurements and direct messages, or choose an atelier visit for a hands-on fitting. Set the service preference in your request from the beginning.
                            </p>
                            <div className="mt-10 grid grid-cols-2 border-y border-[#f7f1de]/20">
                                <div className="border-r border-[#f7f1de]/20 py-6 pr-5">
                                    <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-[#B0BA99]">Remote service</p>
                                    <p className="mt-2 text-xs leading-5 text-[#f7f1de]/55">Discuss measurements and details online.</p>
                                </div>
                                <div className="py-6 pl-5">
                                    <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-[#B0BA99]">Atelier visit</p>
                                    <p className="mt-2 text-xs leading-5 text-[#f7f1de]/55">Meet your tailor for an in-person fit.</p>
                                </div>
                            </div>
                            <Link href="/tailors" className="mt-10 inline-flex items-center gap-3 text-xs font-extrabold uppercase tracking-[0.13em] text-[#B0BA99] transition-colors hover:text-[#f7f1de]">
                                Browse tailoring shops <span aria-hidden="true">→</span>
                            </Link>
                        </div>
                    </div>
                </section>

                {/* Interactive fabric guide */}
                <section id="fabrics" className="px-5 py-24 sm:px-8 lg:px-12 lg:py-32">
                    <div className="mx-auto max-w-[1320px]">
                        <div className="reveal mb-12 flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
                            <div>
                                <p className="text-[10px] font-extrabold uppercase tracking-[0.24em] text-[#9d6638]">The cloth ledger</p>
                                <h2 className="landing-display mt-3 text-5xl leading-none sm:text-7xl">Begin with the feel.</h2>
                            </div>
                            <p className="max-w-md text-sm leading-6 text-[#4e220f]/65">Explore a few cloth directions, then tell your tailor whether you will provide the material or want the atelier to source it.</p>
                        </div>

                        <div className="reveal-scale grid overflow-hidden border border-[#4e220f]/25 bg-[#B0BA99] lg:grid-cols-[0.78fr_1.22fr]">
                            <div className="order-2 lg:order-1">
                                {FABRICS.map((item, index) => {
                                    const isSelected = selectedFabric === index;
                                    return (
                                        <button
                                            key={item.name}
                                            type="button"
                                            onClick={() => setSelectedFabric(index)}
                                            aria-pressed={isSelected}
                                            className={`group flex w-full items-center gap-4 border-b border-[#4e220f]/25 p-5 text-left transition-colors last:border-b-0 lg:p-7 ${isSelected ? "bg-[#4e220f] text-[#f7f1de]" : "hover:bg-[#f7f1de]/45"}`}
                                        >
                                            <span className="h-9 w-9 shrink-0 rounded-full border border-[#4e220f]/30" style={{ backgroundColor: item.color }} />
                                            <span className="min-w-0 flex-1">
                                                <span className="block text-sm font-extrabold">{item.name}</span>
                                                <span className={`mt-1 block text-[10px] uppercase tracking-[0.12em] ${isSelected ? "text-[#f7f1de]/55" : "text-[#4e220f]/55"}`}>{item.use}</span>
                                            </span>
                                            <span className={`text-xs font-bold ${isSelected ? "text-[#B0BA99]" : "text-[#9d6638]"}`}>{item.weight}</span>
                                        </button>
                                    );
                                })}
                            </div>

                            <div className="relative order-1 min-h-[430px] overflow-hidden lg:order-2 lg:min-h-[610px]">
                                <Image
                                    key={fabric.image}
                                    src={fabric.image}
                                    alt={`${fabric.name} tailoring reference`}
                                    fill
                                    sizes="(min-width: 1024px) 55vw, 100vw"
                                    className="fabric-img object-cover"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-[#4e220f]/90 via-transparent to-transparent" />
                                <div className="absolute inset-x-0 bottom-0 p-7 text-[#f7f1de] sm:p-10">
                                    <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#B0BA99]">{fabric.use} · {fabric.weight}</p>
                                    <h3 className="landing-display mt-2 text-4xl sm:text-6xl">{fabric.name}</h3>
                                    <p className="mt-3 max-w-lg text-sm leading-6 text-[#f7f1de]/70">{fabric.description}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Frequently asked questions */}
                <section id="faq" className="border-y border-[#4e220f]/20 bg-[#B0BA99]/40 px-5 py-24 sm:px-8 lg:px-12">
                    <div className="mx-auto grid max-w-[1200px] gap-12 lg:grid-cols-[0.7fr_1.3fr]">
                        <div className="reveal-left">
                            <p className="text-[10px] font-extrabold uppercase tracking-[0.24em] text-[#9d6638]">Before you begin</p>
                            <h2 className="landing-display mt-4 text-5xl leading-[0.95] sm:text-7xl">Questions, clearly answered.</h2>
                        </div>
                        <div className="reveal-right border-t border-[#4e220f]/30">
                            {FAQS.map((faq, index) => {
                                const isOpen = openFaq === index;
                                return (
                                    <div key={faq.question} className="border-b border-[#4e220f]/30">
                                        <button
                                            type="button"
                                            onClick={() => setOpenFaq(isOpen ? null : index)}
                                            aria-expanded={isOpen}
                                            className="flex w-full items-center justify-between gap-6 py-6 text-left text-sm font-extrabold sm:text-base"
                                        >
                                            {faq.question}
                                            <span className="landing-display text-2xl font-normal text-[#9d6638]" aria-hidden="true">{isOpen ? "−" : "+"}</span>
                                        </button>
                                        <div className={`faq-body ${isOpen ? "open" : ""}`}>
                                            <div>
                                                <p className="max-w-2xl pb-6 text-sm leading-7 text-[#4e220f]/65">{faq.answer}</p>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </section>

                {/* Final call to action */}
                <section className="bg-[#9d6638] px-5 py-20 text-[#f7f1de] sm:px-8 lg:px-12 lg:py-24">
                    <div className="mx-auto flex max-w-[1200px] flex-col items-start justify-between gap-10 lg:flex-row lg:items-end">
                        <div className="max-w-3xl">
                            <p className="text-[10px] font-extrabold uppercase tracking-[0.24em] text-[#f7f1de]/70">Your first stitch</p>
                            <h2 className="landing-display mt-5 text-5xl leading-[0.92] sm:text-7xl">Start with the garment you have in mind.</h2>
                        </div>
                        <Link href="/register" className="inline-flex min-h-14 shrink-0 items-center justify-center bg-[#f7f1de] px-8 text-xs font-extrabold uppercase tracking-[0.12em] text-[#4e220f] transition-colors hover:bg-[#B0BA99]">
                            Create your request
                        </Link>
                    </div>
                </section>
            </main>

            {/* Site footer */}
            <footer className="bg-[#4e220f] px-5 py-10 text-[#f7f1de] sm:px-8 lg:px-12">
                <div className="mx-auto flex max-w-[1320px] flex-col gap-8 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <p className="text-2xl font-extrabold tracking-[0.18em]">FITI</p>
                        <p className="mt-2 text-[10px] uppercase tracking-[0.16em] text-[#f7f1de]/45">Tailoring, made personal.</p>
                    </div>
                    <div className="flex flex-wrap gap-x-6 gap-y-3 text-xs text-[#f7f1de]/60">
                        <Link href="/privacy" className="transition-colors hover:text-[#f7f1de]">Privacy</Link>
                        <Link href="/terms" className="transition-colors hover:text-[#f7f1de]">Terms</Link>
                        <Link href="/contact" className="transition-colors hover:text-[#f7f1de]">Support</Link>
                        <Link href="/login" className="transition-colors hover:text-[#f7f1de]">Sign in</Link>
                    </div>
                </div>
            </footer>

            {/* Atelier chat */}
            {!isChatDrawerOpen ? (
                <button
                    type="button"
                    onClick={() => setIsChatDrawerOpen(true)}
                    className="fixed bottom-5 right-5 z-[80] flex h-12 items-center gap-2 bg-[#4e220f] px-5 text-xs font-extrabold text-[#f7f1de] shadow-[0_12px_36px_rgba(78,34,15,0.28)] transition-transform hover:-translate-y-1"
                    aria-label="Open atelier chat"
                >
                    <span className="h-2 w-2 rounded-full bg-[#B0BA99]" />
                    Ask an atelier
                </button>
            ) : null}

            <AtelierChatDrawer
                isOpen={isChatDrawerOpen}
                onClose={() => setIsChatDrawerOpen(false)}
                userRole="client"
            />
        </div>
    );
}