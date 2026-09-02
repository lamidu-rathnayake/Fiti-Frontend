import type { Metadata } from "next";
import { Manrope, Inter } from "next/font/google";
import { AuthProvider } from "@/lib/firebase/AuthContext";
import { ThemeProvider } from "@/lib/context/ThemeContext";
import "@/app/globals.css";

const manrope = Manrope({
    subsets: ["latin"],
    weight: ["600", "700"],
    variable: "--font-heading",
    display: "swap",
});

const inter = Inter({
    subsets: ["latin"],
    weight: ["400", "500"],
    variable: "--font-sans",
    display: "swap",
});

export const metadata: Metadata = {
    title: "FITI — Luxury Bespoke Tailoring & Performance Atelier",
    description:
        "Discover Sri Lanka's finest verified tailor shops, custom garments, and precision bespoke crafting.",
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en" className={`${manrope.variable} ${inter.variable}`} suppressHydrationWarning>
            <body
                suppressHydrationWarning
                className="antialiased bg-warm-beige text-earth-text font-sans transition-colors duration-300 min-h-screen"
            >
                <ThemeProvider>
                    <AuthProvider>{children}</AuthProvider>
                </ThemeProvider>
            </body>
        </html>
    );
}
