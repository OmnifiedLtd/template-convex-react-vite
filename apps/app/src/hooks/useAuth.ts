import { useAuthActions } from "@convex-dev/auth/react"
import { api } from "convex/_generated/api"
import { useConvexAuth, useQuery } from "convex/react"

/**
 * Custom auth hook that provides user data and auth state.
 */
export function useAuth() {
  const { isLoading, isAuthenticated } = useConvexAuth()
  const { signOut } = useAuthActions()
  const user = useQuery(api.users.viewer)

  return {
    loading: isLoading,
    isAuthenticated,
    user,
    signOut,
  }
}
