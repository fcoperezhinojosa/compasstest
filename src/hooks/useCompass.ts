"use client";

import { useState, useEffect, useCallback, useRef } from "react";

export interface CompassState {
  heading: number;
  direction: string;
  simpleDirection: string;
  isSupported: boolean;
  isMobile: boolean;
  permissionGranted: boolean;
  error: string | null;
}

const SMOOTHING = 0.3;

function normalizeHeading(h: number): number {
  return ((h % 360) + 360) % 360;
}

export function angleDifference(a: number, b: number): number {
  let diff = normalizeHeading(b) - normalizeHeading(a);
  if (diff > 180) diff -= 360;
  if (diff < -180) diff += 360;
  return diff;
}

function getDirectionName(heading: number): string {
  const directions = [
    "N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE",
    "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW",
  ];
  const index = Math.round(normalizeHeading(heading) / 22.5) % 16;
  return directions[index];
}

function getSimpleDirection(heading: number): string {
  const directions = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
  const index = Math.round(normalizeHeading(heading) / 45) % 8;
  return directions[index];
}

function checkIsMobile(): boolean {
  if (typeof navigator === "undefined") return false;
  return (
    /Android|iPhone|iPad|iPod|webOS|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    ) ||
    (navigator.maxTouchPoints > 1 && window.innerWidth < 1024)
  );
}

export function useCompass() {
  const [state, setState] = useState<CompassState>({
    heading: 0,
    direction: "N",
    simpleDirection: "N",
    isSupported: false,
    isMobile: false,
    permissionGranted: false,
    error: null,
  });

  const smoothedHeading = useRef(0);
  const isListening = useRef(false);

  useEffect(() => {
    setState((prev) => ({
      ...prev,
      isSupported: "DeviceOrientationEvent" in window,
      isMobile: checkIsMobile(),
    }));
  }, []);

  const handleOrientation = useCallback((event: DeviceOrientationEvent) => {
    let heading: number;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const evt = event as any;
    if (evt.webkitCompassHeading !== undefined) {
      heading = evt.webkitCompassHeading;
    } else if (event.alpha !== null) {
      heading = 360 - event.alpha!;
    } else {
      return;
    }

    heading = normalizeHeading(heading);

    // Smooth
    const diff = angleDifference(smoothedHeading.current, heading);
    smoothedHeading.current = normalizeHeading(
      smoothedHeading.current + diff * SMOOTHING
    );
    const smoothed = smoothedHeading.current;

    setState((prev) => ({
      ...prev,
      heading: smoothed,
      direction: getDirectionName(smoothed),
      simpleDirection: getSimpleDirection(smoothed),
    }));
  }, []);

  const requestPermission = useCallback(async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const DOE = DeviceOrientationEvent as any;
    if (typeof DOE.requestPermission === "function") {
      try {
        const response = await DOE.requestPermission();
        if (response === "granted") {
          setState((prev) => ({ ...prev, permissionGranted: true }));
          return true;
        }
        setState((prev) => ({
          ...prev,
          error: "Compass permission denied",
        }));
        return false;
      } catch {
        setState((prev) => ({
          ...prev,
          error: "Failed to request permission",
        }));
        return false;
      }
    }
    // Non-iOS: permission not needed
    setState((prev) => ({ ...prev, permissionGranted: true }));
    return true;
  }, []);

  const startListening = useCallback(() => {
    if (isListening.current) return;
    isListening.current = true;
    window.addEventListener("deviceorientation", handleOrientation, true);
  }, [handleOrientation]);

  const stopListening = useCallback(() => {
    isListening.current = false;
    window.removeEventListener("deviceorientation", handleOrientation, true);
  }, [handleOrientation]);

  useEffect(() => {
    return () => {
      if (isListening.current) {
        window.removeEventListener(
          "deviceorientation",
          handleOrientation,
          true
        );
      }
    };
  }, [handleOrientation]);

  return {
    ...state,
    requestPermission,
    startListening,
    stopListening,
    normalizeHeading,
  };
}
