"use client";

import { useRouter } from "next/navigation";

export default function RegisterPage() {
    const router = useRouter();

    const handleRoleSelect = (role: "client" | "tailor") => {
        router.push(`/register/${role}`);
    };

    return (
        <main className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <div className="w-full max-w-lg">
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-8">
                    <div className="text-center mb-8">
                        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                            Choose your role
                        </h1>
                        <p className="text-sm text-slate-500 mt-2">
                            Select how you want to use the marketplace
                        </p>
                    </div>

                    <div className="space-y-4">
                        <button
                            type="button"
                            onClick={() => handleRoleSelect("client")}
                            className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-5 text-left transition hover:border-slate-300 hover:bg-slate-100"
                        >
                            <div className="flex items-center justify-between gap-4">
                                <div>
                                    <p className="text-lg font-semibold text-slate-900">
                                        Client
                                    </p>
                                    <p className="text-sm text-slate-500 mt-1">
                                        I want to discover tailors and request
                                        custom clothing.
                                    </p>
                                </div>
                                <span className="text-xl">→</span>
                            </div>
                        </button>

                        <button
                            type="button"
                            onClick={() => handleRoleSelect("tailor")}
                            className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-5 text-left transition hover:border-slate-300 hover:bg-slate-100"
                        >
                            <div className="flex items-center justify-between gap-4">
                                <div>
                                    <p className="text-lg font-semibold text-slate-900">
                                        Tailor
                                    </p>
                                    <p className="text-sm text-slate-500 mt-1">
                                        I want to create my shop and manage
                                        custom orders.
                                    </p>
                                </div>
                                <span className="text-xl">→</span>
                            </div>
                        </button>
                    </div>

                    <div className="mt-7 text-center">
                        <p className="text-sm text-slate-500">
                            Already have an account?{" "}
                            <button
                                type="button"
                                onClick={() => router.push("/login")}
                                className="font-medium text-slate-900 hover:underline"
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
