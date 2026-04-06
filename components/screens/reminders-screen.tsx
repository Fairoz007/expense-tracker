"use client";

import { useState, useEffect } from "react";
import { ChevronLeft, Bell, Clock, Info } from "lucide-react";
import { toast } from "sonner";

interface RemindersScreenProps {
  onBack: () => void;
}

export function RemindersScreen({ onBack }: RemindersScreenProps) {
  const [reminderTime, setReminderTime] = useState("20:00");
  const [isEnabled, setIsEnabled] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>("default");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedTime = localStorage.getItem("expense-reminder-time");
      const savedEnabled = localStorage.getItem("expense-reminder-enabled");
      if (savedTime) setReminderTime(savedTime);
      if (savedEnabled === "true") setIsEnabled(true);
      
      if ("Notification" in window) {
        setPermission(Notification.permission);
      }
    }
  }, []);

  const requestPermission = async () => {
    if (!("Notification" in window)) {
      toast.error("This browser does not support desktop notifications");
      return;
    }

    const result = await Notification.requestPermission();
    setPermission(result);
    if (result === "granted") {
      toast.success("Notifications enabled!");
    } else {
      toast.error("Notification permission denied");
    }
  };

  const handleToggle = (enabled: boolean) => {
    setIsEnabled(enabled);
    localStorage.setItem("expense-reminder-enabled", enabled.toString());
    if (enabled && permission !== "granted") {
      requestPermission();
    }
  };

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = e.target.value;
    setReminderTime(newTime);
    localStorage.setItem("expense-reminder-time", newTime);
  };

  const testNotification = () => {
    if (permission !== "granted") {
      toast.error("Please enable notification permission first");
      return;
    }

    toast.info("Sending test notification...");
    
    // Show notification immediately
    if ("serviceWorker" in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.ready.then((registration) => {
            registration.showNotification("Expense Tracker Test", {
                body: "This is a test notification! Don't forget to log your expenses.",
                icon: "/icon-light-32x32.png",
                badge: "/icon-light-32x32.png",
                vibrate: [200, 100, 200],
            } as any);
        });
    } else {
        new Notification("Expense Tracker Test", {
            body: "This is a test notification! Don't forget to log your expenses.",
            icon: "/icon-light-32x32.png",
        });
    }
  };

  return (
    <div className="mobile-container flex flex-col bg-card min-h-dvh">
      {/* Header */}
      <div className="px-4 pt-6 pb-4 flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-1 text-foreground hover:text-muted-foreground transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
          <span className="text-sm font-medium">Back</span>
        </button>
        <h1 className="text-lg font-semibold">Reminders</h1>
        <div className="w-10" /> {/* Spacer */}
      </div>

      <div className="px-6 py-4 flex-1">
        <div className="bg-muted/30 rounded-2xl p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[var(--coral)]/10 rounded-full flex items-center justify-center">
                <Bell className="w-5 h-5 text-[var(--coral)]" />
              </div>
              <div>
                <h3 className="font-medium">Daily Reminder</h3>
                <p className="text-xs text-muted-foreground">Get notified to track expenses</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                className="sr-only peer" 
                checked={isEnabled}
                onChange={(e) => handleToggle(e.target.checked)}
              />
              <div className="w-11 h-6 bg-muted rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--coral)]"></div>
            </label>
          </div>

          <div className={`space-y-4 transition-opacity ${isEnabled ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="w-4 h-4" />
                <span>Reminder Time</span>
              </div>
              <input 
                type="time" 
                value={reminderTime}
                onChange={handleTimeChange}
                className="bg-background border border-border rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-[var(--coral)]"
              />
            </div>
          </div>
        </div>

        <div className="bg-blue-50 text-blue-700 p-4 rounded-xl flex gap-3 mb-8">
          <Info className="w-5 h-5 shrink-0 mt-0.5" />
          <p className="text-xs leading-relaxed">
            For reminders to work properly, ensure you have allowed notifications in your phone settings and have the app installed as a PWA (Add to Home Screen).
          </p>
        </div>

        <button
          onClick={testNotification}
          className="w-full py-4 bg-foreground text-background rounded-2xl font-semibold hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
        >
          <Bell className="w-5 h-5" />
          Test Notification
        </button>
      </div>
    </div>
  );
}
