"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/firebase/AuthContext";
import { createClothingRequest } from "@/lib/api/endpoints/orders";
import { uploadToCloudinary } from "@/lib/cloudinary";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "@/lib/firebase/config";
import type { ClothingRequestPayload, ServiceType, Gender, FabricStatus } from "@/lib/api/types/order";

export default function NewRequestPage() {
    const router = useRouter();
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const [form, setForm] = useState({
        service_type: "online" as ServiceType,
        target_date: "",
        target_budget: "",
        clothing_category: "",
        gender: "unisex" as Gender,
        fabric_status: "client_provided" as FabricStatus,
        description: "",
        request_location: "",
    });

    // Inspiration Gallery (Cloudinary)
    const [designImages, setDesignImages] = useState<File[]>([]);
    
    // Voice Note (Firebase Storage)
    const [voiceBlob, setVoiceBlob] = useState<Blob | null>(null);
    const [isRecording, setIsRecording] = useState(false);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<BlobPart[]>([]);

    const handleUpdate = (field: keyof typeof form, value: string) => {
        setForm(f => ({ ...f, [field]: value }));
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setDesignImages(Array.from(e.target.files));
        }
    };

    // --- Media Handlers ---
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

    // --- Submit ---
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        setLoading(true);
        setError("");

        try {
            // 1. Upload Images
            const uploadedImageUrls: string[] = [];
            for (const file of designImages) {
                const url = await uploadToCloudinary(file, "image");
                if (url) uploadedImageUrls.push(url);
            }

            // 2. Upload Voice Note
            let voiceUrl = null;
            if (voiceBlob) {
                const audioRef = ref(storage, `voice_notes/${user.uid}_${Date.now()}.webm`);
                await uploadBytes(audioRef, voiceBlob);
                voiceUrl = await getDownloadURL(audioRef);
            }

            // 3. Submit
            const payload: ClothingRequestPayload = {
                client_id: user.uid,
                service_type: form.service_type,
                target_date: form.target_date || null,
                target_budget: form.target_budget ? Number(form.target_budget) : null,
                clothing_category: form.clothing_category || null,
                gender: form.gender,
                fabric_status: form.fabric_status,
                description: form.description || null,
                request_location: form.request_location || null,
                design_image_urls: uploadedImageUrls,
                voice_note_url: voiceUrl,
            };

            await createClothingRequest(payload);
            router.push("/client/home"); // Success redirect
        } catch (err) {
            console.error(err);
            setError("Failed to create request.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="min-h-screen bg-slate-50 py-12 px-4">
            <div className="mx-auto max-w-2xl bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
                <h1 className="text-2xl font-bold text-slate-900 mb-2">Create Clothing Request</h1>
                <p className="text-slate-500 mb-8">Post your requirements and get competitive bids from local tailors.</p>

                {error && <div className="mb-6 p-4 bg-rose-50 text-rose-700 rounded-xl text-sm">{error}</div>}

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Basics */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
                            <input required type="text" placeholder="e.g. Wedding Dress" value={form.clothing_category} onChange={e => handleUpdate("clothing_category", e.target.value)} className="w-full border border-slate-300 rounded-xl px-4 py-2 text-sm focus:ring-slate-500" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Budget ($)</label>
                            <input type="number" placeholder="Optional" value={form.target_budget} onChange={e => handleUpdate("target_budget", e.target.value)} className="w-full border border-slate-300 rounded-xl px-4 py-2 text-sm focus:ring-slate-500" />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Service Type</label>
                            <select value={form.service_type} onChange={e => handleUpdate("service_type", e.target.value)} className="w-full border border-slate-300 rounded-xl px-4 py-2 text-sm bg-white">
                                <option value="online">Online Only</option>
                                <option value="physical_visit">Physical Visit Required</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Fabric</label>
                            <select value={form.fabric_status} onChange={e => handleUpdate("fabric_status", e.target.value)} className="w-full border border-slate-300 rounded-xl px-4 py-2 text-sm bg-white">
                                <option value="client_provided">I will provide fabric</option>
                                <option value="tailor_provided">Tailor must provide fabric</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                        <textarea rows={4} placeholder="Describe the style, fit, and details..." value={form.description} onChange={e => handleUpdate("description", e.target.value)} className="w-full border border-slate-300 rounded-xl px-4 py-2 text-sm focus:ring-slate-500" />
                    </div>

                    {/* Rich Media */}
                    <div className="p-4 bg-slate-50 rounded-xl space-y-4 border border-slate-200">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Inspiration Gallery (Images)</label>
                            <input type="file" multiple accept="image/*" onChange={handleImageChange} className="text-sm file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-slate-200 file:text-slate-700 hover:file:bg-slate-300" />
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Voice Note Instructions</label>
                            <div className="flex items-center gap-4">
                                {isRecording ? (
                                    <button type="button" onClick={stopRecording} className="px-4 py-2 bg-rose-100 text-rose-700 rounded-xl text-sm font-medium animate-pulse">Stop Recording</button>
                                ) : (
                                    <button type="button" onClick={startRecording} className="px-4 py-2 bg-slate-200 text-slate-700 rounded-xl text-sm font-medium hover:bg-slate-300">Record Audio</button>
                                )}
                                {voiceBlob && <span className="text-sm text-emerald-600 font-medium">Audio recorded ✓</span>}
                            </div>
                        </div>
                    </div>

                    <button type="submit" disabled={loading} className="w-full py-3 bg-slate-900 text-white rounded-xl font-medium hover:bg-slate-800 disabled:opacity-50">
                        {loading ? "Posting Request..." : "Post Clothing Request"}
                    </button>
                </form>
            </div>
        </main>
    );
}
