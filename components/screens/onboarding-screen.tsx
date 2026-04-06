"use client";

import { useState, useCallback, useEffect } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { ChevronRight } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface OnboardingScreenProps {
  onComplete: () => void;
}

const slides = [
  {
    title: "Track your income and expenses",
    description: "Detailed management of your daily finances with beautiful categories and analytics.",
    image: "/images/expense-hero.jpg",
    color: "bg-[var(--cream)]",
  },
  {
    title: "Understand your spending",
    description: "Get smart insights into where your money goes and how to save more effectively.",
    image: "/images/wallet-hero.jpg",
    color: "bg-blue-50",
  },
  {
    title: "Secure and private",
    description: "Your financial data is yours alone, secured with enterprise-grade encryption.",
    image: "/images/onboarding-security.png",
    color: "bg-purple-50",
  }
];

export function OnboardingScreen({ onComplete }: OnboardingScreenProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel();
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isLastSlide, setIsLastSlide] = useState(false);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    const index = emblaApi.selectedScrollSnap();
    setSelectedIndex(index);
    setIsLastSlide(index === slides.length - 1);
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on("select", onSelect);
    emblaApi.on("reInit", onSelect);
  }, [emblaApi, onSelect]);

  const handleNext = () => {
    if (emblaApi) {
      if (isLastSlide) {
        onComplete();
      } else {
        emblaApi.scrollNext();
      }
    }
  };

  return (
    <div className="mobile-container flex flex-col bg-background min-h-dvh overflow-hidden">
      <div className="flex-1 min-h-0 relative flex flex-col">
        {/* Embla Viewport */}
        <div className="overflow-hidden flex-1" ref={emblaRef}>
          <div className="flex h-full">
            {slides.map((slide, index) => (
              <div key={index} className="flex-[0_0_100%] min-w-0 flex flex-col">
                <div className={cn("flex-1 flex items-center justify-center p-8 relative rounded-b-[3rem]", slide.color)}>
                  <div className="relative w-full max-w-[300px] aspect-square drop-shadow-2xl">
                    <Image
                      src={slide.image}
                      alt={slide.title}
                      fill
                      className="object-contain"
                      priority
                      onError={(e) => {
                         // Fallback handle for missing images
                         (e.target as any).src = "https://placehold.co/600x600/png?text=Expense+Tracker";
                      }}
                    />
                  </div>
                </div>
                
                <div className="px-8 pt-10 pb-6 text-center">
                  <h1 className="text-3xl font-black text-foreground leading-tight mb-4 tracking-tight">
                    {slide.title}
                  </h1>
                  <p className="text-muted-foreground text-sm leading-relaxed max-w-[280px] mx-auto font-medium">
                    {slide.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer Area */}
        <div className="px-8 pb-12 flex flex-col items-center gap-8">
          {/* Dots Indicator */}
          <div className="flex gap-2">
            {slides.map((_, index) => (
              <div
                key={index}
                className={cn(
                  "h-1.5 rounded-full transition-all duration-300",
                  selectedIndex === index ? "w-8 bg-[var(--coral)]" : "w-1.5 bg-muted-foreground/30"
                )}
              />
            ))}
          </div>

          {/* Action Button */}
          <button
            onClick={handleNext}
            className={cn(
                "w-full h-16 rounded-2xl flex items-center justify-center gap-3 font-black text-lg transition-all active:scale-[0.98] shadow-xl",
                isLastSlide 
                  ? "bg-[var(--navy)] text-white shadow-[var(--navy)]/20" 
                  : "bg-[var(--coral)] text-white shadow-[var(--coral)]/20"
            )}
          >
            {isLastSlide ? "Get Started" : "Continue"}
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
