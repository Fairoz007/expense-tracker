"use client";

import { useState, useMemo } from "react";
import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Bell, MoreHorizontal, ChevronDown, ShoppingBag, Utensils, Package, Coffee, Car, Film, FileText, Activity } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Cell,
} from "recharts";

interface HomeScreenProps {
  onNavigate: (screen: string, data?: any) => void;
}

export function HomeScreen({ onNavigate }: HomeScreenProps) {
  const { user } = useUser();
  const [selectedYear] = useState(new Date().getFullYear().toString());

  // Get current month date range
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getTime();

  // Fetch current year range for analytics
  const startOfYear = new Date(new Date().getFullYear(), 0, 1).getTime();
  const endOfYear = new Date(new Date().getFullYear(), 11, 31, 23, 59, 59).getTime();

  // Fetch expenses from Convex (limited to current year for analytics)
  const expenses = useQuery(
    api.expenses.getExpenses,
    user?.id ? { clerkId: user.id, startDate: startOfYear, endDate: endOfYear } : "skip"
  );

  const recentExpenses = useQuery(
    api.expenses.getRecentExpenses,
    user?.id ? { clerkId: user.id, limit: 5 } : "skip"
  );

  const expensesSummary = useQuery(
    api.expenses.getExpensesSummary,
    user?.id
      ? { clerkId: user.id, startDate: startOfMonth, endDate: endOfMonth }
      : "skip"
  );

  const balance = useQuery(
    api.expenses.getBalance,
    user?.id ? { clerkId: user.id } : "skip"
  );

  const currentMonth = new Date().toLocaleString('default', { month: 'short' });

  // Calculate analytics data from real expenses
  const analyticsData = useMemo(() => {
    if (!expenses || expenses.length === 0) {
      return ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul"].map(m => ({ month: m, amount: 0 }));
    }

    // Group expenses by month for the selected year
    const monthlyData = new Map<string, number>();
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    
    expenses.forEach((exp) => {
      const date = new Date(exp.date);
      if (date.getFullYear().toString() === selectedYear || exp.description?.includes(`Seed ${selectedYear}`)) {
        const monthKey = months[date.getMonth()];
        if (exp.type === "expense") {
          const current = monthlyData.get(monthKey) || 0;
          monthlyData.set(monthKey, current + exp.amount);
        }
      }
    });

    return months.slice(0, 7).map((month) => ({
      month,
      amount: monthlyData.get(month) || 0,
    }));
  }, [expenses, selectedYear]);

  // Get recent transactions
  const recentTransactions = useMemo(() => {
    if (recentExpenses) return recentExpenses;
    if (!expenses || expenses.length === 0) return [];
    // Fallback to manual sort if recentExpenses is not available (loading)
    return [...expenses].sort((a, b) => b.date - a.date).slice(0, 5);
  }, [recentExpenses, expenses]);

  // Calculate total balance
  const totalBalance = useMemo(() => {
    return balance || 0;
  }, [balance]);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "Shopping": return <ShoppingBag className="h-5 w-5 text-blue-500" />;
      case "Food And Drinks":
      case "Grocery": return <Utensils className="h-5 w-5 text-green-500" />;
      case "Coffee": return <Coffee className="h-5 w-5 text-amber-600" />;
      case "Transport": return <Car className="h-5 w-5 text-indigo-500" />;
      case "Entertainment": return <Film className="h-5 w-5 text-purple-500" />;
      case "Bills": return <FileText className="h-5 w-5 text-orange-500" />;
      case "Healthcare": return <Activity className="h-5 w-5 text-red-500" />;
      default: return <Package className="h-5 w-5 text-gray-500" />;
    }
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
        <h1 className="text-xl font-semibold text-foreground">Home</h1>
        <button 
          onClick={() => onNavigate("reminders")}
          className="relative p-2"
        >
          <Bell className="h-6 w-6 text-[var(--coral)]" />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-[var(--coral)] rounded-full" />
        </button>
      </div>

      {/* Credit Card */}
      <div className="px-5 mb-6">
        <div className="bg-[var(--navy)] rounded-2xl p-5 relative overflow-hidden">
          {/* Card background pattern */}
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/4" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/4" />
          </div>
          
          <div className="relative z-10">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-white/70 text-sm">Total Balance</p>
                <p className="text-white text-3xl font-bold mt-1">
                  OMR {totalBalance.toLocaleString("en-US", { minimumFractionDigits: 3, maximumFractionDigits: 3 })}
                </p>
              </div>
              <button className="text-white/70">
                <MoreHorizontal className="h-6 w-6" />
              </button>
            </div>
            
            <div className="flex items-center justify-between mt-8">
              <div>
                <p className="text-white/50 text-[10px] uppercase tracking-widest mb-1">Account Holder</p>
                <p className="text-white text-sm font-medium">{user?.fullName || "User"}</p>
              </div>
              <div className="flex items-center">
                <div className="w-8 h-8 rounded-full bg-[#EB001B] opacity-90" />
                <div className="w-8 h-8 rounded-full bg-[#F79E1B] -ml-3 opacity-90" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Analytics Section */}
      <div className="px-5 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground">Analytics</h2>
          <button className="flex items-center gap-1 text-sm text-[var(--coral)] border border-[var(--coral)] rounded-full px-3 py-1.5 font-medium">
            Year - {selectedYear}
            <ChevronDown className="h-4 w-4" />
          </button>
        </div>

        <div className="h-48 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={analyticsData} barCategoryGap="20%">
              <XAxis
                dataKey="month"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
              />
              <YAxis hide />
              <Bar dataKey="amount" radius={[6, 6, 0, 0]}>
                {analyticsData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.month === currentMonth ? "var(--purple)" : "var(--purple-light)"}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        
        {/* Chart labels */}
        <div className="flex justify-between px-2 -mt-2">
          {analyticsData.map((item) => (
            <div key={item.month} className="text-center">
              <span className="text-xs text-muted-foreground font-medium">
                OMR {item.amount >= 1000 ? (item.amount / 1000).toFixed(3) + 'k' : item.amount.toLocaleString("en-US", { minimumFractionDigits: 3, maximumFractionDigits: 3 })}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Transactions Section */}
      <div className="px-5 flex-1">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground">Transactions</h2>
          <button 
            onClick={() => onNavigate("expenses")}
            className="text-sm text-muted-foreground font-medium hover:text-foreground transition-colors"
          >
            View All
          </button>
        </div>

        <div className="space-y-3">
          {recentTransactions.map((tx, index) => (
            <div
              key={(tx as any)._id || (tx as any).id || index}
              onClick={() => onNavigate("transaction-detail", tx)}
              className="flex items-center justify-between p-3 bg-card rounded-xl border border-transparent hover:border-border transition-all cursor-pointer active:scale-[0.98]"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center">
                  {getCategoryIcon(tx.category)}
                </div>
                <div>
                  <p className="font-semibold text-foreground">{tx.description || tx.category}</p>
                  <p className="text-xs text-muted-foreground">{tx.type === "income" ? "Income" : "Expense"}</p>
                </div>
              </div>
              <div className="text-right">
                <p className={`font-bold ${tx.type === "income" ? "text-green-500" : "text-[var(--coral)]"}`}>
                  {tx.type === "income" ? "+" : "-"}OMR {tx.amount.toLocaleString("en-US", { minimumFractionDigits: 3, maximumFractionDigits: 3 })}
                </p>
                <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                  {new Date(tx.date).toLocaleDateString("en-US", { weekday: "short", day: "2-digit", month: "short", year: "numeric" })}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
