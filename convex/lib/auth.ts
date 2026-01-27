import { QueryCtx, MutationCtx, ActionCtx } from "../_generated/server";

/**
 * Extract the user ID from the identity subject.
 * Convex Auth's subject format is "userId|sessionId", so we need to extract just the userId.
 */
export function extractUserId(subject: string): string {
  // Convex Auth subject format: "userId|sessionId"
  const pipeIndex = subject.indexOf("|");
  if (pipeIndex !== -1) {
    return subject.substring(0, pipeIndex);
  }
  return subject;
}

/**
 * Get the authenticated user's ID from the context.
 * Throws an error if the user is not authenticated.
 */
export async function getAuthUserId(
  ctx: QueryCtx | MutationCtx | ActionCtx
): Promise<string> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new Error("Unauthorized: You must be logged in to perform this action");
  }
  return extractUserId(identity.subject);
}

/**
 * Get the authenticated user's identity or null if not authenticated.
 */
export async function getAuthIdentity(ctx: QueryCtx | MutationCtx | ActionCtx) {
  return await ctx.auth.getUserIdentity();
}

/**
 * Check if the user is authenticated.
 */
export async function isAuthenticated(
  ctx: QueryCtx | MutationCtx | ActionCtx
): Promise<boolean> {
  const identity = await ctx.auth.getUserIdentity();
  return identity !== null;
}

/**
 * Get the authenticated user's ID or null if not authenticated.
 * Use this for queries that should gracefully handle unauthenticated users
 * (e.g., returning empty data instead of throwing).
 */
export async function getAuthUserIdOrNull(
  ctx: QueryCtx | MutationCtx | ActionCtx
): Promise<string | null> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    return null;
  }
  return extractUserId(identity.subject);
}
