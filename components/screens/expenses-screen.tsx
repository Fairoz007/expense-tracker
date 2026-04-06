"use client";

import { useState, useMemo } from "react";
import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Bell, ChevronLeft, ChevronRight, MoreVertical, ShoppingBag, Utensils, Package, Coffee, Car, Film, FileText, Activity } from "lucide-react";
import { cn } from "@/lib/utils";

const weekDays = ["M", "T", "W", "T", "F", "S", "S"];

interface ExpensesScreenProps {
  onNavigate: (screen: string) => void;
}

export function ExpensesScreen({ onNavigate }: ExpensesScreenProps) {
  const { user } = useUser();
  const [selectedDate, setSelectedDate] = useState(new Date().getDate());
  const [currentDate, setCurrentDate] = useState(new Date());

  // Get current month date range
  const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getTime();
  const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getTime();

  // Fetch balance from Convex
  const balanceQuery = useQuery(
    api.expenses.getBalance,
    user?.id ? { clerkId: user.id } : "skip"
  );

  // Fetch only current month's expenses for list
  const expenses = useQuery(
    api.expenses.getExpenses,
    user?.id ? { clerkId: user.id, startDate: startOfMonth, endDate: endOfMonth } : "skip"
  );

  const expensesSummary = useQuery(
    api.expenses.getExpensesSummary,
    user?.id ? { clerkId: user.id, startDate: startOfMonth, endDate: endOfMonth } : "skip"
  );

  // Get week dates for calendar
  const weekDates = useMemo(() => {
    const today = currentDate.getDate();
    const dayOfWeek = currentDate.getDay();
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    
    return Array.from({ length: 7 }, (_, i) => {
      const date = new Date(currentDate);
      date.setDate(today + mondayOffset + i);
      return date.getDate();
    });
  }, [currentDate]);

  // Format month display
  const monthDisplay = currentDate.toLocaleDateString("en-US", { month: "long", year: "numeric" });

  // Calculate stats from Convex data
  const stats = useMemo(() => {
    const monthSpent = expensesSummary?.totalExpenses || 0;
    
    // For weekSpent and daySpent, we can still use the (now filtered) expenses list
    const now = new Date();
    const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay())).getTime();
    const startOfDay = new Date().setHours(0, 0, 0, 0);

    const weekSpent = (expenses || [])
      .filter(e => e.type === "expense" && e.date >= startOfWeek)
      .reduce((sum, e) => sum + e.amount, 0);

    const daySpent = (expenses || [])
      .filter(e => e.type === "expense" && e.date >= startOfDay)
      .reduce((sum, e) => sum + e.amount, 0);

    return { 
      monthSpent, 
      weekSpent, 
      daySpent, 
      balance: balanceQuery || 0 
    };
  }, [expenses, expensesSummary, balanceQuery]);

  // Group expenses by category
  const expenseCategories = useMemo(() => {
    if (!expensesSummary?.byCategory || expensesSummary.byCategory.length === 0) {
      return [];
    }

    return expensesSummary.byCategory.map((cat, index) => ({
      id: index + 1,
      name: cat.category,
      paymentMethod: "Credit Card",
      totalSpend: cat.amount,
      totalBudget: cat.amount * 1.2, // Estimate budget as 120% of spending
      percentage: Math.min(cat.percentage, 100),
      date: monthDisplay,
    }));
  }, [expensesSummary, monthDisplay]);

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  return (
    <div className="flex flex-col h-full bg-background pb-20">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4">
        <Avatar className="h-12 w-12 border-2 border-[var(--purple-light)]">
          <AvatarImage src={user?.imageUrl} />
          <AvatarFallback className="bg-[var(--purple-light)] text-[var(--purple)]">
            {user?.firstName?.[0] || "U"}
          </AvatarFallback>
        </Avatar>
        <h1 className="text-xl font-bold text-foreground">Expenses</h1>
        <button className="relative p-2">
          <Bell className="h-6 w-6 text-[var(--coral)]" />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-[var(--coral)] rounded-full" />
        </button>
      </div>

      {/* Calendar Week */}
      <div className="px-5 mb-6">
        <div className="flex items-center justify-between mb-4">
          <button onClick={handlePrevMonth} className="p-1">
            <ChevronLeft className="h-5 w-5 text-muted-foreground" />
          </button>
          <span className="font-bold text-foreground">{monthDisplay}</span>
          <button onClick={handleNextMonth} className="p-1">
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>

        <div className="flex justify-between">
          {weekDays.map((day, index) => (
            <div key={index} className="flex flex-col items-center gap-2">
              <span className="text-xs font-bold text-muted-foreground">{day}</span>
              <button
                onClick={() => setSelectedDate(weekDates[index])}
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-colors relative",
                  selectedDate === weekDates[index]
                    ? "bg-[var(--coral)] text-white"
                    : "text-foreground"
                )}
              >
                {weekDates[index]}
                {selectedDate === weekDates[index] && (
                  <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-white" />
                )}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Analysis Cards */}
      <div className="px-5 mb-6 overflow-x-auto">
        <div className="flex gap-4 min-w-max pb-2">
          <div className="bg-[var(--purple)] rounded-2xl p-4 w-40">
            <p className="text-white/80 text-xs font-bold mb-1 uppercase tracking-wider">Month Spent</p>
            <p className="text-white text-xl font-bold">
              OMR {stats.monthSpent.toLocaleString("en-US", { minimumFractionDigits: 3, maximumFractionDigits: 3 })}
            </p>
          </div>
          <div className="bg-[var(--coral)] rounded-2xl p-4 w-40">
            <p className="text-white/80 text-xs font-bold mb-1 uppercase tracking-wider">Week Spent</p>
            <p className="text-white text-xl font-bold">
              OMR {stats.weekSpent.toLocaleString("en-US", { minimumFractionDigits: 3, maximumFractionDigits: 3 })}
            </p>
          </div>
          <div className="bg-[var(--navy)] rounded-2xl p-4 w-40">
            <p className="text-white/80 text-xs font-bold mb-1 uppercase tracking-wider">Day Spent</p>
            <p className="text-white text-xl font-bold">
              OMR {stats.daySpent.toLocaleString("en-US", { minimumFractionDigits: 3, maximumFractionDigits: 3 })}
            </p>
          </div>
        </div>
      </div>

      {/* Expenses List */}
      <div className="px-5 flex-1 overflow-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-foreground">Categories</h2>
          <button 
            onClick={() => onNavigate("total-expense")}
            className="text-sm font-bold text-muted-foreground hover:text-foreground"
          >
            All History
          </button>
        </div>

        <div className="space-y-4 pb-4">
          {expenseCategories.map((category) => (
            <div
              key={category.id}
              className="bg-card rounded-2xl p-4 border border-border hover:border-[var(--coral)] transition-colors"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
                    {getCategoryIcon(category.name)}
                  </div>
                  <div>
                    <p className="font-bold text-foreground">{category.name}</p>
                    <p className="text-xs font-bold text-muted-foreground uppercase">
                      {category.paymentMethod}
                    </p>
                  </div>
                </div>
                <span className="text-xs font-bold text-muted-foreground">
                  {category.date}
                </span>
              </div>

              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Spent</p>
                  <p className="text-lg font-bold text-[var(--purple)]">
                    OMR {category.totalSpend.toLocaleString("en-US", { minimumFractionDigits: 3, maximumFractionDigits: 3 })}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Budget</p>
                  <p className="text-lg font-bold text-foreground">
                    OMR {Math.round(category.totalBudget).toLocaleString("en-US", { minimumFractionDigits: 3, maximumFractionDigits: 3 })}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[var(--purple)] rounded-full transition-all"
                    style={{ width: `${Math.min(category.percentage, 100)}%` }}
                  />
                </div>
                <span className="text-xs font-bold text-[var(--coral)] min-w-[35px]">
                  {category.percentage.toFixed(0)}%
                </span>
              </div>
            </div>
          ))}
          {expenseCategories.length === 0 && (
            <div className="text-center py-10 text-muted-foreground font-medium">
              No data for this month.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function getCategoryIcon(category: string): React.ReactNode {
  const iconProps = { className: "h-5 w-5" };
  const icons: Record<string, React.ReactNode> = {
    "Shopping": <ShoppingBag {...iconProps} className="text-blue-500" />,
    "Grocery": <Utensils {...iconProps} className="text-green-500" />,
    "Food And Drinks": <Utensils {...iconProps} className="text-green-500" />,
    "Coffee": <Coffee {...iconProps} className="text-amber-600" />,
    "Transport": <Car {...iconProps} className="text-indigo-500" />,
    "Entertainment": <Film {...iconProps} className="text-purple-500" />,
    "Bills": <FileText {...iconProps} className="text-orange-500" />,
    "Healthcare": <Activity {...iconProps} className="text-red-500" />,
  };
  return icons[category] || <Package {...iconProps} className="text-gray-400" />;
}
