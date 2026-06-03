"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Collaboration from "@tiptap/extension-collaboration";
import CollaborationCaret from "@tiptap/extension-collaboration-caret";
import Placeholder from "@tiptap/extension-placeholder";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import { HocuspocusProvider } from "@hocuspocus/provider";
import * as Y from "yjs";
import { Loader2, Users } from "lucide-react";
import { cn } from "@/lib/utils";

type CollaborativeEditorProps = {
  documentId: string;
  user: {
    id: string;
    name: string;
    color: string;
  };
  className?: string;
};

type EditorSurfaceProps = {
  ydoc: Y.Doc;
  provider: HocuspocusProvider;
  user: CollaborativeEditorProps["user"];
  className?: string;
};

/** 仅在协同文档已从服务端同步后再挂载 Tiptap，避免刷新后加载到空文档 */
function EditorSurface({
  ydoc,
  provider,
  user,
  className,
}: EditorSurfaceProps) {
  const editor = useEditor(
    {
      immediatelyRender: false,
      extensions: [
        StarterKit.configure({
          undoRedo: false,
          link: false,
          underline: false,
        }),
        Underline,
        Link.configure({ openOnClick: false }),
        Placeholder.configure({
          placeholder: "开始输入，邀请同事一起协作…",
        }),
        Collaboration.configure({
          document: ydoc,
        }),
        CollaborationCaret.configure({
          provider,
          user: {
            name: user.name,
            color: user.color,
          },
        }),
      ],
      editorProps: {
        attributes: {
          class:
            "prose prose-neutral max-w-none min-h-[60vh] focus:outline-none px-1",
        },
      },
    },
    [ydoc, provider, user.name, user.color],
  );

  const setLink = useCallback(() => {
    if (!editor) return;
    const previousUrl = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("链接地址", previousUrl ?? "https://");
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  }, [editor]);

  if (!editor) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center gap-2 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
        <span>正在初始化编辑器…</span>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col gap-4", className)}>
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-card px-4 py-2">
        <div className="flex flex-wrap items-center gap-1">
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBold().run()}
            active={editor.isActive("bold")}
            label="B"
            className="font-bold"
          />
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleItalic().run()}
            active={editor.isActive("italic")}
            label="I"
            className="italic"
          />
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            active={editor.isActive("underline")}
            label="U"
            className="underline"
          />
          <span className="mx-2 h-6 w-px bg-border" />
          <ToolbarButton
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 1 }).run()
            }
            active={editor.isActive("heading", { level: 1 })}
            label="H1"
          />
          <ToolbarButton
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 2 }).run()
            }
            active={editor.isActive("heading", { level: 2 })}
            label="H2"
          />
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            active={editor.isActive("bulletList")}
            label="• 列表"
          />
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            active={editor.isActive("orderedList")}
            label="1. 列表"
          />
          <ToolbarButton onClick={setLink} label="链接" />
        </div>

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Users className="h-4 w-4" />
          <OnlineCount provider={provider} />
          <span className="inline-flex h-2 w-2 rounded-full bg-emerald-500" />
        </div>
      </div>

      <div className="rounded-xl border bg-card p-6 shadow-sm">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}

function OnlineCount({ provider }: { provider: HocuspocusProvider }) {
  const [count, setCount] = useState(1);

  useEffect(() => {
    const update = () => setCount(provider.awareness?.getStates().size ?? 1);
    provider.awareness?.on("change", update);
    update();
    return () => provider.awareness?.off("change", update);
  }, [provider]);

  return <span>{count} 人在线</span>;
}

export function CollaborativeEditor({
  documentId,
  user,
  className,
}: CollaborativeEditorProps) {
  const [provider, setProvider] = useState<HocuspocusProvider | null>(null);
  const [synced, setSynced] = useState(false);
  const [status, setStatus] = useState<"loading" | "connected" | "error">(
    "loading",
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const ydoc = useMemo(() => new Y.Doc(), [documentId]);

  useEffect(() => {
    let active = true;
    let hocuspocus: HocuspocusProvider | null = null;

    const connect = async () => {
      try {
        const res = await fetch(`/api/collab/token?documentId=${documentId}`);
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error ?? "无法获取协同令牌");
        }
        const { token, wsUrl } = await res.json();
        if (!active) return;

        hocuspocus = new HocuspocusProvider({
          url: wsUrl,
          name: documentId,
          document: ydoc,
          token,
          onConnect: () => setStatus("connected"),
          onDisconnect: () => {
            setStatus("loading");
            setSynced(false);
          },
          onAuthenticationFailed: () => {
            setStatus("error");
            setErrorMessage("协同认证失败");
            setSynced(false);
          },
          onSynced: () => {
            setStatus("connected");
            setSynced(true);
          },
        });

        hocuspocus.setAwarenessField("user", {
          name: user.name,
          color: user.color,
        });

        setProvider(hocuspocus);
      } catch (err) {
        if (active) {
          setStatus("error");
          setSynced(false);
          setErrorMessage(
            err instanceof Error ? err.message : "协同连接失败",
          );
        }
      }
    };

    void connect();

    return () => {
      active = false;
      hocuspocus?.destroy();
      setProvider(null);
      setSynced(false);
    };
  }, [documentId, ydoc, user.name, user.color]);

  useEffect(() => {
    if (!provider) return;

    const flushOnLeave = () => {
      provider.disconnect();
    };

    window.addEventListener("beforeunload", flushOnLeave);
    return () => window.removeEventListener("beforeunload", flushOnLeave);
  }, [provider]);

  if (status === "error") {
    return (
      <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-8 text-center text-destructive">
        <p>{errorMessage ?? "协同服务不可用"}</p>
        <p className="mt-2 text-sm text-muted-foreground">
          请确认已运行{" "}
          <code className="rounded bg-muted px-1.5 py-0.5">pnpm dev</code>{" "}
          （包含 collab-server），且{" "}
          <code className="rounded bg-muted px-1.5 py-0.5">
            NEXT_PUBLIC_COLLAB_WS_URL
          </code>{" "}
          指向 ws://localhost:1234
        </p>
      </div>
    );
  }

  if (!provider || !synced) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center gap-2 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
        <span>
          {!provider ? "正在连接协同服务…" : "正在加载文档内容…"}
        </span>
      </div>
    );
  }

  return (
    <EditorSurface
      ydoc={ydoc}
      provider={provider}
      user={user}
      className={className}
    />
  );
}

function ToolbarButton({
  onClick,
  active,
  label,
  className,
}: {
  onClick: () => void;
  active?: boolean;
  label: string;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-md px-2.5 py-1.5 text-sm transition-colors hover:bg-accent",
        active && "bg-accent text-accent-foreground",
        className,
      )}
    >
      {label}
    </button>
  );
}
