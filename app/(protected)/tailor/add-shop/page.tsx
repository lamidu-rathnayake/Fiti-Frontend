"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import dynamic from "next/dynamic";
import { useAuth } from "@/lib/firebase/AuthContext";
import { createShop } from "@/lib/api/endpoints/shops";
import { reverseGeocode } from "@/lib/geocoding";
import { validatePhoneNumber } from "@/lib/phone";
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

export default function AddShopPage() {
    const router = useRouter();
    const { user } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Controlled form state
    const [shopName, setShopName] = useState("");
    const [specialty, setSpecialty] = useState("");
    const [shopBio, setShopBio] = useState("");
    const [shopAddress, setShopAddress] = useState("");
    const [city, setCity] = useState("");
    const [contactNumber, setContactNumber] = useState("");
    const [registrationNumber, setRegistrationNumber] = useState("");
    const [latitude, setLatitude] = useState<number | null>(null);
    const [longitude, setLongitude] = useState<number | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!shopName.trim()) {
            setError("Shop name is required.");
            return;
        }

        const phoneVal = validatePhoneNumber(contactNumber);
        if (!phoneVal.isValid) {
            setError(phoneVal.error || "Please enter a valid phone number.");
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const newShop = await createShop({
                shop_name: shopName.trim(),
                specialty: specialty.trim() || undefined,
                shop_bio: shopBio.trim() || undefined,
                shop_address: shopAddress.trim() || undefined,
                city: city.trim() || undefined,
                contact_number: phoneVal.normalized || undefined,
                registration_number: registrationNumber.trim() || undefined,
                latitude,
                longitude,
            });

            // Store shop name in localStorage for UI breadcrumbs / quick access
            try {
                const existingShops: number[] = JSON.parse(
                    localStorage.getItem("tailorShopIds") || "[]",
                );
                if (!existingShops.includes(newShop.shop_id)) {
                    localStorage.setItem(
                        "tailorShopIds",
                        JSON.stringify([...existingShops, newShop.shop_id]),
                    );
                }
                localStorage.setItem(
                    "tailorSelectedShopId",
                    String(newShop.shop_id),
                );
                localStorage.setItem("tailorSelectedShop", newShop.shop_name);
            } catch {
                // localStorage not critical
            }

            router.push("/tailor/home");
        } catch (err: unknown) {
            const msg =
                err instanceof Error
                    ? err.message
                    : "Failed to create shop. Please check your details and try again.";
            setError(msg);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-warm-beige text-earth-text font-sans relative overflow-x-hidden selection:bg-accent selection:text-cream-bg">
            <FullPageLock
                isSubmitting={isLoading}
                title="Creating Atelier Shop"
                message="Please wait while we establish your digital atelier presence..."
            />
            <div className="relative z-10 max-w-lg mx-auto pt-16 pb-24 px-6 flex flex-col items-center">
                {/* Header Section */}
                <div className="text-center mb-8 space-y-2">
                    <span className="text-[10px] font-mono tracking-[0.25em] text-earth-text/60 uppercase block font-bold">
                        ATELIER REGISTRATION
                    </span>
                    <h1 className="text-3xl font-extrabold text-earth-text tracking-tight font-heading">
                        Add Your Shop
                    </h1>
                    <p className="text-xs text-earth-text/70 max-w-75 mx-auto leading-relaxed">
                        Create your digital atelier presence and connect with
                        clients.
                    </p>
                </div>

                {/* Form Container */}
                <div className="w-full bg-cream-bg border border-accent/20 rounded-3xl overflow-hidden shadow-md">
                    <form
                        onSubmit={handleSubmit}
                        className="p-6 md:p-8 space-y-5"
                    >
                        {/* Error Banner */}
                        {error && (
                            <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-800 text-xs font-bold">
                                {error}
                            </div>
                        )}

                        {/* Shop Name */}
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-mono font-bold uppercase tracking-widest text-earth-text/70">
                                Shop Name <span className="text-accent">*</span>
                            </label>
                            <input
                                type="text"
                                value={shopName}
                                onChange={(e) => setShopName(e.target.value)}
                                placeholder="e.g. SAVILE & SONS"
                                required
                                className="w-full bg-warm-beige border border-accent/20 focus:border-accent/60 rounded-xl px-4 py-3 text-xs text-earth-text placeholder-earth-text/40 outline-none transition-all shadow-sm"
                            />
                        </div>

                        {/* Specialty */}
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-mono font-bold uppercase tracking-widest text-earth-text/70">
                                Specialty
                            </label>
                            <input
                                type="text"
                                value={specialty}
                                onChange={(e) => setSpecialty(e.target.value)}
                                placeholder="e.g. Bespoke Suits, Wedding Attire"
                                className="w-full bg-warm-beige border border-accent/20 focus:border-accent/60 rounded-xl px-4 py-3 text-xs text-earth-text placeholder-earth-text/40 outline-none transition-all shadow-sm"
                            />
                        </div>

                        {/* Shop Bio */}
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-mono font-bold uppercase tracking-widest text-earth-text/70">
                                Shop Bio
                            </label>
                            <textarea
                                value={shopBio}
                                onChange={(e) => setShopBio(e.target.value)}
                                placeholder="The craft of timeless silhouettes..."
                                rows={3}
                                className="w-full bg-warm-beige border border-accent/20 focus:border-accent/60 rounded-xl px-4 py-3 text-xs text-earth-text placeholder-earth-text/40 outline-none transition-all resize-none shadow-sm"
                            />
                        </div>

                        {/* Street Address */}
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-mono font-bold uppercase tracking-widest text-earth-text/70">
                                Street Address
                            </label>
                            <input
                                type="text"
                                value={shopAddress}
                                onChange={(e) => setShopAddress(e.target.value)}
                                placeholder="No. 42 Artisans Row, Colombo 07"
                                className="w-full bg-warm-beige border border-accent/20 focus:border-accent/60 rounded-xl px-4 py-3 text-xs text-earth-text placeholder-earth-text/40 outline-none transition-all shadow-sm"
                            />
                        </div>

                        {/* City */}
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-mono font-bold uppercase tracking-widest text-earth-text/70">
                                City
                            </label>
                            <input
                                type="text"
                                value={city}
                                onChange={(e) => setCity(e.target.value)}
                                placeholder="e.g. Colombo"
                                className="w-full bg-warm-beige border border-accent/20 focus:border-accent/60 rounded-xl px-4 py-3 text-xs text-earth-text placeholder-earth-text/40 outline-none transition-all shadow-sm"
                            />
                        </div>

                        {/* Shop Location */}
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-mono font-bold uppercase tracking-widest text-earth-text/70">
                                Pin Shop Location (Optional)
                            </label>
                            <LocationPicker
                                onChange={async ({ lat, lng }) => {
                                    setLatitude(lat);
                                    setLongitude(lng);
                                    const location = await reverseGeocode(
                                        lat,
                                        lng,
                                    );
                                    if (location) {
                                        setShopAddress(location.address);
                                        setCity(location.city);
                                    }
                                }}
                            />
                        </div>

                        {/* Phone Number */}
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-mono font-bold uppercase tracking-widest text-earth-text/70">
                                Phone Number
                            </label>
                            <input
                                type="tel"
                                value={contactNumber}
                                onChange={(e) =>
                                    setContactNumber(e.target.value)
                                }
                                placeholder="+94 77 123 4567"
                                className="w-full bg-warm-beige border border-accent/20 focus:border-accent/60 rounded-xl px-4 py-3 text-xs text-earth-text placeholder-earth-text/40 outline-none transition-all shadow-sm"
                            />
                        </div>

                        {/* Registration Number */}
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-mono font-bold uppercase tracking-widest text-earth-text/70">
                                Registration Number
                            </label>
                            <input
                                type="text"
                                value={registrationNumber}
                                onChange={(e) =>
                                    setRegistrationNumber(e.target.value)
                                }
                                placeholder="e.g. BR-0092-LK"
                                className="w-full bg-warm-beige border border-accent/20 focus:border-accent/60 rounded-xl px-4 py-3 text-xs text-earth-text placeholder-earth-text/40 outline-none transition-all shadow-sm"
                            />
                        </div>

                        {/* Submit Button */}
                        <div className="pt-4">
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full bg-accent hover:bg-accent-hover text-cream-bg font-bold text-xs uppercase tracking-wider py-4 rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-70 shadow-sm"
                            >
                                {isLoading ? (
                                    <>
                                        <svg
                                            className="w-4 h-4 animate-spin text-cream-bg"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                        >
                                            <circle
                                                className="opacity-25"
                                                cx="12"
                                                cy="12"
                                                r="10"
                                                stroke="currentColor"
                                                strokeWidth="4"
                                            />
                                            <path
                                                className="opacity-75"
                                                fill="currentColor"
                                                d="M4 12a8 8 0 018-8v8H4z"
                                            />
                                        </svg>
                                        Creating Shop...
                                    </>
                                ) : (
                                    <>
                                        Submit And Continue
                                        <svg
                                            className="w-4 h-4"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2.5}
                                                d="M14 5l7 7m0 0l-7 7m7-7H3"
                                            />
                                        </svg>
                                    </>
                                )}
                            </button>
                        </div>
                    </form>

                    {/* Bottom Image */}
                    <div className="w-full h-40 md:h-48 relative overflow-hidden border-t border-accent/15">
                        <img
                            src="https://images.unsplash.com/photo-1598033129183-c4f50c736f10?auto=format&fit=crop&w=600&q=80"
                            alt="Tailor sewing"
                            className="w-full h-full object-cover opacity-60 contrast-125 mix-blend-multiply"
                        />
                    </div>
                </div>

                <div className="mt-6">
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
