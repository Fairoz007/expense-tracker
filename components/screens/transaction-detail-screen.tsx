"use client";

import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { ChevronLeft, Trash2, Edit3, ShoppingBag, Utensils, Package, Coffee, Car, Film, FileText, Activity, Calendar, Tag, CreditCard, AlignLeft } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface TransactionDetailScreenProps {
  transaction: {
    _id: any;
    amount: number;
    category: string;
    description?: string;
    date: number;
    type: "expense" | "income";
  };
  onBack: () => void;
  onEdit: (transaction: any) => void;
  onDeleteSuccess: () => void;
}

export function TransactionDetailScreen({ transaction, onBack, onEdit, onDeleteSuccess }: TransactionDetailScreenProps) {
  const deleteExpense = useMutation(api.expenses.deleteExpense);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (window.confirm("Are you sure you want to delete this transaction?")) {
      setIsDeleting(true);
      try {
        await deleteExpense({ expenseId: transaction._id });
        toast.success("Transaction deleted successfully");
        onDeleteSuccess();
      } catch (error) {
        toast.error("Failed to delete transaction");
        setIsDeleting(false);
      }
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getCategoryIcon = (category: string) => {
    const iconProps = { className: "h-6 w-6" };
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

  return (
    <div className="flex flex-col h-full bg-background overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-6 bg-[var(--cream)]">
        <button onClick={onBack} className="p-2 -ml-2 text-foreground">
          <ChevronLeft className="h-6 w-6" />
        </button>
        <h1 className="text-xl font-bold text-foreground">Details</h1>
        <div className="w-10" /> {/* Spacer */}
      </div>

      <div className="flex-1 overflow-auto">
        {/* Amount Box */}
        <div className="bg-[var(--cream)] px-5 pb-10 flex flex-col items-center">
            <div className={cn(
                "w-20 h-20 rounded-3xl flex items-center justify-center mb-6 shadow-xl shadow-black/5",
                transaction.type === "income" ? "bg-green-100" : "bg-orange-100"
            )}>
                {getCategoryIcon(transaction.category)}
            </div>
            <p className={cn(
                "text-4xl font-black mb-2",
                transaction.type === "income" ? "text-green-600" : "text-[var(--coral)]"
            )}>
                {transaction.type === "income" ? "+" : "-"}OMR {transaction.amount.toLocaleString("en-US", { minimumFractionDigits: 3, maximumFractionDigits: 3 })}
            </p>
            <p className="text-muted-foreground font-bold uppercase tracking-widest text-xs">
                {transaction.description || transaction.category}
            </p>
        </div>

        {/* Details List */}
        <div className="px-5 py-8 space-y-8 -mt-6 bg-background rounded-t-[40px]">
            <div className="space-y-6">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center">
                        <Tag className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-0.5">Category</p>
                        <p className="font-bold text-foreground text-lg">{transaction.category}</p>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center">
                        <Calendar className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-0.5">Date & Time</p>
                        <p className="font-bold text-foreground text-lg">{formatDate(transaction.date)}</p>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center">
                        <CreditCard className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-0.5">Transaction Type</p>
                        <p className={cn(
                            "font-bold text-lg capitalize",
                            transaction.type === "income" ? "text-green-500" : "text-[var(--coral)]"
                        )}>
                            {transaction.type}
                        </p>
                    </div>
                </div>

                {transaction.description && (
                    <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center shrink-0">
                            <AlignLeft className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-0.5">Description</p>
                            <p className="font-bold text-foreground text-lg">{transaction.description}</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="px-5 pb-8 pt-4 bg-background border-t border-border flex gap-4">
        <button
          onClick={() => onEdit(transaction)}
          className="flex-1 py-4 bg-[var(--navy)] text-white font-bold rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-black/10 active:scale-[0.98] transition-all"
        >
          <Edit3 className="h-5 w-5" />
          Edit
        </button>
        <button
          onClick={handleDelete}
          disabled={isDeleting}
          className="flex-1 py-4 bg-red-50 text-red-500 font-bold rounded-2xl flex items-center justify-center gap-2 border border-red-100 active:scale-[0.98] transition-all disabled:opacity-50"
        >
          <Trash2 className="h-5 w-5" />
          {isDeleting ? "Deleting..." : "Delete"}
        </button>
      </div>
    </div>
  );
}
