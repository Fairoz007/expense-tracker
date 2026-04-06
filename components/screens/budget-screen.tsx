"use client";

import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { ChevronLeft, Save, Plus, Trash2, ShoppingBag, Utensils, Package, Coffee, Car, Film, FileText, Activity } from "lucide-react";
import { toast } from "sonner";

interface BudgetScreenProps {
  onBack: () => void;
}

const CATEGORIES = [
  "Shopping",
  "Grocery",
  "Food And Drinks",
  "Coffee",
  "Transport",
  "Entertainment",
  "Bills",
  "Healthcare",
  "Others",
];

export function BudgetScreen({ onBack }: BudgetScreenProps) {
  const { user } = useUser();
  const budgets = useQuery(api.budgets.getBudgets, user?.id ? { clerkId: user.id } : "skip");
  const setBudget = useMutation(api.budgets.setBudget);

  const [selectedCategory, setSelectedCategory] = useState(CATEGORIES[0]);
  const [amount, setAmount] = useState("");

  const handleSave = async () => {
    if (!user?.id || !amount || isNaN(parseFloat(amount))) {
      toast.error("Please enter a valid amount");
      return;
    }

    try {
      await setBudget({
        clerkId: user.id,
        category: selectedCategory,
        amount: parseFloat(amount),
      });
      toast.success(`Budget set for ${selectedCategory}`);
      setAmount("");
    } catch (error: any) {
      toast.error("Failed to set budget: " + error.message);
    }
  };

  const getCategoryIcon = (category: string) => {
    const iconProps = { className: "h-5 w-5" };
    switch (category) {
      case "Shopping": return <ShoppingBag {...iconProps} className="text-blue-500" />;
      case "Grocery":
      case "Food And Drinks": return <Utensils {...iconProps} className="text-green-500" />;
      case "Coffee": return <Coffee {...iconProps} className="text-amber-600" />;
      case "Transport": return <Car {...iconProps} className="text-indigo-500" />;
      case "Entertainment": return <Film {...iconProps} className="text-purple-500" />;
      case "Bills": return <FileText {...iconProps} className="text-orange-500" />;
      case "Healthcare": return <Activity {...iconProps} className="text-red-500" />;
      default: return <Package {...iconProps} className="text-gray-500" />;
    }
  };

  return (
    <div className="mobile-container flex flex-col bg-background min-h-dvh">
      {/* Header */}
      <div className="px-5 pt-8 pb-4 flex items-center justify-between">
        <button onClick={onBack} className="p-2 -ml-2 rounded-full hover:bg-muted transition-colors">
          <ChevronLeft className="h-6 w-6 text-foreground" />
        </button>
        <h1 className="text-xl font-bold text-foreground">Set Budgets</h1>
        <div className="w-10" /> {/* Spacer */}
      </div>

      <div className="px-5 py-4 space-y-6">
        {/* Set Budget Form */}
        <div className="bg-card rounded-2xl p-5 border border-border shadow-sm">
          <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-4">Add or Update Budget</h2>
          
          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-muted-foreground uppercase mb-1.5 block">Category</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full bg-muted border-none rounded-xl px-4 py-3 text-foreground font-medium focus:ring-2 focus:ring-[var(--purple)] outline-none"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-muted-foreground uppercase mb-1.5 block">Monthly Limit (OMR)</label>
              <div className="relative">
                <input
                  type="number"
                  step="0.100"
                  placeholder="0.000"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full bg-muted border-none rounded-xl px-4 py-3 text-foreground font-bold text-lg focus:ring-2 focus:ring-[var(--purple)] outline-none"
                />
              </div>
            </div>

            <button
              onClick={handleSave}
              className="w-full bg-[var(--purple)] text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.98] transition-all"
            >
              <Save className="h-5 w-5" />
              Save Budget
            </button>
          </div>
        </div>

        {/* Existing Budgets List */}
        <div className="space-y-3">
          <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Active Budgets</h2>
          
          {!budgets ? (
            <div className="animate-pulse space-y-2">
              <div className="h-16 bg-muted rounded-xl" />
              <div className="h-16 bg-muted rounded-xl" />
            </div>
          ) : budgets.length === 0 ? (
            <div className="text-center py-10 bg-muted/30 rounded-2xl border border-dashed border-border text-muted-foreground">
              No budgets set yet.
            </div>
          ) : (
            <div className="space-y-3">
              {budgets.map((budget: any) => (
                <div key={budget._id} className="bg-card border border-border p-4 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-muted rounded-lg">
                      {getCategoryIcon(budget.category)}
                    </div>
                    <div>
                      <p className="font-bold text-foreground">{budget.category}</p>
                      <p className="text-xs text-muted-foreground">Monthly Limit</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-[var(--purple)]">
                      OMR {budget.amount.toLocaleString("en-US", { minimumFractionDigits: 3, maximumFractionDigits: 3 })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
