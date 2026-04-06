"use client";

import { useEffect } from "react";

export function ServiceWorkerRegistration() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      const handleRegistration = (registration: ServiceWorkerRegistration) => {
        console.log("Service Worker registered with scope:", registration.scope);

        // Check for updates periodically
        setInterval(() => {
          registration.update();
        }, 1000 * 60 * 60); // Check every hour

        registration.onupdatefound = () => {
          const installingWorker = registration.installing;
          if (installingWorker) {
            installingWorker.onstatechange = () => {
              if (installingWorker.state === "installed") {
                if (navigator.serviceWorker.controller) {
                   // New content is available; please refresh.
                   console.log("New content is available; refreshing...");
                   // We don't necessarily need to reload here if sw.js has skipWaiting
                   // but it ensures the UI is fresh.
                }
              }
            };
          }
        };
      };

      // Handle controller change (e.g. when skipWaiting() is called)
      let refreshing = false;
      navigator.serviceWorker.addEventListener("controllerchange", () => {
        if (refreshing) return;
        refreshing = true;
        window.location.reload();
      });

      window.addEventListener("load", () => {
        navigator.serviceWorker
          .register("/sw.js")
          .then(handleRegistration)
          .catch((error) => {
            console.error("Service Worker registration failed:", error);
          });
      });
    }
  }, []);

  return null;
}
