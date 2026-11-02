"use client";

import type {
  PaginatedEditorHandle,
  SelectionStyles,
} from "./paginated-types";

type HandleGetter = () => PaginatedEditorHandle | null;
type UpdateListener = () => void;

const PENDING_MARK_COMMANDS = new Set([
  "bold",
  "italic",
  "underline",
  "strikeThrough",
  "superscript",
  "subscript",
  "foreColor",
  "hiliteColor",
  "fontName",
  "styleWithCSS",
]);

function rgbToHex(color: string): string {
  if (!color) return "#000000";
  if (color.startsWith("#")) return color;
  const match = color.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
  if (!match) return color;
  const r = Number(match[1]);
  const g = Number(match[2]);
  const b = Number(match[3]);
  return (
    "#" +
    [r, g, b]
      .map((n) => Math.max(0, Math.min(255, n)).toString(16).padStart(2, "0"))
      .join("")
  );
}

function selectionElement(): HTMLElement | null {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return null;
  const range = selection.getRangeAt(0);
  const node = range.startContainer;
  if (node.nodeType === Node.ELEMENT_NODE) {
    const el = node as HTMLElement;
    const child = el.childNodes[range.startOffset];
    if (child && child.nodeType === Node.ELEMENT_NODE) return child as HTMLElement;
    const prev = range.startOffset > 0 ? el.childNodes[range.startOffset - 1] : null;
    if (prev && prev.nodeType === Node.ELEMENT_NODE) return prev as HTMLElement;
    return el;
  }
  return (node.parentElement as HTMLElement | null);
}

function blockOf(el: HTMLElement | null): HTMLElement | null {
  if (!el) return null;
  return (el.closest("p,h1,h2,h3,h4,h5,h6,li,td,th,pre,blockquote,div") as HTMLElement | null) || el;
}

function hasPageBreakContent(html: string): boolean {
  return /data-page-break|page-break-after|page-break-before|zd-page-break/i.test(html);
}

function tableHtml(rows: number, cols: number, header: boolean): string {
  const body: string[] = [];
  for (let r = 0; r < rows; r += 1) {
    const cells: string[] = [];
    for (let c = 0; c < cols; c += 1) {
      const tag = header && r === 0 ? "th" : "td";
      cells.push(
        `<${tag} style="border:1px solid #c7c7c7;padding:5px 8px;min-width:40px;">&nbsp;</${tag}>`
      );
    }
    body.push(`<tr>${cells.join("")}</tr>`);
  }
  return `<table style="border-collapse:collapse;width:100%;margin:8px 0;"><tbody>${body.join("")}</tbody></table><p><br></p>`;
}

/**
 * A small structural stand-in for TipTap's Editor. The toolbar and menu bar were
 * written against that API, so this adapter keeps them working while the actual
 * surface is a set of paginated contentEditable articles.
 */
export class PageEditorAdapter {
  private getHandle: HandleGetter;
  private listeners = new Set<UpdateListener>();

  constructor(getHandle: HandleGetter) {
    this.getHandle = getHandle;
  }

  on(event: string, listener: UpdateListener): void {
    if (event === "update") this.listeners.add(listener);
  }

  off(event: string, listener: UpdateListener): void {
    if (event === "update") this.listeners.delete(listener);
  }

  emitUpdate(): void {
    this.listeners.forEach((listener) => listener());
  }

  chain(): PageEditorChain {
    return new PageEditorChain(this);
  }

  get commands(): {
    setContent: (html: string) => void;
    focus: (position?: "start" | "end") => void;
  } {
    return {
      setContent: (html: string) => this.getHandle()?.setHTML(html),
      focus: (position?: "start" | "end") => this.getHandle()?.focus(position),
    };
  }

  getHTML(): string {
    return this.getHandle()?.getHTML() || "";
  }

  doFocus(position?: "start" | "end"): void {
    const handle = this.getHandle();
    if (!handle) return;

    const selection = window.getSelection();
    const anchor = selection?.anchorNode;
    const anchorEl =
      anchor instanceof Element ? anchor : anchor?.parentElement ?? null;
    const article = anchorEl?.closest("article");

    if (selection && selection.rangeCount > 0 && article instanceof HTMLElement) {
      const range = selection.getRangeAt(0).cloneRange();
      article.focus({ preventScroll: true });
      selection.removeAllRanges();
      selection.addRange(range);
      return;
    }

    handle.focus(position);
  }

  run(command: string, value?: string): boolean {
    const handle = this.getHandle();
    if (!handle) return false;
    const ok = handle.exec(command, value);
    const selection = window.getSelection();
    const collapsed = !!selection && selection.rangeCount > 0 && selection.isCollapsed;
    if (!(collapsed && PENDING_MARK_COMMANDS.has(command))) {
      handle.requestReflow(true);
    }
    this.emitUpdate();
    return ok;
  }

  applyFontSize(size: string): void {
    const handle = this.getHandle();
    if (!handle) return;
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0 || selection.isCollapsed) {
      return;
    }

    const range = selection.getRangeAt(0);
    const root = range.commonAncestorContainer;
    const container = root.nodeType === Node.ELEMENT_NODE ? (root as Element) : root.parentElement;
    if (!container) return;

    const targets: Text[] = [];
    const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT);
    let node = walker.nextNode();
    while (node) {
      const text = node as Text;
      if (text.nodeValue && text.nodeValue.length > 0 && range.intersectsNode(text)) {
        targets.push(text);
      }
      node = walker.nextNode();
    }

    const spans: HTMLSpanElement[] = [];
    targets.forEach((text) => {
      const start = text === range.startContainer ? range.startOffset : 0;
      const end = text === range.endContainer ? range.endOffset : text.nodeValue?.length || 0;
      if (end <= start) return;
      const slice = document.createRange();
      slice.setStart(text, start);
      slice.setEnd(text, end);
      const span = document.createElement("span");
      span.style.fontSize = `${size}pt`;
      try {
        slice.surroundContents(span);
      } catch {
        return;
      }
      spans.push(span);
    });

    if (!spans.length) return;

    const next = document.createRange();
    next.setStartBefore(spans[0]);
    next.setEndAfter(spans[spans.length - 1]);
    selection.removeAllRanges();
    selection.addRange(next);

    handle.requestReflow(true);
    this.emitUpdate();
  }

  applyFontFamily(family: string): void {
    this.run("styleWithCSS", "true");
    this.run("fontName", family);
  }

  insertTable(rows: number, cols: number, withHeaderRow: boolean): void {
    const handle = this.getHandle();
    if (!handle) return;
    handle.focus();
    handle.exec("insertHTML", tableHtml(rows, cols, withHeaderRow));
    handle.requestReflow(true);
    this.emitUpdate();
  }

  insertHtml(html: string): void {
    const handle = this.getHandle();
    if (!handle) return;
    if (hasPageBreakContent(html)) {
      handle.insertPageBreak();
      this.emitUpdate();
      return;
    }
    handle.focus();
    handle.exec("insertHTML", html);
    handle.requestReflow(true);
    this.emitUpdate();
  }

  insertTaskList(): void {
    this.insertHtml(
      '<ul data-task-list="1" style="list-style:none;padding-left:0;"><li><label><input type="checkbox">&nbsp;</label><span>&nbsp;</span></li></ul><p><br></p>'
    );
  }

  isActive(name: string, attrs?: Record<string, unknown>): boolean {
    const handle = this.getHandle();
    if (!handle) return false;

    const state = (command: string): boolean => {
      try {
        return document.queryCommandState(command);
      } catch {
        return false;
      }
    };

    switch (name) {
      case "bold":
        return state("bold");
      case "italic":
        return state("italic");
      case "underline":
        return state("underline");
      case "strike":
        return state("strikeThrough");
      case "superscript":
        return state("superscript");
      case "subscript":
        return state("subscript");
      case "bulletList":
        return state("insertUnorderedList");
      case "orderedList":
        return state("insertOrderedList");
      case "code":
        return !!selectionElement()?.closest("code");
      case "taskList":
        return !!selectionElement()?.closest("ul[data-task-list]");
      case "highlight": {
        const el = selectionElement();
        if (!el) return false;
        const bg = window.getComputedStyle(el).backgroundColor;
        return !!bg && bg !== "transparent" && bg !== "rgba(0, 0, 0, 0)";
      }
      case "textAlign": {
        const block = blockOf(selectionElement());
        if (!block) return false;
        const align = window.getComputedStyle(block).textAlign;
        const wanted = String(attrs?.align || "left");
        if (wanted === "justify") return align === "justify";
        return align === wanted || (wanted === "left" && align === "start");
      }
      case "heading": {
        const level = attrs?.level;
        return !!level && !!selectionElement()?.closest(`h${level}`);
      }
      default:
        return false;
    }
  }

  getAttributes(name: string): Record<string, string> {
    if (name !== "textStyle") return {};
    const handle = this.getHandle();
    if (!handle) return {};
    const styles: SelectionStyles = handle.getSelectionStyles();
    return {
      ...(styles.fontFamily ? { fontFamily: styles.fontFamily } : {}),
      ...(styles.fontSize ? { fontSize: styles.fontSize } : {}),
      ...(styles.color ? { color: styles.color } : {}),
    };
  }

  can(): { undo: () => boolean; redo: () => boolean } {
    const enabled = (command: string): boolean => {
      try {
        return document.queryCommandEnabled(command);
      } catch {
        return false;
      }
    };
    return {
      undo: () => enabled("undo"),
      redo: () => enabled("redo"),
    };
  }

  setOptions(options: { editorProps?: { attributes?: Record<string, string> } }): void {
    const spellcheck = options?.editorProps?.attributes?.spellcheck;
    if (spellcheck != null) {
      this.getHandle()?.setSpellCheck(spellcheck === "true");
    }
  }

  getSelectionStyles(): SelectionStyles {
    return this.getHandle()?.getSelectionStyles() || {};
  }

  getHandlePublic(): PaginatedEditorHandle | null {
    return this.getHandle();
  }

  destroy(): void {
    this.listeners.clear();
  }
}

class PageEditorChain {
  private adapter: PageEditorAdapter;
  private ops: Array<() => void> = [];

  constructor(adapter: PageEditorAdapter) {
    this.adapter = adapter;
  }

  private push(fn: () => void): this {
    this.ops.push(fn);
    return this;
  }

  focus(position?: "start" | "end"): this {
    return this.push(() => this.adapter.doFocus(position));
  }

  undo(): this {
    return this.push(() => this.adapter.run("undo"));
  }

  redo(): this {
    return this.push(() => this.adapter.run("redo"));
  }

  selectAll(): this {
    return this.push(() => this.adapter.getHandlePublic()?.selectAll());
  }

  insertContent(html: string): this {
    return this.push(() => this.adapter.insertHtml(html));
  }

  setImage(attrs: { src: string }): this {
    return this.push(() => this.adapter.run("insertImage", attrs.src));
  }

  insertTable(attrs: { rows: number; cols?: number; withHeaderRow?: boolean }): this {
    return this.push(() =>
      this.adapter.insertTable(attrs.rows, attrs.cols ?? 3, !!attrs.withHeaderRow)
    );
  }

  setHorizontalRule(): this {
    return this.push(() => this.adapter.run("insertHorizontalRule"));
  }

  setLink(attrs: { href: string }): this {
    return this.push(() => this.adapter.run("createLink", attrs.href));
  }

  toggleBold(): this {
    return this.push(() => this.adapter.run("bold"));
  }

  toggleItalic(): this {
    return this.push(() => this.adapter.run("italic"));
  }

  toggleUnderline(): this {
    return this.push(() => this.adapter.run("underline"));
  }

  toggleStrike(): this {
    return this.push(() => this.adapter.run("strikeThrough"));
  }

  toggleSuperscript(): this {
    return this.push(() => this.adapter.run("superscript"));
  }

  toggleSubscript(): this {
    return this.push(() => this.adapter.run("subscript"));
  }

  toggleHighlight(): this {
    return this.push(() =>
      this.adapter.run("hiliteColor", this.adapter.isActive("highlight") ? "transparent" : "#ffff00")
    );
  }

  toggleBulletList(): this {
    return this.push(() => this.adapter.run("insertUnorderedList"));
  }

  toggleOrderedList(): this {
    return this.push(() => this.adapter.run("insertOrderedList"));
  }

  toggleTaskList(): this {
    return this.push(() => this.adapter.insertTaskList());
  }

  toggleCode(): this {
    return this.push(() => this.adapter.run("fontName", "Courier New"));
  }

  clearNodes(): this {
    return this.push(() => this.adapter.run("removeFormat"));
  }

  unsetAllMarks(): this {
    return this.push(() => this.adapter.run("removeFormat"));
  }

  toggleHeading(attrs: { level: number }): this {
    return this.push(() => this.adapter.run("formatBlock", `h${attrs.level}`));
  }

  setTextAlign(align: "left" | "center" | "right" | "justify"): this {
    const map = {
      left: "justifyLeft",
      center: "justifyCenter",
      right: "justifyRight",
      justify: "justifyFull",
    } as const;
    return this.push(() => this.adapter.run(map[align]));
  }

  setFontFamily(family: string): this {
    return this.push(() => this.adapter.applyFontFamily(family));
  }

  unsetFontFamily(): this {
    return this.push(() => this.adapter.applyFontFamily("Calibri"));
  }

  setFontSize(size: string): this {
    return this.push(() => this.adapter.applyFontSize(size));
  }

  setColor(color: string): this {
    return this.push(() => {
      this.adapter.run("styleWithCSS", "true");
      this.adapter.run("foreColor", color);
    });
  }

  indent(): this {
    return this.push(() => this.adapter.run("indent"));
  }

  outdent(): this {
    return this.push(() => this.adapter.run("outdent"));
  }

  run(): boolean {
    this.ops.forEach((op) => op());
    return true;
  }
}

export function colorToHex(color: string): string {
  return rgbToHex(color);
}
