// Re-export storage hooks for convenience

// Export the API object for direct access
export { api } from "convex/_generated/api"

// Re-export from convex/react for convenience
export {
  useAction,
  useConvex,
  useConvexAuth,
  useMutation,
  useQuery,
} from "convex/react"
export {
  uploadFile,
  useDeleteFile,
  useFileUrl,
  useGenerateUploadUrl,
} from "../useStorage"
