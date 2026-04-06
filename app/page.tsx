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
import { BudgetScreen } from "@/components/screens/budget-screen";
import { BottomNavigation } from "@/components/ui/bottom-navigation";

type Screen = "onboarding" | "signin" | "home" | "expenses" | "total-expense" | "add" | "calendar" | "profile" | "reminders" | "transaction-detail" | "all-transactions" | "budget";

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
      createOrGetUser({
        clerkId: user.id,
        email: user.primaryEmailAddress?.emailAddress || "",
        name: `${user.firstName || ""} ${user.lastName || ""}`.trim() || "User",
        imageUrl: user.imageUrl,
      }).then(() => {
        seedInitialData({ clerkId: user.id }).catch(() => {});
      }).catch((err) => {
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
    return (
        <div className="screen-entry">
            <OnboardingScreen onComplete={handleOnboardingComplete} />
        </div>
    );
  }

  // Show sign in if not authenticated
  if (!isSignedIn) {
    return (
      <div className="mobile-container screen-entry flex flex-col items-center justify-center min-h-dvh bg-[var(--cream)] p-6">
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

  // Helper to wrap screen in container + entry animation
  const renderScreen = () => {
    switch (currentScreen) {
      case "total-expense":
        return (
          <div className="mobile-container min-h-dvh screen-entry">
            <TotalExpenseScreen 
              onBack={() => setCurrentScreen("expenses")} 
              onNavigate={(screen) => handleNavigation(screen)}
            />
          </div>
        );
      case "add":
        return (
          <div className="mobile-container min-h-dvh screen-entry">
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
      case "transaction-detail":
        if (!selectedTransaction) return null;
        return (
          <div className="mobile-container min-h-dvh screen-entry">
            <TransactionDetailScreen 
              transaction={selectedTransaction}
              onBack={() => setCurrentScreen("home")}
              onEdit={(tx) => {
                setSelectedTransaction(tx);
                setIsEditing(true);
                setCurrentScreen("add");
              }}
              onDeleteSuccess={() => setCurrentScreen("home")}
            />
          </div>
        );
      case "all-transactions":
        return (
          <div className="mobile-container min-h-dvh screen-entry">
            <AllTransactionsScreen 
              onBack={() => setCurrentScreen("home")}
              onTransactionClick={(tx) => {
                setSelectedTransaction(tx);
                setCurrentScreen("transaction-detail");
              }}
            />
          </div>
        );
      case "profile":
        return (
          <div className="mobile-container min-h-dvh screen-entry">
            <ProfileScreen 
              onBack={() => setCurrentScreen("home")} 
              onNavigate={handleNavigation}
            />
          </div>
        );
      case "reminders":
        return (
          <div className="mobile-container min-h-dvh screen-entry">
            <RemindersScreen onBack={() => setCurrentScreen("profile")} />
          </div>
        );
      case "budget":
        return (
          <div className="mobile-container min-h-dvh screen-entry">
            <BudgetScreen onBack={() => setCurrentScreen("profile")} />
          </div>
        );
      case "home":
      case "expenses":
      case "calendar":
        return (
          <div className="mobile-container min-h-dvh screen-entry">
            {currentScreen === "home" && <HomeScreen onNavigate={handleNavigation} />}
            {currentScreen === "expenses" && <ExpensesScreen onNavigate={handleNavigation} />}
            {currentScreen === "calendar" && <ExpensesScreen onNavigate={handleNavigation} />}
            
            <BottomNavigation
              currentScreen={currentScreen as "home" | "expenses" | "add" | "calendar" | "profile"}
              onNavigate={(screen) => setCurrentScreen(screen)}
            />
          </div>
        );
      default:
        return null;
    }
  };

  return <>{renderScreen()}</>;
}
