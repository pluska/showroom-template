
export const preloadImages = (urls: string[]): Promise<void> => {
  return new Promise((resolve) => {
    let loaded = 0;
    const total = urls.length;
    if (total === 0) {
      resolve();
      return;
    }

    // Safety timeout: if images take longer than 8s, just proceed
    const timeoutId = setTimeout(() => {
        console.warn("Image buffer preload timeout - proceeding anyway");
        resolve();
    }, 8000);

    const checkComplete = () => {
        loaded++;
        if (loaded === total) {
            clearTimeout(timeoutId);
            resolve();
        }
    };

    urls.forEach((url) => {
      const img = new Image();
      img.src = url;
      img.onload = checkComplete;
      img.onerror = () => {
        console.warn(`Failed to preload image: ${url}`);
        checkComplete();
      };
    });
  });
};

export const preloadVideo = (url: string): Promise<void> => {
  return new Promise((resolve) => {
    const video = document.createElement('video');
    video.preload = 'auto';
    video.playsInline = true;
    video.muted = true;
    video.src = url;

    // Safety timeout: if video takes longer than 6s, just proceed
    // The user can likely stream it by then
    const timeoutId = setTimeout(() => {
        console.warn(`Video preload timeout for ${url} - proceeding anyway`);
        // We clean up
        video.oncanplay = null;
        video.onerror = null;
        resolve();
    }, 6000);

    const onReady = () => {
        clearTimeout(timeoutId); 
        resolve();
    };

    // 'oncanplay' is much faster than 'oncanplaythrough'.
    // It fires when there is enough data to start, which is sufficient for UI unblocking.
    video.oncanplay = onReady;
    
    video.onerror = () => {
        console.warn(`Failed to preload video: ${url}`);
        // If it fails, we shouldn't block the user
        onReady();
    };

    video.load();
  });
};
