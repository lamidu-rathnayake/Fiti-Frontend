"use client";

import { useParams, useRouter } from "next/navigation";

import {
    ClientRegisterForm,
    TailorRegisterForm,
} from "@/components/auth/register-forms";

export default function RoleRegistrationPage() {
    const params = useParams();
    const router = useRouter();

    const role = Array.isArray(params?.role) ? params.role[0] : params?.role;

    if (role === "tailor") {
        return <TailorRegisterForm onBack={() => router.push("/register")} />;
    }

    if (role === "client") {
        return <ClientRegisterForm onBack={() => router.push("/register")} />;
    }

    return (
        <main className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
                <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                    Invalid role
                </h1>
                <p className="mt-2 text-sm text-slate-500">
                    Please choose a valid registration role.
                </p>
                <button
                    type="button"
                    onClick={() => router.push("/register")}
                    className="mt-5 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-slate-800"
                >
                    Back to role selection
                </button>
            </div>
        </main>
    );
}
