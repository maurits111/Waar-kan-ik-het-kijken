import type { Metadata } from "next";
import "./globals.css";
import { Analytics } from "@vercel/analytics/react";

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
      <body className="min-h-full flex flex-col">
        {children}
        <Analytics />
      </body>
    </html>
  );
}