"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/lib/firebase/AuthContext";

export default function ProtectedLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { user, dbRole, loading } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const requiredRole = pathname.startsWith("/tailor")
        ? "tailor"
        : pathname.startsWith("/client")
            ? "client"
            : null;

    useEffect(() => {
        if (loading) return;

        if (!user) {
            router.replace("/login");
        } else if (!dbRole) {
            router.replace("/onboarding");
        } else if (requiredRole && dbRole !== requiredRole) {
            router.replace(`/${dbRole}/home`);
        }
    }, [loading, router, user, dbRole, requiredRole]);

    const authorized = user && dbRole && (!requiredRole || dbRole === requiredRole);

    if (loading || !authorized) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#0A0B0E] text-xs text-[#F5CA53] font-mono tracking-widest uppercase">
                Checking access...
            </div>
        );
    }

    return <div className="min-h-screen bg-[#0A0B0E]">{children}</div>;
}
