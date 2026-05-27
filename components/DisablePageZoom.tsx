"use client";

import { useEffect } from "react";

const ZOOM_KEY_VALUES = new Set(["+", "-", "=", "0"]);

export function DisablePageZoom() {
  useEffect(() => {
    function preventGesture(event: Event) {
      event.preventDefault();
    }

    function preventWheelZoom(event: WheelEvent) {
      if (event.ctrlKey || event.metaKey) {
        event.preventDefault();
      }
    }

    function preventKeyboardZoom(event: KeyboardEvent) {
      if (!(event.ctrlKey || event.metaKey)) {
        return;
      }

      if (ZOOM_KEY_VALUES.has(event.key)) {
        event.preventDefault();
      }
    }

    document.addEventListener("gesturestart", preventGesture, {
      passive: false,
    });
    document.addEventListener("gesturechange", preventGesture, {
      passive: false,
    });
    document.addEventListener("gestureend", preventGesture, {
      passive: false,
    });
    window.addEventListener("wheel", preventWheelZoom, {
      passive: false,
    });
    window.addEventListener("keydown", preventKeyboardZoom);

    return () => {
      document.removeEventListener("gesturestart", preventGesture);
      document.removeEventListener("gesturechange", preventGesture);
      document.removeEventListener("gestureend", preventGesture);
      window.removeEventListener("wheel", preventWheelZoom);
      window.removeEventListener("keydown", preventKeyboardZoom);
    };
  }, []);

  return null;
}
