"use client";

import { useCallback, useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/firebase/AuthContext";
import { listTailorShops } from "@/lib/api/endpoints/shops";
import type { Shop } from "@/lib/api/types/shop";

export default function TailorNavControls() {
    const { user } = useAuth();
    const [tailorShops, setTailorShops] = useState<Shop[]>([]);
    const [selectedShop, setSelectedShop] = useState<Shop | null>(null);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const loadShops = useCallback(async () => {
        if (!user) return;
        try {
            const shops = await listTailorShops(user.uid);
            setTailorShops(shops);
            if (shops.length > 0) {
                const storedId = localStorage.getItem("tailorSelectedShopId");
                const active = storedId
                    ? (shops.find((s) => String(s.shop_id) === storedId) ?? shops[0])
                    : shops[0];
                setSelectedShop(active);
            }
        } catch {
            // silently fail — nav controls are non-critical
        }
    }, [user]);

    useEffect(() => {
        void loadShops();
    }, [loadShops]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleSelectShop = (shop: Shop) => {
        setSelectedShop(shop);
        setIsDropdownOpen(false);
        localStorage.setItem("tailorSelectedShopId", String(shop.shop_id));
        // Dispatch a custom event so the dashboard page can react if open
        window.dispatchEvent(
            new CustomEvent("tailorShopChanged", { detail: shop })
        );
    };

    if (tailorShops.length === 0) return null;

    return (
        <div className="hidden lg:flex items-center gap-2" ref={dropdownRef}>
            {/* Edit Shop Profile Button */}
            {selectedShop && (
                <Link
                    href={`/tailor/shop/${selectedShop.shop_id}`}
                    className="flex items-center gap-1.5 bg-accent/10 border border-accent/30 hover:border-accent hover:bg-accent hover:text-white px-3 py-1.5 rounded-full text-[11px] font-bold text-accent transition-all shadow-sm shrink-0"
                >
                    <span>✏️</span> Edit Shop
                </Link>
            )}

            {/* Shop Selector Dropdown */}
            <div className="relative">
                <button
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="flex items-center gap-2 bg-warm-beige border border-accent/30 hover:border-accent px-3 py-1.5 rounded-full text-[11px] font-bold text-earth-text transition-all shadow-sm"
                >
                    <span className="truncate max-w-[120px]">
                        {selectedShop?.shop_name ?? "Select Shop"}
                    </span>
                    <svg
                        className={`w-3 h-3 text-accent transition-transform ${isDropdownOpen ? "rotate-180" : ""}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 9l-7 7-7-7"
                        />
                    </svg>
                </button>

                {isDropdownOpen && (
                    <div className="absolute top-full right-0 mt-2 w-52 bg-cream-bg border border-accent/20 rounded-2xl shadow-xl overflow-hidden z-50 py-1.5">
                        {tailorShops.map((shop) => (
                            <button
                                key={shop.shop_id}
                                onClick={() => handleSelectShop(shop)}
                                className={`w-full text-left px-4 py-2.5 text-xs font-bold hover:bg-warm-beige transition-colors ${
                                    selectedShop?.shop_id === shop.shop_id
                                        ? "text-accent bg-accent/5"
                                        : "text-earth-text/80 hover:text-earth-text"
                                }`}
                            >
                                {shop.shop_name}
                            </button>
                        ))}
                        <div className="h-px bg-accent/15 my-1.5" />
                        {selectedShop && (
                            <Link
                                href={`/tailor/shop/${selectedShop.shop_id}`}
                                onClick={() => setIsDropdownOpen(false)}
                                className="w-full text-left px-4 py-2 text-xs font-bold text-earth-text/80 hover:text-accent hover:bg-warm-beige transition-colors flex items-center gap-2"
                            >
                                ✏️ View & Edit Shop Profile
                            </Link>
                        )}
                        <Link
                            href="/tailor/add-shop"
                            onClick={() => setIsDropdownOpen(false)}
                            className="w-full text-left px-4 py-2 text-xs font-bold text-accent hover:bg-warm-beige transition-colors flex items-center gap-2"
                        >
                            + Add New Shop
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}
