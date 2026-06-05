"use client";

import { useEffect, useState } from "react";
import { getActiveMedia } from "@/app/actions/media";
import { getAssetUrl } from "@/utils/assets";
import { X, Loader2, Menu } from "lucide-react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/layout/Sidebar";

export default function VideoPage() {
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setIsLoading(true);
    getActiveMedia("VIDEO_SIDEBAR").then((media) => {
      if (media && media.length > 0) {
        setVideoUrl(getAssetUrl(media[0].url));
      } else {
         // Si no hay video, podemos usar un placeholder o redirigir
         router.push("/");
      }
    }).catch(console.error).finally(() => {
      setIsLoading(false);
    });
  }, []);

  return (
    <div className="flex bg-black h-screen w-full relative overflow-hidden">
      
      {/* Top Controls Overlay */}
      <div className="absolute top-0 left-0 w-full p-6 flex justify-between items-start z-30 pointer-events-none">
          <div className="flex flex-col items-start gap-4 pointer-events-auto">
                <button 
                  onClick={() => setIsSidebarOpen(true)}
                  className="w-10 h-10 rounded-full bg-brand-primary text-white flex items-center justify-center hover:bg-brand-dark-orange transition-colors shadow-lg"
                >
                  <Menu size={20} />
                </button>
          </div>
          
          <div className="pointer-events-auto">
             <button 
                  onClick={() => router.push("/")}
                  className="w-10 h-10 rounded-full bg-black/40 text-white flex items-center justify-center hover:bg-black/80 transition-colors shadow-lg backdrop-blur-md border border-white/10"
                >
                  <X size={20} />
             </button>
          </div>
      </div>

      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      {/* Main Video Area */}
      <div className="flex-1 relative flex items-center justify-center bg-black w-full h-full">
         {isLoading ? (
             <div className="flex flex-col items-center justify-center gap-2 text-white">
                 <Loader2 className="w-8 h-8 animate-spin" />
                 <p>Cargando video...</p>
             </div>
         ) : videoUrl ? (
             <video 
                src={videoUrl} 
                controls 
                autoPlay
                muted
                playsInline
                className="w-full h-full object-contain"
             />
         ) : (
             <div className="text-gray-500">
                 No hay un video configurado actualmente.
             </div>
         )}
      </div>

    </div>
  );
}
