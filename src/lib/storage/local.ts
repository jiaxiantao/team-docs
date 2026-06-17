import { mkdir, readFile, rm, writeFile } from "fs/promises";
import path from "path";
import type { StorageAdapter, StoredObject } from "@/lib/storage/types";

function resolvePath(key: string): string {
  const root = process.env.UPLOAD_DIR ?? path.join(process.cwd(), "uploads");
  const resolved = path.resolve(root, key);
  if (!resolved.startsWith(path.resolve(root))) {
    throw new Error("非法存储路径");
  }
  return resolved;
}

export function createLocalStorage(): StorageAdapter {
  return {
    async put(key, body) {
      const filePath = resolvePath(key);
      await mkdir(path.dirname(filePath), { recursive: true });
      await writeFile(filePath, body);
    },
    async get(key) {
      try {
        const filePath = resolvePath(key);
        const body = await readFile(filePath);
        return { body, mimeType: "application/octet-stream" };
      } catch {
        return null;
      }
    },
    async delete(key) {
      try {
        await rm(resolvePath(key), { force: true });
      } catch {
        /* ignore missing file */
      }
    },
  };
}

export async function getLocalObject(
  key: string,
): Promise<StoredObject | null> {
  return createLocalStorage().get(key);
}
