"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useAuth } from "@/lib/firebase/AuthContext";
import { updateTailorProfile } from "@/lib/api/endpoints/profiles";

export default function LocationPage() {
    const router = useRouter();
    const { user } = useAuth();
    const [currentLocation, setCurrentLocation] = useState("Colombo, Sri Lanka");
    const [isDetecting, setIsDetecting] = useState(false);
    const [manualCity, setManualCity] = useState("");
    const [manualCountry, setManualCountry] = useState("");
    const [statusMessage, setStatusMessage] = useState<string | null>(null);

    useEffect(() => {
        const storedLoc = localStorage.getItem("tailorLocation");
        if (storedLoc) {
            setCurrentLocation(storedLoc);
        }
    }, []);

    // Automatic GPS Geolocation Detection
    const handleDetectLocation = () => {
        setIsDetecting(true);
        setStatusMessage(null);

        if (!navigator.geolocation) {
            setStatusMessage("Geolocation is not supported by your browser.");
            setIsDetecting(false);
            return;
        }

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;
                try {
                    // Reverse geocoding via public openstreetmap API
                    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
                    const data = await res.json();
                    
                    const city = data.address.city || data.address.town || data.address.village || data.address.state || "Detected City";
                    const country = data.address.country || "Global";
                    const formatted = `${city}, ${country}`;
                    
                    setCurrentLocation(formatted);
                    localStorage.setItem("tailorLocation", formatted);
                    setStatusMessage(`Location updated to ${formatted}`);

                    // Persist city + GPS coordinates to backend
                    if (user) {
                        updateTailorProfile(user.uid, {
                            city,
                            latitude,
                            longitude,
                        }).catch(console.error);
                    }
                    
                    setTimeout(() => {
                        router.push("/tailor/home");
                    }, 1200);
                } catch (e) {
                    // Fallback based on coords
                    const fallbackLoc = `Lat: ${latitude.toFixed(2)}, Lon: ${longitude.toFixed(2)}`;
                    setCurrentLocation(fallbackLoc);
                    localStorage.setItem("tailorLocation", fallbackLoc);
                    setStatusMessage(`GPS Located: ${fallbackLoc}`);
                    // Still persist coordinates to backend
                    if (user) {
                        updateTailorProfile(user.uid, { latitude, longitude }).catch(console.error);
                    }
                    setTimeout(() => router.push("/tailor/home"), 1200);
                } finally {
                    setIsDetecting(false);
                }
            },
            (error) => {
                setIsDetecting(false);
                setStatusMessage("Unable to retrieve GPS coordinates. Please allow location permissions or set manually.");
            },
            { timeout: 10000 }
        );
    };

    // Manual Save
    const handleManualSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!manualCity.trim()) return;

        const formatted = manualCountry.trim() 
            ? `${manualCity.trim()}, ${manualCountry.trim()}` 
            : manualCity.trim();

        setCurrentLocation(formatted);
        localStorage.setItem("tailorLocation", formatted);

        // Persist city to backend
        if (user) {
            updateTailorProfile(user.uid, { city: manualCity.trim() }).catch(console.error);
        }

        router.push("/tailor/home");
    };

    // Preset quick picks
    const handleSelectPreset = (preset: string) => {
        setCurrentLocation(preset);
        localStorage.setItem("tailorLocation", preset);
        // Persist city to backend (extract city part before the comma)
        if (user) {
            const cityPart = preset.split(",")[0].trim();
            updateTailorProfile(user.uid, { city: cityPart }).catch(console.error);
        }
        router.push("/tailor/home");
    };

    return (
        <div className="min-h-screen bg-[#070708] text-white font-sans selection:bg-[#F5CA53] selection:text-black relative overflow-hidden">
            {/* Ambient Gold & Black Luxury Lighting */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-5xl h-[500px] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#554618]/30 via-[#1e190b]/20 to-transparent pointer-events-none z-0"></div>
            <div className="absolute top-1/3 -left-32 w-80 h-80 bg-[#F5CA53]/10 rounded-full blur-[130px] pointer-events-none z-0"></div>

            <div className="relative z-10 max-w-lg mx-auto pt-12 pb-24 px-6 flex flex-col items-center min-h-screen justify-between">
                
                <div className="w-full space-y-8">
                    {/* Top Bar with Back Button */}
                    <div className="flex items-center justify-between">
                        <Link href="/tailor/home" className="w-10 h-10 bg-[#141418] border border-[#F5CA53]/20 rounded-full flex items-center justify-center text-zinc-400 hover:text-white hover:border-[#F5CA53] transition-all">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                        </Link>
                        <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#F5CA53]">Location Settings</span>
                        <div className="w-10"></div>
                    </div>

                    {/* Header */}
                    <div className="text-center space-y-2">
                        <h1 className="text-3xl font-light tracking-tight text-white">
                            Set Your <span className="font-semibold text-[#F5CA53] drop-shadow-[0_0_15px_rgba(245,202,83,0.3)]">Location</span>
                        </h1>
                        <p className="text-xs text-zinc-400 max-w-[290px] mx-auto leading-relaxed">
                            Configure your atelier hub to connect with local bespoke clientele.
                        </p>
                    </div>

                    {/* Current Active Location Display */}
                    <div className="bg-[#141418]/80 backdrop-blur-xl border border-[#F5CA53]/30 rounded-[20px] p-4 flex items-center justify-between shadow-xl">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-[#F5CA53]/10 border border-[#F5CA53]/20 flex items-center justify-center text-[#F5CA53]">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                            </div>
                            <div>
                                <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-500 block">Current Atelier City</span>
                                <span className="text-sm font-semibold text-white">{currentLocation}</span>
                            </div>
                        </div>
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.8)]"></span>
                    </div>

                    {statusMessage && (
                        <div className="p-3 bg-[#26282D] border border-zinc-700 rounded-xl text-xs text-center text-zinc-300">
                            {statusMessage}
                        </div>
                    )}

                    {/* Option 1: Automatic GPS Button */}
                    <div className="space-y-3">
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#A39A7C] block px-1">Automatic Detection</span>
                        <button
                            onClick={handleDetectLocation}
                            disabled={isDetecting}
                            className="w-full bg-[#1A1914] hover:bg-[#232014] border border-[#F5CA53]/40 hover:border-[#F5CA53] rounded-2xl p-4 flex items-center justify-between transition-all group shadow-lg"
                        >
                            <div className="flex items-center gap-3.5 text-left">
                                <div className="w-10 h-10 rounded-xl bg-[#F5CA53] text-black flex items-center justify-center shrink-0 shadow-md group-hover:scale-105 transition-transform">
                                    {isDetecting ? (
                                        <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path></svg>
                                    ) : (
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                    )}
                                </div>
                                <div>
                                    <h3 className="text-sm font-semibold text-white group-hover:text-[#F5CA53] transition-colors">Use My Current Location</h3>
                                    <p className="text-[11px] text-zinc-400">Detect your exact GPS city automatically</p>
                                </div>
                            </div>
                            <svg className="w-4 h-4 text-zinc-500 group-hover:text-[#F5CA53] group-hover:translate-x-0.5 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                        </button>
                    </div>

                    {/* Option 2: Set Location Manually */}
                    <div className="space-y-4">
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#A39A7C] block px-1">Set Location Manually</span>
                        
                        <form onSubmit={handleManualSubmit} className="bg-[#141418]/80 backdrop-blur-xl border border-zinc-800/80 rounded-[24px] p-5 space-y-4 shadow-xl">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">City / District</label>
                                <input
                                    type="text"
                                    placeholder="e.g. London, Colombo, Milan"
                                    value={manualCity}
                                    onChange={(e) => setManualCity(e.target.value)}
                                    required
                                    className="w-full bg-[#1F2025] border border-zinc-700 focus:border-[#F5CA53] rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-600 outline-none transition-colors"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Country / State (Optional)</label>
                                <input
                                    type="text"
                                    placeholder="e.g. UK, Sri Lanka, Italy"
                                    value={manualCountry}
                                    onChange={(e) => setManualCountry(e.target.value)}
                                    className="w-full bg-[#1F2025] border border-zinc-700 focus:border-[#F5CA53] rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-600 outline-none transition-colors"
                                />
                            </div>

                            <button
                                type="submit"
                                className="w-full bg-[#F5CA53] hover:bg-[#e4bb49] text-black font-bold text-xs uppercase tracking-widest py-3.5 rounded-xl transition-all shadow-lg shadow-[#F5CA53]/20 active:scale-[0.98]"
                            >
                                Apply Manual Location
                            </button>
                        </form>
                    </div>

                    {/* Quick Atelier Cities */}
                    <div className="space-y-2.5">
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 block px-1">Popular Atelier Hubs</span>
                        <div className="flex flex-wrap gap-2">
                            {["London, UK", "Colombo, Sri Lanka", "Milan, Italy", "Paris, France", "New York, USA"].map((hub) => (
                                <button
                                    key={hub}
                                    onClick={() => handleSelectPreset(hub)}
                                    className="px-3.5 py-1.5 rounded-full bg-[#141418] border border-zinc-800 text-xs text-zinc-400 hover:text-[#F5CA53] hover:border-[#F5CA53]/40 transition-colors"
                                >
                                    {hub}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="mt-8">
                    <Link href="/tailor/home" className="text-xs text-zinc-500 hover:text-white transition-colors">
                        Cancel and return to dashboard
                    </Link>
                </div>
            </div>
        </div>
    );
}
