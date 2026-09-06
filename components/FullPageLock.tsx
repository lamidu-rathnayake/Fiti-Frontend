"use client";

import { useState, useRef } from "react";
import dynamic from "next/dynamic";
import type { LottieHandle } from "lottie-react";
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
    const [isPaused, setIsPaused] = useState(false);
    const lottieRef = useRef<LottieHandle>(null);

    const active = isSubmitting !== undefined ? isSubmitting : (isLoading !== undefined ? isLoading : true);
    if (!active) return null;

    const togglePause = () => {
        if (isPaused) {
            lottieRef.current?.play();
            setIsPaused(false);
        } else {
            lottieRef.current?.pause();
            setIsPaused(true);
        }
    };

    return (
        <div className="fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-earth-text/40 backdrop-blur-md text-earth-text select-none transition-all duration-300">
            <div className="relative flex flex-col items-center max-w-sm px-8 py-10 rounded-3xl bg-cream-bg/95 border border-accent/30 shadow-[0_20px_50px_rgba(78,34,15,0.25)] backdrop-blur-xl text-center space-y-4 mx-4">
                {/* Lottie Sewing Animation with WCAG 2.2.2 Pause Control */}
                <div className="relative w-56 h-56 sm:w-64 sm:h-64 flex items-center justify-center drop-shadow-[0_10px_20px_rgba(78,34,15,0.15)] group">
                    <Lottie
                        lottieRef={lottieRef as unknown as React.RefObject<LottieHandle>}
                        src={sewingAnimation}
                        loop={true}
                        autoplay={!isPaused}
                        style={{ width: "100%", height: "100%" }}
                    />

                    {/* WCAG 2.2.2 Pause/Play Affordance Control */}
                    <button
                        type="button"
                        onClick={togglePause}
                        aria-label={isPaused ? "Play animation" : "Pause animation"}
                        title={isPaused ? "Play animation" : "Pause animation"}
                        className="absolute bottom-1 right-1 px-3 py-1 bg-earth-text/85 text-cream-bg text-[11px] font-mono font-bold rounded-full backdrop-blur-sm hover:bg-earth-text transition-all flex items-center gap-1.5 shadow-md border border-accent/20 cursor-pointer z-10"
                    >
                        <span>{isPaused ? "▶" : "⏸"}</span>
                        <span>{isPaused ? "Play" : "Pause"}</span>
                    </button>
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
