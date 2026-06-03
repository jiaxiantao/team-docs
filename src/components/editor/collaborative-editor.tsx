"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Collaboration from "@tiptap/extension-collaboration";
import CollaborationCaret from "@tiptap/extension-collaboration-caret";
import Placeholder from "@tiptap/extension-placeholder";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import { HocuspocusProvider } from "@hocuspocus/provider";
import * as Y from "yjs";
import { Loader2, Users, WifiOff } from "lucide-react";
import { cn } from "@/lib/utils";

type CollaborativeEditorProps = {
  documentId: string;
  user: {
    id: string;
    name: string;
    color: string;
  };
  readOnly?: boolean;
  className?: string;
};

type ConnectionState = "connecting" | "syncing" | "ready" | "disconnected" | "error";

type EditorSurfaceProps = {
  ydoc: Y.Doc;
  provider: HocuspocusProvider;
  user: CollaborativeEditorProps["user"];
  readOnly?: boolean;
  disconnected?: boolean;
  onRetry?: () => void;
  className?: string;
};

/** 仅在协同文档已从服务端同步后再挂载 Tiptap，避免刷新后加载到空文档 */
function EditorSurface({
  ydoc,
  provider,
  user,
  readOnly = false,
  disconnected = false,
  onRetry,
  className,
}: EditorSurfaceProps) {
  const editor = useEditor(
    {
      immediatelyRender: false,
      editable: !readOnly,
      extensions: [
        StarterKit.configure({
          undoRedo: false,
          link: false,
          underline: false,
        }),
        Underline,
        Link.configure({ openOnClick: false }),
        Placeholder.configure({
          placeholder: readOnly
            ? "只读模式"
            : "开始输入，邀请同事一起协作…",
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
    [ydoc, provider, user.name, user.color, readOnly],
  );

  const [linkUrl, setLinkUrl] = useState("");
  const [showLinkInput, setShowLinkInput] = useState(false);

  const applyLink = useCallback(() => {
    if (!editor) return;
    if (!linkUrl.trim()) {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
    } else {
      const href = linkUrl.startsWith("http") ? linkUrl : `https://${linkUrl}`;
      editor.chain().focus().extendMarkRange("link").setLink({ href }).run();
    }
    setShowLinkInput(false);
    setLinkUrl("");
  }, [editor, linkUrl]);

  const openLinkInput = useCallback(() => {
    if (!editor) return;
    const previous = editor.getAttributes("link").href as string | undefined;
    setLinkUrl(previous ?? "");
    setShowLinkInput(true);
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
      {disconnected && (
        <div
          className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-2 text-sm text-amber-950 dark:text-amber-100"
          role="status"
        >
          <span className="flex items-center gap-2">
            <WifiOff className="h-4 w-4 shrink-0" />
            协同连接已断开，编辑可能无法同步
          </span>
          {onRetry && (
            <Button type="button" size="sm" variant="secondary" onClick={onRetry}>
              重新连接
            </Button>
          )}
        </div>
      )}

      <div className="overflow-hidden rounded-xl border bg-card">
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2">
          {!readOnly && (
            <div className="flex flex-wrap items-center gap-1">
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
              <span className="mx-2 h-6 w-px bg-border" />
              <ToolbarButton
                onClick={() =>
                  editor.chain().focus().toggleHeading({ level: 1 }).run()
                }
                active={editor.isActive("heading", { level: 1 })}
                ariaLabel="一级标题"
                label="H1"
              />
              <ToolbarButton
                onClick={() =>
                  editor.chain().focus().toggleHeading({ level: 2 }).run()
                }
                active={editor.isActive("heading", { level: 2 })}
                ariaLabel="二级标题"
                label="H2"
              />
              <ToolbarButton
                onClick={() => editor.chain().focus().toggleBulletList().run()}
                active={editor.isActive("bulletList")}
                ariaLabel="无序列表"
                label="• 列表"
              />
              <ToolbarButton
                onClick={() => editor.chain().focus().toggleOrderedList().run()}
                active={editor.isActive("orderedList")}
                ariaLabel="有序列表"
                label="1. 列表"
              />
              <ToolbarButton
                onClick={openLinkInput}
                ariaLabel="插入链接"
                label="链接"
              />
            </div>
          )}

          <div
            className={cn(
              "flex items-center gap-2 text-sm text-muted-foreground",
              readOnly && "ml-auto",
            )}
          >
            <Users className="h-4 w-4" />
            <OnlineCount provider={provider} />
            <span
              className={cn(
                "inline-flex h-2 w-2 rounded-full",
                disconnected ? "bg-amber-500" : "bg-emerald-500",
              )}
            />
          </div>
        </div>

        {showLinkInput && !readOnly && (
          <div className="flex flex-wrap items-center gap-2 border-t px-4 py-2">
            <Input
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              placeholder="https://example.com"
              className="h-8 max-w-xs flex-1 text-sm"
              onKeyDown={(e) => e.key === "Enter" && applyLink()}
            />
            <Button type="button" size="sm" variant="secondary" onClick={applyLink}>
              应用
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => setShowLinkInput(false)}
            >
              取消
            </Button>
          </div>
        )}
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
  readOnly = false,
  className,
}: CollaborativeEditorProps) {
  const [provider, setProvider] = useState<HocuspocusProvider | null>(null);
  const [synced, setSynced] = useState(false);
  const [connectionState, setConnectionState] =
    useState<ConnectionState>("connecting");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [connectAttempt, setConnectAttempt] = useState(0);

  const ydoc = useMemo(() => {
    void documentId;
    return new Y.Doc();
  }, [documentId]);

  const providerRef = useRef<HocuspocusProvider | null>(null);

  const retry = useCallback(() => {
    providerRef.current?.destroy();
    providerRef.current = null;
    setProvider(null);
    setSynced(false);
    setConnectionState("connecting");
    setErrorMessage(null);
    setConnectAttempt((n) => n + 1);
  }, []);

  useEffect(() => {
    let active = true;

    const connect = async () => {
      try {
        const res = await fetch(`/api/collab/token?documentId=${documentId}`);
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error ?? "无法获取协同令牌");
        }
        const { token, wsUrl } = await res.json();
        if (!active) return;

        const hocuspocus = new HocuspocusProvider({
          url: wsUrl,
          name: documentId,
          document: ydoc,
          token,
          onConnect: () => {
            if (!active) return;
            setConnectionState((s) => (s === "ready" ? "ready" : "syncing"));
          },
          onDisconnect: () => {
            if (!active) return;
            setConnectionState((s) => (s === "ready" ? "disconnected" : s));
          },
          onAuthenticationFailed: () => {
            if (!active) return;
            setConnectionState("error");
            setErrorMessage("协同认证失败");
            setSynced(false);
          },
          onSynced: () => {
            if (!active) return;
            setConnectionState("ready");
            setSynced(true);
          },
        });

        hocuspocus.setAwarenessField("user", {
          name: user.name,
          color: user.color,
        });

        providerRef.current = hocuspocus;
        setProvider(hocuspocus);
      } catch (err) {
        if (active) {
          setConnectionState("error");
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
      providerRef.current?.destroy();
      providerRef.current = null;
      setProvider(null);
      setSynced(false);
    };
  }, [documentId, ydoc, user.name, user.color, connectAttempt]);

  useEffect(() => {
    if (!provider) return;

    const flushOnLeave = () => {
      provider.disconnect();
    };

    window.addEventListener("beforeunload", flushOnLeave);
    return () => window.removeEventListener("beforeunload", flushOnLeave);
  }, [provider]);

  if (connectionState === "error") {
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
        <Button type="button" className="mt-6" variant="secondary" onClick={retry}>
          重试连接
        </Button>
      </div>
    );
  }

  if (!provider || !synced) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-muted-foreground">
        <div className="flex items-center gap-2">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>
            {connectionState === "connecting"
              ? "正在连接协同服务…"
              : "正在加载文档内容…"}
          </span>
        </div>
      </div>
    );
  }

  return (
    <EditorSurface
      ydoc={ydoc}
      provider={provider}
      user={user}
      readOnly={readOnly}
      disconnected={connectionState === "disconnected"}
      onRetry={retry}
      className={className}
    />
  );
}

function ToolbarButton({
  onClick,
  active,
  label,
  ariaLabel,
  className,
}: {
  onClick: () => void;
  active?: boolean;
  label: string;
  ariaLabel: string;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      aria-pressed={active}
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
