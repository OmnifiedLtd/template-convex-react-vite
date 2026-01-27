import { defineSchema, defineTable } from "convex/server";
import { authTables } from "@convex-dev/auth/server";
import { v } from "convex/values";

/**
 * Database schema for the application.
 *
 * This schema includes:
 * - Convex Auth tables (users, accounts, sessions, verification tokens)
 * - Example tasks table to demonstrate basic CRUD operations
 */
export default defineSchema({
  // Convex Auth tables provide authentication functionality
  ...authTables,

  // Example table: Tasks
  // This demonstrates a simple data model with user ownership
  tasks: defineTable({
    userId: v.string(), // Links to the auth user
    title: v.string(),
    description: v.optional(v.string()),
    completed: v.boolean(),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_and_completed", ["userId", "completed"]),
});
