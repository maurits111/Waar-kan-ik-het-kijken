import type { Metadata } from "next";
import "./globals.css";
import { Analytics } from "@vercel/analytics/react";
import Link from "next/link";

export const metadata: Metadata = {
  metadataBase: new URL("https://waarkanikhetkijken.com"),
  title: "Waar kan ik het kijken? - Vind al je films en series",
  description:
    "Ontdek direct op welke streamingdienst (zoals Netflix, Disney+, Videoland) jouw favoriete film of serie beschikbaar is.",
  openGraph: {
    title: "Waar kan ik het kijken? - Vind al je films en series",
    description:
      "Ontdek direct op welke streamingdienst (zoals Netflix, Disney+, Videoland) jouw favoriete film of serie beschikbaar is.",
    url: "https://waarkanikhetkijken.com",
    siteName: "Waar kan ik het kijken?",
    locale: "nl_NL",
    type: "website",
  },
  verification: {
    google: "1PFjOqCDDJlZ-WBr-2XvHupSZgbzC_zy8HUbsgfDnh8",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="nl" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-[#10131a] text-white">
        {/* Simpele Header */}
        <header className="border-b border-[#232838] px-6 py-4 flex justify-between items-center max-w-6xl mx-auto w-full">
          <Link href="/" className="font-bold text-lg text-cyan-400 hover:opacity-80 transition-opacity">
            🎬 Waar kan ik het kijken?
          </Link>
          <Link
            href="/watchlist"
            className="px-4 py-2 bg-[#181c27] border border-[#232838] rounded-xl text-sm font-medium hover:bg-cyan-500 hover:text-black transition-all flex items-center gap-2"
          >
            ❤️ Mijn Watchlist
          </Link>
        </header>

        {/* Hoofdinhoud van de pagina's */}
        <main className="flex-1">{children}</main>

        <Analytics />
      </body>
    </html>
  );
}