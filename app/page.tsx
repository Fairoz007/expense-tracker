"use client";

import { useState, useEffect } from "react";
import { useUser, SignIn } from "@clerk/nextjs";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { OnboardingScreen } from "@/components/screens/onboarding-screen";
import { HomeScreen } from "@/components/screens/home-screen";
import { ExpensesScreen } from "@/components/screens/expenses-screen";
import { TotalExpenseScreen } from "@/components/screens/total-expense-screen";
import { AddExpenseScreen } from "@/components/screens/add-expense-screen";
import { ProfileScreen } from "@/components/screens/profile-screen";
import { BottomNavigation } from "@/components/ui/bottom-navigation";

type Screen = "onboarding" | "signin" | "home" | "expenses" | "total-expense" | "add" | "calendar" | "profile";

export default function HomePage() {
  const { isLoaded, isSignedIn, user } = useUser();
  const createOrGetUser = useMutation(api.users.createOrGetUser);
  const [currentScreen, setCurrentScreen] = useState<Screen>("onboarding");
  const [hasOnboarded, setHasOnboarded] = useState(false);

  // Check if user has completed onboarding
  useEffect(() => {
    const onboarded = localStorage.getItem("expense-tracker-onboarded");
    if (onboarded === "true") {
      setHasOnboarded(true);
      setCurrentScreen(isSignedIn ? "home" : "signin");
    }
  }, [isSignedIn]);

  // Create or get user in Convex when signed in (non-blocking)
  useEffect(() => {
    if (isSignedIn && user) {
      // Run in background, don't block UI
      createOrGetUser({
        clerkId: user.id,
        email: user.primaryEmailAddress?.emailAddress || "",
        name: `${user.firstName || ""} ${user.lastName || ""}`.trim() || "User",
        imageUrl: user.imageUrl,
      }).then(() => {
      }).catch((err) => {
        // Silently handle errors - Convex may not be connected
        console.log("[v0] Convex user sync skipped:", err?.message || "Not connected");
      });
    }
  }, [isSignedIn, user, createOrGetUser]);

  // Update screen based on auth state
  useEffect(() => {
    if (hasOnboarded) {
      if (isSignedIn) {
        if (currentScreen === "signin" || currentScreen === "onboarding") {
          setCurrentScreen("home");
        }
      } else {
        setCurrentScreen("signin");
      }
    }
  }, [isSignedIn, hasOnboarded, currentScreen]);

  const handleOnboardingComplete = () => {
    localStorage.setItem("expense-tracker-onboarded", "true");
    setHasOnboarded(true);
    setCurrentScreen("signin");
  };

  const handleNavigation = (screen: string) => {
    setCurrentScreen(screen as Screen);
  };

  if (!isLoaded) {
    return (
      <div className="mobile-container flex items-center justify-center min-h-dvh">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  // Show onboarding for first-time users
  if (currentScreen === "onboarding" && !hasOnboarded) {
    return <OnboardingScreen onComplete={handleOnboardingComplete} />;
  }

  // Show sign in if not authenticated
  if (!isSignedIn) {
    return (
      <div className="mobile-container flex flex-col items-center justify-center min-h-dvh bg-[var(--cream)] p-6">
        <h1 className="text-2xl font-bold text-foreground mb-2">Welcome Back</h1>
        <p className="text-muted-foreground text-center mb-8">
          Sign in to continue managing your expenses
        </p>
        <SignIn
          routing="hash"
          appearance={{
            elements: {
              rootBox: "w-full max-w-[360px]",
              card: "shadow-none border-0 bg-transparent",
              headerTitle: "hidden",
              headerSubtitle: "hidden",
              socialButtonsBlockButton:
                "bg-card border border-border hover:bg-accent",
              formButtonPrimary: "bg-[var(--coral)] hover:opacity-90",
              footerActionLink: "text-[var(--coral)] hover:opacity-90",
            },
          }}
        />
      </div>
    );
  }

  // Show total expense screen
  if (currentScreen === "total-expense") {
    return (
      <div className="mobile-container min-h-dvh">
        <TotalExpenseScreen onBack={() => setCurrentScreen("expenses")} />
      </div>
    );
  }

  // Show add expense screen
  if (currentScreen === "add") {
    return (
      <div className="mobile-container min-h-dvh">
        <AddExpenseScreen onBack={() => setCurrentScreen("home")} />
      </div>
    );
  }

  // Show profile screen
  if (currentScreen === "profile") {
    return (
      <div className="mobile-container min-h-dvh">
        <ProfileScreen onBack={() => setCurrentScreen("home")} />
      </div>
    );
  }

  // Main app with bottom navigation
  return (
    <div className="mobile-container min-h-dvh">
      {currentScreen === "home" && <HomeScreen onNavigate={handleNavigation} />}
      {currentScreen === "expenses" && <ExpensesScreen onNavigate={handleNavigation} />}
      {currentScreen === "calendar" && <ExpensesScreen onNavigate={handleNavigation} />}
      
      <BottomNavigation
        currentScreen={currentScreen as "home" | "expenses" | "add" | "calendar" | "profile"}
        onNavigate={(screen) => setCurrentScreen(screen)}
      />
    </div>
  );
}
