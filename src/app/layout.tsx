import type { Metadata } from "next";
import { Montserrat, Inter } from "next/font/google"; // Using fonts closer to original (Montserrat/Inter)
import "./globals.css";
import config from "@/config/config";

const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-primary",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-secondary",
});

export const metadata: Metadata = {
  title: config.appName,
  description: config.appDescription,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <head>
        <link href='https://api.mapbox.com/mapbox-gl-js/v3.1.2/mapbox-gl.css' rel='stylesheet' />
      </head>
      <body
        className={`${montserrat.variable} ${inter.variable} antialiased h-screen w-screen overflow-hidden bg-black text-white`}
      >
        {children}
      </body>
    </html>
  );
}
