import type { Metadata, Viewport } from "next";
// Self-hosted variable fonts (bundled via @fontsource — no build-time network
// fetch, so the production build never depends on Google Fonts being reachable).
import "@fontsource-variable/inter";
import "@fontsource-variable/jetbrains-mono";
import "./globals.css";

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
      <body className="dark">{children}</body>
    </html>
  );
}
