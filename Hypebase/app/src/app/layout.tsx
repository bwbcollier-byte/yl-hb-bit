import type { Metadata } from "next";
import { Urbanist, Poppins } from "next/font/google";
import "./globals.css";

const urbanist = Urbanist({
  variable: "--font-urbanist",
  subsets: ["latin"],
});

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "Talent Contacts & Momentum Intel | Hypebase | Direct Manager Outreach",
  description:
    "Bypass the gatekeepers. Access verified manager contacts for music, film, and sports stars. View live momentum charts and brand conflict history in one engine.",
};

import { ThemeProvider } from "@/components/theme-provider";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={`${urbanist.variable} ${poppins.variable}`}>
      <body className="antialiased font-sans bg-[var(--color-brand-obsidian)] text-[var(--color-brand-text)] min-h-screen">
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
