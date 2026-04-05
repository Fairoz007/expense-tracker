"use client";

import { useUser, useClerk } from "@clerk/nextjs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { toast } from "sonner";
import {
  ChevronLeft,
  User,
  BadgeCheck,
  Building2,
  DollarSign,
  Grid3X3,
  Lock,
  Trash2,
} from "lucide-react";

interface ProfileScreenProps {
  onBack: () => void;
}

const menuItems = [
  {
    icon: User,
    title: "User profile",
    description: "Change profile image, name or password",
  },
  {
    icon: BadgeCheck,
    title: "Premium plans",
    description: "Explore premium options and enjoy",
  },
  {
    icon: Building2,
    title: "Accounts",
    description: "Manage accounts and description",
  },
  {
    icon: DollarSign,
    title: "Currencies",
    description: "Add other currencies, adjust exchange rates",
  },
  {
    icon: Grid3X3,
    title: "Categories",
    description: "Manage categories and add sub-categories",
  },
  {
    icon: Lock,
    title: "Security",
    description: "Protect your app with PIN or Fingerprint",
  },
];

export function ProfileScreen({ onBack }: ProfileScreenProps) {
  const { user } = useUser();
  const { signOut } = useClerk();

  const userId = user?.id?.slice(-10).toUpperCase() || "XXXXXXXXXX";

  const clearAllUserData = useMutation(api.expenses.clearAllUserData);

  const handleLogout = async () => {
    await signOut();
  };

  const handleResetData = async () => {
    if (!user?.id) return;
    
    if (confirm("Are you sure you want to delete all transaction data? This cannot be undone.")) {
      try {
        const result = await clearAllUserData({ clerkId: user.id });
        toast.success(`Cleared all data (${result.count} transactions)`);
      } catch (error: any) {
        toast.error("Failed to clear data: " + error.message);
      }
    }
  };

  return (
    <div className="mobile-container flex flex-col bg-card min-h-dvh">
      {/* Header */}
      <div className="px-4 pt-6 pb-4">
        <button
          onClick={onBack}
          className="flex items-center gap-1 text-foreground hover:text-muted-foreground transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
          <span className="text-sm font-medium">Back</span>
        </button>
      </div>

      {/* Profile Info */}
      <div className="flex flex-col items-center pb-6">
        <Avatar className="w-24 h-24 border-4 border-[var(--coral)] mb-4">
          <AvatarImage src={user?.imageUrl} alt={user?.firstName || "User"} />
          <AvatarFallback className="bg-[var(--coral)] text-white text-2xl">
            {user?.firstName?.[0] || "U"}
          </AvatarFallback>
        </Avatar>
        <h2 className="text-xl font-semibold text-foreground">
          {user?.firstName || "User"} {user?.lastName || ""}
        </h2>
        <p className="text-muted-foreground text-sm">ID: {userId}</p>
      </div>

      {/* Menu Items */}
      <div className="px-6 flex-1">
        <div className="flex flex-col gap-1">
          {menuItems.map((item) => (
            <button
              key={item.title}
              className="flex items-center gap-4 p-4 rounded-xl hover:bg-accent transition-colors text-left"
            >
              <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
                <item.icon className="w-5 h-5 text-foreground" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-foreground">{item.title}</h3>
                <p className="text-muted-foreground text-sm">
                  {item.description}
                </p>
              </div>
            </button>
          ))}
          
          {/* Reset Data Option */}
          <button
            onClick={handleResetData}
            className="flex items-center gap-4 p-4 rounded-xl hover:bg-red-50 text-left transition-colors group"
          >
            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center group-hover:bg-red-200">
              <Trash2 className="w-5 h-5 text-red-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-medium text-red-600">Reset Account Data</h3>
              <p className="text-muted-foreground text-sm">
                Delete all transactions and entries
              </p>
            </div>
          </button>
        </div>
      </div>

      {/* Logout Button */}
      <div className="px-6 py-8 flex justify-center">
        <button
          onClick={handleLogout}
          className="px-8 py-3 rounded-full border-2 border-[var(--coral)] text-[var(--coral)] font-medium hover:bg-[var(--coral)]/10 transition-colors"
        >
          Logout
        </button>
      </div>
    </div>
  );
}
