import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { auth } from "./auth";

const http = httpRouter();

// Register Convex Auth HTTP routes (token refresh, OAuth callbacks)
auth.addHttpRoutes(http);

/**
 * Health check endpoint.
 * Useful for monitoring and uptime checks.
 */
http.route({
  path: "/health",
  method: "GET",
  handler: httpAction(async () => {
    return new Response(JSON.stringify({ status: "ok" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }),
});

export default http;
