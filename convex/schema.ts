import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    clerkId: v.string(),
    email: v.string(),
    name: v.string(),
    imageUrl: v.optional(v.string()),
    createdAt: v.number(),
  }).index("by_clerk_id", ["clerkId"]),

  expenses: defineTable({
    userId: v.id("users"),
    amount: v.number(),
    category: v.string(),
    description: v.optional(v.string()),
    date: v.number(),
    type: v.union(v.literal("expense"), v.literal("income")),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_and_date", ["userId", "date"]),

  categories: defineTable({
    userId: v.id("users"),
    name: v.string(),
    color: v.string(),
    icon: v.optional(v.string()),
  }).index("by_user", ["userId"]),

  budgets: defineTable({
    userId: v.id("users"),
    category: v.string(),
    amount: v.number(),
    period: v.literal("monthly"),
  }).index("by_user", ["userId"])
    .index("by_user_and_category", ["userId", "category"]),
});
