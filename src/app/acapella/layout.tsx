import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: "VoxStudio Pro — Apple Vocal Coach & Karaoke Suite",
  description: "Monitor de afinación a 60 FPS, vocalizaciones y teleprompter sincronizado LRCLIB/UltraStar.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "VoxStudio Pro",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#000000",
  viewportFit: "cover",
};

export default function AcapellaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="acapella-theme min-h-screen text-[#f5f5f7] bg-black selection:bg-[#0A84FF] selection:text-white">
      {children}
    </div>
  );
}
