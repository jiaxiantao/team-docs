import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import type { StorageAdapter } from "@/lib/storage/types";

function getS3Config() {
  const bucket = process.env.S3_BUCKET;
  const region = process.env.S3_REGION ?? "us-east-1";
  if (!bucket) {
    throw new Error("S3_BUCKET is required for S3 storage");
  }

  return {
    bucket,
    region,
    endpoint: process.env.S3_ENDPOINT,
    forcePathStyle: process.env.S3_FORCE_PATH_STYLE === "1",
    accessKeyId: process.env.S3_ACCESS_KEY_ID,
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
  };
}

function createS3Client() {
  const config = getS3Config();
  return new S3Client({
    region: config.region,
    endpoint: config.endpoint,
    forcePathStyle: config.forcePathStyle,
    credentials:
      config.accessKeyId && config.secretAccessKey
        ? {
            accessKeyId: config.accessKeyId,
            secretAccessKey: config.secretAccessKey,
          }
        : undefined,
  });
}

export function isS3StorageConfigured(): boolean {
  return Boolean(process.env.S3_BUCKET);
}

export function createS3Storage(): StorageAdapter {
  const config = getS3Config();
  const client = createS3Client();

  return {
    async put(key, body, mimeType) {
      await client.send(
        new PutObjectCommand({
          Bucket: config.bucket,
          Key: key,
          Body: body,
          ContentType: mimeType,
        }),
      );
    },
    async get(key) {
      try {
        const response = await client.send(
          new GetObjectCommand({
            Bucket: config.bucket,
            Key: key,
          }),
        );
        const bytes = await response.Body?.transformToByteArray();
        if (!bytes) return null;
        return {
          body: Buffer.from(bytes),
          mimeType: response.ContentType ?? "application/octet-stream",
        };
      } catch {
        return null;
      }
    },
    async delete(key) {
      await client.send(
        new DeleteObjectCommand({
          Bucket: config.bucket,
          Key: key,
        }),
      );
    },
  };
}
