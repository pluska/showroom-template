"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

export default function AnalyticsTracker() {
  const pathname = usePathname();
  const lastTrackedPath = useRef<string | null>(null);
  const activeViewRef = useRef<{ id: string; startTime: number } | null>(null);

  // Send duration to server
  const sendDuration = (id: string, startTime: number) => {
    const elapsedSeconds = Math.round((Date.now() - startTime) / 1000);
    // Only track if stayed for at least 1 second
    if (elapsedSeconds > 0) {
      const url = "/api/analytics/duration";
      const payload = JSON.stringify({ id, duration: elapsedSeconds });

      if (typeof navigator !== "undefined" && navigator.sendBeacon) {
        navigator.sendBeacon(url, new Blob([payload], { type: "application/json" }));
      } else {
        fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: payload,
          keepalive: true,
        }).catch((err) => console.error("Error sending page duration:", err));
      }
    }
  };

  useEffect(() => {
    if (!pathname) return;

    // Do not track visits to dashboard, admin pages, login, or API endpoints
    if (
      pathname.startsWith("/dashboard") ||
      pathname.startsWith("/login") ||
      pathname.startsWith("/api")
    ) {
      // If we had an active tracking session, close it when entering dashboard/etc.
      if (activeViewRef.current) {
        sendDuration(activeViewRef.current.id, activeViewRef.current.startTime);
        activeViewRef.current = null;
      }
      return;
    }

    // Prevent double tracking in React StrictMode
    if (lastTrackedPath.current === pathname) {
      return;
    }

    // If changing paths, send the duration for the previous path
    if (activeViewRef.current) {
      sendDuration(activeViewRef.current.id, activeViewRef.current.startTime);
      activeViewRef.current = null;
    }

    lastTrackedPath.current = pathname;
    const startTime = Date.now();

    // Client-side device detection
    let deviceType = "desktop";
    if (typeof window !== "undefined") {
      const width = window.innerWidth;
      if (width < 768) {
        deviceType = "mobile";
      } else if (width < 1024) {
        deviceType = "tablet";
      }
    }

    // Fire page view event
    fetch("/api/analytics/hit", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        path: pathname,
        deviceType,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data && data.success && data.pageViewId) {
          activeViewRef.current = {
            id: data.pageViewId,
            startTime,
          };
        }
      })
      .catch((err) => {
        console.error("Failed to register page view event:", err);
      });

    // Cleanup on unmount or path change
    return () => {
      if (activeViewRef.current) {
        sendDuration(activeViewRef.current.id, activeViewRef.current.startTime);
      }
    };
  }, [pathname]);

  // Handle page unloads, tab closing, backgrounding
  useEffect(() => {
    const handleUnload = () => {
      if (activeViewRef.current) {
        sendDuration(activeViewRef.current.id, activeViewRef.current.startTime);
        activeViewRef.current = null;
      }
    };

    window.addEventListener("beforeunload", handleUnload);
    window.addEventListener("pagehide", handleUnload);

    return () => {
      window.removeEventListener("beforeunload", handleUnload);
      window.removeEventListener("pagehide", handleUnload);
    };
  }, []);

  return null;
}
