export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024; // 10 MB

export const ALLOWED_IMAGE_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
] as const;

export type AllowedImageMimeType = (typeof ALLOWED_IMAGE_MIME_TYPES)[number];

const IMAGE_EXT: Record<AllowedImageMimeType, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/gif": "gif",
  "image/webp": "webp",
};

/** 附件允许的扩展名（小写，不含点） */
export const ALLOWED_FILE_EXTENSIONS = [
  "jpg",
  "jpeg",
  "png",
  "gif",
  "webp",
  "pdf",
  "txt",
  "md",
  "csv",
  "json",
  "zip",
  "doc",
  "docx",
  "xls",
  "xlsx",
  "ppt",
  "pptx",
] as const;

export type AllowedFileExtension = (typeof ALLOWED_FILE_EXTENSIONS)[number];

const EXTENSION_MIME: Partial<Record<AllowedFileExtension, string>> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  gif: "image/gif",
  webp: "image/webp",
  pdf: "application/pdf",
  txt: "text/plain",
  md: "text/markdown",
  csv: "text/csv",
  json: "application/json",
  zip: "application/zip",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  xls: "application/vnd.ms-excel",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ppt: "application/vnd.ms-powerpoint",
  pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
};

export function isAllowedImageMimeType(
  mimeType: string,
): mimeType is AllowedImageMimeType {
  return (ALLOWED_IMAGE_MIME_TYPES as readonly string[]).includes(mimeType);
}

export function extensionForMimeType(mimeType: AllowedImageMimeType): string {
  return IMAGE_EXT[mimeType];
}

export function fileExtension(filename: string): string {
  const parts = filename.split(".");
  if (parts.length < 2) return "";
  return parts.at(-1)?.toLowerCase() ?? "";
}

export function isAllowedFileExtension(ext: string): ext is AllowedFileExtension {
  return (ALLOWED_FILE_EXTENSIONS as readonly string[]).includes(ext);
}

export function resolveUploadMimeType(file: {
  type: string;
  name: string;
}): string {
  if (file.type) return file.type;
  const ext = fileExtension(file.name);
  if (isAllowedFileExtension(ext) && EXTENSION_MIME[ext]) {
    return EXTENSION_MIME[ext]!;
  }
  return "application/octet-stream";
}

export function resolveUploadExtension(
  file: { name: string },
  mimeType: string,
): string {
  if (isAllowedImageMimeType(mimeType)) {
    return extensionForMimeType(mimeType);
  }
  const fromName = fileExtension(file.name);
  if (isAllowedFileExtension(fromName)) return fromName;
  if (mimeType === "application/pdf") return "pdf";
  if (mimeType === "text/plain") return "txt";
  return "bin";
}

export function isImageUpload(mimeType: string): boolean {
  return isAllowedImageMimeType(mimeType);
}

export function validateFileUpload(file: {
  size: number;
  type: string;
  name: string;
}): string | null {
  if (file.size <= 0) return "文件为空";
  if (file.size > MAX_UPLOAD_BYTES) {
    return `文件不能超过 ${MAX_UPLOAD_BYTES / 1024 / 1024} MB`;
  }

  const mimeType = resolveUploadMimeType(file);
  if (isAllowedImageMimeType(mimeType)) return null;

  const ext = fileExtension(file.name);
  if (!isAllowedFileExtension(ext)) {
    return "不支持的文件类型（支持图片、PDF、Office、TXT、ZIP 等）";
  }

  return null;
}

/** @deprecated 使用 validateFileUpload */
export function validateImageUpload(file: {
  size: number;
  type: string;
  name?: string;
}): string | null {
  return validateFileUpload({
    size: file.size,
    type: file.type,
    name: file.name ?? "file",
  });
}
