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

    useEffect(() => {
        if (!loading) {
            if (!user) {
                router.replace("/login");
            } else if (!dbRole) {
                router.replace("/onboarding");
            } else {
                if (pathname.startsWith("/tailor") && dbRole !== "tailor") {
                    router.replace("/client/home");
                } else if (pathname.startsWith("/client") && dbRole !== "client") {
                    router.replace("/tailor/home");
                }
            }
        }
    }, [loading, router, user, pathname]);

    if (loading || !user || !dbRole) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 text-sm text-slate-500">
                Checking session...
            </div>
        );
    }

    if (pathname.startsWith("/tailor") && dbRole !== "tailor") return null;
    if (pathname.startsWith("/client") && dbRole !== "client") return null;

    return <div className="min-h-screen">{children}</div>;
}
