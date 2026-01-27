import React from "react";
import ReactDOM from "react-dom/client";
import * as Sentry from "@sentry/react";
import { ConvexAuthProvider } from "@convex-dev/auth/react";
import { ConvexReactClient } from "convex/react";
import App from "./App";
import "./index.css";

// Initialize Sentry for error monitoring
const sentryDsn = import.meta.env.VITE_SENTRY_DSN as string;
const sentryRelease =
  (import.meta.env.VITE_SENTRY_RELEASE as string | undefined) ||
  (import.meta.env.VITE_VERCEL_GIT_COMMIT_SHA as string | undefined);
if (sentryDsn) {
  Sentry.init({
    dsn: sentryDsn,
    // Send default PII data (e.g., IP address) to help with debugging
    sendDefaultPii: true,
    // Only enable in production-like environments
    enabled: import.meta.env.PROD || !!import.meta.env.VITE_SENTRY_DSN,
    // Tag releases when provided via env
    release: sentryRelease,
  });
}

// Initialize Convex client
const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL as string);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ConvexAuthProvider client={convex}>
      <App />
    </ConvexAuthProvider>
  </React.StrictMode>
);
