"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/lib/firebase/AuthContext";

export default function ProtectedLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { user, dbRole, loading, setRole } = useAuth();
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        if (!loading) {
            if (pathname.startsWith("/tailor")) {
                if (dbRole !== "tailor") {
                    setRole("tailor");
                }
            } else if (pathname.startsWith("/client")) {
                if (dbRole !== "client") {
                    setRole("client");
                }
            } else if (!user && !dbRole) {
                router.replace("/login");
            }
        }
    }, [loading, router, user, dbRole, pathname, setRole]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#0A0B0E] text-xs text-[#F5CA53] font-mono tracking-widest uppercase">
                Loading Atelier Dashboard...
            </div>
        );
    }

    return <div className="min-h-screen bg-[#0A0B0E]">{children}</div>;
}
