import type { Metadata } from "next";
export const runtime = 'edge';
import { Montserrat, Inter } from "next/font/google"; // Using fonts closer to original (Montserrat/Inter)
import "./globals.css";
import config from "@/config/config";
import StoreInitializer from "@/components/layout/StoreInitializer";
import { getFloorsData } from "@/app/actions/units";
import { getBuildingFacesData } from "@/app/actions/building";
import { type Floor } from "@/data/floors";

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

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  let floorsData: Floor[] = [];
  let buildingFacesData: any[] = [];
  try {
    floorsData = (await getFloorsData()) as Floor[];
  } catch (e) {
    console.error("Failed to load initial floorsData during SSR:", e);
  }
  try {
    buildingFacesData = await getBuildingFacesData();
  } catch (e) {
    console.error("Failed to load initial buildingFacesData during SSR:", e);
  }

  return (
    <html lang="es">
      <head>
        <link href='https://api.mapbox.com/mapbox-gl-js/v3.1.2/mapbox-gl.css' rel='stylesheet' />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var savedTheme = localStorage.getItem('theme');
                  var theme = savedTheme || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
                  if (theme === 'dark') {
                    document.documentElement.classList.add('dark');
                    document.documentElement.setAttribute('data-theme', 'dark');
                  } else {
                    document.documentElement.classList.remove('dark');
                    document.documentElement.setAttribute('data-theme', 'light');
                  }
                } catch (e) {}
              })();
            `
          }}
        />
      </head>
      <body
        className={`${montserrat.variable} ${inter.variable} antialiased h-screen w-screen overflow-hidden bg-base-100 text-base-content`}
      >
        <StoreInitializer initialFloorsData={floorsData} initialBuildingFacesData={buildingFacesData} />

        {children}
      </body>
    </html>
  );
}
