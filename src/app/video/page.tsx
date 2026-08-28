"use client";

import { useEffect, useRef, useState } from "react";
import { getActiveMedia } from "@/app/actions/media";
import { getAssetUrl } from "@/utils/assets";
import { X, Loader2, Menu, Volume2, VolumeX, Play } from "lucide-react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/layout/Sidebar";

const DEFAULT_VIDEO_PATH = "video/video.mp4";
const DEFAULT_POSTER_PATH = "video/poster.webp";

export default function VideoPage() {
  const [videoUrl, setVideoUrl] = useState<string>(() => getAssetUrl(DEFAULT_VIDEO_PATH));
  const [posterUrl] = useState<string>(() => getAssetUrl(DEFAULT_POSTER_PATH));
  const [isLoading, setIsLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const router = useRouter();

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    getActiveMedia("VIDEO_SIDEBAR")
      .then((media) => {
        if (!isMounted) return;
        if (media && media.length > 0 && media[0].url) {
          setVideoUrl(getAssetUrl(media[0].url));
        } else {
          setVideoUrl(getAssetUrl(DEFAULT_VIDEO_PATH));
        }
      })
      .catch((err) => {
        console.warn("Could not fetch DB media, using default Olimpo Tumbes video:", err);
        if (isMounted) {
          setVideoUrl(getAssetUrl(DEFAULT_VIDEO_PATH));
        }
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Intentar reproducir con sonido automáticamente
  useEffect(() => {
    if (!isLoading && videoRef.current) {
      videoRef.current.muted = false;
      videoRef.current
        .play()
        .then(() => {
          setIsPlaying(true);
          setIsMuted(false);
        })
        .catch(() => {
          // Si el navegador bloquea la reproducción automática con sonido, fallback a muted
          if (videoRef.current) {
            videoRef.current.muted = true;
            setIsMuted(true);
            videoRef.current.play().catch(() => {});
          }
        });
    }
  }, [isLoading, videoUrl]);

  const toggleMute = () => {
    if (!videoRef.current) return;
    const nextMuted = !videoRef.current.muted;
    videoRef.current.muted = nextMuted;
    setIsMuted(nextMuted);
  };

  const handleClose = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push("/showroom");
    }
  };

  return (
    <div className="flex bg-black h-screen w-screen relative overflow-hidden select-none">
      {/* Top Controls Overlay */}
      <div className="absolute top-0 left-0 w-full p-6 flex justify-between items-center z-30 pointer-events-none">
        <div className="flex items-center gap-4 pointer-events-auto">
          <button
            type="button"
            onClick={() => setIsSidebarOpen(true)}
            className="w-10 h-10 rounded-full bg-brand-primary text-white flex items-center justify-center hover:bg-brand-dark-orange transition-colors shadow-lg cursor-pointer"
            aria-label="Abrir menú"
          >
            <Menu size={20} />
          </button>

          <div className="hidden sm:flex items-center px-4 py-2 bg-black/60 backdrop-blur-md text-white text-xs uppercase tracking-widest font-secondary rounded-full border border-white/10 shadow-lg">
            El Olimpo de Tumbes
          </div>
        </div>

        <div className="flex items-center gap-3 pointer-events-auto">
          {/* Unmute / Mute Button */}
          <button
            type="button"
            onClick={toggleMute}
            className="h-10 px-4 rounded-full bg-black/50 hover:bg-black text-white flex items-center gap-2 transition-colors shadow-lg backdrop-blur-md border border-white/10 cursor-pointer"
            title={isMuted ? "Activar audio" : "Silenciar audio"}
          >
            {isMuted ? (
              <>
                <VolumeX size={18} className="text-brand-orange" />
                <span className="text-xs font-medium uppercase tracking-wider hidden md:inline">Activar Sonido</span>
              </>
            ) : (
              <>
                <Volume2 size={18} className="text-green-400" />
                <span className="text-xs font-medium uppercase tracking-wider hidden md:inline">Audio Activado</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleClose}
            className="w-10 h-10 rounded-full bg-black/50 hover:bg-black text-white flex items-center justify-center transition-colors shadow-lg backdrop-blur-md border border-white/10 cursor-pointer"
            aria-label="Cerrar video"
          >
            <X size={20} />
          </button>
        </div>
      </div>

      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      {/* Main Video Area */}
      <div className="flex-1 relative flex items-center justify-center bg-black w-full h-full">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center gap-3 text-white">
            <Loader2 className="w-8 h-8 animate-spin text-brand-orange" />
            <p className="text-xs tracking-widest uppercase text-neutral-300">Cargando video...</p>
          </div>
        ) : (
          <div className="relative w-full h-full flex items-center justify-center">
            <video
              ref={videoRef}
              src={videoUrl}
              poster={posterUrl}
              controls
              autoPlay
              muted={isMuted}
              playsInline
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              onVolumeChange={() => {
                if (videoRef.current) {
                  setIsMuted(videoRef.current.muted || videoRef.current.volume === 0);
                }
              }}
              className="w-full h-full object-contain max-h-screen"
            />

            {/* Muted reminder banner on first load */}
            {isMuted && isPlaying && (
              <button
                type="button"
                onClick={toggleMute}
                className="absolute bottom-20 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2.5 px-5 py-2.5 rounded-full bg-black/80 hover:bg-black text-white backdrop-blur-md border border-white/20 shadow-2xl cursor-pointer transition-all hover:scale-105 active:scale-95 animate-in fade-in slide-in-from-bottom-4 duration-500"
              >
                <VolumeX size={16} className="text-brand-orange animate-pulse" />
                <span className="text-xs font-semibold uppercase tracking-wider">
                  Clic aquí para activar el sonido
                </span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
