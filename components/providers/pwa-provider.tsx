"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { toast } from "sonner";
import { Download, CloudOff, RefreshCw, X, Smartphone } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@/components/ui/button";

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
  const [showInstallBanner, setShowInstallBanner] = useState(false);

  useEffect(() => {
    // 1. Handle Install Prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
      
      // Auto-pop logic: check if user has dismissed it recently
      const lastDismissed = localStorage.getItem("pwa-prompt-dismissed");
      const isStandalone = window.matchMedia("(display-mode: standalone)").matches || (navigator as any).standalone === true;
      
      if (!isStandalone && (!lastDismissed || Date.now() - parseInt(lastDismissed) > 1000 * 60 * 60 * 24 * 7)) { // 7 days
        // Delay slightly for effect
        setTimeout(() => setShowInstallBanner(true), 1500);
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
      setShowInstallBanner(false);
    }
  };

  const dismissBanner = () => {
    setShowInstallBanner(false);
    localStorage.setItem("pwa-prompt-dismissed", Date.now().toString());
  };

  return (
    <PWAContext.Provider value={{ isInstallable, installApp, isOffline }}>
      {children}
      
      <AnimatePresence>
        {showInstallBanner && (
          <motion.div 
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 50, opacity: 0 }}
            className="fixed bottom-6 left-4 right-4 z-[9999] sm:left-auto sm:right-6 sm:w-96"
          >
            <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 p-5 overflow-hidden relative group">
              {/* Decorative elements */}
              <div className="absolute top-0 right-0 p-1 opacity-20 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={dismissBanner}
                  className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full"
                >
                  <X className="h-4 w-4 text-zinc-500" />
                </button>
              </div>
              
              <div className="flex gap-4 items-start">
                <div className="h-12 w-12 rounded-xl bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center shrink-0">
                  <Smartphone className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                </div>
                
                <div className="flex-1">
                  <h3 className="font-semibold text-lg text-zinc-900 dark:text-zinc-50 mb-1">
                    Install App
                  </h3>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4 leading-relaxed">
                    Install Expense Tracker on your home screen for fast access and offline tracking.
                  </p>
                  
                  <div className="flex gap-2">
                    <Button 
                      onClick={installApp}
                      className="bg-orange-600 hover:bg-orange-700 text-white rounded-lg px-6 flex-1 shadow-lg shadow-orange-600/20"
                    >
                      Install Now
                    </Button>
                    <Button 
                      variant="ghost" 
                      onClick={dismissBanner}
                      className="text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                    >
                      Later
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
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
