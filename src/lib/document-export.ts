import type { JSONContent } from "@tiptap/core";
import { generateHTML } from "@tiptap/html";
import { yDocToProsemirrorJSON } from "@tiptap/y-tiptap";
import * as Y from "yjs";
import { getStaticEditorExtensions } from "@/lib/editor-static-extensions";

export const COLLAB_XML_FRAGMENT = "default";

export function yjsStateToProsemirrorJSON(state: Uint8Array): JSONContent {
  const ydoc = new Y.Doc();
  Y.applyUpdate(ydoc, state);
  return yDocToProsemirrorJSON(ydoc, COLLAB_XML_FRAGMENT) as JSONContent;
}

export function yjsStateToHtml(state: Uint8Array): string {
  const json = yjsStateToProsemirrorJSON(state);
  return generateHTML(json, getStaticEditorExtensions());
}

export function wrapExportHtml(title: string, bodyHtml: string): string {
  const safeTitle = title
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${safeTitle}</title>
  <style>
    body { font-family: system-ui, sans-serif; line-height: 1.6; max-width: 48rem; margin: 2rem auto; padding: 0 1rem; color: #111; }
    img { max-width: 100%; height: auto; }
    table { border-collapse: collapse; width: 100%; margin: 1rem 0; }
    th, td { border: 1px solid #ddd; padding: 0.5rem 0.75rem; text-align: left; }
    th { background: #f5f5f5; }
    blockquote { border-left: 3px solid #ddd; margin: 1rem 0; padding-left: 1rem; color: #555; }
    pre { background: #f5f5f5; padding: 1rem; overflow-x: auto; border-radius: 0.375rem; }
    .file-attachment { display: inline-flex; gap: 0.5rem; padding: 0.5rem 0.75rem; border: 1px solid #ddd; border-radius: 0.375rem; text-decoration: none; color: inherit; }
    ul[data-type="taskList"] { list-style: none; padding-left: 0; }
  </style>
</head>
<body>
  <article class="prose">${bodyHtml}</article>
</body>
</html>`;
}

export { sanitizeFilename } from "@/lib/content-disposition";
