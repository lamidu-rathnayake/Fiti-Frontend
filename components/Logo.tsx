"use client";

import Image from "next/image";
import { useTheme } from "@/lib/context/ThemeContext";

interface LogoProps {
    width?: number;
    height?: number;
    className?: string;
    priority?: boolean;
    alt?: string;
}

export default function Logo({
    width = 180,
    height = 60,
    className = "h-10 sm:h-12 w-auto object-contain",
    priority = false,
    alt = "FITI Atelier",
}: LogoProps) {
    const { theme } = useTheme();
    const logoSrc = theme === "dark" ? "/logo_dark.png" : "/logo_light.png";

    return (
        <Image
            src={logoSrc}
            alt={alt}
            width={width}
            height={height}
            priority={priority}
            className={className}
        />
    );
}
