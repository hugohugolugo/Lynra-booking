import type { Metadata, Viewport } from "next";
import { Funnel_Display, Inter_Tight, Frank_Ruhl_Libre } from "next/font/google";
import "./globals.css";

const funnelDisplay = Funnel_Display({
  weight: ["600"],
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const interTight = Inter_Tight({
  weight: ["400", "500", "600"],
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

const frankRuhlLibre = Frank_Ruhl_Libre({
  weight: ["300", "400"],
  subsets: ["latin"],
  variable: "--font-quote",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Lynra — Book Your Stay",
  description: "Book your stay at a Lynra village. Designed for those who work where they live.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${funnelDisplay.variable} ${interTight.variable} ${frankRuhlLibre.variable} font-body antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
