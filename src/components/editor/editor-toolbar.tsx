"use client";

import type { Editor } from "@tiptap/react";
import {
  Code2,
  Highlighter,
  ImageIcon,
  Link2,
  List,
  ListChecks,
  ListOrdered,
  Minus,
  Paperclip,
  Quote,
  Strikethrough,
  Table2,
  Trash2,
} from "lucide-react";
import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type EditorToolbarProps = {
  editor: Editor;
  uploading: boolean;
  uploadError: string | null;
  showLinkInput: boolean;
  linkUrl: string;
  onLinkUrlChange: (url: string) => void;
  onOpenLinkInput: () => void;
  onApplyLink: () => void;
  onCloseLinkInput: () => void;
  onInsertImage: (file: File) => void;
  onInsertAttachment: (file: File) => void;
};

export function EditorToolbar({
  editor,
  uploading,
  uploadError,
  showLinkInput,
  linkUrl,
  onLinkUrlChange,
  onOpenLinkInput,
  onApplyLink,
  onCloseLinkInput,
  onInsertImage,
  onInsertAttachment,
}: EditorToolbarProps) {
  const imageInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const inTable = editor.isActive("table");

  const headingValue = editor.isActive("heading", { level: 1 })
    ? "h1"
    : editor.isActive("heading", { level: 2 })
      ? "h2"
      : editor.isActive("heading", { level: 3 })
        ? "h3"
        : "p";

  return (
    <div className="border-b">
      <div className="flex flex-wrap items-center gap-0.5 px-3 py-2">
        <ToolbarSelect
          value={headingValue}
          ariaLabel="段落样式"
          onChange={(value) => {
            if (value === "p") {
              editor.chain().focus().setParagraph().run();
            } else if (value === "h1") {
              editor.chain().focus().toggleHeading({ level: 1 }).run();
            } else if (value === "h2") {
              editor.chain().focus().toggleHeading({ level: 2 }).run();
            } else {
              editor.chain().focus().toggleHeading({ level: 3 }).run();
            }
          }}
          options={[
            { value: "p", label: "正文" },
            { value: "h1", label: "标题 1" },
            { value: "h2", label: "标题 2" },
            { value: "h3", label: "标题 3" },
          ]}
        />

        <ToolbarDivider />

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          active={editor.isActive("bold")}
          ariaLabel="加粗"
          label="B"
          className="font-bold"
        />
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          active={editor.isActive("italic")}
          ariaLabel="斜体"
          label="I"
          className="italic"
        />
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          active={editor.isActive("underline")}
          ariaLabel="下划线"
          label="U"
          className="underline"
        />
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleStrike().run()}
          active={editor.isActive("strike")}
          ariaLabel="删除线"
          icon={<Strikethrough className="h-4 w-4" />}
        />
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHighlight().run()}
          active={editor.isActive("highlight")}
          ariaLabel="高亮"
          icon={<Highlighter className="h-4 w-4" />}
        />

        <ToolbarDivider />

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          active={editor.isActive("bulletList")}
          ariaLabel="无序列表"
          icon={<List className="h-4 w-4" />}
        />
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          active={editor.isActive("orderedList")}
          ariaLabel="有序列表"
          icon={<ListOrdered className="h-4 w-4" />}
        />
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleTaskList().run()}
          active={editor.isActive("taskList")}
          ariaLabel="任务列表"
          icon={<ListChecks className="h-4 w-4" />}
        />

        <ToolbarDivider />

        <ToolbarButton
          onClick={onOpenLinkInput}
          active={editor.isActive("link")}
          ariaLabel="插入链接"
          icon={<Link2 className="h-4 w-4" />}
        />
        <ToolbarButton
          onClick={() => imageInputRef.current?.click()}
          ariaLabel="插入图片"
          icon={<ImageIcon className="h-4 w-4" />}
          disabled={uploading}
        />
        <ToolbarButton
          onClick={() => fileInputRef.current?.click()}
          ariaLabel="插入附件"
          icon={<Paperclip className="h-4 w-4" />}
          disabled={uploading}
        />
        <ToolbarButton
          onClick={() =>
            editor
              .chain()
              .focus()
              .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
              .run()
          }
          ariaLabel="插入表格"
          icon={<Table2 className="h-4 w-4" />}
        />
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          active={editor.isActive("codeBlock")}
          ariaLabel="代码块"
          icon={<Code2 className="h-4 w-4" />}
        />
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          active={editor.isActive("blockquote")}
          ariaLabel="引用"
          icon={<Quote className="h-4 w-4" />}
        />
        <ToolbarButton
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          ariaLabel="分割线"
          icon={<Minus className="h-4 w-4" />}
        />

        <input
          ref={imageInputRef}
          type="file"
          accept="image/jpeg,image/png,image/gif,image/webp"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onInsertImage(file);
            e.target.value = "";
          }}
        />
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.txt,.md,.csv,.json,.zip,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onInsertAttachment(file);
            e.target.value = "";
          }}
        />
      </div>

      {inTable && (
        <div className="flex flex-wrap items-center gap-1 border-t bg-muted/30 px-3 py-1.5">
          <span className="mr-1 text-xs text-muted-foreground">表格</span>
          <ToolbarButton
            onClick={() => editor.chain().focus().addRowAfter().run()}
            ariaLabel="在下方插入行"
            label="+ 行"
            className="text-xs"
          />
          <ToolbarButton
            onClick={() => editor.chain().focus().addColumnAfter().run()}
            ariaLabel="在右侧插入列"
            label="+ 列"
            className="text-xs"
          />
          <ToolbarButton
            onClick={() => editor.chain().focus().deleteRow().run()}
            ariaLabel="删除行"
            label="删行"
            className="text-xs"
          />
          <ToolbarButton
            onClick={() => editor.chain().focus().deleteColumn().run()}
            ariaLabel="删除列"
            label="删列"
            className="text-xs"
          />
          <ToolbarButton
            onClick={() => editor.chain().focus().deleteTable().run()}
            ariaLabel="删除表格"
            icon={<Trash2 className="h-3.5 w-3.5" />}
            className="text-xs text-destructive"
          />
        </div>
      )}

      {(uploading || uploadError) && (
        <div className="border-t px-3 py-1.5 text-sm">
          {uploading && (
            <span className="text-muted-foreground">文件上传中…</span>
          )}
          {uploadError && (
            <span className="text-destructive" role="alert">
              {uploadError}
            </span>
          )}
        </div>
      )}

      {showLinkInput && (
        <div className="flex flex-wrap items-center gap-2 border-t px-3 py-2">
          <Input
            value={linkUrl}
            onChange={(e) => onLinkUrlChange(e.target.value)}
            placeholder="https://example.com"
            className="h-8 max-w-xs flex-1 text-sm"
            onKeyDown={(e) => e.key === "Enter" && onApplyLink()}
          />
          <Button type="button" size="sm" variant="secondary" onClick={onApplyLink}>
            应用
          </Button>
          <Button type="button" size="sm" variant="ghost" onClick={onCloseLinkInput}>
            取消
          </Button>
        </div>
      )}
    </div>
  );
}

function ToolbarDivider() {
  return <span className="mx-1 h-6 w-px bg-border" />;
}

function ToolbarSelect({
  value,
  onChange,
  options,
  ariaLabel,
}: {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  ariaLabel: string;
}) {
  return (
    <select
      value={value}
      aria-label={ariaLabel}
      onChange={(e) => onChange(e.target.value)}
      className="h-8 rounded-md border bg-background px-2 text-sm"
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}

function ToolbarButton({
  onClick,
  active,
  label,
  ariaLabel,
  className,
  icon,
  disabled,
}: {
  onClick: () => void;
  active?: boolean;
  label?: string;
  ariaLabel: string;
  className?: string;
  icon?: React.ReactNode;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      aria-pressed={active}
      disabled={disabled}
      className={cn(
        "inline-flex h-8 min-w-8 items-center justify-center rounded-md px-2 text-sm transition-colors hover:bg-accent disabled:opacity-50",
        active && "bg-accent text-accent-foreground",
        className,
      )}
    >
      {icon ?? label}
    </button>
  );
}
