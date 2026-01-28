import { ConvexAuthProvider } from "@convex-dev/auth/react"
import * as Sentry from "@sentry/react"
import { ConvexReactClient } from "convex/react"
import React from "react"
import ReactDOM from "react-dom/client"
import App from "./App"
import { ErrorFallback } from "./components/layout/ErrorFallback"
import "./index.css"
import "./lib/sentry"

// Initialize Convex client
const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL as string)

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Sentry.ErrorBoundary fallback={ErrorFallback}>
      <ConvexAuthProvider client={convex}>
        <App />
      </ConvexAuthProvider>
    </Sentry.ErrorBoundary>
  </React.StrictMode>,
)
