"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/firebase/AuthContext";

import { createClothingRequest } from "@/lib/api/endpoints/orders";
import { getMeasurements, updateMeasurements } from "@/lib/api/endpoints/profiles";
import type { Measurements } from "@/lib/api/types/profile";
import { uploadToCloudinary } from "@/lib/cloudinary";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "@/lib/firebase/config";
import MapWithOverlay from "@/components/map/MapWithOverlay";
import { reverseGeocode } from "@/lib/geocoding";

export default function NewTailoringRequestPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { user, logout } = useAuth();
    
    const shopIdParam = searchParams.get("shop_id");

    const [garmentType, setGarmentType] = useState("TWO-PIECE SUIT");
    const [fabricChoice, setFabricChoice] = useState("shop_provides");
    const [gender, setGender] = useState<"male" | "female" | "unisex">("male");
    const [serviceType, setServiceType] = useState<"online" | "physical_visit">("online");
    const [notes, setNotes] = useState("");
    const [city, setCity] = useState("");
    const [latitude, setLatitude] = useState<number | null>(null);
    const [longitude, setLongitude] = useState<number | null>(null);
    const [targetBudget, setTargetBudget] = useState("");
    const [targetDate, setTargetDate] = useState("");
    const [submitted, setSubmitted] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [savedMeasurements, setSavedMeasurements] = useState<Measurements | null>(null);
    const [shopName, setShopName] = useState<string | null>(null);
    const [mapKey, setMapKey] = useState(0);
    
    // Measurement Modal State
    const [isMeasurementModalOpen, setIsMeasurementModalOpen] = useState(false);
    const [savingMeasurements, setSavingMeasurements] = useState(false);
    const [measurementForm, setMeasurementForm] = useState({
        chest: "", waist: "", hip: "", shoulder: "",
        sleeve: "", neck: "", inseam: "", length: "", notes: ""
    });
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        if (user) {
            getMeasurements(user.uid)
                .then(measurements => {
                    setSavedMeasurements(measurements);
                    if (measurements) {
                        setMeasurementForm({
                            chest: measurements.chest?.toString() || "",
                            waist: measurements.waist?.toString() || "",
                            hip: measurements.hip?.toString() || "",
                            shoulder: measurements.shoulder?.toString() || "",
                            sleeve: measurements.sleeve?.toString() || "",
                            neck: measurements.neck?.toString() || "",
                            inseam: measurements.inseam?.toString() || "",
                            length: measurements.length?.toString() || "",
                            notes: measurements.notes || ""
                        });
                    }
                })
                .catch(err => console.log("No saved measurements found", err));
        }
        // In a real app we'd fetch the shop name using shopIdParam here too
        if (shopIdParam) {
            setShopName("Selected Atelier");
        }
    }, [user, shopIdParam]);

    // Inspiration Gallery (Cloudinary)
    const [designImages, setDesignImages] = useState<File[]>([]);
    
    // Voice Note (Firebase Storage)
    const [voiceBlob, setVoiceBlob] = useState<Blob | null>(null);
    const [isRecording, setIsRecording] = useState(false);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<BlobPart[]>([]);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setDesignImages(Array.from(e.target.files));
        }
    };

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorderRef.current = new MediaRecorder(stream);
            chunksRef.current = [];

            mediaRecorderRef.current.ondataavailable = (e) => chunksRef.current.push(e.data);
            mediaRecorderRef.current.onstop = () => {
                const blob = new Blob(chunksRef.current, { type: "audio/webm" });
                setVoiceBlob(blob);
            };

            mediaRecorderRef.current.start();
            setIsRecording(true);
        } catch (err) {
            console.error("Mic error:", err);
            setError("Could not access microphone.");
        }
    };

    const stopRecording = () => {
        mediaRecorderRef.current?.stop();
        setIsRecording(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setError(null);
        try {
            // 1. Upload Images
            const uploadedImageUrls: string[] = [];
            for (const file of designImages) {
                const url = await uploadToCloudinary(file, "image");
                if (url) uploadedImageUrls.push(url);
            }

            // 2. Upload Voice Note
            let voiceUrl = null;
            if (voiceBlob && user) {
                const audioRef = ref(storage, `voice_notes/${user.uid}_${Date.now()}.webm`);
                await uploadBytes(audioRef, voiceBlob);
                voiceUrl = await getDownloadURL(audioRef);
            }

            await createClothingRequest({
                client_id: user?.uid || "guest_client",
                clothing_category: garmentType,
                description: notes || undefined,
                request_location: city || undefined,
                latitude: latitude,
                longitude: longitude,
                service_type: serviceType,
                request_type: shopIdParam ? "direct" : "bidding",
                fabric_status: fabricChoice as "client_provided" | "shop_provides",
                gender: gender,
                target_budget: targetBudget ? parseFloat(targetBudget) : undefined,
                target_date: targetDate || undefined,
                design_image_urls: uploadedImageUrls,
                voice_note_url: voiceUrl || undefined,
                target_shop_ids: shopIdParam ? [parseInt(shopIdParam)] : undefined,
                measurement_profile_id: savedMeasurements ? savedMeasurements.id : undefined,
            });
            setSubmitted(true);
            setTimeout(() => {
                router.push("/client/home");
            }, 1800);
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : "Failed to submit request.";
            setError(msg);
        } finally {
            setSubmitting(false);
        }
    };

    const handleSaveMeasurements = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        setSavingMeasurements(true);
        try {
            await updateMeasurements(user.uid, {
                chest: measurementForm.chest ? parseFloat(measurementForm.chest) : undefined,
                waist: measurementForm.waist ? parseFloat(measurementForm.waist) : undefined,
                hip: measurementForm.hip ? parseFloat(measurementForm.hip) : undefined,
                shoulder: measurementForm.shoulder ? parseFloat(measurementForm.shoulder) : undefined,
                sleeve: measurementForm.sleeve ? parseFloat(measurementForm.sleeve) : undefined,
                neck: measurementForm.neck ? parseFloat(measurementForm.neck) : undefined,
                inseam: measurementForm.inseam ? parseFloat(measurementForm.inseam) : undefined,
                length: measurementForm.length ? parseFloat(measurementForm.length) : undefined,
                notes: measurementForm.notes || null,
            });
            // refresh
            const updated = await getMeasurements(user.uid);
            setSavedMeasurements(updated);
            setIsMeasurementModalOpen(false);
        } catch (err) {
            console.error("Failed to save measurements", err);
        } finally {
            setSavingMeasurements(false);
        }
    };

    return (
        <main className="max-w-3xl w-full mx-auto px-4 sm:px-8 py-8 flex-1 space-y-8 bg-warm-beige min-h-screen text-earth-text selection:bg-accent selection:text-cream-bg">
            <div className="bg-cream-bg border border-accent/20 rounded-2xl p-6 sm:p-8 shadow-md">
                {shopIdParam && (
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-accent/10 border border-accent/30 rounded-full mb-4">
                        <span className="w-2 h-2 rounded-full bg-accent animate-pulse"></span>
                        <span className="text-[10px] font-bold text-earth-text tracking-widest uppercase">
                            Direct Request to {shopName}
                        </span>
                    </div>
                )}
                <span className="text-[10px] font-mono tracking-[0.25em] text-earth-text/60 uppercase block mb-1 font-bold">
                    BESPOKE COMMISSION
                </span>
                <h1 className="text-3xl sm:text-4xl font-extrabold text-earth-text tracking-tight font-heading">
                    New Tailoring Request
                </h1>
                <p className="text-xs sm:text-sm text-earth-text/70 mt-2 leading-relaxed font-medium">
                    Specify your bespoke garment requirements to connect with top Sri Lankan master tailors.
                </p>
            </div>

            {submitted ? (
                <div className="bg-cream-bg border border-accent/40 rounded-2xl p-8 text-center space-y-4 shadow-md">
                    <div className="w-12 h-12 rounded-full bg-accent/20 border border-accent flex items-center justify-center mx-auto text-accent text-xl font-bold">
                        ✓
                    </div>
                    <h2 className="text-xl font-bold text-earth-text font-heading">Request Dispatched!</h2>
                    <p className="text-xs text-earth-text/70 font-medium">
                        Local ateliers{city ? ` in ${city}` : ""} are reviewing your specification. Redirecting to your dashboard...
                    </p>
                </div>
            ) : (
                <form onSubmit={handleSubmit} className="bg-cream-bg border border-accent/20 rounded-2xl p-6 sm:p-10 shadow-md space-y-6">

                    {/* Error Banner */}
                    {error && (
                        <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 text-xs font-medium">
                            {error}
                        </div>
                    )}

                    {/* GARMENT TYPE */}
                    <div>
                        <label className="block text-[10px] font-mono font-bold uppercase tracking-widest text-earth-text mb-2">
                            GARMENT TYPE
                        </label>
                        <select
                            value={garmentType}
                            onChange={(e) => setGarmentType(e.target.value)}
                            className="w-full bg-warm-beige/60 border border-accent/30 rounded-xl p-3.5 text-xs font-bold text-earth-text uppercase focus:border-accent outline-none transition-all"
                        >
                            <option value="TWO-PIECE SUIT">TWO-PIECE SUIT (JACKET &amp; TROUSERS)</option>
                            <option value="THREE-PIECE TUXEDO">THREE-PIECE TUXEDO</option>
                            <option value="OVERCOAT / TRENCH">OVERCOAT / TRENCH</option>
                            <option value="BESPOKE SHIRT">BESPOKE SHIRT</option>
                            <option value="ALTERATION &amp; REPAIR">ALTERATION &amp; REPAIR</option>
                            <option value="DRESS">DRESS</option>
                            <option value="SAREE BLOUSE">SAREE BLOUSE</option>
                        </select>
                    </div>

                    {/* GENDER */}
                    <div>
                        <label className="block text-[10px] font-mono font-bold uppercase tracking-widest text-earth-text mb-2">
                            FIT PREFERENCE
                        </label>
                        <div className="grid grid-cols-3 gap-3">
                            {([
                                { val: "male", label: "Men's Fit" },
                                { val: "female", label: "Women's Fit" },
                                { val: "unisex", label: "Unisex" },
                            ] as { val: "male" | "female" | "unisex"; label: string }[]).map(({ val, label }) => (
                                <button
                                    key={val}
                                    type="button"
                                    onClick={() => setGender(val)}
                                    className={`py-3 rounded-xl text-xs font-bold uppercase tracking-wider border transition-all ${gender === val
                                        ? "bg-accent text-cream-bg border-accent shadow-sm"
                                        : "bg-warm-beige/60 text-earth-text/80 border-accent/30 hover:border-accent"
                                        }`}
                                >
                                    {label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* FABRIC PREFERENCE */}
                    <div>
                        <label className="block text-[10px] font-mono font-bold uppercase tracking-widest text-earth-text mb-2">
                            FABRIC / MATERIAL
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                type="button"
                                onClick={() => setFabricChoice("shop_provides")}
                                className={`py-3.5 rounded-xl text-xs font-bold uppercase tracking-wider border transition-all flex flex-col items-center gap-1 ${fabricChoice === "shop_provides"
                                    ? "bg-accent text-cream-bg border-accent shadow-sm"
                                    : "bg-warm-beige/60 text-earth-text/80 border-accent/30 hover:border-accent"
                                    }`}
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                                Tailor Sources Fabric
                            </button>
                            <button
                                type="button"
                                onClick={() => setFabricChoice("client_provided")}
                                className={`py-3.5 rounded-xl text-xs font-bold uppercase tracking-wider border transition-all flex flex-col items-center gap-1 ${fabricChoice === "client_provided"
                                    ? "bg-accent text-cream-bg border-accent shadow-sm"
                                    : "bg-warm-beige/60 text-earth-text/80 border-accent/30 hover:border-accent"
                                    }`}
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                </svg>
                                I Provide Fabric
                            </button>
                        </div>
                    </div>

                    {/* SERVICE TYPE */}
                    <div>
                        <label className="block text-[10px] font-mono font-bold uppercase tracking-widest text-earth-text mb-2">
                            SERVICE TYPE
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                type="button"
                                onClick={() => setServiceType("online")}
                                className={`py-3 rounded-xl text-xs font-bold uppercase tracking-wider border transition-all ${serviceType === "online"
                                    ? "bg-accent text-cream-bg border-accent shadow-sm"
                                    : "bg-warm-beige/60 text-earth-text/80 border-accent/30 hover:border-accent"
                                    }`}
                            >
                                Online / Remote
                            </button>
                            <button
                                type="button"
                                onClick={() => setServiceType("physical_visit")}
                                className={`py-3 rounded-xl text-xs font-bold uppercase tracking-wider border transition-all ${serviceType === "physical_visit"
                                    ? "bg-accent text-cream-bg border-accent shadow-sm"
                                    : "bg-warm-beige/60 text-earth-text/80 border-accent/30 hover:border-accent"
                                    }`}
                            >
                                Physical Visit
                            </button>
                        </div>
                    </div>

                    {/* Saved Measurements Badge */}
                    <div className="bg-warm-beige/80 p-4 rounded-xl border border-accent/20 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-cream-bg border border-accent/30 flex items-center justify-center text-accent">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2-1-2 1M4 7l2-1M4 7l2 1M4 7v2.5M12 21l-2-1m2 1l2-1m-2 1v-2.5M6 18l-2-1v-2.5M18 18l2-1v-2.5" /></svg>
                            </div>
                            <div>
                                <p className="text-sm font-bold text-earth-text">Measurement Profile</p>
                                <p className="text-xs text-earth-text/70 mt-0.5 font-medium">
                                    {savedMeasurements ? "Your saved bespoke measurements will be attached securely to this request." : "No saved measurements found. Tailors will ask for them later."}
                                </p>
                            </div>
                        </div>
                        <button 
                            type="button" 
                            onClick={() => setIsMeasurementModalOpen(true)} 
                            className="text-[10px] font-bold uppercase tracking-widest text-earth-text/80 hover:text-accent transition-colors border border-accent/30 px-3 py-1.5 rounded-lg hover:border-accent bg-cream-bg">
                            Edit
                        </button>
                    </div>

                    {/* TARGET BUDGET & DATE (two-column) */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[10px] font-mono font-bold uppercase tracking-widest text-earth-text mb-2">
                                TARGET BUDGET (LKR)
                            </label>
                            <input
                                type="number"
                                value={targetBudget}
                                onChange={(e) => setTargetBudget(e.target.value)}
                                placeholder="e.g. 25000"
                                min={0}
                                className="w-full bg-warm-beige/60 border border-accent/30 rounded-xl p-3.5 text-xs font-bold text-earth-text focus:border-accent outline-none transition-all placeholder-earth-text/50"
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-mono font-bold uppercase tracking-widest text-earth-text mb-2">
                                TARGET COMPLETION DATE
                            </label>
                            <input
                                type="date"
                                value={targetDate}
                                onChange={(e) => setTargetDate(e.target.value)}
                                className="w-full bg-warm-beige/60 border border-accent/30 rounded-xl p-3.5 text-xs font-bold text-earth-text focus:border-accent outline-none transition-all"
                            />
                        </div>
                    </div>

                    {/* PREFERRED CITY / LOCATION via Map */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="block text-[10px] font-mono font-bold uppercase tracking-widest text-earth-text">
                                DELIVERY &amp; SERVICE LOCATION
                            </label>
                            <button
                                type="button"
                                onClick={() => setMapKey(k => k + 1)}
                                className="text-[10px] font-black text-accent hover:text-cream-bg hover:bg-accent transition-all border border-accent/40 px-3 py-1.5 rounded-lg flex items-center gap-1.5 bg-accent/10 shadow-sm uppercase tracking-wider"
                            >
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
                                USE SAVED LOCATION
                            </button>
                        </div>
                        <div className="bg-warm-beige/60 border border-accent/30 rounded-2xl overflow-hidden shadow-inner p-1">
                            <MapWithOverlay
                                key={mapKey}
                                onLocationChange={async (loc) => {
                                    setLatitude(loc.lat);
                                    setLongitude(loc.lng);
                                    const res = await reverseGeocode(loc.lat, loc.lng);
                                    if (res && res.city) {
                                        setCity(res.city);
                                    }
                                }}
                            />
                        </div>
                    </div>

                    {/* SPECIAL INSTRUCTIONS & FIT NOTES */}
                    <div>
                        <label className="block text-[10px] font-mono font-bold uppercase tracking-widest text-earth-text mb-2">
                            SPECIAL INSTRUCTIONS &amp; FIT NOTES
                        </label>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Describe fit, lapel preference (Peak vs Notch), event date, any special requirements..."
                            rows={4}
                            className="w-full bg-warm-beige/60 border border-accent/30 rounded-xl p-3.5 text-xs font-medium text-earth-text focus:border-accent outline-none resize-none transition-all placeholder-earth-text/50"
                        />
                    </div>

                    {/* RICH MEDIA */}
                    <div className="p-5 bg-warm-beige/50 rounded-xl space-y-5 border border-accent/20">
                        <div>
                            <label className="block text-[10px] font-mono font-bold uppercase tracking-widest text-earth-text mb-2">INSPIRATION GALLERY (IMAGES)</label>
                            <input type="file" multiple accept="image/*" onChange={handleImageChange} className="w-full text-xs text-earth-text/70 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-cream-bg file:text-earth-text hover:file:bg-accent hover:file:text-cream-bg transition-all cursor-pointer" />
                        </div>

                        <div>
                            <label className="block text-[10px] font-mono font-bold uppercase tracking-widest text-earth-text mb-2">VOICE NOTE INSTRUCTIONS</label>
                            <div className="flex items-center gap-4">
                                {isRecording ? (
                                    <button type="button" onClick={stopRecording} className="px-5 py-2.5 bg-rose-500/10 text-rose-600 border border-rose-500/30 rounded-xl text-xs font-bold animate-pulse hover:bg-rose-500/20 transition-all">Stop Recording</button>
                                ) : (
                                    <button type="button" onClick={startRecording} className="px-5 py-2.5 bg-cream-bg text-earth-text border border-accent/30 rounded-xl text-xs font-bold hover:bg-accent hover:text-cream-bg transition-all">Record Audio</button>
                                )}
                                {voiceBlob && <span className="text-xs text-accent font-bold flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-accent inline-block"></span> Audio attached</span>}
                            </div>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={submitting}
                        className="w-full py-4 rounded-xl bg-accent hover:bg-earth-text disabled:opacity-60 text-xs font-black uppercase tracking-[0.15em] text-cream-bg shadow-md transition-all"
                    >
                        {submitting ? (
                            <span className="flex items-center justify-center gap-2">
                                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                                </svg>
                                Dispatching...
                            </span>
                        ) : (
                            "DISPATCH REQUEST TO ATELIERS →"
                        )}
                    </button>
                </form>
            )}
            
            {/* Measurement Settings Modal */}
            {mounted && isMeasurementModalOpen && createPortal(
                <div className="fixed inset-0 z-[100] flex items-start sm:items-center justify-center bg-black/40 backdrop-blur-sm p-4 pt-20 sm:pt-4 overflow-y-auto">
                    <div className="bg-cream-bg rounded-2xl border border-accent/20 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
                        <div className="p-6 border-b border-accent/10 flex items-center justify-between sticky top-0 bg-cream-bg z-10">
                            <h2 className="text-xl font-bold text-earth-text font-serif flex items-center gap-2">
                                <span className="text-accent">03</span> Bespoke Measurements
                            </h2>
                            <button 
                                onClick={() => setIsMeasurementModalOpen(false)}
                                className="text-earth-text/50 hover:text-earth-text transition-colors p-1"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>
                        <div className="p-6 space-y-6">
                            <p className="text-xs text-earth-text/70">
                                Save these once, and automatically apply them to all future bespoke requests. All values in inches.
                            </p>
                            <form onSubmit={handleSaveMeasurements} className="space-y-6">
                                <div className="grid grid-cols-2 gap-x-4 gap-y-6">
                                    <div>
                                        <label className="text-[10px] font-mono tracking-widest text-accent uppercase block mb-1 font-semibold">Chest</label>
                                        <input type="number" step="0.1" value={measurementForm.chest} onChange={e => setMeasurementForm({...measurementForm, chest: e.target.value})} className="w-full px-4 py-3 bg-white/90 border border-accent/20 focus:border-accent rounded-xl text-sm text-earth-text focus:outline-none transition-all text-center font-mono" />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-mono tracking-widest text-accent uppercase block mb-1 font-semibold">Waist</label>
                                        <input type="number" step="0.1" value={measurementForm.waist} onChange={e => setMeasurementForm({...measurementForm, waist: e.target.value})} className="w-full px-4 py-3 bg-white/90 border border-accent/20 focus:border-accent rounded-xl text-sm text-earth-text focus:outline-none transition-all text-center font-mono" />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-mono tracking-widest text-accent uppercase block mb-1 font-semibold">Hips</label>
                                        <input type="number" step="0.1" value={measurementForm.hip} onChange={e => setMeasurementForm({...measurementForm, hip: e.target.value})} className="w-full px-4 py-3 bg-white/90 border border-accent/20 focus:border-accent rounded-xl text-sm text-earth-text focus:outline-none transition-all text-center font-mono" />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-mono tracking-widest text-accent uppercase block mb-1 font-semibold">Inseam</label>
                                        <input type="number" step="0.1" value={measurementForm.inseam} onChange={e => setMeasurementForm({...measurementForm, inseam: e.target.value})} className="w-full px-4 py-3 bg-white/90 border border-accent/20 focus:border-accent rounded-xl text-sm text-earth-text focus:outline-none transition-all text-center font-mono" />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-mono tracking-widest text-accent uppercase block mb-1 font-semibold">Shoulder</label>
                                        <input type="number" step="0.1" value={measurementForm.shoulder} onChange={e => setMeasurementForm({...measurementForm, shoulder: e.target.value})} className="w-full px-4 py-3 bg-white/90 border border-accent/20 focus:border-accent rounded-xl text-sm text-earth-text focus:outline-none transition-all text-center font-mono" />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-mono tracking-widest text-accent uppercase block mb-1 font-semibold">Sleeve</label>
                                        <input type="number" step="0.1" value={measurementForm.sleeve} onChange={e => setMeasurementForm({...measurementForm, sleeve: e.target.value})} className="w-full px-4 py-3 bg-white/90 border border-accent/20 focus:border-accent rounded-xl text-sm text-earth-text focus:outline-none transition-all text-center font-mono" />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-mono tracking-widest text-accent uppercase block mb-1 font-semibold">Neck</label>
                                        <input type="number" step="0.1" value={measurementForm.neck} onChange={e => setMeasurementForm({...measurementForm, neck: e.target.value})} className="w-full px-4 py-3 bg-white/90 border border-accent/20 focus:border-accent rounded-xl text-sm text-earth-text focus:outline-none transition-all text-center font-mono" />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-mono tracking-widest text-accent uppercase block mb-1 font-semibold">Full Length</label>
                                        <input type="number" step="0.1" value={measurementForm.length} onChange={e => setMeasurementForm({...measurementForm, length: e.target.value})} className="w-full px-4 py-3 bg-white/90 border border-accent/20 focus:border-accent rounded-xl text-sm text-earth-text focus:outline-none transition-all text-center font-mono" />
                                    </div>
                                    <div className="col-span-2">
                                        <label className="text-[10px] font-mono tracking-widest text-accent uppercase block mb-1 font-semibold">Fit Preferences & Notes</label>
                                        <textarea rows={3} value={measurementForm.notes} onChange={e => setMeasurementForm({...measurementForm, notes: e.target.value})} className="w-full px-4 py-3 bg-white/90 border border-accent/20 focus:border-accent rounded-xl text-sm text-earth-text focus:outline-none transition-all resize-none font-mono" />
                                    </div>
                                </div>
                                <div className="pt-4 flex items-center justify-end gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setIsMeasurementModalOpen(false)}
                                        className="px-5 py-2.5 rounded-xl border border-earth-text/20 text-earth-text text-xs font-bold uppercase tracking-widest hover:bg-earth-text/5 transition-all"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={savingMeasurements}
                                        className="px-5 py-2.5 bg-accent text-white text-xs font-bold uppercase tracking-widest rounded-xl hover:bg-accent-hover transition-all shadow-md disabled:opacity-50"
                                    >
                                        {savingMeasurements ? "Saving..." : "Save Measurements"}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            , document.body)}
        </main>
    );
}
