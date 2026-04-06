"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { toast } from "sonner";
import { Download, CloudOff, RefreshCw } from "lucide-react";

interface PWAContextType {
  isInstallable: boolean;
  installApp: () => Promise<void>;
  isOffline: boolean;
}

const PWAContext = createContext<PWAContextType | undefined>(undefined);

export function PWAProvider({ children }: { children: React.ReactNode }) {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    // 1. Handle Install Prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
      
      // Optional: Show a one-time toast to invite installation
      const hasShownPrompt = localStorage.getItem("pwa-prompt-shown");
      if (!hasShownPrompt) {
        toast("Install Expense Tracker", {
          description: "Install our app for a better experience and offline access.",
          action: {
            label: "Install",
            onClick: () => {
                (e as any).prompt();
                localStorage.setItem("pwa-prompt-shown", "true");
            },
          },
          duration: 10000,
        });
      }
    };

    // 2. Handle Offline/Online status
    const handleOnline = () => {
      setIsOffline(false);
      toast.success("Back online!", {
        icon: <RefreshCw className="h-4 w-4" />,
      });
    };

    const handleOffline = () => {
      setIsOffline(true);
      toast.error("You are currently offline", {
        description: "Some features may be limited.",
        icon: <CloudOff className="h-4 w-4" />,
        duration: Infinity,
      });
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Initial check
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      handleOffline();
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const installApp = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setDeferredPrompt(null);
      setIsInstallable(false);
    }
  };

  return (
    <PWAContext.Provider value={{ isInstallable, installApp, isOffline }}>
      {children}
      {isInstallable && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 pwa-only hidden">
           {/* This is a hidden trigger or we can show a subtle floating button */}
        </div>
      )}
    </PWAContext.Provider>
  );
}

export const usePWA = () => {
  const context = useContext(PWAContext);
  if (context === undefined) {
    throw new Error("usePWA must be used within a PWAProvider");
  }
  return context;
};
