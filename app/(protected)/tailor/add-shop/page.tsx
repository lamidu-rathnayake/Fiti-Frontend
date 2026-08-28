"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function AddShopPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [shopName, setShopName] = useState("");

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        // Simulate an API call
        setTimeout(() => {
            // Save to localStorage for demo purposes
            const existingShops = JSON.parse(localStorage.getItem('tailorShops') || '["Shop 1"]');
            if (shopName.trim() && !existingShops.includes(shopName.trim())) {
                const updatedShops = [...existingShops, shopName.trim()];
                localStorage.setItem('tailorShops', JSON.stringify(updatedShops));
            }
            localStorage.setItem('tailorSelectedShop', shopName.trim() || "Shop 1");
            
            setIsLoading(false);
            router.push("/tailor/home");
        }, 1000);
    };

    return (
        <div className="min-h-screen bg-[#070707] text-white font-sans relative overflow-x-hidden selection:bg-[#F5CA53] selection:text-black">
            {/* Background Gradient Effect matching the design */}
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
                        
                        {/* Shop Name */}
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-[#B5B099]">Shop Name</label>
                            <input 
                                type="text" 
                                value={shopName}
                                onChange={(e) => setShopName(e.target.value)}
                                placeholder="e.g. SAVILE & SONS"
                                required
                                className="w-full bg-[#1F2025] border border-zinc-700 focus:border-[#F5CA53] rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-600 outline-none transition-colors"
                            />
                        </div>

                        {/* Shop Bio */}
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-[#B5B099]">Shop Bio</label>
                            <textarea 
                                placeholder="The craft of timeless silhouettes..."
                                rows={3}
                                required
                                className="w-full bg-[#1F2025] border border-zinc-700 focus:border-[#F5CA53] rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-600 outline-none transition-colors resize-none"
                            ></textarea>
                        </div>

                        {/* Street Address */}
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-[#B5B099]">Street Address</label>
                            <input 
                                type="text" 
                                placeholder="No. 42 Artisans Row"
                                required
                                className="w-full bg-[#1F2025] border border-zinc-700 focus:border-[#F5CA53] rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-600 outline-none transition-colors"
                            />
                        </div>

                        {/* City & Code */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-[#B5B099]">City</label>
                                <input 
                                    type="text" 
                                    placeholder="LONDON"
                                    required
                                    className="w-full bg-[#1F2025] border border-zinc-700 focus:border-[#F5CA53] rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-600 outline-none transition-colors"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-[#B5B099]">Code</label>
                                <input 
                                    type="text" 
                                    placeholder="W1S 3PR"
                                    required
                                    className="w-full bg-[#1F2025] border border-zinc-700 focus:border-[#F5CA53] rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-600 outline-none transition-colors"
                                />
                            </div>
                        </div>

                        {/* Phone Number */}
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-[#B5B099]">Phone Number</label>
                            <input 
                                type="tel" 
                                placeholder="+44 20 7123 4567"
                                required
                                className="w-full bg-[#1F2025] border border-zinc-700 focus:border-[#F5CA53] rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-600 outline-none transition-colors"
                            />
                        </div>

                        {/* Registration Number */}
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-[#B5B099]">Registration Number</label>
                            <input 
                                type="text" 
                                placeholder="VAT-0092-B-XX"
                                required
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
                                {isLoading ? "Processing..." : "Submit And Continue"}
                                {!isLoading && (
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
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
