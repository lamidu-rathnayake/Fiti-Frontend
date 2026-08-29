"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/lib/firebase/AuthContext";
import { createShop } from "@/lib/api/endpoints/shops";

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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!shopName.trim()) {
            setError("Shop name is required.");
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
                contact_number: contactNumber.trim() || undefined,
                registration_number: registrationNumber.trim() || undefined,
            });

            // Store shop name in localStorage for UI breadcrumbs / quick access
            try {
                const existingShops: number[] = JSON.parse(localStorage.getItem("tailorShopIds") || "[]");
                if (!existingShops.includes(newShop.shop_id)) {
                    localStorage.setItem("tailorShopIds", JSON.stringify([...existingShops, newShop.shop_id]));
                }
                localStorage.setItem("tailorSelectedShopId", String(newShop.shop_id));
                localStorage.setItem("tailorSelectedShop", newShop.shop_name);
            } catch {
                // localStorage not critical
            }

            router.push("/tailor/home");
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : "Failed to create shop. Please check your details and try again.";
            setError(msg);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#070707] text-white font-sans relative overflow-x-hidden selection:bg-[#F5CA53] selection:text-black">
            {/* Background Gradient Effect */}
            <div className="absolute top-0 left-0 w-full h-[50vh] bg-gradient-to-br from-[#5D5735]/40 via-[#2A2715]/20 to-transparent pointer-events-none z-0"></div>

            <div className="relative z-10 max-w-lg mx-auto pt-16 pb-24 px-6 flex flex-col items-center">
                {/* Header Section */}
                <div className="text-center mb-10 space-y-3">
                    <h1 className="text-3xl font-medium text-white tracking-tight">Add Your Shop</h1>
                    <p className="text-[13px] text-zinc-400 max-w-[280px] mx-auto leading-relaxed">
                        Create your digital atelier presence and connect with clients.
                    </p>
                </div>

                {/* Form Container */}
                <div className="w-full bg-[#18191E]/60 backdrop-blur-md border border-zinc-700/50 rounded-[28px] overflow-hidden shadow-2xl">
                    <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-5">

                        {/* Error Banner */}
                        {error && (
                            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-medium">
                                {error}
                            </div>
                        )}

                        {/* Shop Name */}
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-[#B5B099]">
                                Shop Name <span className="text-rose-400">*</span>
                            </label>
                            <input
                                type="text"
                                value={shopName}
                                onChange={(e) => setShopName(e.target.value)}
                                placeholder="e.g. SAVILE & SONS"
                                required
                                className="w-full bg-[#1F2025] border border-zinc-700 focus:border-[#F5CA53] rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-600 outline-none transition-colors"
                            />
                        </div>

                        {/* Specialty */}
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-[#B5B099]">Specialty</label>
                            <input
                                type="text"
                                value={specialty}
                                onChange={(e) => setSpecialty(e.target.value)}
                                placeholder="e.g. Bespoke Suits, Wedding Attire"
                                className="w-full bg-[#1F2025] border border-zinc-700 focus:border-[#F5CA53] rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-600 outline-none transition-colors"
                            />
                        </div>

                        {/* Shop Bio */}
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-[#B5B099]">Shop Bio</label>
                            <textarea
                                value={shopBio}
                                onChange={(e) => setShopBio(e.target.value)}
                                placeholder="The craft of timeless silhouettes..."
                                rows={3}
                                className="w-full bg-[#1F2025] border border-zinc-700 focus:border-[#F5CA53] rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-600 outline-none transition-colors resize-none"
                            />
                        </div>

                        {/* Street Address */}
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-[#B5B099]">Street Address</label>
                            <input
                                type="text"
                                value={shopAddress}
                                onChange={(e) => setShopAddress(e.target.value)}
                                placeholder="No. 42 Artisans Row, Colombo 07"
                                className="w-full bg-[#1F2025] border border-zinc-700 focus:border-[#F5CA53] rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-600 outline-none transition-colors"
                            />
                        </div>

                        {/* City */}
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-[#B5B099]">City</label>
                            <input
                                type="text"
                                value={city}
                                onChange={(e) => setCity(e.target.value)}
                                placeholder="e.g. Colombo"
                                className="w-full bg-[#1F2025] border border-zinc-700 focus:border-[#F5CA53] rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-600 outline-none transition-colors"
                            />
                        </div>

                        {/* Phone Number */}
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-[#B5B099]">Phone Number</label>
                            <input
                                type="tel"
                                value={contactNumber}
                                onChange={(e) => setContactNumber(e.target.value)}
                                placeholder="+94 77 123 4567"
                                className="w-full bg-[#1F2025] border border-zinc-700 focus:border-[#F5CA53] rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-600 outline-none transition-colors"
                            />
                        </div>

                        {/* Registration Number */}
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-[#B5B099]">Registration Number</label>
                            <input
                                type="text"
                                value={registrationNumber}
                                onChange={(e) => setRegistrationNumber(e.target.value)}
                                placeholder="e.g. BR-0092-LK"
                                className="w-full bg-[#1F2025] border border-zinc-700 focus:border-[#F5CA53] rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-600 outline-none transition-colors"
                            />
                        </div>

                        {/* Submit Button */}
                        <div className="pt-4">
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full bg-[#F5CA53] hover:bg-[#e4bb49] text-black font-bold text-xs uppercase tracking-widest py-4 rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-70 shadow-lg shadow-[#F5CA53]/20"
                            >
                                {isLoading ? (
                                    <>
                                        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                                        </svg>
                                        Creating Shop...
                                    </>
                                ) : (
                                    <>
                                        Submit And Continue
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                        </svg>
                                    </>
                                )}
                            </button>
                        </div>
                    </form>

                    {/* Bottom Image */}
                    <div className="w-full h-40 md:h-48 mt-2 relative">
                        <div className="absolute inset-0 bg-gradient-to-t from-transparent to-[#18191E]/60 z-10"></div>
                        <img
                            src="https://images.unsplash.com/photo-1598033129183-c4f50c736f10?auto=format&fit=crop&w=600&q=80"
                            alt="Tailor sewing"
                            className="w-full h-full object-cover grayscale opacity-70 contrast-125"
                        />
                    </div>
                </div>

                <div className="mt-6">
                    <Link href="/tailor/home" className="text-xs text-zinc-500 hover:text-white transition-colors">
                        Cancel and return to dashboard
                    </Link>
                </div>
            </div>
        </div>
    );
}
