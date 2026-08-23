"use client";

import { use } from "react";
import { useParams, useRouter } from "next/navigation";

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
    const routeParams = useParams();
    
    // Safely resolve params for Next.js 15+ App Router
    let roleParam: string | string[] | undefined = routeParams?.role;
    try {
        const resolvedParams = use(params);
        if (resolvedParams?.role) {
            roleParam = resolvedParams.role;
        }
    } catch {
        // Fallback to routeParams
    }

    const role = Array.isArray(roleParam) ? roleParam[0] : roleParam;
    const normalizedRole = role?.toLowerCase();

    if (normalizedRole === "tailor" || normalizedRole === "seller") {
        return <TailorRegisterForm onBack={() => router.push("/register")} />;
    }

    if (normalizedRole === "client") {
        return <ClientRegisterForm onBack={() => router.push("/register")} />;
    }

    return (
        <main className="min-h-screen bg-[#0A0B0E] text-white flex items-center justify-center p-4 selection:bg-[#F5CA53] selection:text-black font-sans">
            <div className="w-full max-w-md bg-[#131418] border border-zinc-800 rounded-2xl p-8 text-center shadow-2xl">
                <h1 className="text-2xl font-bold tracking-tight text-[#F5CA53]">
                    Invalid Role Selected
                </h1>
                <p className="mt-2 text-xs text-zinc-400">
                    Please choose a valid registration role to proceed.
                </p>
                <button
                    type="button"
                    onClick={() => router.push("/register")}
                    className="mt-6 rounded-xl bg-[#F5CA53] px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-black transition hover:bg-[#f7d369]"
                >
                    Back to Role Selection
                </button>
            </div>
        </main>
    );
}
