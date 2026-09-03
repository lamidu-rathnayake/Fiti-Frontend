"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { useAuth } from "@/lib/firebase/AuthContext";
import { listTailorShops, updateShop } from "@/lib/api/endpoints/shops";
import type { Shop } from "@/lib/api/types/shop";
import { reverseGeocode } from "@/lib/geocoding";
import FullPageLock from "@/components/FullPageLock";

const LocationPicker = dynamic(
    () => import("@/components/map/LocationPicker"),
    {
        ssr: false,
        loading: () => (
            <div className="h-64 w-full animate-pulse rounded-xl border border-accent/30 bg-card-bg/20 flex items-center justify-center text-xs font-semibold uppercase tracking-wider text-earth-text/60">
                Loading map...
            </div>
        ),
    },
);

export default function LocationPage() {
    const router = useRouter();
    const { user } = useAuth();
    const [statusMessage, setStatusMessage] = useState<string | null>(null);
    const [shops, setShops] = useState<Shop[]>([]);
    const [selectedShop, setSelectedShop] = useState<Shop | null>(null);
    const [shopLatitude, setShopLatitude] = useState<number | null>(null);
    const [shopLongitude, setShopLongitude] = useState<number | null>(null);
    const [shopAddress, setShopAddress] = useState("");
    const [shopCity, setShopCity] = useState("");
    const [isShopLocationSaving, setIsShopLocationSaving] = useState(false);

    useEffect(() => {
        if (!user) return;

        const loadShops = async () => {
            try {
                const tailorShops = await listTailorShops(user.uid);
                setShops(tailorShops);

                const storedShopId = Number(
                    localStorage.getItem("tailorSelectedShopId"),
                );
                const activeShop =
                    tailorShops.find((shop) => shop.shop_id === storedShopId) ??
                    tailorShops[0] ??
                    null;
                setSelectedShop(activeShop);
            } catch (error) {
                console.error("Failed to load tailor shops", error);
                setStatusMessage(
                    "Unable to load your shops. Please try again.",
                );
            }
        };

        void loadShops();
    }, [user]);

    useEffect(() => {
        if (!selectedShop) return;

        setShopLatitude(selectedShop.latitude);
        setShopLongitude(selectedShop.longitude);
        setShopAddress(selectedShop.shop_address ?? "");
        setShopCity(selectedShop.city ?? "");
        localStorage.setItem(
            "tailorSelectedShopId",
            String(selectedShop.shop_id),
        );
        localStorage.setItem("tailorSelectedShop", selectedShop.shop_name);
    }, [selectedShop]);

    const handleShopLocationSave = async () => {
        if (!selectedShop || shopLatitude === null || shopLongitude === null) {
            setStatusMessage(
                "Select a shop and pin its location on the map first.",
            );
            return;
        }

        setIsShopLocationSaving(true);
        setStatusMessage(null);

        try {
            const updatedShop = await updateShop(selectedShop.shop_id, {
                shop_name: selectedShop.shop_name,
                specialty: selectedShop.specialty,
                shop_bio: selectedShop.shop_bio,
                shop_address: shopAddress.trim() || null,
                city: shopCity.trim() || null,
                contact_number: selectedShop.contact_number,
                registration_number: selectedShop.registration_number,
                latitude: shopLatitude,
                longitude: shopLongitude,
            });
            setSelectedShop(updatedShop);
            setShops((currentShops) =>
                currentShops.map((shop) =>
                    shop.shop_id === updatedShop.shop_id ? updatedShop : shop,
                ),
            );
            setStatusMessage("Shop location updated successfully.");
        } catch (error) {
            setStatusMessage(
                error instanceof Error
                    ? error.message
                    : "Failed to update shop location.",
            );
        } finally {
            setIsShopLocationSaving(false);
        }
    };

    return (
        <div className="min-h-screen bg-warm-beige text-earth-text font-sans selection:bg-accent selection:text-cream-bg relative overflow-hidden">
            <FullPageLock
                isSubmitting={isShopLocationSaving}
                title="Updating Atelier Location"
                message="Saving location preferences and configuring your regional hub..."
            />
            <div className="relative z-10 max-w-lg mx-auto pt-12 pb-24 px-6 flex flex-col items-center min-h-screen justify-between">
                <div className="w-full space-y-8">
                    {/* Top Bar with Back Button */}
                    <div className="flex items-center justify-between">
                        <Link
                            href="/tailor/home"
                            className="w-10 h-10 bg-cream-bg border border-accent/30 rounded-full flex items-center justify-center text-earth-text hover:bg-accent hover:text-cream-bg transition-all shadow-sm"
                        >
                            <svg
                                className="w-5 h-5"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M15 19l-7-7 7-7"
                                />
                            </svg>
                        </Link>
                        <span className="text-[10px] font-mono font-bold uppercase tracking-[0.25em] text-accent">
                            Location Settings
                        </span>
                        <div className="w-10"></div>
                    </div>

                    {/* Header */}
                    <div className="text-center space-y-2">
                        <h1 className="text-3xl font-extrabold text-earth-text font-heading">
                            Set Your{" "}
                            <span className="text-accent">Location</span>
                        </h1>
                        <p className="text-xs text-earth-text/70 max-w-75 mx-auto leading-relaxed">
                            Configure your atelier hub to connect with local
                            bespoke clientele.
                        </p>
                    </div>

                    {/* Current Active Location Display */}
                    <div className="bg-cream-bg border border-accent/30 rounded-2xl p-4 flex items-center justify-between shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent">
                                <svg
                                    className="w-5 h-5"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                                    />
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                                    />
                                </svg>
                            </div>
                            <div>
                                <span className="text-[9px] font-mono font-bold uppercase tracking-widest text-earth-text/60 block">
                                    Current Atelier City
                                </span>
                                <span className="text-sm font-extrabold text-earth-text">
                                    {selectedShop?.city || "No shop selected"}
                                </span>
                            </div>
                        </div>
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 shadow-sm"></span>
                    </div>

                    {statusMessage && (
                        <div className="p-3 bg-cream-bg border border-accent/20 rounded-xl text-xs text-center font-bold text-earth-text/80 shadow-sm">
                            {statusMessage}
                        </div>
                    )}

                    <section className="bg-cream-bg border border-accent/30 rounded-2xl p-5 space-y-4 shadow-sm">
                        <div>
                            <span className="text-[9px] font-mono font-bold uppercase tracking-widest text-earth-text/60 block">
                                Selected Store Location
                            </span>
                            <h2 className="text-lg font-extrabold text-earth-text font-heading">
                                Update your shop map pin
                            </h2>
                        </div>

                        {shops.length > 0 ? (
                            <>
                                <div className="relative">
                                    <select
                                        aria-label="Select store"
                                        value={selectedShop?.shop_id ?? ""}
                                        onChange={(event) => {
                                            const shop = shops.find(
                                                (item) =>
                                                    item.shop_id ===
                                                    Number(event.target.value),
                                            );
                                            setSelectedShop(shop ?? null);
                                        }}
                                        className="w-full appearance-none rounded-xl border border-accent/40 bg-cream-bg px-4 py-3 pr-10 text-xs font-bold uppercase tracking-wider text-earth-text shadow-sm outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
                                    >
                                        {shops.map((shop) => (
                                            <option
                                                key={shop.shop_id}
                                                value={shop.shop_id}
                                                className="bg-cream-bg text-earth-text"
                                            >
                                                {shop.shop_name}
                                            </option>
                                        ))}
                                    </select>
                                    <svg
                                        className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-accent"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        aria-hidden="true"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="m6 9 6 6 6-6"
                                        />
                                    </svg>
                                </div>

                                <LocationPicker
                                    key={selectedShop?.shop_id ?? "shop"}
                                    defaultLocation={
                                        shopLatitude !== null &&
                                        shopLongitude !== null
                                            ? {
                                                  lat: shopLatitude,
                                                  lng: shopLongitude,
                                              }
                                            : undefined
                                    }
                                    onChange={async ({ lat, lng }) => {
                                        setShopLatitude(lat);
                                        setShopLongitude(lng);
                                        const location = await reverseGeocode(
                                            lat,
                                            lng,
                                        );
                                        if (location) {
                                            setShopAddress(location.address);
                                            setShopCity(location.city);
                                        }
                                    }}
                                />

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <input
                                        type="text"
                                        value={shopAddress}
                                        onChange={(event) =>
                                            setShopAddress(event.target.value)
                                        }
                                        placeholder="Shop address"
                                        className="w-full rounded-xl border border-accent/20 bg-warm-beige px-4 py-3 text-xs text-earth-text outline-none focus:border-accent/60"
                                    />
                                    <input
                                        type="text"
                                        value={shopCity}
                                        onChange={(event) =>
                                            setShopCity(event.target.value)
                                        }
                                        placeholder="Shop city"
                                        className="w-full rounded-xl border border-accent/20 bg-warm-beige px-4 py-3 text-xs text-earth-text outline-none focus:border-accent/60"
                                    />
                                </div>

                                <button
                                    type="button"
                                    onClick={handleShopLocationSave}
                                    disabled={isShopLocationSaving}
                                    className="w-full rounded-xl bg-accent py-3.5 text-xs font-bold uppercase tracking-wider text-cream-bg transition hover:bg-accent-hover disabled:opacity-60"
                                >
                                    {isShopLocationSaving
                                        ? "Saving Shop Location..."
                                        : "Save Shop Location"}
                                </button>
                            </>
                        ) : (
                            <p className="text-xs text-earth-text/60">
                                No shops found. Create a shop before updating
                                its location.
                            </p>
                        )}
                    </section>
                </div>

                <div className="mt-8">
                    <Link
                        href="/tailor/home"
                        className="text-xs font-bold text-earth-text/60 hover:text-earth-text transition-colors"
                    >
                        ← Cancel and return to dashboard
                    </Link>
                </div>
            </div>
        </div>
    );
}
