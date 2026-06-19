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
import Logo from '@/components/UI/Logo';

const Homepage = () => {
  const router = useRouter();
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [isPlayingIntro, setIsPlayingIntro] = useState(false);

  // Animation Refs
  const logoRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const textRefs = useRef<(HTMLElement | null)[]>([]);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Timeline Ref to control animation
  const tlRef = useRef<gsap.core.Timeline | null>(null);

  useEffect(() => {
    // Preload the poster immediately to avoid gray screen
    const img = new Image();
    img.src = homepageData.intro.poster;

    // Create timeline but don't auto-repeat infinitely (we handle restart via video sync)
    const tl = gsap.timeline({ defaults: { ease: "power2.out" }, paused: false });
    tlRef.current = tl;

    // Initial Setup
    gsap.set(textRefs.current, { y: 20, autoAlpha: 0 });

    // 1. Initial State: Wait 3 seconds
    tl.to({}, { duration: 3 })

      // Logo slides up when text is about to start
      .to(logoRef.current, {
        y: window.innerWidth < 600 ? '-14vh' : '-25vh',
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
  }, []);

  // Store actions
  const setLoading = useStore(state => state.setLoading);
  const isLoadingAssets = useStore(state => state.isLoadingAssets);

  const handleStartIntro = () => {
    setIsPlayingIntro(true);

    // Preload showroom background images in the background while the intro video plays
    preloadImages([
      getAssetUrl('building/photos/face_0_daylight.webp'),
      getAssetUrl('building/photos/face_0_nightlight.webp')
    ]).catch((error) => {
      console.warn("Background preloading of showroom images failed:", error);
    });
  };

  const handleVideoEnd = () => {
    router.push('/showroom');
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
    <div className="h-full w-full relative overflow-hidden font-sans flex flex-col">
      <Sidebar isOpen={isSidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="fixed top-6 right-6 z-50">
        <FullScreenToggle />
      </div>

      {/* Background Video */}
      <div className="absolute inset-0 z-0">

        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          poster={homepageData.intro.poster}
          className="w-full h-full object-cover"
          onEnded={handleBackgroundVideoEnded}
          // Prioritize loading intro assets as soon as the main video can play
          onCanPlay={() => {
            // 1. Silent preload of the "Enter" transition video
            preloadVideo(getAssetUrl('videos/walks/trans_intro_to_0.mp4')).catch(() => { });
            // 2. Silent preload of the first building face (Daylight)
            preloadImages([getAssetUrl('building/photos/face_0_daylight.webp')]).catch(() => { });
          }}
        >
          <source src={homepageData.intro.video} type="video/mp4" />
          Your browser does not support the video tag.
        </video>
        <div className="absolute inset-0 bg-black/20" />
      </div>

      {/* UI Overlay */}
      <div className="relative z-10 flex-1 flex flex-col justify-between p-6 lg:p-12 text-white">

        {/* Top Section: Header menu icon */}
        <div className="w-full flex justify-between items-start shrink-0 h-12 relative">
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

        {/* Middle Section: Presentation Text (Black Box) & Logo */}
        <div className="flex-1 flex items-center justify-center relative w-full max-w-4xl mx-auto my-6">
          {/* Brand Logo centered in middle by default, shifts to top during slides */}
          <Logo
            ref={logoRef}
            className="absolute w-full max-w-[28rem] md:max-w-xl opacity-90 will-change-transform px-4"
            style={{ fontSize: 'clamp(3rem, 8vw, 6rem)' }}
          />

          {/* Presentation Text: sits below logo within the same middle section */}
          <div className="absolute bottom-0 left-16 right-16 flex flex-col justify-center h-40">
            {homepageData.slides.map((slide, index) => (
              <p
                key={index}
                ref={el => { textRefs.current[index] = el }}
                className="absolute bg-black/40 backdrop-blur-md rounded-2xl p-6 lg:p-10 text-center text-lg lg:text-3xl font-light tracking-wide opacity-0 text-white drop-shadow-lg max-w-3xl w-full mx-auto pointer-events-none"
              >
                {slide.highlight ? (
                  <><span className="font-bold">{slide.highlight}</span> {slide.text.replace('{{highlight}}', '').trim()}</>
                ) : (
                  slide.text
                )}
              </p>
            ))}
          </div>
        </div>
        {/* Bottom Section: Entrar Button */}
        <div className="w-full flex justify-center pb-2 lg:pb-6 shrink-0">
          <button
            ref={buttonRef}
            onClick={handleStartIntro}
            disabled={isPlayingIntro || isLoadingAssets}
            className={`group relative px-8 lg:px-12 py-3 lg:py-4 bg-brand-primary/80 hover:bg-brand-primary backdrop-blur-xl border border-white/20 text-white text-xs lg:text-sm font-medium tracking-widest uppercase rounded-full overflow-hidden transition-all hover:scale-105 active:scale-95 cursor-pointer shadow-lg hover:shadow-xl font-secondary shrink-0 
                    ${(isPlayingIntro) ? 'opacity-0 pointer-events-none' : 'opacity-100'}
                    ${isLoadingAssets ? 'cursor-wait opacity-80' : ''}
                `}
          >
            <span className="relative z-10 font-bold tracking-[0.2em] flex items-center gap-2">
              {isLoadingAssets ? <Loader /> : homepageData.hero.button}
            </span>
          </button>
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
