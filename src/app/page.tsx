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

const Homepage = () => {
  const router = useRouter();
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [isPlayingIntro, setIsPlayingIntro] = useState(false);

  // Animation Refs
  const logoRef = useRef<HTMLImageElement>(null);
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
    
    // 1. Initial State: Logo centered (3s wait)
    tl.to({}, { duration: 3 })
    
      .to(logoRef.current, { 
        y: '-25vh', 
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

  const handleStartIntro = async () => {
    setLoading(true);
    
    try {
        await preloadVideo(getAssetUrl('videos/walks/trans_intro_to_0.mp4'));
        await preloadImages([
           getAssetUrl('building/photos/face_0_daylight.png'),
           getAssetUrl('building/photos/face_0_nightlight.png')
        ]);
    } catch (error) {
        console.error("Preloading failed:", error);
    } finally {
        setLoading(false);
        setIsPlayingIntro(true);
    }
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
              preloadVideo(getAssetUrl('videos/walks/trans_intro_to_0.mp4')).catch(() => {});
              // 2. Silent preload of the first building face (Daylight)
              preloadImages([getAssetUrl('building/photos/face_0_daylight.png')]).catch(() => {});
          }}
        >
          <source src={homepageData.intro.video} type="video/mp4" />
          Your browser does not support the video tag.
        </video>
        <div className="absolute inset-0 bg-black/20" />
      </div>

      {/* UI Overlay */}
      <div className="relative z-10 flex-1 flex flex-col justify-between p-6 lg:p-12 text-white">
        
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
                  <path d="M4 12H20M4 6H20M4 18H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
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
             
             {/* Logo & Button Container */}
             <div className="relative z-20 flex flex-col items-center gap-8 landscape:gap-3 lg:gap-12 transition-transform will-change-transform">
                 <img 
                   ref={logoRef} // Ref moved to image for independent animation
                   src={homepageData.hero.logo} 
                   alt="Logo" 
                   className="w-[180px] lg:w-full max-w-xl object-contain drop-shadow-2xl opacity-90"
                 />

                 {/* Entrar Button - Now inside the container to move with logo */}
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

             {/* Presentation Text Container */}
             <div className="absolute top-[38%] lg:top-[65%] left-0 right-0 -translate-y-1/2 flex flex-col items-center justify-center pointer-events-none z-10 h-[160px] lg:h-[200px] px-4">
                 
                 {homepageData.slides.map((slide, index) => (
                    <p 
                        key={index}
                        ref={el => { textRefs.current[index] = el }} 
                        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full lg:w-fit bg-black/40 backdrop-blur-md rounded-2xl p-6 lg:p-10 text-center text-lg lg:text-3xl font-light tracking-wide opacity-0 text-white drop-shadow-lg max-w-4xl mx-auto"
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
