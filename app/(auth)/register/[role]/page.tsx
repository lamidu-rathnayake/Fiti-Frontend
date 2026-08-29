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
        <main className="min-h-screen bg-[#f7f1de] text-[#4e220f] flex items-center justify-center p-4 selection:bg-[#9d6638] selection:text-[#f7f1de] font-sans">
            <div className="w-full max-w-md bg-[#f7f1de] border border-[#9d6638]/40 rounded-3xl p-8 text-center shadow-2xl">
                <h1 className="text-2xl font-bold tracking-tight text-[#4e220f] uppercase">
                    Invalid Role Selected
                </h1>
                <p className="mt-2 text-xs text-[#4e220f]/70">
                    Please choose a valid registration role to proceed.
                </p>
                <button
                    type="button"
                    onClick={() => router.push("/register")}
                    className="mt-6 rounded-full bg-[#9d6638] px-6 py-3 text-xs font-bold uppercase tracking-wider text-[#f7f1de] transition hover:bg-[#4e220f]"
                >
                    Back to Role Selection
                </button>
            </div>
        </main>
    );
}
