"use client";

import { useRouter } from "next/navigation";

export default function RegisterPage() {
    const router = useRouter();

    const handleRoleSelect = (role: "client" | "tailor") => {
        router.push(`/register/${role}`);
    };

    return (
        <main className="min-h-screen bg-[#0D0D0D] text-white flex items-center justify-center p-4 selection:bg-[#F6CA57] selection:text-black">
            <div className="w-full max-w-lg">
                <div className="bg-[#141414] border border-zinc-800 rounded-3xl shadow-2xl p-8 relative overflow-hidden">
                    {/* Subtle gold glow behind card content */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[200px] h-[50px] bg-[#F6CA57]/20 blur-[60px] pointer-events-none"></div>

                    <div className="text-center mb-8 relative z-10">
                        <h1 className="text-2xl font-semibold tracking-wide text-zinc-100">
                            Choose Your Role
                        </h1>
                        <p className="text-sm text-zinc-500 mt-2">
                            Select how you want to use the marketplace
                        </p>
                    </div>

                    <div className="space-y-4 relative z-10">
                        <button
                            type="button"
                            onClick={() => handleRoleSelect("client")}
                            className="group w-full rounded-2xl border border-zinc-800 bg-[#0D0D0D] p-5 text-left transition hover:border-[#F6CA57]/50 hover:bg-zinc-900 shadow-sm"
                        >
                            <div className="flex items-center justify-between gap-4">
                                <div>
                                    <p className="text-sm font-bold tracking-widest text-[#F6CA57] uppercase mb-1">
                                        Client
                                    </p>
                                    <p className="text-xs text-zinc-400 leading-relaxed pr-4">
                                        I want to discover tailors and request custom clothing.
                                    </p>
                                </div>
                                <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400 group-hover:bg-[#F6CA57] group-hover:text-black transition-colors shrink-0 shadow-[0_0_10px_rgba(246,202,87,0)] group-hover:shadow-[0_0_15px_rgba(246,202,87,0.3)]">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                                </div>
                            </div>
                        </button>

                        <button
                            type="button"
                            onClick={() => handleRoleSelect("tailor")}
                            className="group w-full rounded-2xl border border-zinc-800 bg-[#0D0D0D] p-5 text-left transition hover:border-[#F6CA57]/50 hover:bg-zinc-900 shadow-sm"
                        >
                            <div className="flex items-center justify-between gap-4">
                                <div>
                                    <p className="text-sm font-bold tracking-widest text-[#F6CA57] uppercase mb-1">
                                        Tailor
                                    </p>
                                    <p className="text-xs text-zinc-400 leading-relaxed pr-4">
                                        I want to create my shop and manage custom orders.
                                    </p>
                                </div>
                                <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400 group-hover:bg-[#F6CA57] group-hover:text-black transition-colors shrink-0 shadow-[0_0_10px_rgba(246,202,87,0)] group-hover:shadow-[0_0_15px_rgba(246,202,87,0.3)]">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                                </div>
                            </div>
                        </button>
                    </div>

                    <div className="mt-8 text-center relative z-10">
                        <p className="text-xs text-zinc-500 font-medium">
                            Already have an account?{" "}
                            <button
                                type="button"
                                onClick={() => router.push("/login")}
                                className="font-bold text-[#F6CA57] hover:underline hover:text-yellow-400 ml-1"
                            >
                                Sign in
                            </button>
                        </p>
                    </div>
                </div>
            </div>
        </main>
    );
}
