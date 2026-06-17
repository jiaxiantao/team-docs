import { createLocalStorage } from "@/lib/storage/local";
import { createS3Storage, isS3StorageConfigured } from "@/lib/storage/s3";
import type { StorageAdapter } from "@/lib/storage/types";

export type StorageDriver = "local" | "s3";

export function getStorageDriver(): StorageDriver {
  if (process.env.STORAGE_DRIVER === "s3" || isS3StorageConfigured()) {
    return "s3";
  }
  return "local";
}

let storage: StorageAdapter | null = null;

export function getStorage(): StorageAdapter {
  if (!storage) {
    storage =
      getStorageDriver() === "s3"
        ? createS3Storage()
        : createLocalStorage();
  }
  return storage;
}

export function buildAttachmentStorageKey(
  documentId: string,
  attachmentId: string,
  extension: string,
): string {
  return `docs/${documentId}/${attachmentId}.${extension}`;
}

export function attachmentPublicUrl(attachmentId: string): string {
  return `/api/attachments/${attachmentId}`;
}
