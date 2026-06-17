import { isImageUpload } from "@/lib/upload-policy";

export type UploadedFile = {
  url: string;
  filename: string;
  size: number;
  mimeType: string;
};

export async function uploadDocumentFile(
  documentId: string,
  file: File,
): Promise<UploadedFile> {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`/api/documents/${documentId}/upload`, {
    method: "POST",
    body: formData,
  });
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(
      typeof data.error === "string" ? data.error : "文件上传失败",
    );
  }

  const attachment = data.attachment as UploadedFile;
  return attachment;
}

export function isImageFile(mimeType: string): boolean {
  return isImageUpload(mimeType);
}
