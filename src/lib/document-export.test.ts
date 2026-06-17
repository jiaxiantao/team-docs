import { describe, expect, it } from "vitest";
import * as Y from "yjs";
import {
  yjsStateToHtml,
  yjsStateToProsemirrorJSON,
} from "@/lib/document-export";

describe("document-export", () => {
  it("converts empty yjs state to prosemirror doc", () => {
    const ydoc = new Y.Doc();
    const state = Y.encodeStateAsUpdate(ydoc);
    const json = yjsStateToProsemirrorJSON(state);
    expect(json.type).toBe("doc");
    expect(Array.isArray(json.content)).toBe(true);
  });

  it("generates html from empty yjs state", () => {
    const ydoc = new Y.Doc();
    const state = Y.encodeStateAsUpdate(ydoc);
    const html = yjsStateToHtml(state);
    expect(typeof html).toBe("string");
  });
});
