"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import {
    ClientRegisterForm,
    TailorRegisterForm,
} from "@/components/auth/register-forms";

export default function RoleRegistrationPage({
    params,
}: {
    params: Promise<{ role: string }>;
}) {
    const router = useRouter();
    const resolvedParams = use(params);
    
    const role = Array.isArray(resolvedParams?.role) ? resolvedParams.role[0] : resolvedParams?.role;
    const normalizedRole = role?.toLowerCase();

    if (normalizedRole === "tailor" || normalizedRole === "seller") {
        return <TailorRegisterForm onBack={() => router.push("/register")} />;
    }

    if (normalizedRole === "client") {
        return <ClientRegisterForm onBack={() => router.push("/register")} />;
    }

    return (
        <main className="min-h-screen bg-warm-beige text-earth-text flex items-center justify-center p-4 selection:bg-accent selection:text-cream-bg font-sans">
            <div className="w-full max-w-md bg-cream-bg border border-accent/40 rounded-3xl p-8 text-center shadow-2xl">
                <h1 className="text-2xl font-bold tracking-tight text-earth-text uppercase">
                    Invalid Role Selected
                </h1>
                <p className="mt-2 text-xs text-earth-text/70">
                    Please choose a valid registration role to proceed.
                </p>
                <button
                    type="button"
                    onClick={() => router.push("/register")}
                    className="mt-6 rounded-full bg-accent px-6 py-3 text-xs font-bold uppercase tracking-wider text-cream-bg transition hover:bg-earth-text"
                >
                    Back to Role Selection
                </button>
            </div>
        </main>
    );
}
