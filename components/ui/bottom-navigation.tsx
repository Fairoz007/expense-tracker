"use client";

import { Home, CreditCard, Calendar, Settings, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

type Screen = "home" | "expenses" | "add" | "calendar" | "profile";

interface BottomNavigationProps {
  currentScreen: Screen;
  onNavigate: (screen: Screen) => void;
}

export function BottomNavigation({
  currentScreen,
  onNavigate,
}: BottomNavigationProps) {
  const navItems = [
    { id: "home" as const, icon: Home, label: "Home" },
    { id: "expenses" as const, icon: CreditCard, label: "Cards" },
    { id: "add" as const, icon: Plus, label: "Add", isCenter: true },
    { id: "calendar" as const, icon: Calendar, label: "Calendar" },
    { id: "profile" as const, icon: Settings, label: "Settings" },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border z-50 pb-[env(safe-area-inset-bottom,0)]">
      <div className="max-w-[430px] mx-auto px-4 py-2 select-none">
        <div className="flex items-center justify-between">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentScreen === item.id;

            if (item.isCenter) {
              return (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  className="w-14 h-14 -mt-8 rounded-full bg-[var(--coral)] flex items-center justify-center shadow-lg active-scale focus:outline-none"
                >
                  <Icon className="h-6 w-6 text-white" />
                </button>
              );
            }

            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className="flex flex-col items-center gap-1 p-2 active-scale focus:outline-none"
              >
                <Icon
                  className={cn(
                    "h-6 w-6 transition-colors",
                    isActive ? "text-[var(--coral)]" : "text-muted-foreground hover:text-foreground"
                  )}
                />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
