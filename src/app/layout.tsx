import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

/**
 * Modern typography (Phase 4). Inter for UI, JetBrains Mono for the terminal
 * and tabular/code surfaces. Exposed as CSS variables consumed by globals.css
 * and the Tailwind font tokens.
 */
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "NEXUS OS — The AI-native operating system",
  description:
    "A futuristic, browser-based operating system with an AI Command Center. Your computer, in a tab.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#04070f",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${jetbrainsMono.variable} dark`}>
        {children}
      </body>
    </html>
  );
}
