import Highlight from "@tiptap/extension-highlight";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import { Table } from "@tiptap/extension-table";
import { TableCell } from "@tiptap/extension-table-cell";
import { TableHeader } from "@tiptap/extension-table-header";
import { TableRow } from "@tiptap/extension-table-row";
import TaskItem from "@tiptap/extension-task-item";
import TaskList from "@tiptap/extension-task-list";
import Underline from "@tiptap/extension-underline";
import StarterKit from "@tiptap/starter-kit";
import type { Extensions } from "@tiptap/core";
import { FileAttachment } from "@/components/editor/file-attachment-extension";

/** 服务端导出 / 快照预览用，不含协同扩展 */
export function getStaticEditorExtensions(): Extensions {
  return [
    StarterKit.configure({
      link: false,
      underline: false,
    }),
    Underline,
    Highlight.configure({ multicolor: false }),
    Link.configure({
      openOnClick: true,
      HTMLAttributes: { rel: "noopener noreferrer" },
    }),
    Image.configure({ inline: false, allowBase64: false }),
    Table.configure({ resizable: true }),
    TableRow,
    TableHeader,
    TableCell,
    TaskList,
    TaskItem.configure({ nested: true }),
    FileAttachment,
  ];
}
