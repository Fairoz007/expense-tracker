import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const createOrGetUser = mutation({
  args: {
    clerkId: v.string(),
    email: v.string(),
    name: v.string(),
    imageUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first();

    if (existingUser) {
      return existingUser._id;
    }

    const userId = await ctx.db.insert("users", {
      clerkId: args.clerkId,
      email: args.email,
      name: args.name,
      imageUrl: args.imageUrl,
      createdAt: Date.now(),
    });

    // Create default categories for new user
    const defaultCategories = [
      { name: "Shopping", color: "#E85D5D", icon: "shopping-bag" },
      { name: "Grocery", color: "#4CAF50", icon: "shopping-cart" },
      { name: "Coffee", color: "#8BC34A", icon: "coffee" },
      { name: "Transport", color: "#2196F3", icon: "car" },
      { name: "Entertainment", color: "#9C27B0", icon: "film" },
      { name: "Bills", color: "#FF9800", icon: "file-text" },
    ];

    for (const category of defaultCategories) {
      await ctx.db.insert("categories", {
        userId,
        ...category,
      });
    }

    return userId;
  },
});

export const getCurrentUser = query({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first();
  },
});

export const updateUser = mutation({
  args: {
    clerkId: v.string(),
    name: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    const updates: Record<string, string> = {};
    if (args.name) updates.name = args.name;
    if (args.imageUrl) updates.imageUrl = args.imageUrl;

    await ctx.db.patch(user._id, updates);
    return user._id;
  },
});
