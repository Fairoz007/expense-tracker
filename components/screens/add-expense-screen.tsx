"use client";

import { useState, useMemo } from "react";
import { useMutation, useQuery } from "convex/react";
import { useUser } from "@clerk/nextjs";
import { api } from "@/convex/_generated/api";
import { ChevronLeft, ChevronRight, Clock, FileText, CreditCard, Landmark, Wallet, Banknote, ShoppingBag, Utensils, Package, Coffee, Car, Film, Activity, DollarSign, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { toast } from "sonner";

const paymentMethods = [
  { id: "wallet", icon: <Wallet className="h-6 w-6" />, label: "Wallet" },
  { id: "bank", icon: <Landmark className="h-6 w-6" />, label: "Bank" },
  { id: "card", icon: <CreditCard className="h-6 w-6" />, label: "Card" },
  { id: "cash", icon: <Banknote className="h-6 w-6" />, label: "Cash" },
];

const expenseTypes = ["Need", "Want", "Bill"];

const defaultCategories = [
  { id: "grocery", name: "Grocery" },
  { id: "food", name: "Food And Drinks" },
  { id: "shopping", name: "Shopping" },
  { id: "healthcare", name: "Healthcare" },
  { id: "transport", name: "Transport" },
  { id: "entertainment", name: "Entertainment" },
];

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

interface AddExpenseScreenProps {
  onBack: () => void;
}

export function AddExpenseScreen({ onBack }: AddExpenseScreenProps) {
  const { user } = useUser();
  const addExpense = useMutation(api.expenses.addExpense);
  const categories = useQuery(
    api.categories.getCategories,
    user?.id ? { clerkId: user.id } : "skip"
  );

  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [transactionType, setTransactionType] = useState<"expense" | "income">("expense");
  const [selectedCategory, setSelectedCategory] = useState("Grocery");
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("wallet");
  const [notes, setNotes] = useState("");
  const [isRecurring, setIsRecurring] = useState(false);
  const [selectedType, setSelectedType] = useState("Need");
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isLoading, setIsLoading] = useState(false);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const handleSubmit = async () => {
    if (!user?.id) {
      toast.error("User session not found");
      return;
    }
    if (!amount || parseFloat(amount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }
    if (!title.trim()) {
      toast.error("Please enter a title");
      return;
    }

    setIsLoading(true);
    try {
      await addExpense({
        clerkId: user.id,
        amount: parseFloat(amount),
        category: transactionType === "income" ? "Income" : selectedCategory,
        description: title.trim(),
        date: selectedDate.getTime(),
        type: transactionType,
      });
      toast.success(`${transactionType === "income" ? "Income" : "Expense"} added successfully!`);
      onBack();
    } catch (error: any) {
      console.error("[v0] Expense save error:", error);
      toast.error(error?.message || "Failed to add transaction. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const displayCategories = useMemo(() => {
    if (transactionType === "income") {
      return [{ id: "income", name: "Income", icon: <DollarSign className="h-5 w-5 text-green-500" /> }];
    }
    const rawCategories = categories?.length ? categories : defaultCategories;
    return rawCategories.map((c: any) => ({
      id: c._id || c.id,
      name: c.name,
      icon: getCategoryIcon(c.name)
    }));
  }, [categories, transactionType]);

  return (
    <div className="flex flex-col h-full bg-background overflow-hidden">
      {/* Header */}
      <div className="flex items-center px-5 py-4 bg-[var(--cream)]">
        <button onClick={onBack} className="flex items-center gap-1 text-foreground">
          <ChevronLeft className="h-5 w-5" />
          <span className="font-bold">Back</span>
        </button>
        <h1 className="flex-1 text-center text-xl font-bold text-foreground pr-12">
          Add Transaction
        </h1>
      </div>

      {/* Transaction Type Toggle */}
      <div className="bg-[var(--cream)] px-5 pb-4">
        <div className="flex bg-white/50 p-1 rounded-xl border border-border/10">
          <button
            onClick={() => setTransactionType("expense")}
            className={cn(
              "flex-1 py-2.5 rounded-lg text-sm font-bold uppercase tracking-wider transition-all",
              transactionType === "expense"
                ? "bg-white text-[var(--coral)] shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Expense
          </button>
          <button
            onClick={() => setTransactionType("income")}
            className={cn(
              "flex-1 py-2.5 rounded-lg text-sm font-bold uppercase tracking-wider transition-all",
              transactionType === "income"
                ? "bg-white text-green-500 shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Income
          </button>
        </div>
      </div>

      {/* Hero Image */}
      <div className="bg-[var(--cream)] px-5 pb-6">
        <div className="relative h-32 w-full rounded-b-3xl overflow-hidden">
          <Image
            src="/images/wallet-hero.jpg"
            alt="Wallet illustration"
            fill
            className="object-contain"
            priority
          />
        </div>
      </div>

      {/* Form */}
      <div className="flex-1 px-5 py-4 space-y-5 overflow-auto no-scrollbar">
        {/* Title */}
        <div>
          <label className="text-xs font-bold text-[var(--coral)] mb-2 block uppercase tracking-wider">
            Title
          </label>
          <div className="flex items-center gap-3 bg-card border border-border rounded-xl px-4 py-3">
            <FileText className="h-5 w-5 text-muted-foreground" />
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Store name or category"
              className="flex-1 bg-transparent outline-none text-foreground font-medium placeholder:text-muted-foreground"
            />
          </div>
        </div>

        {/* Category */}
        <div>
          <label className="text-xs font-bold text-[var(--coral)] mb-2 block uppercase tracking-wider">
            Category
          </label>
          <div className="flex items-center gap-3 bg-card border border-border rounded-xl px-4 py-3">
            <div className="flex items-center justify-center w-6 h-6">
              {displayCategories.find((c: any) => c.name === selectedCategory)?.icon || <Package className="h-5 w-5 text-muted-foreground" />}
            </div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="flex-1 bg-transparent outline-none text-foreground font-medium appearance-none cursor-pointer"
            >
              {displayCategories.map((cat: any) => (
                <option key={cat.id} value={cat.name}>
                  {cat.name}
                </option>
              ))}
            </select>
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          </div>
        </div>

        {/* Amount & Date */}
        <div>
          <label className="text-xs font-bold text-[var(--coral)] mb-2 block uppercase tracking-wider">
            Amount
          </label>
          <div className="flex items-center gap-3 bg-card border border-border rounded-xl px-4 py-3 font-bold">
            <span className="text-lg text-muted-foreground">OMR</span>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.000"
              className="flex-1 bg-transparent outline-none text-foreground text-lg placeholder:text-muted-foreground"
            />
            <button className="flex items-center gap-1 text-muted-foreground border-l border-border pl-3">
              <span className="text-xs uppercase tracking-wider">{formatDate(selectedDate)}</span>
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Payment Method */}
        <div>
          <label className="text-xs font-bold text-[var(--coral)] mb-2 block uppercase tracking-wider">
            Payment Method
          </label>
          <div className="flex gap-3">
            {paymentMethods.map((method) => (
              <button
                key={method.id}
                onClick={() => setSelectedPaymentMethod(method.id)}
                className={cn(
                  "flex-1 py-4 rounded-xl flex flex-col items-center justify-center gap-2 transition-all",
                  selectedPaymentMethod === method.id
                    ? "bg-[var(--coral)] text-white shadow-lg shadow-[var(--coral)]/20"
                    : "bg-card border border-border text-muted-foreground"
                )}
              >
                {method.icon}
                <span className="text-[10px] font-bold uppercase tracking-widest">{method.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="text-xs font-bold text-[var(--coral)] mb-2 block uppercase tracking-wider">
            Notes <span className="text-muted-foreground font-normal lowercase tracking-normal">(optional)</span>
          </label>
          <div className="flex items-center gap-3 bg-card border border-border rounded-xl px-4 py-3">
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add details..."
              className="flex-1 bg-transparent outline-none text-foreground font-medium placeholder:text-muted-foreground"
            />
          </div>
        </div>

        {/* Recurring Toggle */}
        <div className="flex items-center justify-between py-2">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-muted-foreground" />
            <span className="font-bold text-foreground">Recurring Transaction</span>
          </div>
          <button
            onClick={() => setIsRecurring(!isRecurring)}
            className={cn(
              "w-12 h-7 rounded-full transition-colors relative",
              isRecurring ? "bg-[var(--coral)]" : "bg-muted"
            )}
          >
            <span
              className={cn(
                "absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-transform",
                isRecurring ? "left-6" : "left-1"
              )}
            />
          </button>
        </div>

        {/* Expense Type */}
        <div className="flex gap-2 pb-4">
          {expenseTypes.map((type) => (
            <button
              key={type}
              onClick={() => setSelectedType(type)}
              className={cn(
                "flex-1 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-colors",
                selectedType === type
                  ? "bg-[var(--coral)] text-white"
                  : "bg-card border border-border text-foreground"
              )}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Add Expense Button */}
      <div className="px-5 pb-8 pt-4 bg-background border-t border-border">
        <button
          onClick={handleSubmit}
          disabled={isLoading}
          className={cn(
            "w-full py-4 rounded-2xl font-bold text-white text-lg transition-all active:scale-[0.98]",
            isLoading
              ? "bg-[var(--coral)]/50 cursor-not-allowed"
              : "bg-[var(--coral)] hover:bg-[var(--coral)]/90 shadow-lg shadow-[var(--coral)]/20"
          )}
        >
          {isLoading ? "Processing..." : "Add Transaction"}
        </button>
      </div>
    </div>
  );
}
