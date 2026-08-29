"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/firebase/AuthContext";

import { createClothingRequest } from "@/lib/api/endpoints/orders";
import { getMeasurements } from "@/lib/api/endpoints/profiles";
import type { Measurements } from "@/lib/api/types/profile";
import { uploadToCloudinary } from "@/lib/cloudinary";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "@/lib/firebase/config";

export default function NewTailoringRequestPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { user, logout } = useAuth();
    
    const shopIdParam = searchParams.get("shop_id");

    const [garmentType, setGarmentType] = useState("TWO-PIECE SUIT");
    const [fabricChoice, setFabricChoice] = useState("tailor_provided");
    const [gender, setGender] = useState<"male" | "female" | "unisex">("male");
    const [serviceType, setServiceType] = useState<"online" | "physical_visit">("online");
    const [notes, setNotes] = useState("");
    const [city, setCity] = useState("");
    const [targetBudget, setTargetBudget] = useState("");
    const [targetDate, setTargetDate] = useState("");
    const [submitted, setSubmitted] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [savedMeasurements, setSavedMeasurements] = useState<Measurements | null>(null);
    const [shopName, setShopName] = useState<string | null>(null);

    useEffect(() => {
        if (user) {
            getMeasurements(user.uid)
                .then(setSavedMeasurements)
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
                service_type: serviceType,
                fabric_status: fabricChoice as "client_provided" | "tailor_provided",
                gender: gender,
                target_budget: targetBudget ? parseFloat(targetBudget) : undefined,
                target_date: targetDate || undefined,
                design_image_urls: uploadedImageUrls,
                voice_note_url: voiceUrl || undefined,
                target_shop_ids: shopIdParam ? [parseInt(shopIdParam)] : undefined,
                measurement: savedMeasurements ? {
                    chest: savedMeasurements.chest ? Number(savedMeasurements.chest) : null,
                    waist: savedMeasurements.waist ? Number(savedMeasurements.waist) : null,
                    shoulder: savedMeasurements.shoulder ? Number(savedMeasurements.shoulder) : null,
                    sleeve: savedMeasurements.sleeve ? Number(savedMeasurements.sleeve) : null,
                    neck: savedMeasurements.neck ? Number(savedMeasurements.neck) : null,
                    hip: savedMeasurements.hip ? Number(savedMeasurements.hip) : null,
                    inseam: savedMeasurements.inseam ? Number(savedMeasurements.inseam) : null,
                    length: savedMeasurements.length ? Number(savedMeasurements.length) : null,
                } : undefined,
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

    return (
        <>
            {/* FORM CONTAINER */}
            <main className="max-w-3xl w-full mx-auto px-4 sm:px-8 py-12 flex-1 space-y-8">
                <div>
                    {shopIdParam && (
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#F5CA53]/10 border border-[#F5CA53]/30 rounded-full mb-4">
                            <span className="w-2 h-2 rounded-full bg-[#F5CA53] animate-pulse"></span>
                            <span className="text-[10px] font-bold text-[#F5CA53] tracking-widest uppercase">
                                Direct Request to {shopName}
                            </span>
                        </div>
                    )}
                    <span className="text-[10px] font-mono tracking-[0.25em] text-[#F5CA53] uppercase block mb-1">
                        BESPOKE COMMISSION
                    </span>
                    <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight font-heading">
                        New Tailoring Request
                    </h1>
                    <p className="text-xs sm:text-sm text-zinc-400 mt-2 leading-relaxed">
                        Specify your bespoke garment requirements to connect with top Sri Lankan master tailors.
                    </p>
                </div>

                {submitted ? (
                    <div className="bg-[#121318] border border-[#F5CA53]/40 rounded-2xl p-8 text-center space-y-4 shadow-2xl">
                        <div className="w-12 h-12 rounded-full bg-[#F5CA53]/20 border border-[#F5CA53] flex items-center justify-center mx-auto text-[#F5CA53] text-xl font-bold">
                            ✓
                        </div>
                        <h2 className="text-xl font-bold text-white font-heading">Request Dispatched!</h2>
                        <p className="text-xs text-zinc-400">
                            Local ateliers{city ? ` in ${city}` : ""} are reviewing your specification. Redirecting to your dashboard...
                        </p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="bg-[#121318] border border-zinc-800/80 rounded-2xl p-6 sm:p-10 shadow-2xl space-y-6">

                        {/* Error Banner */}
                        {error && (
                            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-medium">
                                {error}
                            </div>
                        )}

                        {/* GARMENT TYPE */}
                        <div>
                            <label className="block text-[10px] font-mono font-bold uppercase tracking-widest text-[#F5CA53] mb-2">
                                GARMENT TYPE
                            </label>
                            <select
                                value={garmentType}
                                onChange={(e) => setGarmentType(e.target.value)}
                                className="w-full bg-[#18191E] border border-zinc-800 rounded-xl p-3.5 text-xs font-bold text-white uppercase focus:border-[#F5CA53] outline-none transition-all"
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
                            <label className="block text-[10px] font-mono font-bold uppercase tracking-widest text-[#F5CA53] mb-2">
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
                                            ? "bg-[#F5CA53] text-black border-[#F5CA53] shadow-[0_0_12px_rgba(245,202,83,0.3)]"
                                            : "bg-[#18191E] text-zinc-400 border-zinc-800 hover:border-zinc-600"
                                            }`}
                                    >
                                        {label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* FABRIC PREFERENCE */}
                        <div>
                            <label className="block text-[10px] font-mono font-bold uppercase tracking-widest text-[#F5CA53] mb-2">
                                FABRIC / MATERIAL
                            </label>
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    type="button"
                                    onClick={() => setFabricChoice("tailor_provided")}
                                    className={`py-3.5 rounded-xl text-xs font-bold uppercase tracking-wider border transition-all flex flex-col items-center gap-1 ${fabricChoice === "tailor_provided"
                                        ? "bg-[#F5CA53] text-black border-[#F5CA53] shadow-[0_0_12px_rgba(245,202,83,0.3)]"
                                        : "bg-[#18191E] text-zinc-400 border-zinc-800"
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
                                        ? "bg-[#F5CA53] text-black border-[#F5CA53] shadow-[0_0_12px_rgba(245,202,83,0.3)]"
                                        : "bg-[#18191E] text-zinc-400 border-zinc-800"
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
                            <label className="block text-[10px] font-mono font-bold uppercase tracking-widest text-[#F5CA53] mb-2">
                                SERVICE TYPE
                            </label>
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    type="button"
                                    onClick={() => setServiceType("online")}
                                    className={`py-3 rounded-xl text-xs font-bold uppercase tracking-wider border transition-all ${serviceType === "online"
                                        ? "bg-[#F5CA53] text-black border-[#F5CA53]"
                                        : "bg-[#18191E] text-zinc-400 border-zinc-800 hover:border-zinc-600"
                                        }`}
                                >
                                    Online / Remote
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setServiceType("physical_visit")}
                                    className={`py-3 rounded-xl text-xs font-bold uppercase tracking-wider border transition-all ${serviceType === "physical_visit"
                                        ? "bg-[#F5CA53] text-black border-[#F5CA53]"
                                        : "bg-[#18191E] text-zinc-400 border-zinc-800 hover:border-zinc-600"
                                        }`}
                                >
                                    Physical Visit
                                </button>
                            </div>
                        </div>

                    {/* Saved Measurements Badge */}
                    <div className="bg-[#121318] p-4 rounded-xl border border-zinc-800/80 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-[#F5CA53]">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2-1-2 1M4 7l2-1M4 7l2 1M4 7v2.5M12 21l-2-1m2 1l2-1m-2 1v-2.5M6 18l-2-1v-2.5M18 18l2-1v-2.5" /></svg>
                            </div>
                            <div>
                                <p className="text-sm font-bold text-white">Measurement Profile</p>
                                <p className="text-xs text-zinc-500 mt-0.5">
                                    {savedMeasurements ? "Your saved bespoke measurements will be attached securely to this request." : "No saved measurements found. Tailors will ask for them later."}
                                </p>
                            </div>
                        </div>
                        <Link href="/client/profile" className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 hover:text-[#F5CA53] transition-colors border border-zinc-800 px-3 py-1.5 rounded-lg hover:border-[#F5CA53]">
                            Edit
                        </Link>
                    </div>

                        {/* TARGET BUDGET & DATE (two-column) */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[10px] font-mono font-bold uppercase tracking-widest text-[#F5CA53] mb-2">
                                    TARGET BUDGET (LKR)
                                </label>
                                <input
                                    type="number"
                                    value={targetBudget}
                                    onChange={(e) => setTargetBudget(e.target.value)}
                                    placeholder="e.g. 25000"
                                    min={0}
                                    className="w-full bg-[#18191E] border border-zinc-800 rounded-xl p-3.5 text-xs font-bold text-white focus:border-[#F5CA53] outline-none transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-mono font-bold uppercase tracking-widest text-[#F5CA53] mb-2">
                                    TARGET COMPLETION DATE
                                </label>
                                <input
                                    type="date"
                                    value={targetDate}
                                    onChange={(e) => setTargetDate(e.target.value)}
                                    className="w-full bg-[#18191E] border border-zinc-800 rounded-xl p-3.5 text-xs font-bold text-white focus:border-[#F5CA53] outline-none transition-all [color-scheme:dark]"
                                />
                            </div>
                        </div>

                        {/* PREFERRED CITY / LOCATION */}
                        <div>
                            <label className="block text-[10px] font-mono font-bold uppercase tracking-widest text-[#F5CA53] mb-2">
                                PREFERRED CITY / LOCATION
                            </label>
                            <input
                                type="text"
                                value={city}
                                onChange={(e) => setCity(e.target.value)}
                                placeholder="e.g. Colombo 07, Kandy"
                                className="w-full bg-[#18191E] border border-zinc-800 rounded-xl p-3.5 text-xs font-bold text-white focus:border-[#F5CA53] outline-none transition-all"
                            />
                        </div>

                        {/* SPECIAL INSTRUCTIONS & FIT NOTES */}
                        <div>
                            <label className="block text-[10px] font-mono font-bold uppercase tracking-widest text-[#F5CA53] mb-2">
                                SPECIAL INSTRUCTIONS &amp; FIT NOTES
                            </label>
                            <textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="Describe fit, lapel preference (Peak vs Notch), event date, any special requirements..."
                                rows={4}
                                className="w-full bg-[#18191E] border border-zinc-800 rounded-xl p-3.5 text-xs font-medium text-white focus:border-[#F5CA53] outline-none resize-none transition-all"
                            />
                        </div>

                        {/* RICH MEDIA */}
                        <div className="p-5 bg-[#18191E] rounded-xl space-y-5 border border-zinc-800">
                            <div>
                                <label className="block text-[10px] font-mono font-bold uppercase tracking-widest text-[#F5CA53] mb-2">INSPIRATION GALLERY (IMAGES)</label>
                                <input type="file" multiple accept="image/*" onChange={handleImageChange} className="w-full text-xs text-zinc-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-zinc-800 file:text-[#F5CA53] hover:file:bg-zinc-700 transition-all cursor-pointer" />
                            </div>
                            
                            <div>
                                <label className="block text-[10px] font-mono font-bold uppercase tracking-widest text-[#F5CA53] mb-2">VOICE NOTE INSTRUCTIONS</label>
                                <div className="flex items-center gap-4">
                                    {isRecording ? (
                                        <button type="button" onClick={stopRecording} className="px-5 py-2.5 bg-rose-500/10 text-rose-400 border border-rose-500/30 rounded-xl text-xs font-bold animate-pulse hover:bg-rose-500/20 transition-all">Stop Recording</button>
                                    ) : (
                                        <button type="button" onClick={startRecording} className="px-5 py-2.5 bg-zinc-800 text-zinc-300 border border-zinc-700 rounded-xl text-xs font-bold hover:text-white hover:border-zinc-500 transition-all">Record Audio</button>
                                    )}
                                    {voiceBlob && <span className="text-xs text-[#F5CA53] font-bold flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#F5CA53] inline-block"></span> Audio attached</span>}
                                </div>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={submitting}
                            className="w-full py-4 rounded-xl bg-[#F5CA53] hover:bg-[#f7d369] disabled:opacity-60 text-xs font-black uppercase tracking-[0.15em] text-black shadow-[0_0_20px_rgba(245,202,83,0.3)] transition-all hover:scale-[1.01]"
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
            </main>
        </>
    );
}
