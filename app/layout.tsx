import type { Metadata } from "next";
import "./globals.css";
import { Analytics } from "@vercel/analytics/react";

export const metadata: Metadata = {
  title: "Waar kan ik het kijken?",
  description: "Zoek een titel en zie direct op welke streamingdiensten het beschikbaar is.",
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