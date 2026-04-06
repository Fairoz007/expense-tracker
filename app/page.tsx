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
import { RemindersScreen } from "@/components/screens/reminders-screen";
import { TransactionDetailScreen } from "@/components/screens/transaction-detail-screen";
import { AllTransactionsScreen } from "@/components/screens/all-transactions-screen";
import { BottomNavigation } from "@/components/ui/bottom-navigation";

type Screen = "onboarding" | "signin" | "home" | "expenses" | "total-expense" | "add" | "calendar" | "profile" | "reminders" | "transaction-detail" | "all-transactions";

export default function HomePage() {
  const { isLoaded, isSignedIn, user } = useUser();
  const createOrGetUser = useMutation(api.users.createOrGetUser);
  const seedInitialData = useMutation(api.expenses.seedInitialData);
  const [currentScreen, setCurrentScreen] = useState<Screen>("onboarding");
  const [hasOnboarded, setHasOnboarded] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);

  // Check if user has completed onboarding for this session
  useEffect(() => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const screenParam = urlParams.get("screen") as Screen;
      
      if (isSignedIn) {
         // If already signed in, we can skip onboarding if they've done it this session
         // or if they used a direct link
         if (screenParam) {
           setCurrentScreen(screenParam);
           setHasOnboarded(true);
         }
      }
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
        // Seed initial data (only happens if user has no expenses)
        seedInitialData({ clerkId: user.id }).catch(() => {});
      }).catch((err) => {
        // Silently handle errors - Convex may not be connected
        console.log("[v0] Convex user sync skipped:", err?.message || "Not connected");
      });
    }
  }, [isSignedIn, user, createOrGetUser, seedInitialData]);

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
    setHasOnboarded(true);
    setCurrentScreen(isSignedIn ? "home" : "signin");
  };

  const handleNavigation = (screen: string, data?: any) => {
    if (screen === "transaction-detail") {
      setSelectedTransaction(data);
      setIsEditing(false);
    } else if (screen === "add" && data) {
      // This is for editing from the detail screen
      setSelectedTransaction(data);
      setIsEditing(true);
    } else if (screen === "add") {
      setSelectedTransaction(null);
      setIsEditing(false);
    }
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
        <TotalExpenseScreen 
          onBack={() => setCurrentScreen("expenses")} 
          onNavigate={(screen) => handleNavigation(screen)}
        />
      </div>
    );
  }

  // Show add/edit expense screen
  if (currentScreen === "add") {
    return (
      <div className="mobile-container min-h-dvh">
        <AddExpenseScreen 
          onBack={() => {
            if (isEditing) {
              setCurrentScreen("transaction-detail");
            } else {
              setCurrentScreen("home");
            }
          }} 
          initialData={isEditing ? {
            id: selectedTransaction._id,
            amount: selectedTransaction.amount,
            category: selectedTransaction.category,
            description: selectedTransaction.description,
            date: selectedTransaction.date,
            type: selectedTransaction.type,
          } : undefined}
        />
      </div>
    );
  }

  // Show transaction detail screen
  if (currentScreen === "transaction-detail" && selectedTransaction) {
    return (
      <div className="mobile-container min-h-dvh">
        <TransactionDetailScreen 
          transaction={selectedTransaction}
          onBack={() => {
             // Go back to wherever we came from
             // This is a bit tricky, but for simplicity let's go home
             setCurrentScreen("home");
          }}
          onEdit={(tx) => {
            setSelectedTransaction(tx);
            setIsEditing(true);
            setCurrentScreen("add");
          }}
          onDeleteSuccess={() => setCurrentScreen("home")}
        />
      </div>
    );
  }

  // Show all transactions screen
  if (currentScreen === "all-transactions") {
    return (
      <div className="mobile-container min-h-dvh">
        <AllTransactionsScreen 
          onBack={() => setCurrentScreen("home")}
          onTransactionClick={(tx) => {
            setSelectedTransaction(tx);
            setCurrentScreen("transaction-detail");
          }}
        />
      </div>
    );
  }

  // Show profile screen
  if (currentScreen === "profile") {
    return (
      <div className="mobile-container min-h-dvh">
        <ProfileScreen 
          onBack={() => setCurrentScreen("home")} 
          onNavigate={handleNavigation}
        />
      </div>
    );
  }

  // Show reminders screen
  if (currentScreen === "reminders") {
    return (
      <div className="mobile-container min-h-dvh">
        <RemindersScreen onBack={() => setCurrentScreen("profile")} />
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
