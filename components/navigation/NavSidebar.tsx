"use client";

import { useAuth } from "@/lib/firebase/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface NavSidebarProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function NavSidebar({ isOpen, onClose }: NavSidebarProps) {
    const { dbRole, logout } = useAuth();
    const router = useRouter();

    const navItems = dbRole === "tailor"
        ? [
            {
                href: "/tailor/home",
                label: "Dashboard Home",
                iconPath: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6",
            },
            {
                href: "/tailor/orders",
                label: "My Orders",
                iconPath: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 8h6m-6 4h6",
            },
            {
                href: "/tailor/add-shop",
                label: "Add Shop",
                iconPath: "M12 6v12m6-6H6",
            },
            {
                href: "/tailor/location",
                label: "Shop Location",
                iconPath: "M17.657 16.657L13.414 20.9a2 2 0 01-2.828 0l-4.243-4.243a8 8 0 1111.314 0zM15 11a3 3 0 11-6 0 3 3 0 016 0z",
            },
        ]
        : [
            {
                href: "/client/profile",
                label: "My Profile & Settings",
                iconPath: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z",
            },
            {
                href: "/client/home",
                label: "Dashboard Home",
                iconPath: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6",
            },
            {
                href: "/client/biddingRequest",
                label: "Broadcast Bidding",
                iconPath: "M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z",
            },
            {
                href: "/client/orders",
                label: "My Orders",
                iconPath: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 8h6m-6 4h6",
            },
        ];

    return (
        <>
            {/* Backdrop */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] transition-opacity"
                    onClick={onClose}
                />
            )}

            {/* Sidebar */}
            <div className={`fixed top-0 right-0 h-full w-72 bg-cream-bg border-l border-accent/40 z-[101] transform transition-transform duration-300 ease-in-out ${isOpen ? "translate-x-0" : "translate-x-full"} flex flex-col p-6 shadow-2xl`}>
                {/* Header with Close Button */}
                <div className="flex justify-start mb-8">
                    <button onClick={onClose} className="w-8 h-8 rounded-full border border-accent/40 flex items-center justify-center text-earth-text hover:text-accent hover:border-accent transition-all">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                {/* Navigation / Actions */}
                <div className="flex-1 space-y-2 mt-4">
                    {navItems.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            onClick={onClose}
                            className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-card-bg/40 text-earth-text font-semibold transition-all group"
                        >
                            <svg className="w-5 h-5 text-accent group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={item.iconPath} />
                            </svg>
                            <span className="text-sm font-bold tracking-wide">{item.label}</span>
                        </Link>
                    ))}
                </div>

                {/* Footer / Logout */}
                <div className="mt-auto pt-6 flex border-t border-accent/20">
                    <button
                        onClick={async () => {
                            await logout();
                            router.push("/login");
                        }}
                        className="w-full px-4 py-2.5 border border-accent text-accent hover:bg-accent hover:text-cream-bg rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-sm"
                    >
                        Logout
                    </button>
                </div>
            </div>
        </>
    );
}
