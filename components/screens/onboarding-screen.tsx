"use client";

import { useState } from "react";
import { ChevronRight } from "lucide-react";
import Image from "next/image";

interface OnboardingScreenProps {
  onComplete: () => void;
}

export function OnboardingScreen({ onComplete }: OnboardingScreenProps) {
  const [isAnimating, setIsAnimating] = useState(false);

  const handleSwipe = () => {
    setIsAnimating(true);
    setTimeout(() => {
      onComplete();
    }, 300);
  };

  return (
    <div className="mobile-container flex flex-col bg-card min-h-dvh">
      {/* Hero Section with Image */}
      <div className="flex-1 bg-[var(--cream)] rounded-b-[2.5rem] flex items-center justify-center p-8 relative overflow-hidden">
        <div className="relative w-full max-w-[280px] aspect-square">
          <Image
            src="/images/expense-hero.jpg"
            alt="Expense tracking illustration"
            fill
            className="object-contain"
            priority
          />
        </div>
      </div>

      {/* Content Section */}
      <div className="px-6 py-8 flex flex-col items-center text-center gap-4">
        <h1 className="text-2xl font-bold text-foreground leading-tight text-balance">
          Manage your daily life expenses
        </h1>
        <p className="text-muted-foreground text-sm leading-relaxed max-w-[280px]">
          Expense Tracker is a simple and efficient personal finance management
          app that allows you to track your daily expenses and income.
        </p>
      </div>

      {/* Swipe Button */}
      <div className="px-6 pb-10">
        <button
          onClick={handleSwipe}
          disabled={isAnimating}
          className="w-full bg-[var(--coral)] hover:opacity-90 text-white rounded-full py-4 px-6 flex items-center justify-center gap-2 transition-all duration-300 relative overflow-hidden group"
        >
          <span className="absolute left-4 bg-white/20 rounded-full p-2 transition-transform group-hover:translate-x-2">
            <ChevronRight className="w-4 h-4" />
            <ChevronRight className="w-4 h-4 absolute top-2 left-2 opacity-50" />
          </span>
          <span className="font-medium">Swipe to get started</span>
        </button>
      </div>
    </div>
  );
}
