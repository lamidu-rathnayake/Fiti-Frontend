"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/firebase/AuthContext";
import NavSidebar from "@/components/navigation/NavSidebar";

export default function ProtectedLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { user, dbRole, loading } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    // Protected Route Logic
    const requiredRole = pathname.startsWith("/tailor") && !pathname.startsWith("/tailors")
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
            <div className="min-h-screen flex items-center justify-center bg-warm-beige text-xs text-accent font-mono tracking-widest uppercase animate-pulse">
                Checking access...
            </div>
        );
    }

    const homeUrl = `/${dbRole}/home`;

    return (
        <div className="min-h-screen bg-warm-beige text-earth-text flex flex-col justify-between selection:bg-accent selection:text-cream-bg font-sans relative">
            {/* TOP NAVIGATION HEADER */}
            <header className="w-full border-b border-accent/30 bg-cream-bg/95 backdrop-blur-xl sticky top-0 z-50 transition-all duration-300">
                <div className="max-w-7xl mx-auto px-4 sm:px-8 py-4 flex items-center justify-between gap-4">
                    {/* Left: Atelier Logo */}
                    <div className="flex items-center gap-4">
                        <Link href="/" className="flex items-center gap-3 group">
                            <img
                                src="/logo_light.png"
                                alt="FITI Atelier Digital Logo"
                                width={220}
                                height={80}
                                className="h-12 sm:h-14 w-auto object-contain transition-transform group-hover:scale-105"
                            />
                        </Link>
                    </div>

                    {/* Middle Navigation Links */}
                    <nav className="hidden lg:flex items-center space-x-8 text-xs font-bold tracking-wider text-earth-text/70">
                        {dbRole !== "tailor" && (
                            <Link href="/client/storefront" className={pathname === '/client/storefront' ? 'text-earth-text font-black relative pb-1 border-b-2 border-accent' : 'hover:text-accent transition-colors'}>
                                Storefront
                            </Link>
                        )}
                        <Link href={homeUrl} className={pathname === homeUrl ? 'text-earth-text font-black relative pb-1 border-b-2 border-accent' : 'hover:text-accent transition-colors'}>
                            {dbRole !== "tailor" ? "Home" : "Dashboard"}
                        </Link>
                        {dbRole !== "tailor" && (
                            <Link href={`/${dbRole}/orders`} className={pathname === `/${dbRole}/orders` ? 'text-earth-text font-black relative pb-1 border-b-2 border-accent' : 'hover:text-accent transition-colors'}>
                                Orders
                            </Link>
                        )}

                        {/*show tailors if only a client*/}
                        {dbRole !== "tailor" && (
                            <>
                                <Link href="/client/tailors" className={pathname === '/client/tailors' ? 'text-earth-text font-black relative pb-1 border-b-2 border-accent' : 'hover:text-accent transition-colors'}>
                                    Tailors
                                </Link>
                                <Link href="/client/biddingRequest" className={pathname === '/client/biddingRequest' ? 'text-earth-text font-black relative pb-1 border-b-2 border-accent' : 'hover:text-accent transition-colors'}>
                                    Broadcast
                                </Link>
                            </>
                        )}
                    </nav>

                    {/* Right: Hamburger Menu */}
                    <div className="flex items-center space-x-3">
                        <button
                            onClick={() => setIsSidebarOpen(true)}
                            className="p-1 hover:bg-card-bg/40 rounded-lg transition-colors text-earth-text hover:text-accent"
                            title="Menu"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                        </button>
                    </div>
                </div>
            </header>

            {/* MAIN CONTENT AREA */}
            <main className="flex-1 flex flex-col relative z-10 w-full h-full">
                {children}
            </main>

            {/* ATELIER DIGITAL FOOTER */}
            <footer className="w-full border-t border-accent/30 bg-cream-bg py-8 px-4 sm:px-8 mt-auto relative z-20">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-xs">
                    <div>
                        <span className="font-extrabold text-sm tracking-widest text-earth-text uppercase font-heading block">
                            ATELIER DIGITAL
                        </span>
                        <p className="text-earth-text/60 text-[11px] mt-1 font-mono">
                            &copy; {new Date().getFullYear()} ATELIER DIGITAL. ALL RIGHTS RESERVED.
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-6 text-earth-text/80 font-mono text-[11px]">
                        <Link href="/terms" className="hover:text-accent transition-colors">Terms of Service</Link>
                        <Link href="/privacy" className="hover:text-accent transition-colors">Privacy Policy</Link>
                        <Link href="/contact" className="hover:text-accent transition-colors">Contact Support</Link>
                    </div>
                </div>
            </footer>

            {/* NAV SIDEBAR COMPONENT */}
            <NavSidebar
                isOpen={isSidebarOpen}
                onClose={() => setIsSidebarOpen(false)}
            />
        </div>
    );
}
