import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const setBudget = mutation({
  args: {
    clerkId: v.string(),
    category: v.string(),
    amount: v.number(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    const existingBudget = await ctx.db
      .query("budgets")
      .withIndex("by_user_and_category", (q) =>
        q.eq("userId", user._id).eq("category", args.category)
      )
      .first();

    if (existingBudget) {
      await ctx.db.patch(existingBudget._id, { amount: args.amount });
      return existingBudget._id;
    } else {
      return await ctx.db.insert("budgets", {
        userId: user._id,
        category: args.category,
        amount: args.amount,
        period: "monthly",
      });
    }
  },
});

export const getBudgets = query({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first();

    if (!user) return [];

    return await ctx.db
      .query("budgets")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();
  },
});

export const getBudgetStatus = query({
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

    if (!user) return [];

    const budgets = await ctx.db
      .query("budgets")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    const expenses = await ctx.db
      .query("expenses")
      .withIndex("by_user_and_date", (q) =>
        q.eq("userId", user._id).gte("date", args.startDate).lte("date", args.endDate)
      )
      .collect();

    const expenseMap = new Map<string, number>();
    expenses
      .filter((e) => e.type === "expense")
      .forEach((e) => {
        const current = expenseMap.get(e.category) || 0;
        expenseMap.set(e.category, current + e.amount);
      });

    return budgets.map((b) => {
      const actual = expenseMap.get(b.category) || 0;
      return {
        category: b.category,
        budget: b.amount,
        actual: actual,
        remaining: b.amount - actual,
        percentage: (actual / b.amount) * 100,
      };
    });
  },
});
