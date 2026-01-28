import * as Sentry from "@sentry/react"
import { useEffect, useRef } from "react"
import { Navigate, useLocation } from "react-router-dom"
import { useAuth } from "@/hooks/useAuth"

interface AuthGuardProps {
  children: React.ReactNode
}

export function AuthGuard({ children }: AuthGuardProps) {
  const { loading, isAuthenticated } = useAuth()
  const location = useLocation()
  const prevState = useRef<{ loading: boolean; isAuthenticated: boolean } | null>(null)

  // Log state transitions for debugging
  useEffect(() => {
    const currentState = { loading, isAuthenticated }

    if (
      prevState.current &&
      (prevState.current.loading !== currentState.loading ||
        prevState.current.isAuthenticated !== currentState.isAuthenticated)
    ) {
      const transitionData = {
        from: prevState.current,
        to: currentState,
        path: location.pathname,
        timestamp: new Date().toISOString(),
      }
      console.log("[Auth Debug] AuthGuard state transition", transitionData)

      Sentry.addBreadcrumb({
        category: "auth",
        message: "AuthGuard state transition",
        level: "info",
        data: transitionData,
      })

      // Log concerning transitions
      if (
        prevState.current.isAuthenticated &&
        !currentState.isAuthenticated &&
        !currentState.loading
      ) {
        console.warn("[Auth Debug] AuthGuard: User became unauthenticated, will redirect to /auth")
        Sentry.addBreadcrumb({
          category: "auth",
          message: "User became unauthenticated - redirecting to /auth",
          level: "warning",
          data: transitionData,
        })
      }
    }

    prevState.current = currentState
  }, [loading, isAuthenticated, location.pathname])

  // Show loading spinner ONLY during initial auth check when we have no user.
  // During session validation, Convex Auth maintains the user object, so
  // we continue showing content without a jarring spinner.
  //
  // If we have a user, always render children regardless of loading state.
  // This ensures smooth UX during background session validation.
  if (isAuthenticated) {
    return <>{children}</>
  }

  // No user - check if we're still loading
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  // Not loading and no user - redirect to auth
  console.log("[Auth Debug] AuthGuard redirecting to /auth from:", location.pathname)
  Sentry.addBreadcrumb({
    category: "auth",
    message: "AuthGuard redirect to /auth",
    level: "info",
    data: { from: location.pathname },
  })
  return <Navigate to="/auth" state={{ from: location }} replace />
}
