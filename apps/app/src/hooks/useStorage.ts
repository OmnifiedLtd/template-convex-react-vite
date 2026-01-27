import { useMutation, useQuery } from "convex/react";
import { api } from "convex/_generated/api";
import type { Id } from "convex/_generated/dataModel";

/**
 * Hook to generate an upload URL for file storage.
 */
export function useGenerateUploadUrl() {
  return useMutation(api.storage.generateUploadUrl);
}

/**
 * Hook to get a file URL from storage.
 */
export function useFileUrl(storageId: Id<"_storage"> | undefined) {
  const url = useQuery(
    api.storage.getUrl,
    storageId ? { storageId } : "skip"
  );
  return url ?? null;
}

/**
 * Hook to delete a file from storage.
 */
export function useDeleteFile() {
  return useMutation(api.storage.deleteFile);
}

/**
 * Helper function to upload a file to Convex storage.
 */
export async function uploadFile(
  generateUploadUrl: () => Promise<string>,
  file: File
): Promise<Id<"_storage">> {
  // Get a signed upload URL
  const uploadUrl = await generateUploadUrl();

  // Upload the file
  const response = await fetch(uploadUrl, {
    method: "POST",
    headers: {
      "Content-Type": file.type,
    },
    body: file,
  });

  if (!response.ok) {
    throw new Error("Failed to upload file");
  }

  const { storageId } = await response.json();
  return storageId;
}
