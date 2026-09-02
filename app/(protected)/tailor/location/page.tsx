"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useAuth } from "@/lib/firebase/AuthContext";
import { updateTailorProfile } from "@/lib/api/endpoints/profiles";
import FullPageLock from "@/components/FullPageLock";

export default function LocationPage() {
    const router = useRouter();
    const { user } = useAuth();
    const [currentLocation, setCurrentLocation] = useState("Colombo, Sri Lanka");
    const [isDetecting, setIsDetecting] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
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

        setIsSaving(true);
        const formatted = manualCountry.trim() 
            ? `${manualCity.trim()}, ${manualCountry.trim()}` 
            : manualCity.trim();

        setCurrentLocation(formatted);
        localStorage.setItem("tailorLocation", formatted);

        // Persist city to backend
        if (user) {
            updateTailorProfile(user.uid, { city: manualCity.trim() }).catch(console.error);
        }

        setTimeout(() => {
            router.push("/tailor/home");
        }, 800);
    };

    // Preset quick picks
    const handleSelectPreset = (preset: string) => {
        setIsSaving(true);
        setCurrentLocation(preset);
        localStorage.setItem("tailorLocation", preset);
        // Persist city to backend (extract city part before the comma)
        if (user) {
            const cityPart = preset.split(",")[0].trim();
            updateTailorProfile(user.uid, { city: cityPart }).catch(console.error);
        }
        setTimeout(() => {
            router.push("/tailor/home");
        }, 800);
    };

    return (
        <div className="min-h-screen bg-warm-beige text-earth-text font-sans selection:bg-accent selection:text-cream-bg relative overflow-hidden">
            <FullPageLock
                isSubmitting={isDetecting || isSaving}
                title="Updating Atelier Location"
                message="Saving location preferences and configuring your regional hub..."
            />
            <div className="relative z-10 max-w-lg mx-auto pt-12 pb-24 px-6 flex flex-col items-center min-h-screen justify-between">
                
                <div className="w-full space-y-8">
                    {/* Top Bar with Back Button */}
                    <div className="flex items-center justify-between">
                        <Link href="/tailor/home" className="w-10 h-10 bg-cream-bg border border-accent/30 rounded-full flex items-center justify-center text-earth-text hover:bg-accent hover:text-cream-bg transition-all shadow-sm">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                        </Link>
                        <span className="text-[10px] font-mono font-bold uppercase tracking-[0.25em] text-accent">Location Settings</span>
                        <div className="w-10"></div>
                    </div>

                    {/* Header */}
                    <div className="text-center space-y-2">
                        <h1 className="text-3xl font-extrabold text-earth-text font-heading">
                            Set Your <span className="text-accent">Location</span>
                        </h1>
                        <p className="text-xs text-earth-text/70 max-w-[300px] mx-auto leading-relaxed">
                            Configure your atelier hub to connect with local bespoke clientele.
                        </p>
                    </div>

                    {/* Current Active Location Display */}
                    <div className="bg-cream-bg border border-accent/30 rounded-2xl p-4 flex items-center justify-between shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                            </div>
                            <div>
                                <span className="text-[9px] font-mono font-bold uppercase tracking-widest text-earth-text/60 block">Current Atelier City</span>
                                <span className="text-sm font-extrabold text-earth-text">{currentLocation}</span>
                            </div>
                        </div>
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 shadow-sm"></span>
                    </div>

                    {statusMessage && (
                        <div className="p-3 bg-cream-bg border border-accent/20 rounded-xl text-xs text-center font-bold text-earth-text/80 shadow-sm">
                            {statusMessage}
                        </div>
                    )}

                    {/* Option 1: Automatic GPS Button */}
                    <div className="space-y-3">
                        <span className="text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-earth-text/60 block px-1">Automatic Detection</span>
                        <button
                            onClick={handleDetectLocation}
                            disabled={isDetecting}
                            className="w-full bg-cream-bg hover:bg-accent/5 border border-accent/30 hover:border-accent rounded-2xl p-4 flex items-center justify-between transition-all group shadow-sm"
                        >
                            <div className="flex items-center gap-3.5 text-left">
                                <div className="w-10 h-10 rounded-xl bg-accent text-cream-bg flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 transition-transform">
                                    {isDetecting ? (
                                        <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path></svg>
                                    ) : (
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                    )}
                                </div>
                                <div>
                                    <h3 className="text-sm font-extrabold text-earth-text group-hover:text-accent transition-colors font-heading">Use My Current Location</h3>
                                    <p className="text-[11px] text-earth-text/60">Detect your exact GPS city automatically</p>
                                </div>
                            </div>
                            <svg className="w-4 h-4 text-earth-text/40 group-hover:text-accent group-hover:translate-x-0.5 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                        </button>
                    </div>

                    {/* Option 2: Set Location Manually */}
                    <div className="space-y-4">
                        <span className="text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-earth-text/60 block px-1">Set Location Manually</span>
                        
                        <form onSubmit={handleManualSubmit} className="bg-cream-bg border border-accent/20 rounded-2xl p-5 space-y-4 shadow-sm">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-mono font-bold uppercase tracking-widest text-earth-text/70">City / District</label>
                                <input
                                    type="text"
                                    placeholder="e.g. London, Colombo, Milan"
                                    value={manualCity}
                                    onChange={(e) => setManualCity(e.target.value)}
                                    required
                                    className="w-full bg-warm-beige border border-accent/20 focus:border-accent/60 rounded-xl px-4 py-3 text-xs text-earth-text placeholder-earth-text/40 outline-none transition-all shadow-sm"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-mono font-bold uppercase tracking-widest text-earth-text/70">Country / State (Optional)</label>
                                <input
                                    type="text"
                                    placeholder="e.g. UK, Sri Lanka, Italy"
                                    value={manualCountry}
                                    onChange={(e) => setManualCountry(e.target.value)}
                                    className="w-full bg-warm-beige border border-accent/20 focus:border-accent/60 rounded-xl px-4 py-3 text-xs text-earth-text placeholder-earth-text/40 outline-none transition-all shadow-sm"
                                />
                            </div>

                            <button
                                type="submit"
                                className="w-full bg-accent hover:bg-accent-hover text-cream-bg font-bold text-xs uppercase tracking-wider py-3.5 rounded-xl transition-all shadow-sm active:scale-[0.98]"
                            >
                                Apply Manual Location
                            </button>
                        </form>
                    </div>

                    {/* Quick Atelier Cities */}
                    <div className="space-y-2.5">
                        <span className="text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-earth-text/60 block px-1">Popular Atelier Hubs</span>
                        <div className="flex flex-wrap gap-2">
                            {["London, UK", "Colombo, Sri Lanka", "Milan, Italy", "Paris, France", "New York, USA"].map((hub) => (
                                <button
                                    key={hub}
                                    onClick={() => handleSelectPreset(hub)}
                                    className="px-3.5 py-1.5 rounded-full bg-cream-bg border border-accent/20 text-xs font-bold text-earth-text/70 hover:text-accent hover:border-accent transition-colors shadow-sm"
                                >
                                    {hub}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="mt-8">
                    <Link href="/tailor/home" className="text-xs font-bold text-earth-text/60 hover:text-earth-text transition-colors">
                        ← Cancel and return to dashboard
                    </Link>
                </div>
            </div>
        </div>
    );
}
