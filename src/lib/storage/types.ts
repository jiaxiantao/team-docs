export type StoredObject = {
  body: Buffer;
  mimeType: string;
};

export interface StorageAdapter {
  put(key: string, body: Buffer, mimeType: string): Promise<void>;
  get(key: string): Promise<StoredObject | null>;
  delete(key: string): Promise<void>;
}
