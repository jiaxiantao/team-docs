"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Button } from "@/components/ui/button";
import { useEditor, EditorContent } from "@tiptap/react";
import { HocuspocusProvider } from "@hocuspocus/provider";
import * as Y from "yjs";
import { Loader2, Users, WifiOff } from "lucide-react";
import { COLLAB_TOKEN_REFRESH_MS } from "@/lib/collab-token";
import { createEditorExtensions } from "@/components/editor/editor-extensions";
import { EditorToolbar } from "@/components/editor/editor-toolbar";
import {
  isImageFile,
  uploadDocumentFile,
} from "@/components/editor/upload-document-file";
import { fetchJson } from "@/lib/fetch-json";
import { cn } from "@/lib/utils";

type EditorUser = {
  id: string;
  name: string;
  color: string;
};

type CollaborativeEditorProps = {
  documentId: string;
  user?: EditorUser;
  shareToken?: string;
  readOnly?: boolean;
  className?: string;
};

type ConnectionState = "connecting" | "syncing" | "ready" | "disconnected" | "error";

type EditorSurfaceProps = {
  documentId: string;
  ydoc: Y.Doc;
  provider: HocuspocusProvider;
  user: EditorUser;
  readOnly?: boolean;
  disconnected?: boolean;
  onRetry?: () => void;
  className?: string;
};

function EditorSurface({
  documentId,
  ydoc,
  provider,
  user,
  readOnly = false,
  disconnected = false,
  onRetry,
  className,
}: EditorSurfaceProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [linkUrl, setLinkUrl] = useState("");
  const [showLinkInput, setShowLinkInput] = useState(false);

  const editor = useEditor(
    {
      immediatelyRender: false,
      editable: !readOnly,
      extensions: createEditorExtensions({ ydoc, provider, user, readOnly }),
      editorProps: {
        attributes: {
          class:
            "prose prose-neutral max-w-none min-h-[60vh] focus:outline-none px-1",
        },
      },
    },
    [ydoc, provider, user.name, user.color, readOnly],
  );

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

  const insertUploadedFile = useCallback(
    async (file: File) => {
      if (!editor) return;
      setUploading(true);
      setUploadError(null);
      try {
        const uploaded = await uploadDocumentFile(documentId, file);
        if (isImageFile(uploaded.mimeType)) {
          editor
            .chain()
            .focus()
            .setImage({ src: uploaded.url, alt: uploaded.filename })
            .run();
        } else {
          editor
            .chain()
            .focus()
            .setFileAttachment({
              href: uploaded.url,
              filename: uploaded.filename,
              size: uploaded.size,
              mimeType: uploaded.mimeType,
            })
            .run();
        }
      } catch (err) {
        setUploadError(err instanceof Error ? err.message : "文件上传失败");
      } finally {
        setUploading(false);
      }
    },
    [documentId, editor],
  );

  useEffect(() => {
    if (!editor || readOnly) return;

    const handlePaste = (event: ClipboardEvent) => {
      const items = event.clipboardData?.items;
      if (!items) return;

      for (const item of items) {
        if (item.kind !== "file") continue;
        const file = item.getAsFile();
        if (!file) continue;
        event.preventDefault();
        void insertUploadedFile(file);
        return;
      }
    };

    const handleDrop = (event: DragEvent) => {
      const file = event.dataTransfer?.files?.[0];
      if (!file) return;
      event.preventDefault();
      void insertUploadedFile(file);
    };

    const dom = editor.view.dom;
    dom.addEventListener("paste", handlePaste);
    dom.addEventListener("drop", handleDrop);
    return () => {
      dom.removeEventListener("paste", handlePaste);
      dom.removeEventListener("drop", handleDrop);
    };
  }, [editor, readOnly, insertUploadedFile]);

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
        {!readOnly && (
          <EditorToolbar
            editor={editor}
            uploading={uploading}
            uploadError={uploadError}
            showLinkInput={showLinkInput}
            linkUrl={linkUrl}
            onLinkUrlChange={setLinkUrl}
            onOpenLinkInput={openLinkInput}
            onApplyLink={applyLink}
            onCloseLinkInput={() => setShowLinkInput(false)}
            onInsertImage={insertUploadedFile}
            onInsertAttachment={insertUploadedFile}
          />
        )}

        <div
          className={cn(
            "flex items-center justify-end gap-2 border-t px-4 py-2 text-sm text-muted-foreground",
            readOnly && "border-t-0",
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
  user: userProp,
  shareToken,
  readOnly = false,
  className,
}: CollaborativeEditorProps) {
  const [provider, setProvider] = useState<HocuspocusProvider | null>(null);
  const [synced, setSynced] = useState(false);
  const [connectionState, setConnectionState] =
    useState<ConnectionState>("connecting");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [connectAttempt, setConnectAttempt] = useState(0);
  const [sessionUser, setSessionUser] = useState<EditorUser | null>(
    userProp ?? null,
  );

  const ydoc = useMemo(() => {
    void documentId;
    return new Y.Doc();
  }, [documentId]);

  const providerRef = useRef<HocuspocusProvider | null>(null);
  const tokenUrlRef = useRef<string>("");

  const retry = useCallback(() => {
    providerRef.current?.destroy();
    providerRef.current = null;
    setProvider(null);
    setSynced(false);
    setSessionUser(userProp ?? null);
    setConnectionState("connecting");
    setErrorMessage(null);
    setConnectAttempt((n) => n + 1);
  }, [userProp]);

  useEffect(() => {
    let active = true;

    const connect = async () => {
      try {
        const tokenUrl = shareToken
          ? `/api/share/${shareToken}/collab`
          : `/api/collab/token?documentId=${documentId}`;
        tokenUrlRef.current = tokenUrl;

        const data = await fetchJson<{
          token: string;
          wsUrl: string;
          user?: EditorUser;
        }>(tokenUrl);
        const { token, wsUrl } = data;
        const user = data.user ?? userProp;
        if (!user) throw new Error("缺少用户信息");
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

        setSessionUser(user);
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
  }, [documentId, ydoc, userProp, shareToken, connectAttempt]);

  useEffect(() => {
    if (!provider) return;
    const flushOnLeave = () => provider.disconnect();
    window.addEventListener("beforeunload", flushOnLeave);
    return () => window.removeEventListener("beforeunload", flushOnLeave);
  }, [provider]);

  useEffect(() => {
    if (!provider || connectionState !== "ready") return;

    const refreshToken = async () => {
      try {
        const data = await fetchJson<{ token: string }>(tokenUrlRef.current);
        const current = providerRef.current;
        if (!current || !data.token) return;
        current.configuration.token = data.token;
      } catch {
        /* 静默失败 */
      }
    };

    const timer = setInterval(refreshToken, COLLAB_TOKEN_REFRESH_MS);
    return () => clearInterval(timer);
  }, [provider, connectionState]);

  if (connectionState === "error") {
    return (
      <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-8 text-center text-destructive">
        <p>{errorMessage ?? "协同服务不可用"}</p>
        <p className="mt-2 text-sm text-muted-foreground">
          请确认已运行{" "}
          <code className="rounded bg-muted px-1.5 py-0.5">pnpm dev</code>{" "}
          （包含 collab-server）
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
        <Loader2 className="h-5 w-5 animate-spin" />
        <span>
          {connectionState === "connecting"
            ? "正在连接协同服务…"
            : "正在加载文档内容…"}
        </span>
      </div>
    );
  }

  if (!sessionUser) return null;

  return (
    <EditorSurface
      documentId={documentId}
      ydoc={ydoc}
      provider={provider}
      user={sessionUser}
      readOnly={readOnly}
      disconnected={connectionState === "disconnected"}
      onRetry={retry}
      className={className}
    />
  );
}
