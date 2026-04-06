"use client";

import { useState, useEffect } from "react";
import { ChevronLeft, Bell, Clock, Info, Calendar, Sparkles, AlertCircle } from "lucide-react";
import { toast } from "sonner";

interface RemindersScreenProps {
  onBack: () => void;
}

type Frequency = "daily" | "hourly" | "every-6h" | "weekdays" | "weekends";
type MotivationType = "gentle" | "strict" | "funny";

export function RemindersScreen({ onBack }: RemindersScreenProps) {
  const [reminderTime, setReminderTime] = useState("20:00");
  const [isEnabled, setIsEnabled] = useState(false);
  const [frequency, setFrequency] = useState<Frequency>("daily");
  const [motivation, setMotivation] = useState<MotivationType>("gentle");
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedTime = localStorage.getItem("expense-reminder-time");
      const savedEnabled = localStorage.getItem("expense-reminder-enabled");
      const savedFreq = localStorage.getItem("expense-reminder-frequency") as Frequency;
      const savedMotiv = localStorage.getItem("expense-reminder-motivation") as MotivationType;
      
      if (savedTime) setReminderTime(savedTime);
      if (savedEnabled === "true") setIsEnabled(true);
      if (savedFreq) setFrequency(savedFreq);
      if (savedMotiv) setMotivation(savedMotiv);
      
      if ("Notification" in window) {
        setPermission(Notification.permission);
      }
    }
  }, []);

  const requestPermission = async () => {
    if (!("Notification" in window)) {
      toast.error("This browser does not support notifications");
      return;
    }

    const result = await Notification.requestPermission();
    setPermission(result);
    return result;
  };

  const handleToggle = async (enabled: boolean) => {
    setIsLoading(true);
    
    if (enabled && permission !== "granted") {
      const result = await requestPermission();
      if (result !== "granted") {
        setIsEnabled(false);
        setIsLoading(false);
        return;
      }
    }

    setIsEnabled(enabled);
    localStorage.setItem("expense-reminder-enabled", enabled.toString());
    
    setTimeout(() => {
        setIsLoading(false);
        if (enabled) {
            toast.success(`${frequency.replace("-", " ")} reminders set for ${reminderTime}`);
        } else {
            toast.info("Reminders turned off");
        }
    }, 500);
  };

  const saveSetting = (key: string, value: string) => {
    localStorage.setItem(key, value);
    // Visual feedback for auto-saving
  };

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = e.target.value;
    setReminderTime(newTime);
    saveSetting("expense-reminder-time", newTime);
  };

  const testNotification = async () => {
    if (permission !== "granted") {
      const result = await requestPermission();
      if (result !== "granted") return;
    }

    toast.info("Sending test notification...");
    
    const notificationOptions = {
      body: motivation === "funny" 
        ? "🍔 Your wallet is getting fat. Log those calories (expenses)!" 
        : motivation === "strict" 
            ? "⚠️ TRANSACTION REQUIRED: Log your daily expenses now."
            : "Don't forget to track your expenses today! 💸",
      icon: "/android-chrome-192x192.png",
      badge: "/favicon-32x32.png",
      vibrate: [200, 100, 200],
      tag: "test-reminder",
      renotify: true
    };

    if ("serviceWorker" in navigator && navigator.serviceWorker.controller) {
        const registration = await navigator.serviceWorker.ready;
        registration.showNotification("Expense Tracker", notificationOptions);
    } else {
        new Notification("Expense Tracker", notificationOptions);
    }
  };

  return (
    <div className="mobile-container flex flex-col bg-background min-h-dvh">
      {/* Premium Header */}
      <div className="px-5 pt-8 pb-6 flex items-center justify-between">
        <button
          onClick={onBack}
          className="w-10 h-10 flex items-center justify-center bg-card border border-border rounded-xl shadow-sm active:scale-95 transition-all"
        >
          <ChevronLeft className="w-5 h-5 text-foreground" />
        </button>
        <h1 className="text-xl font-bold text-foreground">Reminders</h1>
        <div className="w-10" />
      </div>

      <div className="px-6 space-y-6 flex-1 pb-10">
        {/* Permission Status */}
        {permission === "denied" && (
            <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                <div>
                    <h4 className="text-sm font-semibold text-red-800">Notifications Blocked</h4>
                    <p className="text-xs text-red-600 mt-1">Please enable notifications in your browser settings to receive reminders.</p>
                </div>
            </div>
        )}

        {/* Global Toggle */}
        <div className="bg-card border border-border rounded-3xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${isEnabled ? 'bg-[var(--coral)]/10 text-[var(--coral)]' : 'bg-muted text-muted-foreground'}`}>
                <Bell className={`w-6 h-6 ${isEnabled ? 'animate-bounce' : ''}`} />
              </div>
              <div>
                <h3 className="font-bold text-foreground">Smart Reminders</h3>
                <p className="text-xs text-muted-foreground">Stay on track with your budget</p>
              </div>
            </div>
            <button 
              onClick={() => handleToggle(!isEnabled)}
              disabled={isLoading}
              className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors focus:outline-none ${isEnabled ? 'bg-[var(--coral)]' : 'bg-muted'}`}
            >
              <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${isEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>
        </div>

        {/* Configuration Card */}
        <div className={`space-y-4 transition-all duration-300 ${isEnabled ? 'opacity-100 translate-y-0' : 'opacity-40 pointer-events-none translate-y-4'}`}>
          <div className="bg-card border border-border rounded-3xl p-6 shadow-sm space-y-6">
            {/* Time Picker */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-50 text-blue-500 rounded-xl flex items-center justify-center">
                    <Clock className="w-5 h-5" />
                </div>
                <span className="font-medium">Reminder Time</span>
              </div>
              <input 
                type="time" 
                value={reminderTime}
                onChange={handleTimeChange}
                className="bg-muted/50 border-none rounded-xl px-4 py-2 font-bold text-lg focus:ring-2 focus:ring-[var(--coral)] outline-none"
              />
            </div>

            <div className="h-px bg-border/50" />

            {/* Frequency Selection */}
            <div className="space-y-3">
                <div className="flex items-center gap-3 mb-1">
                    <div className="w-10 h-10 bg-green-50 text-green-500 rounded-xl flex items-center justify-center">
                        <Calendar className="w-5 h-5" />
                    </div>
                    <span className="font-medium">Frequency</span>
                </div>
                <div className="flex flex-wrap gap-2">
                    {(["daily", "hourly", "every-6h", "weekdays", "weekends"] as Frequency[]).map((f) => (
                        <button
                            key={f}
                            onClick={() => { setFrequency(f); saveSetting("expense-reminder-frequency", f); }}
                            className={`px-3 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all border ${frequency === f ? 'bg-[var(--coral)] border-[var(--coral)] text-white shadow-lg' : 'bg-muted border-transparent text-muted-foreground hover:bg-muted/80'}`}
                        >
                            {f.replace("-", " ")}
                        </button>
                    ))}
                </div>
            </div>

            <div className="h-px bg-border/50" />

            {/* Motivation Style */}
            <div className="space-y-3">
                <div className="flex items-center gap-3 mb-1">
                    <div className="w-10 h-10 bg-purple-50 text-purple-500 rounded-xl flex items-center justify-center">
                        <Sparkles className="w-5 h-5" />
                    </div>
                    <span className="font-medium">Motivation Style</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                    {(["gentle", "strict", "funny"] as MotivationType[]).map((m) => (
                        <button
                            key={m}
                            onClick={() => { setMotivation(m); saveSetting("expense-reminder-motivation", m); }}
                            className={`py-2 rounded-xl text-xs font-semibold capitalize transition-all ${motivation === m ? 'bg-[var(--purple)] text-white shadow-md' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}
                        >
                            {m}
                        </button>
                    ))}
                </div>
            </div>
          </div>
        </div>

        {/* Tutorial Card */}
        <div className="bg-[var(--navy)] text-white/90 p-5 rounded-3xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Info className="w-20 h-20" />
          </div>
          <h4 className="font-bold text-white mb-1">PWA Support</h4>
          <p className="text-xs text-white/70 leading-relaxed max-w-[80%]">
            To receive notifications reliably on your mobile device, please "Add to Home Screen" and ensure notifications are enabled in your OS settings.
          </p>
        </div>

        {/* Test Button */}
        <button
          onClick={testNotification}
          className="w-full py-5 bg-foreground text-background rounded-3xl font-bold hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-3 shadow-lg"
        >
          <Bell className="w-5 h-5" />
          Test My Setup
        </button>
      </div>
    </div>
  );
}

