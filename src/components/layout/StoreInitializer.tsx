"use client";

import { useEffect, useRef } from "react";
import { useStore } from "@/store/useStore";
import { getFloorsData } from "@/app/actions/units";
import type { Floor } from "@/data/floors";

interface StoreInitializerProps {
  initialFloorsData: Floor[];
}

export default function StoreInitializer({ initialFloorsData }: StoreInitializerProps) {
  const initialized = useRef(false);

  // Sync state during SSR / first render
  if (!initialized.current) {
    useStore.setState({ floorsData: initialFloorsData });
    initialized.current = true;
  }

  // Background sync for real-time updates when mounting
  useEffect(() => {
    getFloorsData()
      .then((data) => {
        useStore.setState({ floorsData: data as Floor[] });
      })
      .catch((err) => {
        console.error("Failed to sync floor data in background:", err);
      });
  }, []);

  return null;
}
