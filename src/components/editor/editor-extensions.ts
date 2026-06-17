import type { HocuspocusProvider } from "@hocuspocus/provider";
import Collaboration from "@tiptap/extension-collaboration";
import CollaborationCaret from "@tiptap/extension-collaboration-caret";
import Highlight from "@tiptap/extension-highlight";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import { Table } from "@tiptap/extension-table";
import { TableCell } from "@tiptap/extension-table-cell";
import { TableHeader } from "@tiptap/extension-table-header";
import { TableRow } from "@tiptap/extension-table-row";
import TaskItem from "@tiptap/extension-task-item";
import TaskList from "@tiptap/extension-task-list";
import Underline from "@tiptap/extension-underline";
import StarterKit from "@tiptap/starter-kit";
import type { Extensions } from "@tiptap/react";
import type * as Y from "yjs";
import { FileAttachment } from "@/components/editor/file-attachment-extension";

type EditorExtensionOptions = {
  ydoc: Y.Doc;
  provider: HocuspocusProvider;
  user: { name: string; color: string };
  readOnly?: boolean;
};

export function createEditorExtensions({
  ydoc,
  provider,
  user,
  readOnly = false,
}: EditorExtensionOptions): Extensions {
  return [
    StarterKit.configure({
      undoRedo: false,
      link: false,
      underline: false,
    }),
    Underline,
    Highlight.configure({ multicolor: false }),
    Link.configure({
      openOnClick: readOnly,
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
    Placeholder.configure({
      placeholder: readOnly ? "只读模式" : "开始输入，邀请同事一起协作…",
    }),
    Collaboration.configure({ document: ydoc }),
    CollaborationCaret.configure({
      provider,
      user: { name: user.name, color: user.color },
    }),
  ];
}
