import { Node, mergeAttributes } from "@tiptap/core";

export type FileAttachmentAttrs = {
  href: string;
  filename: string;
  size: number;
  mimeType: string;
};

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    fileAttachment: {
      setFileAttachment: (attrs: FileAttachmentAttrs) => ReturnType;
    };
  }
}

export const FileAttachment = Node.create({
  name: "fileAttachment",
  group: "block",
  atom: true,
  selectable: true,
  draggable: true,

  addAttributes() {
    return {
      href: { default: null },
      filename: { default: null },
      size: { default: 0 },
      mimeType: { default: null },
    };
  },

  parseHTML() {
    return [{ tag: 'a[data-file-attachment="true"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    const filename = HTMLAttributes.filename ?? "附件";
    const size = Number(HTMLAttributes.size ?? 0);
    const sizeLabel =
      size >= 1024 * 1024
        ? `${(size / 1024 / 1024).toFixed(1)} MB`
        : size >= 1024
          ? `${Math.round(size / 1024)} KB`
          : `${size} B`;

    return [
      "a",
      mergeAttributes(HTMLAttributes, {
        "data-file-attachment": "true",
        class: "file-attachment",
        target: "_blank",
        rel: "noopener noreferrer",
      }),
      ["span", { class: "file-attachment-name" }, filename],
      ["span", { class: "file-attachment-meta" }, sizeLabel],
    ];
  },

  addCommands() {
    return {
      setFileAttachment:
        (attrs) =>
        ({ commands }) =>
          commands.insertContent({ type: this.name, attrs }),
    };
  },
});
