"use client";

import { useState, useMemo } from "react";
import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";

const weekDays = ["M", "T", "W", "T", "F", "S", "S"];

const COLORS = ["var(--purple)", "var(--coral)", "var(--navy)", "#4CAF50", "#FF9800"];

interface TotalExpenseScreenProps {
  onBack: () => void;
}

export function TotalExpenseScreen({ onBack }: TotalExpenseScreenProps) {
  const { user } = useUser();
  const [selectedDate, setSelectedDate] = useState(new Date().getDate());
  const [currentDate, setCurrentDate] = useState(new Date());

  // Get current month date range
  const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getTime();
  const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getTime();

  // Fetch data from Convex
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

  // Calculate pie data from Convex
  const pieData = useMemo(() => {
    if (!expensesSummary?.byCategory || expensesSummary.byCategory.length === 0) {
      return [];
    }

    return expensesSummary.byCategory.slice(0, 5).map((cat, index) => ({
      name: cat.category,
      value: Math.round(cat.percentage),
      amount: Math.round(cat.amount),
      color: COLORS[index % COLORS.length],
    }));
  }, [expensesSummary]);

  const totalSpent = expensesSummary?.totalExpenses || 0;
  const budget = 8700; // Could be fetched from user settings
  const spentPercentage = Math.min((totalSpent / budget) * 100, 100);
  const remainingPercentage = 100 - spentPercentage;

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  return (
    <div className="flex flex-col h-full bg-background pb-20">
      {/* Header */}
      <div className="flex items-center px-5 py-4">
        <button onClick={onBack} className="p-2 -ml-2">
          <ChevronLeft className="h-6 w-6 text-foreground" />
        </button>
        <h1 className="flex-1 text-center text-xl font-semibold text-foreground pr-8">
          Total Expense
        </h1>
      </div>

      {/* Calendar Week */}
      <div className="px-5 mb-6">
        <div className="flex items-center justify-between mb-4">
          <button onClick={handlePrevMonth} className="p-1">
            <ChevronLeft className="h-5 w-5 text-muted-foreground" />
          </button>
          <span className="font-medium text-foreground">{monthDisplay}</span>
          <button onClick={handleNextMonth} className="p-1">
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>

        <div className="flex justify-between">
          {weekDays.map((day, index) => (
            <div key={index} className="flex flex-col items-center gap-2">
              <span className="text-sm text-muted-foreground">{day}</span>
              <button
                onClick={() => setSelectedDate(weekDates[index])}
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-colors relative",
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

      {/* Spending Summary */}
      <div className="px-5 mb-6">
        <div className="flex items-baseline justify-between mb-3">
          <div>
            <span className="text-foreground">You have Spent </span>
            <span className="text-[var(--coral)] font-bold text-xl">
              OMR {totalSpent.toLocaleString("en-US", { minimumFractionDigits: 3, maximumFractionDigits: 3 })}
            </span>
          </div>
          <span className="text-sm text-muted-foreground">{monthDisplay}</span>
        </div>
        <p className="text-muted-foreground text-sm mb-4">this month.</p>

        {/* Progress Bar */}
        <div className="flex items-center gap-3">
          <div 
            className="h-10 bg-[var(--purple)] rounded-lg flex items-center justify-center transition-all"
            style={{ width: `${spentPercentage}%` }}
          >
            <span className="text-white font-semibold">{spentPercentage.toFixed(2)}%</span>
          </div>
          <div 
            className="h-10 bg-muted rounded-lg flex items-center justify-center"
            style={{ width: `${remainingPercentage}%` }}
          >
            <span className="text-muted-foreground font-semibold">
              {remainingPercentage.toFixed(2)}%
            </span>
          </div>
        </div>
      </div>

      {/* Analytics Section */}
      <div className="px-5 flex-1">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground">Analytics</h2>
          <button className="text-sm text-muted-foreground">View All</button>
        </div>

        {/* Pie Chart */}
        <div className="relative h-64 mb-4">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={2}
                dataKey="value"
                startAngle={90}
                endAngle={-270}
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>

          {/* Percentage labels on chart */}
          {pieData[0] && (
            <div className="absolute top-8 right-8 text-sm font-medium text-foreground">
              {pieData.length > 1 ? pieData[1].name : pieData[0].name}
              <br />
              <span className="text-muted-foreground">
                OMR {(pieData.length > 1 ? pieData[1].amount : pieData[0].amount).toLocaleString("en-US", { minimumFractionDigits: 3, maximumFractionDigits: 3 })}
              </span>
            </div>
          )}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
            <span className="text-3xl font-bold text-[var(--coral)]">
              {pieData.length > 1 ? pieData[1].value : pieData[0]?.value || 0}%
            </span>
          </div>
          {pieData[0] && (
            <div className="absolute bottom-12 left-4 text-center">
              <span className="text-lg font-semibold text-[var(--purple)]">{pieData[0].value}%</span>
            </div>
          )}
          {pieData[2] && (
            <div className="absolute bottom-16 right-12 text-center">
              <span className="text-lg font-semibold text-[var(--navy)]">{pieData[2].value}%</span>
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="flex justify-between px-4">
          {pieData.slice(0, 3).map((item, index) => (
            <div key={item.name} className="text-center">
              <p className="text-sm font-medium text-foreground">{item.name}</p>
              <p className="text-xs text-muted-foreground">
                OMR {item.amount.toLocaleString("en-US", { minimumFractionDigits: 3, maximumFractionDigits: 3 })}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
