"use client";

import dynamic from "next/dynamic";
import sewingAnimation from "@/public/Sewing.json";

const Lottie = dynamic(() => import("lottie-react").then((mod) => mod.Lottie), { ssr: false });

interface FullPageLockProps {
    isSubmitting?: boolean;
    isLoading?: boolean;
    title?: string;
    message?: string;
    badgeText?: string;
}

export default function FullPageLock({
    isSubmitting,
    isLoading,
    title = "Processing Request...",
    message = "Please wait while we update your Atelier records.",
    badgeText = "ATELIER LOADING",
}: FullPageLockProps) {
    const active = isSubmitting !== undefined ? isSubmitting : (isLoading !== undefined ? isLoading : true);
    if (!active) return null;

    return (
        <div className="fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-earth-text/40 backdrop-blur-md text-earth-text select-none transition-all duration-300">
            <div className="relative flex flex-col items-center max-w-sm px-8 py-10 rounded-3xl bg-cream-bg/95 border border-accent/30 shadow-[0_20px_50px_rgba(78,34,15,0.25)] backdrop-blur-xl text-center space-y-4 mx-4">
                {/* Lottie Sewing Animation */}
                <div className="w-56 h-56 sm:w-64 sm:h-64 flex items-center justify-center pointer-events-none drop-shadow-[0_10px_20px_rgba(78,34,15,0.15)]">
                    <Lottie
                        src={sewingAnimation}
                        loop={true}
                        autoplay={true}
                        style={{ width: "100%", height: "100%" }}
                    />
                </div>

                {/* Status Badges & Text */}
                <div className="space-y-2">
                    <span className="inline-block px-3.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-[0.25em] bg-sage/30 text-earth-text border border-sage/60 shadow-sm">
                        {badgeText}
                    </span>
                    <h3 className="text-xl sm:text-2xl font-extrabold font-serif text-earth-text tracking-tight">
                        {title}
                    </h3>
                    <p className="text-xs text-earth-text/75 font-sans leading-relaxed max-w-xs">
                        {message}
                    </p>
                </div>

                {/* Loading indicator bar */}
                <div className="w-48 h-1.5 bg-warm-beige border border-accent/15 rounded-full overflow-hidden relative mt-2">
                    <div className="absolute inset-y-0 bg-accent animate-pulse w-full rounded-full" />
                </div>
            </div>
        </div>
    );
}
