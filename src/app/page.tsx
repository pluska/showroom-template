"use client";
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import gsap from 'gsap';
import Sidebar from '@/components/layout/Sidebar';
import { getAssetUrl } from '@/utils/assets';
import { useStore } from '@/store/useStore';
import { preloadVideo, preloadImages } from '@/utils/preload';
import Loader from '@/components/UI/Loader';
import FullScreenToggle from '@/components/UI/FullScreenToggle';
import { homepageData } from '@/data/homepage';
import { getActiveMedia } from '@/app/actions/media';

// A dónde lleva "Entrar": portada → transición → Urbanización.
//
// El recorrido es el mismo de Océano, con otro contenido:
//   portada → transición → Caras → ingresar a la fase → zonas con chevrons
//
// Los dos últimos pasos viven dentro de /showroom, no en rutas aparte.
// "Urbanización" está fuera del menú (features.json, active:false) porque no
// se salta ahí desde el menú: se llega por este recorrido.
// El paso va explícito en la URL —y no como `/showroom` a secas— porque el
// menú distingue "Urbanización" (la portada) de "Master Plan" (las fases) por
// ese parámetro: son la misma ruta. Sin él, entrar desde aquí no resaltaría
// ninguna de las dos.
const ENTRY_ROUTE = '/showroom?step=intro';

const Homepage = () => {
  const router = useRouter();
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [isPlayingIntro, setIsPlayingIntro] = useState(false);
  const [introVideo, setIntroVideo] = useState(getAssetUrl(homepageData.intro.video));

  useEffect(() => {
    getActiveMedia("VIDEO_PORTADA").then((media) => {
      if (media && media.length > 0) {
        setIntroVideo(getAssetUrl(media[0].url));
      }
    }).catch(console.error);
  }, []);

  // El giro no está puesto al montar —lo enciende `UseLandscape` después—, así
  // que la animación se rehace cuando cambia: es el momento en que la caja pasa
  // de 812 a 375 de alto y hay que volver a medirla.
  const isForcedLandscape = useStore((state) => state.isForcedLandscape);

  // Animation Refs
  const rootRef = useRef<HTMLDivElement>(null);
  const logoRef = useRef<HTMLImageElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const textRefs = useRef<(HTMLElement | null)[]>([]);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Timeline Ref to control animation
  const tlRef = useRef<gsap.core.Timeline | null>(null);

  useEffect(() => {
    // Preload the poster immediately to avoid gray screen
    const img = new Image();
    img.src = getAssetUrl(homepageData.intro.poster);

    // Background preloading of transition assets so they are ready when the user enters the showroom
    preloadImages([
      getAssetUrl('urbanization/sides/side-1/day.webp'),
      getAssetUrl('urbanization/master-plan.webp')
    ]).catch(() => { });

    // Create timeline but don't auto-repeat infinitely (we handle restart via video sync)
    const tl = gsap.timeline({ defaults: { ease: "power2.out" }, paused: false });
    tlRef.current = tl;

    // Cuánto sube el logo para dejar sitio al texto. Se mide sobre la CAJA, no
    // sobre la ventana: girados, `vh` sigue siendo el alto del teléfono —812px
    // donde la caja tiene 375— y el logo se iba 146px arriba en vez de 67, o
    // sea fuera de plano. `clientHeight` da el alto real en los dos modos.
    const boxHeight = rootRef.current?.clientHeight ?? window.innerHeight;
    const moveUpY = -(boxHeight < 500 ? 0.18 : 0.25) * boxHeight;

    // Initial Setup
    gsap.set(textRefs.current, { y: 20, autoAlpha: 0 });

    // 1. Initial State: Logo centered (3s wait)
    tl.to({}, { duration: 3 })

      .to(logoRef.current, {
        y: moveUpY,
        duration: 2,
        ease: "power3.inOut"
      }, "moveUp")

    // 3. Text Cycle
    // Using data-driven slides
    homepageData.slides.forEach((slide, index) => {
      const isLast = index === homepageData.slides.length - 1;

      // Appear
      if (index === 0) {
        tl.to(textRefs.current[index], { y: 0, autoAlpha: 1, duration: 1 }, "-=0.5");
      } else {
        tl.fromTo(textRefs.current[index],
          { y: 20, autoAlpha: 0 },
          { y: 0, autoAlpha: 1, duration: 1 }
        );
      }

      // Disappear (except maybe hold the last one? original logic cycled them all)
      tl.to(textRefs.current[index], {
        y: -20,
        autoAlpha: 0,
        duration: 0.8,
        delay: 5
      });
    });

    // End: Logo returns to center
    tl.to(logoRef.current, {
      y: 0,
      duration: 1.5,
      ease: "power3.inOut"
    }, "reset");

    return () => {
      tl.kill();
    };
  }, [isForcedLandscape]);

  const handleStartIntro = () => {
    router.push(ENTRY_ROUTE);
  };

  const handleVideoEnd = () => {
    router.push(ENTRY_ROUTE);
  };

  const handleBackgroundVideoEnded = () => {
    const video = videoRef.current;
    if (!video) return;

    // Logic:
    // 1. Always replay video (manual loop)
    video.play().catch(e => console.log("Video play failed", e));

    // 2. If Timeline is finished (progress == 1), restart it
    if (tlRef.current && tlRef.current.progress() === 1) {
      tlRef.current.restart();
    }
  };

  return (
    <div ref={rootRef} className="h-full w-full relative overflow-hidden font-sans flex flex-col">
      <Sidebar isOpen={isSidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="fixed top-6 right-6 z-50">
        <FullScreenToggle />
      </div>

      {/* Background Video & Fallback Image */}
      <div className="absolute inset-0 z-0 bg-neutral-950">
        {/* Fallback Image */}
        <img
          src={getAssetUrl(homepageData.intro.fallback || 'homepage/fallback.webp')}
          alt="El Olimpo de Tumbes"
          className="absolute inset-0 w-full h-full object-cover"
        />

        <video
          key={introVideo}
          ref={videoRef}
          autoPlay
          muted
          playsInline
          poster={getAssetUrl(homepageData.intro.poster)}
          className="w-full h-full object-cover relative z-10"
          onEnded={handleBackgroundVideoEnded}
          // Prioritize loading intro assets as soon as the main video can play
          onCanPlay={() => {
            // Preload the first side image and transition assets for smooth showroom entry
            preloadImages([getAssetUrl('urbanization/sides/side-1/day.webp')]).catch(() => { });
          }}
        >
          <source src={introVideo} type="video/mp4" />
          Your browser does not support the video tag.
        </video>
        <div className="absolute inset-0 bg-black/20 z-20 pointer-events-none" />
      </div>

      {/* UI Overlay */}
      {/* Stays below the sidebar backdrop (z-60): when the menu is open the page
          blurs behind it and the hero logo is hidden, so the menu's own centered
          logo stands alone instead of ghosting over a blurred duplicate. */}
      <div className="relative z-10 flex-1 flex flex-col justify-between p-4 sm:p-6 lg:p-12 text-white">

        {/* Header */}
        <div className="flex justify-between items-start shrink-0">
          <div className="flex gap-4">
            {/* Menu Icon */}
            <div className="group relative flex items-center">
              <button
                onClick={() => setSidebarOpen(true)}
                className="p-2 bg-brand-primary/80 hover:bg-brand-primary backdrop-blur-xl border border-white/20 rounded-full transition-all cursor-pointer text-white relative z-10 shadow-lg"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M4 12H20M4 6H20M4 18H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              <span className="absolute left-full ml-3 px-2 py-1 bg-black/50 backdrop-blur-md text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none font-secondary tracking-wider uppercase">
                Menu
              </span>
            </div>
          </div>
        </div>

        {/* Central Hero Section */}
        <div className="flex-1 flex flex-col items-center justify-center relative w-full max-w-6xl mx-auto h-full">

          {/* Logo Container (animates up on its own). Fades out while the menu
                 is open so it doesn't sit behind the menu's own centered logo. */}
          <div className={`relative z-20 flex flex-col items-center transition-opacity duration-300 will-change-transform ${isSidebarOpen ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
            <img
              ref={logoRef} // Ref moved to image for independent animation
              src={homepageData.hero.logo}
              alt="Logo"
              className="w-[140px] sm:w-[180px] lg:w-full max-w-xl object-contain drop-shadow-2xl opacity-90"
            />
          </div>

          {/* Entrar Button - anchored near the bottom, clear of the presentation text */}
          <button
            ref={buttonRef}
            onClick={handleStartIntro}
            disabled={isPlayingIntro || isSidebarOpen}
            className={`absolute bottom-[5%] sm:bottom-[8%] lg:bottom-[10%] left-1/2 -translate-x-1/2 z-20 group px-6 sm:px-8 lg:px-12 py-2.5 sm:py-3 lg:py-4 bg-brand-primary/80 hover:bg-brand-primary backdrop-blur-xl border border-white/20 text-white text-[11px] sm:text-xs lg:text-sm font-medium tracking-widest uppercase rounded-full overflow-hidden transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer shadow-lg hover:shadow-xl font-secondary
                    ${(isPlayingIntro || isSidebarOpen) ? 'opacity-0 pointer-events-none' : 'opacity-100'}
                `}
          >
            <span className="relative z-10 font-bold tracking-[0.2em] flex items-center gap-2">
              {homepageData.hero.button}
            </span>
          </button>

          {/* Presentation Text Container */}
          <div className={`absolute top-[50%] sm:top-[52%] lg:top-[55%] left-0 right-0 -translate-y-1/2 flex flex-col items-center justify-center pointer-events-none z-10 min-h-[160px] sm:h-[220px] lg:h-[260px] px-3 sm:px-4 transition-opacity duration-300 ${isSidebarOpen ? 'opacity-0' : 'opacity-100'}`}>

            {homepageData.slides.map((slide, index) => (
              <p
                key={index}
                ref={el => { textRefs.current[index] = el }}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[92%] sm:w-full lg:w-fit bg-black/40 backdrop-blur-md rounded-2xl p-3.5 sm:p-6 lg:p-10 text-center text-sm sm:text-lg lg:text-3xl font-light tracking-wide opacity-0 text-white drop-shadow-lg max-w-2xl lg:max-w-4xl mx-auto flex flex-col gap-1.5 sm:gap-2"
              >
                {slide.highlight ? (
                  <>
                    <span className="font-bold block text-sm sm:text-lg lg:text-2xl uppercase tracking-wider text-white">{slide.highlight}</span>
                    <span className="text-xs sm:text-sm lg:text-base font-light leading-relaxed block max-w-2xl mx-auto normal-case">{slide.text.replace('{{highlight}}', '').trim()}</span>
                  </>
                ) : (
                  slide.text
                )}
              </p>
            ))}

          </div>

        </div>

      </div>

      {/* Intro Transition Video Overlay */}
      {isPlayingIntro && (
        <div className="absolute inset-0 z-50 bg-black">
          <video
            autoPlay
            className="w-full h-full object-cover"
            playsInline
            onEnded={handleVideoEnd}
          >
            <source src={getAssetUrl('videos/walks/trans_intro_to_0.mp4')} type="video/mp4" />
          </video>
        </div>
      )}
    </div>
  );
};

export default Homepage;
