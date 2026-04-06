import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const addExpense = mutation({
  args: {
    clerkId: v.string(),
    amount: v.number(),
    category: v.string(),
    description: v.optional(v.string()),
    date: v.number(),
    type: v.union(v.literal("expense"), v.literal("income")),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    return await ctx.db.insert("expenses", {
      userId: user._id,
      amount: args.amount,
      category: args.category,
      description: args.description,
      date: args.date,
      type: args.type,
      createdAt: Date.now(),
    });
  },
});

export const getExpenses = query({
  args: {
    clerkId: v.string(),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first();

    if (!user) {
      return [];
    }

    if (args.startDate !== undefined && args.endDate !== undefined) {
      return await ctx.db
        .query("expenses")
        .withIndex("by_user_and_date", (q) =>
          q.eq("userId", user._id).gte("date", args.startDate!).lte("date", args.endDate!)
        )
        .collect();
    }

    return await ctx.db
      .query("expenses")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();
  },
});

export const getRecentExpenses = query({
  args: {
    clerkId: v.string(),
    limit: v.number(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first();

    if (!user) {
      return [];
    }

    return await ctx.db
      .query("expenses")
      .withIndex("by_user_and_date", (q) => q.eq("userId", user._id))
      .order("desc")
      .take(args.limit);
  },
});

export const getExpensesSummary = query({
  args: {
    clerkId: v.string(),
    startDate: v.number(),
    endDate: v.number(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first();

    if (!user) {
      return { totalIncome: 0, totalExpenses: 0, byCategory: [] };
    }

    const filtered = await ctx.db
      .query("expenses")
      .withIndex("by_user_and_date", (q) =>
        q.eq("userId", user._id).gte("date", args.startDate).lte("date", args.endDate)
      )
      .collect();

    const totalIncome = filtered
      .filter((e) => e.type === "income")
      .reduce((sum, e) => sum + e.amount, 0);

    const totalExpenses = filtered
      .filter((e) => e.type === "expense")
      .reduce((sum, e) => sum + e.amount, 0);

    const categoryMap = new Map<string, number>();
    filtered
      .filter((e) => e.type === "expense")
      .forEach((e) => {
        const current = categoryMap.get(e.category) || 0;
        categoryMap.set(e.category, current + e.amount);
      });

    const byCategory = Array.from(categoryMap.entries()).map(
      ([category, amount]) => ({
        category,
        amount,
        percentage: totalExpenses > 0 ? (amount / totalExpenses) * 100 : 0,
      })
    );

    return { totalIncome, totalExpenses, byCategory };
  },
});

export const getBalance = query({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first();

    if (!user) return 0;

    const expenses = await ctx.db
      .query("expenses")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    const income = expenses
      .filter((e) => e.type === "income")
      .reduce((sum, e) => sum + e.amount, 0);
    const spent = expenses
      .filter((e) => e.type === "expense")
      .reduce((sum, e) => sum + e.amount, 0);

    return income - spent;
  },
});

export const seedInitialData = mutation({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    // Check if we already have expenses to avoid double seeding
    const existing = await ctx.db
      .query("expenses")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .first();

    if (existing) {
      return { success: true, message: "Data already exists" };
    }

    // 1. Initial Balance / Income to get to $59,765.00
    // We'll add a large income first, then subtract the specific expenses
    const targetBalance = 59765.0;
    const pumaAmount = 952;
    const nikeAmount = 475;
    
    // total income needed = targetBalance + expenses
    const totalIncomeNeeded = targetBalance + pumaAmount + nikeAmount;

    await ctx.db.insert("expenses", {
      userId: user._id,
      amount: totalIncomeNeeded,
      category: "Income",
      description: "Initial Balance",
      date: Date.now(),
      type: "income",
      createdAt: Date.now(),
    });

    // 2. Specific Transactions
    const now = new Date();
    const april5_2026 = new Date(2026, 3, 5).getTime(); // April 5, 2026

    await ctx.db.insert("expenses", {
      userId: user._id,
      amount: pumaAmount,
      category: "Shopping",
      description: "Puma Store",
      date: april5_2026,
      type: "expense",
      createdAt: Date.now(),
    });

    await ctx.db.insert("expenses", {
      userId: user._id,
      amount: nikeAmount,
      category: "Shopping",
      description: "Nike Super Store",
      date: april5_2026,
      type: "expense",
      createdAt: Date.now(),
    });

    // 3. Analytics Data for 2022
    const year2022 = 2022;
    const analytics = [
      { month: 0, amount: 1500 }, // Jan
      { month: 1, amount: 1700 }, // Feb
      { month: 2, amount: 1500 }, // Mar
      { month: 3, amount: 3000 }, // Apr
      { month: 4, amount: 2400 }, // May
      { month: 5, amount: 2500 }, // Jun
      { month: 6, amount: 3900 }, // Jul
    ];

    for (const item of analytics) {
      await ctx.db.insert("expenses", {
        userId: user._id,
        amount: item.amount,
        category: "Analytics Backup",
        description: `Monthly Seed ${year2022}`,
        date: new Date(year2022, item.month, 15).getTime(),
        type: "expense",
        createdAt: Date.now(),
      });
    }

    return { success: true };
  },
});

export const deleteExpense = mutation({
  args: { expenseId: v.id("expenses") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.expenseId);
  },
});

export const updateExpense = mutation({
  args: {
    expenseId: v.id("expenses"),
    amount: v.optional(v.number()),
    category: v.optional(v.string()),
    description: v.optional(v.string()),
    date: v.optional(v.number()),
    type: v.optional(v.union(v.literal("expense"), v.literal("income"))),
  },
  handler: async (ctx, args) => {
    const { expenseId, ...updates } = args;
    await ctx.db.patch(expenseId, updates);
  },
});

export const clearAllUserData = mutation({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    const expenses = await ctx.db
      .query("expenses")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    for (const expense of expenses) {
      await ctx.db.delete(expense._id);
    }

    return { success: true, count: expenses.length };
  },
});
export const batchAddExpenses = mutation({
  args: {
    clerkId: v.string(),
    expenses: v.array(
      v.object({
        amount: v.number(),
        category: v.string(),
        description: v.optional(v.string()),
        date: v.number(),
        type: v.union(v.literal("expense"), v.literal("income")),
      })
    ),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    const results = [];
    for (const exp of args.expenses) {
      const id = await ctx.db.insert("expenses", {
        userId: user._id,
        amount: exp.amount,
        category: exp.category,
        description: exp.description,
        date: exp.date,
        type: exp.type,
        createdAt: Date.now(),
      });
      results.push(id);
    }

    return { success: true, count: results.length };
  },
});
