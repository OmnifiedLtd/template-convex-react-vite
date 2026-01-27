import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "./lib/auth";

/**
 * Generate a signed upload URL for file storage.
 */
export const generateUploadUrl = mutation({
  args: {},
  returns: v.string(),
  handler: async (ctx) => {
    await getAuthUserId(ctx); // Ensure authenticated
    return await ctx.storage.generateUploadUrl();
  },
});

/**
 * Get the URL for a stored file.
 */
export const getUrl = query({
  args: { storageId: v.id("_storage") },
  returns: v.union(v.string(), v.null()),
  handler: async (ctx, args) => {
    return await ctx.storage.getUrl(args.storageId);
  },
});

/**
 * Get file metadata from storage.
 */
export const getMetadata = query({
  args: { storageId: v.id("_storage") },
  returns: v.union(
    v.object({
      _id: v.id("_storage"),
      _creationTime: v.number(),
      contentType: v.optional(v.string()),
      sha256: v.string(),
      size: v.number(),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    const metadata = await ctx.db.system.get(args.storageId);
    return metadata;
  },
});

/**
 * Delete a file from storage.
 */
export const deleteFile = mutation({
  args: { storageId: v.id("_storage") },
  returns: v.null(),
  handler: async (ctx, args) => {
    await getAuthUserId(ctx); // Ensure authenticated
    await ctx.storage.delete(args.storageId);
    return null;
  },
});
