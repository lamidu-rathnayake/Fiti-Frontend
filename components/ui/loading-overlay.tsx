import React from "react";
import { useEffect, useState } from "react";

interface LoadingOverlayProps {
    isOpen: boolean;
    message?: string;
}

export function LoadingOverlay({ isOpen, message = "Loading..." }: LoadingOverlayProps) {
    const [shouldRender, setShouldRender] = useState(false);

    // Prevent hydration errors by only rendering on the client side
    useEffect(() => {
        setShouldRender(true);
    }, []);

    if (!isOpen || !shouldRender) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm transition-opacity">
            <div className="flex flex-col items-center gap-6 p-8 rounded-3xl bg-[#141414]/90 border border-zinc-800 shadow-2xl relative overflow-hidden">
                {/* Subtle gold glow behind card content */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[150px] h-[50px] bg-[#F6CA57]/20 blur-[50px] pointer-events-none"></div>

                <div className="relative z-10 flex items-center justify-center">
                    <div className="w-12 h-12 border-4 border-[#F6CA57]/20 border-t-[#F6CA57] rounded-full animate-spin"></div>
                    <div className="absolute inset-0 w-12 h-12 border-4 border-[#F6CA57]/10 border-b-[#F6CA57]/50 rounded-full animate-pulse blur-[1px]"></div>
                </div>
                
                <p className="relative z-10 text-xs font-bold tracking-[0.2em] text-[#F6CA57] uppercase animate-pulse text-center">
                    {message}
                </p>
            </div>
        </div>
    );
}
