import type { Metadata } from "next";
import { AuthProvider } from "@/lib/firebase/AuthContext";
import "@/app/globals.css";

export const metadata: Metadata = {
    title: "Fiti",
    description:
        "Discover tailor shops in our verified online marketplace.",
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en">
            <body className="antialiased">
                <AuthProvider>{children}</AuthProvider>
            </body>
        </html>
    );
}
