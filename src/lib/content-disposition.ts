export function sanitizeFilename(name: string): string {
  const trimmed = name.trim() || "document";
  return trimmed.replace(/[/\\?%*:|"<>]/g, "_").slice(0, 120);
}

function asciiFallbackFilename(filename: string): string {
  const ascii = filename.replace(/[^\x20-\x7E]/g, "").replace(/"/g, "").trim();
  const stem = ascii.replace(/\.[a-zA-Z0-9]+$/, "");
  if (/[a-zA-Z0-9]/.test(stem)) return ascii || "download";

  const extMatch = filename.match(/(\.[a-zA-Z0-9]+)$/);
  return extMatch ? `download${extMatch[1]}` : "download";
}

/** RFC 5987 — HTTP 头仅支持 ASCII，中文文件名用 filename* */
export function buildContentDisposition(
  filename: string,
  disposition: "attachment" | "inline" = "attachment",
): string {
  const safe = sanitizeFilename(filename);
  const asciiFallback = asciiFallbackFilename(safe);
  const encoded = encodeURIComponent(safe);
  return `${disposition}; filename="${asciiFallback}"; filename*=UTF-8''${encoded}`;
}

export function parseContentDispositionFilename(
  disposition: string,
): string | null {
  const utf8Match = disposition.match(/filename\*=UTF-8''([^;]+)/i);
  if (utf8Match?.[1]) {
    try {
      return decodeURIComponent(utf8Match[1]);
    } catch {
      // fall through
    }
  }

  const asciiMatch = disposition.match(/filename="([^"]+)"/i);
  return asciiMatch?.[1] ?? null;
}
