"use client";

import { useState, useMemo } from "react";
import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { 
  Search, 
  ChevronLeft, 
  Filter, 
  ShoppingBag, 
  Utensils, 
  Package, 
  Coffee, 
  Car, 
  Film, 
  FileText, 
  Activity, 
  Calendar,
  ArrowUpRight,
  ArrowDownLeft
} from "lucide-react";
import { cn } from "@/lib/utils";

interface AllTransactionsScreenProps {
  onBack: () => void;
  onTransactionClick: (tx: any) => void;
}

export function AllTransactionsScreen({ onBack, onTransactionClick }: AllTransactionsScreenProps) {
  const { user } = useUser();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<"all" | "expense" | "income">("all");

  // Fetch all expenses without date range
  const allExpenses = useQuery(
    api.expenses.getExpenses,
    user?.id ? { clerkId: user.id } : "skip"
  );

  // Filter and search logic
  const filteredTransactions = useMemo(() => {
    if (!allExpenses) return [];
    
    return allExpenses
      .filter((tx) => {
        // Filter by type
        if (activeFilter !== "all" && tx.type !== activeFilter) return false;
        
        // Filter by search query
        const query = searchQuery.toLowerCase();
        const description = (tx.description || "").toLowerCase();
        const category = (tx.category || "").toLowerCase();
        const amount = tx.amount.toString();
        
        return description.includes(query) || category.includes(query) || amount.includes(query);
      })
      .sort((a, b) => b.date - a.date); // Most recent first
  }, [allExpenses, searchQuery, activeFilter]);

  const getCategoryIcon = (category: string) => {
    const iconProps = { className: "h-5 w-5" };
    switch (category) {
      case "Shopping": return <ShoppingBag {...iconProps} className="text-blue-500" />;
      case "Food And Drinks":
      case "Grocery": return <Utensils {...iconProps} className="text-green-500" />;
      case "Coffee": return <Coffee {...iconProps} className="text-amber-600" />;
      case "Transport": return <Car {...iconProps} className="text-indigo-500" />;
      case "Entertainment": return <Film {...iconProps} className="text-purple-500" />;
      case "Bills": return <FileText {...iconProps} className="text-orange-500" />;
      case "Healthcare": return <Activity {...iconProps} className="text-red-500" />;
      default: return <Package {...iconProps} className="text-gray-500" />;
    }
  };

  const formatDate = (date: number) => {
    return new Date(date).toLocaleDateString("en-US", {
      day: "2-digit",
      month: "short",
      year: "numeric"
    });
  };

  return (
    <div className="flex flex-col h-full bg-background overflow-hidden animate-in slide-in-from-right duration-300">
      {/* Header */}
      <div className="px-5 pt-6 pb-4 bg-background z-10">
        <div className="flex items-center gap-4 mb-6">
          <button 
            onClick={onBack}
            className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-foreground hover:bg-accent transition-all"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <h1 className="text-2xl font-black text-foreground">View All</h1>
        </div>

        {/* Search Bar */}
        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by name, category or amount..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-14 bg-muted/50 border border-border rounded-2xl pl-12 pr-4 text-foreground font-medium outline-none focus:border-[var(--coral)] focus:ring-4 focus:ring-[var(--coral)]/5 transition-all"
          />
        </div>

        {/* Filters */}
        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
          {[
            { id: "all", label: "All", icon: <Calendar className="h-4 w-4" /> },
            { id: "expense", label: "Expenses", icon: <ArrowUpRight className="h-4 w-4" /> },
            { id: "income", label: "Income", icon: <ArrowDownLeft className="h-4 w-4" /> },
          ].map((filter) => (
            <button
              key={filter.id}
              onClick={() => setActiveFilter(filter.id as any)}
              className={cn(
                "px-5 py-2.5 rounded-full flex items-center gap-2 font-bold text-sm whitespace-nowrap transition-all",
                activeFilter === filter.id 
                  ? "bg-[var(--coral)] text-white shadow-lg shadow-[var(--coral)]/20" 
                  : "bg-muted text-muted-foreground hover:bg-accent"
              )}
            >
              {filter.icon}
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {/* Transactions List */}
      <div className="flex-1 overflow-auto px-5 pb-8 space-y-4">
        {filteredTransactions.length > 0 ? (
          filteredTransactions.map((tx) => (
            <div
              key={tx._id}
              onClick={() => onTransactionClick(tx)}
              className="flex items-center justify-between p-4 bg-card rounded-2xl border border-border hover:border-[var(--coral)] transition-all cursor-pointer active:scale-[0.98] group"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center shrink-0 group-hover:bg-muted/80">
                  {getCategoryIcon(tx.category)}
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-foreground truncate">{tx.description || tx.category}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium mt-0.5">
                    <span className="uppercase tracking-wider">{tx.category}</span>
                    <span>•</span>
                    <span>{formatDate(tx.date)}</span>
                  </div>
                </div>
              </div>
              <div className="text-right shrink-0">
                <p className={cn(
                  "font-black text-lg",
                  tx.type === "income" ? "text-green-500" : "text-[var(--coral)]"
                )}>
                  {tx.type === "income" ? "+" : "-"}OMR {tx.amount.toLocaleString("en-US", { minimumFractionDigits: 3, maximumFractionDigits: 3 })}
                </p>
                <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mt-0.5">
                  {tx.type}
                </p>
              </div>
            </div>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-4">
              <Search className="h-10 w-10 text-muted-foreground/30" />
            </div>
            <p className="text-muted-foreground font-bold">No transactions found</p>
            <p className="text-xs text-muted-foreground mt-1">Try searching for something else</p>
          </div>
        )}
      </div>
    </div>
  );
}
