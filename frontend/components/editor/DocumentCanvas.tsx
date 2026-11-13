"use client";

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
} from "react";
import type {
  PageInfo,
  PageMargins,
  PaginatedEditorHandle,
  SelectionStyles,
} from "@/lib/editor/paginated-types";

interface DocumentCanvasProps {
  initialHtml?: string;
  docxBuffer?: ArrayBuffer | null;
  loadKey?: number;
  zoom: number;
  showPageBreaks: boolean;
  spellCheck: boolean;
  onPagesChange?: (pages: PageInfo[]) => void;
  onActivePageChange?: (index: number) => void;
  onContentChange?: (html: string) => void;
}

interface BaseStyle {
  fontFamily: string;
  fontSize: string;
  lineHeight: string;
  color: string;
  textAlign: string;
  fontWeight: string;
  fontStyle: string;
}

interface PageChrome {
  header: HTMLElement | null;
  footer: HTMLElement | null;
  notes: HTMLElement[];
  headerHeight: number;
  footerHeight: number;
}

interface PageGeometry {
  width: number;
  height: number;
  margins: PageMargins;
  contentHeight: number;
  chrome: PageChrome;
  baseStyle: BaseStyle;
}

interface PageNode {
  section: HTMLElement;
  article: HTMLElement;
  geom: PageGeometry;
}

const A4_WIDTH = 794;
const A4_HEIGHT = 1123;
const DEFAULT_MARGIN = 96;
const PAGE_GAP = 24;
const THUMB_WIDTH = 110;
const MIN_CONTENT_HEIGHT = 120;
const SPLITTABLE_TAGS = new Set([
  "P",
  "DIV",
  "H1",
  "H2",
  "H3",
  "H4",
  "H5",
  "H6",
  "BLOCKQUOTE",
  "PRE",
]);

function firstNumber(value: string): number {
  const n = parseFloat(value);
  return Number.isFinite(n) ? n : 0;
}

function rgbToHex(color: string): string {
  if (!color) return "#000000";
  if (color.startsWith("#")) return color;
  const match = color.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
  if (!match) return color;
  return (
    "#" +
    [match[1], match[2], match[3]]
      .map((n) => Math.max(0, Math.min(255, Number(n))).toString(16).padStart(2, "0"))
      .join("")
  );
}

function defaultBaseStyle(): BaseStyle {
  return {
    fontFamily: "'Calibri','Segoe UI',Arial,sans-serif",
    fontSize: "11pt",
    lineHeight: "1.7",
    color: "#000000",
    textAlign: "left",
    fontWeight: "400",
    fontStyle: "normal",
  };
}

function emptyChrome(): PageChrome {
  return { header: null, footer: null, notes: [], headerHeight: 0, footerHeight: 0 };
}

function makeGeometry(
  width: number,
  height: number,
  margins: PageMargins,
  chrome: PageChrome,
  baseStyle: BaseStyle
): PageGeometry {
  return {
    width,
    height,
    margins,
    chrome,
    baseStyle,
    contentHeight: Math.max(
      MIN_CONTENT_HEIGHT,
      Math.round(height - margins.top - margins.bottom - chrome.headerHeight - chrome.footerHeight - 2)
    ),
  };
}

function hasVisibleContent(article: HTMLElement): boolean {
  if ((article.textContent || "").trim()) return true;
  return !!article.querySelector("img, table, hr, svg, video, canvas, iframe");
}

function isEmptyBlock(el: HTMLElement): boolean {
  if ((el.textContent || "").replace(/\u200b/g, "").trim()) return false;
  return !el.querySelector("img, table, hr, svg, video, canvas, iframe");
}

function defaultGeometry(): PageGeometry {
  return makeGeometry(
    A4_WIDTH,
    A4_HEIGHT,
    { top: DEFAULT_MARGIN, right: DEFAULT_MARGIN, bottom: DEFAULT_MARGIN, left: DEFAULT_MARGIN },
    emptyChrome(),
    defaultBaseStyle()
  );
}

function prepareChrome(el: HTMLElement): HTMLElement {
  const clone = el.cloneNode(true) as HTMLElement;
  clone.querySelectorAll("[id]").forEach((node) => node.removeAttribute("id"));
  clone.querySelectorAll("[contenteditable]").forEach((node) => node.removeAttribute("contenteditable"));
  clone.querySelectorAll("[data-zd-chrome-part]").forEach((node) => node.removeAttribute("data-zd-chrome-part"));
  clone.style.marginTop = "0";
  clone.style.marginBottom = "0";
  clone.style.minHeight = "0";
  clone.style.width = "100%";
  clone.style.flexShrink = "0";
  return clone;
}

function prepareNote(el: HTMLElement): HTMLElement {
  const clone = el.cloneNode(true) as HTMLElement;
  clone.querySelectorAll("[id]").forEach((node) => node.removeAttribute("id"));
  clone.querySelectorAll("[contenteditable]").forEach((node) => node.removeAttribute("contenteditable"));
  clone.style.flexShrink = "0";
  return clone;
}

function measureChrome(width: number, margins: PageMargins, chrome: PageChrome): { headerHeight: number; footerHeight: number } {
  if (!chrome.header && !chrome.footer) return { headerHeight: 0, footerHeight: 0 };
  const probe = document.createElement("section");
  probe.className = "docx";
  probe.style.cssText = [
    "position:fixed",
    "left:-10000px",
    "top:0",
    "visibility:hidden",
    `width:${width}px`,
    "box-sizing:border-box",
    `padding:${margins.top}px ${margins.right}px ${margins.bottom}px ${margins.left}px`,
    "display:flex",
    "flex-direction:column",
  ].join(";");
  if (chrome.header) probe.appendChild(chrome.header.cloneNode(true));
  if (chrome.footer) probe.appendChild(chrome.footer.cloneNode(true));
  document.body.appendChild(probe);
  const first = probe.firstElementChild as HTMLElement | null;
  const last = probe.lastElementChild as HTMLElement | null;
  const headerHeight = chrome.header && first ? first.offsetHeight : 0;
  const footerHeight = chrome.footer && last ? last.offsetHeight : 0;
  probe.remove();
  return { headerHeight, footerHeight };
}

function collectTextNodes(root: HTMLElement): Text[] {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const nodes: Text[] = [];
  let current = walker.nextNode();
  while (current) {
    const text = current as Text;
    if (text.nodeValue && text.nodeValue.length > 0) nodes.push(text);
    current = walker.nextNode();
  }
  return nodes;
}

function elementOf(node: Node | null): HTMLElement | null {
  if (!node) return null;
  return node.nodeType === Node.ELEMENT_NODE ? (node as HTMLElement) : node.parentElement;
}

function blockFromNode(node: Node | null): HTMLElement | null {
  const el = elementOf(node);
  if (!el) return null;
  const block = el.closest("p,div,h1,h2,h3,h4,h5,h6,li,td,th,pre,blockquote");
  if (!(block instanceof HTMLElement)) return null;
  return block.closest("article") ? block : null;
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
  return node.parentElement;
}

const INLINE_STYLE_PROPS = [
  "font-family",
  "font-weight",
  "font-style",
  "text-decoration-line",
  "color",
  "background-color",
  "text-align",
  "vertical-align",
  "margin-top",
  "margin-bottom",
  "margin-left",
  "margin-right",
  "padding-left",
  "text-indent",
  "border-top",
  "border-bottom",
  "border-left",
  "border-right",
];

function inlineComputedStyles(source: HTMLElement, clone: HTMLElement): void {
  const srcEls: HTMLElement[] = [source, ...Array.from(source.querySelectorAll<HTMLElement>("*"))];
  const dstEls: HTMLElement[] = [clone, ...Array.from(clone.querySelectorAll<HTMLElement>("*"))];
  const count = Math.min(srcEls.length, dstEls.length);
  for (let i = 0; i < count; i += 1) {
    const src = srcEls[i];
    const dst = dstEls[i];
    const cs = window.getComputedStyle(src);
    const size = parseFloat(cs.fontSize);
    if (Number.isFinite(size) && size > 0) {
      dst.style.setProperty("font-size", `${Math.round(size * 0.75 * 10) / 10}pt`);
    }
    if (cs.fontFamily) dst.style.setProperty("font-family", cs.fontFamily);
    if (cs.lineHeight && cs.lineHeight !== "normal") {
      dst.style.setProperty("line-height", cs.lineHeight);
    }
    for (const prop of INLINE_STYLE_PROPS) {
      const value = cs.getPropertyValue(prop);
      if (!value) continue;
      if (value === "none" || value === "normal" || value === "rgba(0, 0, 0, 0)") continue;
      if (value === "0px") continue;
      if (prop.startsWith("border") && value.startsWith("0px")) continue;
      dst.style.setProperty(prop, value);
    }
  }
}

function sanitizeExportNode(root: HTMLElement): void {
  root.querySelectorAll("[data-zd-caret]").forEach((node) => node.remove());
  root.querySelectorAll("*").forEach((node) => {
    if (!(node instanceof HTMLElement)) return;
    node.removeAttribute("contenteditable");
    node.removeAttribute("spellcheck");
    for (const attr of Array.from(node.attributes)) {
      if (attr.name.startsWith("data-zd")) node.removeAttribute(attr.name);
    }
  });
  root.removeAttribute("contenteditable");
  root.removeAttribute("spellcheck");
  for (const attr of Array.from(root.attributes)) {
    if (attr.name.startsWith("data-zd")) root.removeAttribute(attr.name);
  }
}

const PaginatedDocumentCanvas = forwardRef<PaginatedEditorHandle, DocumentCanvasProps>(
  function PaginatedDocumentCanvas(
    {
      initialHtml = "",
      docxBuffer = null,
      loadKey = 0,
      zoom,
      showPageBreaks,
      spellCheck,
      onPagesChange,
      onActivePageChange,
      onContentChange,
    },
    ref
  ) {
    const canvasRef = useRef<HTMLDivElement>(null);
    const hostRef = useRef<HTMLDivElement>(null);
    const styleHostRef = useRef<HTMLDivElement>(null);
    const zoomLayerRef = useRef<HTMLDivElement>(null);
    const wrapperRef = useRef<HTMLDivElement | null>(null);
    const pagesRef = useRef<PageNode[]>([]);
    const geometryRef = useRef<PageGeometry[]>([defaultGeometry()]);
    const blockIdRef = useRef(1);
    const reflowTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const composingRef = useRef(false);
    const lastArticleRef = useRef<HTMLElement | null>(null);
    const observerRef = useRef<IntersectionObserver | null>(null);
    const loadTokenRef = useRef(0);

    const propsRef = useRef({ showPageBreaks, spellCheck, zoom });
    propsRef.current = { showPageBreaks, spellCheck, zoom };

    const callbacksRef = useRef({ onPagesChange, onActivePageChange, onContentChange });
    callbacksRef.current = { onPagesChange, onActivePageChange, onContentChange };

    function nextBlockId(): string {
      const id = `b${blockIdRef.current}`;
      blockIdRef.current += 1;
      return id;
    }

    function getActiveArticle(): HTMLElement | null {
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const el = elementOf(selection.getRangeAt(0).startContainer);
        const article = el?.closest("article");
        if (article instanceof HTMLElement) {
          lastArticleRef.current = article;
          return article;
        }
      }
      if (lastArticleRef.current && lastArticleRef.current.isConnected) return lastArticleRef.current;
      return pagesRef.current[0]?.article || null;
    }

    function createWrapper(): HTMLElement {
      const host = hostRef.current;
      const wrapper = document.createElement("div");
      wrapper.className = "docx-wrapper zd-docx-wrapper";
      wrapper.style.display = "flex";
      wrapper.style.flexDirection = "column";
      wrapper.style.alignItems = "center";
      wrapper.style.background = "transparent";
      wrapper.style.padding = "0";
      wrapper.style.width = "100%";
      if (host) {
        host.innerHTML = "";
        host.appendChild(wrapper);
      }
      wrapperRef.current = wrapper;
      return wrapper;
    }

    function startPage(chromeIndex: number): PageNode {
      const wrapper = wrapperRef.current;
      const geom =
        geometryRef.current[chromeIndex] || geometryRef.current[0] || defaultGeometry();
      const { width, height, margins, contentHeight, chrome, baseStyle } = geom;

      const section = document.createElement("section");
      section.className = "docx zd-page";
      section.setAttribute("data-zd-chrome", String(chromeIndex));
      section.style.width = `${width}px`;
      section.style.height = `${height}px`;
      section.style.minHeight = `${height}px`;
      section.style.padding = `${margins.top}px ${margins.right}px ${margins.bottom}px ${margins.left}px`;
      section.style.margin = `0 auto ${propsRef.current.showPageBreaks ? PAGE_GAP : 0}px`;
      section.style.background = "#ffffff";
      section.style.boxSizing = "border-box";
      section.style.position = "relative";
      section.style.overflow = "hidden";
      section.style.display = "flex";
      section.style.flexDirection = "column";
      section.style.flexShrink = "0";
      section.style.boxShadow = propsRef.current.showPageBreaks
        ? "0 2px 8px rgba(32,43,54,0.14)"
        : "none";

      if (chrome.header) {
        const header = chrome.header.cloneNode(true) as HTMLElement;
        header.setAttribute("data-zd-chrome-part", "header");
        section.appendChild(header);
      }

      const article = document.createElement("article");
      article.className = "zd-page-content";
      article.contentEditable = "true";
      article.spellcheck = propsRef.current.spellCheck;
      article.style.flex = "0 0 auto";
      article.style.height = `${contentHeight}px`;
      article.style.minHeight = `${contentHeight}px`;
      article.style.maxHeight = `${contentHeight}px`;
      article.style.overflow = "hidden";
      article.style.outline = "none";
      article.style.margin = "0";
      article.style.padding = "0";
      article.style.fontFamily = baseStyle.fontFamily;
      article.style.fontSize = baseStyle.fontSize;
      article.style.lineHeight = baseStyle.lineHeight;
      article.style.color = baseStyle.color;
      article.style.fontWeight = baseStyle.fontWeight;
      article.style.fontStyle = baseStyle.fontStyle;
      if (baseStyle.textAlign && baseStyle.textAlign !== "start") {
        article.style.textAlign = baseStyle.textAlign;
      }
      article.style.caretColor = "var(--primary-teal)";
      section.appendChild(article);

      chrome.notes.forEach((note) => section.appendChild(note.cloneNode(true)));

      if (chrome.footer) {
        const footer = chrome.footer.cloneNode(true) as HTMLElement;
        footer.setAttribute("data-zd-chrome-part", "footer");
        section.appendChild(footer);
      }

      wrapper?.appendChild(section);
      const page: PageNode = { section, article, geom };
      pagesRef.current.push(page);
      return page;
    }

    function overflowing(article: HTMLElement): boolean {
      return article.scrollHeight > article.clientHeight + 2;
    }

    function splittable(block: HTMLElement): boolean {
      if (!SPLITTABLE_TAGS.has(block.tagName)) return false;
      if (block.querySelector("table,img,video,iframe,object")) return false;
      return (block.textContent || "").trim().length > 0;
    }

    function splitBlockAtLimit(block: HTMLElement, article: HTMLElement): HTMLElement | null {
      const nodes = collectTextNodes(block);
      if (!nodes.length) return null;

      const lengths: number[] = [];
      let total = 0;
      for (const text of nodes) {
        const len = text.nodeValue?.length || 0;
        lengths.push(len);
        total += len;
      }

      const locate = (position: number): { node: Text; offset: number } => {
        let rest = position;
        for (let i = 0; i < nodes.length; i += 1) {
          if (rest <= lengths[i]) return { node: nodes[i], offset: rest };
          rest -= lengths[i];
        }
        const lastNode = nodes[nodes.length - 1];
        return { node: lastNode, offset: lastNode.nodeValue?.length || 0 };
      };

      const limit = article.getBoundingClientRect().top + article.clientHeight - 2;

      const bottomAt = (position: number): number => {
        const { node, offset } = locate(position);
        const range = document.createRange();
        try {
          range.setStart(nodes[0], 0);
          range.setEnd(node, offset);
        } catch {
          return Number.POSITIVE_INFINITY;
        }
        const rects = range.getClientRects();
        if (!rects.length) {
          const rect = range.getBoundingClientRect();
          return rect.bottom || 0;
        }
        return rects[rects.length - 1].bottom;
      };

      if (bottomAt(total) <= limit) return null;

      let low = 0;
      let high = total;
      let best = 0;
      while (low <= high) {
        const mid = (low + high) >> 1;
        if (bottomAt(mid) <= limit) {
          best = mid;
          low = mid + 1;
        } else {
          high = mid - 1;
        }
      }
      if (best <= 0 || best >= total) return null;

      const splitPoint = locate(best);
      const range = document.createRange();
      try {
        range.setStart(nodes[0], 0);
        range.setEnd(splitPoint.node, splitPoint.offset);
      } catch {
        return null;
      }

      const tail = block.cloneNode(false) as HTMLElement;
      tail.removeAttribute("data-zd-hard-start");
      tail.removeAttribute("contenteditable");
      tail.removeAttribute("spellcheck");
      tail.setAttribute("data-zd-block-id", nextBlockId());
      tail.appendChild(range.extractContents());

      const hasVisibleContent =
        (tail.textContent || "").trim().length > 0 || !!tail.querySelector("br,img,input,hr");
      if (!hasVisibleContent) return null;

      block.parentNode?.insertBefore(tail, block.nextSibling);
      return tail;
    }

    function createCaretMarker(): HTMLElement {
      const marker = document.createElement("span");
      marker.setAttribute("data-zd-caret", "1");
      marker.style.cssText =
        "display:inline-block;width:0;height:0;overflow:hidden;vertical-align:baseline;pointer-events:none;";
      return marker;
    }

    function insertSelectionMarkers(): { start: HTMLElement; end: HTMLElement } | null {
      const selection = window.getSelection();
      const article = getActiveArticle();
      if (!selection || selection.rangeCount === 0 || !article) return null;
      const range = selection.getRangeAt(0);
      const startEl = elementOf(range.startContainer);
      const endEl = elementOf(range.endContainer);
      if (!startEl?.closest("article") || !endEl?.closest("article")) return null;

      const place = (marker: HTMLElement, atStart: boolean): boolean => {
        const probe = range.cloneRange();
        const container = atStart ? probe.startContainer : probe.endContainer;
        if (container.nodeType === Node.ELEMENT_NODE) {
          const el = container as HTMLElement;
          const owner = el.closest("article") || article;
          if (el === owner) {
            const atEdge = atStart ? probe.startOffset === 0 : probe.endOffset === 0;
            const block = atEdge ? owner.firstElementChild : owner.lastElementChild;
            if (block) {
              const inner = document.createRange();
              inner.selectNodeContents(block);
              inner.collapse(atStart);
              inner.insertNode(marker);
              return true;
            }
          }
        }
        probe.collapse(atStart);
        probe.insertNode(marker);
        return true;
      };

      if (range.collapsed) {
        const caret = createCaretMarker();
        place(caret, true);
        return { start: caret, end: caret };
      }

      const startMarker = createCaretMarker();
      const endMarker = createCaretMarker();
      place(endMarker, false);
      place(startMarker, true);
      return { start: startMarker, end: endMarker };
    }

    function restoreSelection(
      markers: { start: HTMLElement; end: HTMLElement } | null
    ): void {
      if (!markers) return;
      const { start, end } = markers;
      if (!start.isConnected || !end.isConnected) return;
      const article = elementOf(start)?.closest("article");
      if (!(article instanceof HTMLElement)) return;
      const range = document.createRange();
      if (start === end) {
        range.setStartAfter(start);
        range.collapse(true);
      } else {
        range.setStartAfter(start);
        range.setEndBefore(end);
      }
      start.remove();
      if (end !== start) end.remove();
      article.focus({ preventScroll: true });
      lastArticleRef.current = article;
      const selection = window.getSelection();
      if (selection) {
        selection.removeAllRanges();
        selection.addRange(range);
      }
    }

    function attachObserver(): void {
      if (observerRef.current) observerRef.current.disconnect();
      const canvas = canvasRef.current;
      if (!canvas || typeof IntersectionObserver === "undefined") return;
      const observer = new IntersectionObserver(
        (entries) => {
          let best: { index: number; ratio: number } | null = null;
          for (const entry of entries) {
            if (!entry.isIntersecting) continue;
            const target = entry.target as HTMLElement;
            const index = Number(target.getAttribute("data-zd-page-index") || "0");
            if (!best || entry.intersectionRatio > best.ratio) {
              best = { index, ratio: entry.intersectionRatio };
            }
          }
          if (best) callbacksRef.current.onActivePageChange?.(best.index);
        },
        {
          root: canvas,
          threshold: [0, 0.1, 0.25, 0.5, 0.75, 1],
          rootMargin: "0px 0px -55% 0px",
        }
      );
      pagesRef.current.forEach((page) => observer.observe(page.section));
      observerRef.current = observer;
    }

    function buildPageInfos(): PageInfo[] {
      return pagesRef.current.map((page, index) => {
        const { width, height } = page.geom;
        const scale = THUMB_WIDTH / width;
        const thumbnailHeight = Math.max(1, Math.round(height * scale));
        const clone = page.section.cloneNode(true) as HTMLElement;
        clone.querySelectorAll("[data-zd-caret]").forEach((node) => node.remove());
        clone.querySelectorAll("[contenteditable]").forEach((node) => node.removeAttribute("contenteditable"));
        clone.querySelectorAll("[spellcheck]").forEach((node) => node.removeAttribute("spellcheck"));
        clone.querySelectorAll("[id]").forEach((node) => node.removeAttribute("id"));
        clone.style.transform = `scale(${scale})`;
        clone.style.transformOrigin = "top left";
        clone.style.position = "absolute";
        clone.style.top = "0";
        clone.style.left = "0";
        clone.style.margin = "0";
        clone.style.boxShadow = "none";
        clone.style.pointerEvents = "none";
        return {
          id: `page-${index}`,
          index,
          width,
          height,
          thumbnailWidth: THUMB_WIDTH,
          thumbnailHeight,
          thumbnailHtml: `<div class="zd-thumb-viewport" style="position:relative;width:${THUMB_WIDTH}px;height:${thumbnailHeight}px;overflow:hidden;background:#ffffff;">${clone.outerHTML}</div>`,
        };
      });
    }

    function serializeDocument(inlineStyles: boolean): string {
      const pages = pagesRef.current;
      if (!pages.length) return "";
      return pages
        .map((page) => {
          const clone = page.article.cloneNode(true) as HTMLElement;
          if (inlineStyles) inlineComputedStyles(page.article, clone);
          sanitizeExportNode(clone);
          const { width, height, margins } = page.geom;
          const attrs = [
            'class="zd-export-page"',
            `data-page-width="${width}"`,
            `data-page-height="${height}"`,
            `data-margin-top="${margins.top}"`,
            `data-margin-right="${margins.right}"`,
            `data-margin-bottom="${margins.bottom}"`,
            `data-margin-left="${margins.left}"`,
          ].join(" ");
          return `<section ${attrs}>${clone.innerHTML}</section>`;
        })
        .join('<div data-page-break="true"></div>');
    }

    function rebuild(preserveCaret: boolean): void {
      const wrapper = wrapperRef.current;
      if (!wrapper) return;

      const layer = zoomLayerRef.current;
      if (layer) layer.style.setProperty("zoom", "1");

      const markers = preserveCaret ? insertSelectionMarkers() : null;

      const blocksInOrder: HTMLElement[] = [];
      pagesRef.current.forEach((page) => {
        Array.from(page.article.children).forEach((child) => {
          if (child instanceof HTMLElement && !child.hasAttribute("data-zd-caret")) {
            blocksInOrder.push(child);
          }
        });
      });

      wrapper.innerHTML = "";
      pagesRef.current = [];

      let currentChrome = 0;
      let current = startPage(currentChrome);
      let usedContent = false;

      const chromeOf = (block: HTMLElement): number => {
        const attr = block.getAttribute("data-zd-chrome");
        const value = attr == null ? currentChrome : Number(attr);
        if (attr == null) block.setAttribute("data-zd-chrome", String(currentChrome));
        return Number.isFinite(value) ? value : 0;
      };

      const newPage = (chromeIndex: number) => {
        currentChrome = chromeIndex;
        current = startPage(chromeIndex);
        usedContent = false;
      };

      const flow = (startBlock: HTMLElement) => {
        let block = startBlock;
        const chromeIndex = chromeOf(block);
        current.article.appendChild(block);
        usedContent = true;
        let guard = 0;
        while (overflowing(current.article) && guard < 200) {
          guard += 1;
          const onlyBlock = current.article.children.length === 1;

          if (splittable(block)) {
            const tail = splitBlockAtLimit(block, current.article);
            if (tail) {
              const tailChrome = Number(tail.getAttribute("data-zd-chrome") ?? chromeIndex) || 0;
              newPage(tailChrome);
              block = tail;
              current.article.appendChild(block);
              usedContent = true;
              continue;
            }
          }

          if (!onlyBlock) {
            current.article.removeChild(block);
            newPage(chromeIndex);
            current.article.appendChild(block);
            usedContent = true;
            continue;
          }

          break;
        }
      };

      if (blocksInOrder.length) {
        blocksInOrder.forEach((block) => {
          if (block.getAttribute("data-zd-hard-start") === "1" && usedContent) {
            newPage(chromeOf(block));
          }
          flow(block);
        });
      }

      while (pagesRef.current.length > 1) {
        const last = pagesRef.current[pagesRef.current.length - 1];
        if (!hasVisibleContent(last.article)) {
          last.section.remove();
          pagesRef.current.pop();
        } else {
          break;
        }
      }

      pagesRef.current.forEach((page, index) => {
        page.section.setAttribute("data-zd-page-index", String(index));
      });

      restoreSelection(markers);
      attachObserver();

      if (layer) {
        layer.style.setProperty("zoom", String(propsRef.current.zoom / 100));
      }

      callbacksRef.current.onPagesChange?.(buildPageInfos());
      callbacksRef.current.onContentChange?.(serializeDocument(false));
    }

    function scheduleReflow(preserveCaret: boolean, delay: number): void {
      if (reflowTimerRef.current) clearTimeout(reflowTimerRef.current);
      reflowTimerRef.current = setTimeout(() => {
        reflowTimerRef.current = null;
        rebuild(preserveCaret);
      }, delay);
    }

    function loadHtml(html: string): void {
      const host = hostRef.current;
      if (!host) return;
      if (reflowTimerRef.current) {
        clearTimeout(reflowTimerRef.current);
        reflowTimerRef.current = null;
      }
      loadTokenRef.current += 1;
      host.innerHTML = "";
      wrapperRef.current = null;
      pagesRef.current = [];
      blockIdRef.current = 1;
      createWrapper();

      const temp = document.createElement("div");
      temp.innerHTML = html || "";
      const exportPages = Array.from(temp.children).filter(
        (el): el is HTMLElement => el instanceof HTMLElement && el.matches("section.zd-export-page")
      );

      const blocks: HTMLElement[] = [];

      if (exportPages.length) {
        const first = exportPages[0];
        const width = firstNumber(first.getAttribute("data-page-width") || "") || A4_WIDTH;
        const height = firstNumber(first.getAttribute("data-page-height") || "") || A4_HEIGHT;
        const margin = (name: string) => {
          const value = firstNumber(first.getAttribute(`data-margin-${name}`) || "");
          return value || DEFAULT_MARGIN;
        };
        geometryRef.current = [
          makeGeometry(
            width,
            height,
            { top: margin("top"), right: margin("right"), bottom: margin("bottom"), left: margin("left") },
            emptyChrome(),
            defaultBaseStyle()
          ),
        ];
        exportPages.forEach((section, pageIndex) => {
          let firstBlockInPage = true;
          const children = Array.from(section.children).filter(
            (el): el is HTMLElement =>
              el instanceof HTMLElement && !el.matches("[data-page-break],.zd-page-break")
          );
          if (!children.length) {
            const p = document.createElement("p");
            p.innerHTML = "<br>";
            if (pageIndex > 0) p.setAttribute("data-zd-hard-start", "1");
            p.setAttribute("data-zd-chrome", "0");
            p.setAttribute("data-zd-block-id", nextBlockId());
            blocks.push(p);
            return;
          }
          children.forEach((child) => {
            if (pageIndex > 0 && firstBlockInPage) child.setAttribute("data-zd-hard-start", "1");
            firstBlockInPage = false;
            if (!child.hasAttribute("data-zd-chrome")) child.setAttribute("data-zd-chrome", "0");
            child.setAttribute("data-zd-block-id", nextBlockId());
            blocks.push(child);
          });
        });
      } else {
        geometryRef.current = [defaultGeometry()];
        const children = Array.from(temp.children).filter(
          (el): el is HTMLElement => el instanceof HTMLElement
        );
        if (!children.length && (html || "").trim()) {
          const p = document.createElement("p");
          p.textContent = html.replace(/<[^>]*>/g, "");
          children.push(p);
        }
        children.forEach((child) => {
          child.setAttribute("data-zd-chrome", "0");
          child.setAttribute("data-zd-block-id", nextBlockId());
          blocks.push(child);
        });
      }

      const holder = startPage(0);
      blocks.forEach((block) => holder.article.appendChild(block));
      rebuild(false);
    }

    async function loadDocx(buffer: ArrayBuffer, token: number): Promise<void> {
      const host = hostRef.current;
      const styleHost = styleHostRef.current;
      if (!host || !styleHost) return;
      if (reflowTimerRef.current) {
        clearTimeout(reflowTimerRef.current);
        reflowTimerRef.current = null;
      }

      host.innerHTML = "";
      styleHost.innerHTML = "";
      wrapperRef.current = null;
      pagesRef.current = [];
      blockIdRef.current = 1;

      try {
        const docxPreview = await import("docx-preview");
        await docxPreview.renderAsync(buffer, host, styleHost, {
          className: "docx",
          inWrapper: true,
          breakPages: true,
          ignoreLastRenderedPageBreak: false,
          renderHeaders: true,
          renderFooters: true,
          renderFootnotes: true,
          experimental: true,
        });
        if (token !== loadTokenRef.current) return;
      } catch (error) {
        console.error("[editor] docx page rendering failed:", error);
        if (token !== loadTokenRef.current) return;
        loadHtml("<p>This document could not be rendered in page layout.</p>");
        return;
      }

      const renderedWrapper = host.querySelector<HTMLElement>(".docx-wrapper");
      const sourceRoot = renderedWrapper || host;
      const sources = Array.from(sourceRoot.children).filter(
        (el): el is HTMLElement => el instanceof HTMLElement && el.tagName === "SECTION"
      );

      const geometries: PageGeometry[] = [];
      const blocks: HTMLElement[] = [];

      const readSources = (list: HTMLElement[], chromeIndexOffset: number) => {
        list.forEach((source, index) => {
          const chromeIndex = chromeIndexOffset + index;
          const cs = window.getComputedStyle(source);
          const width = firstNumber(cs.width) || A4_WIDTH;
          const height = firstNumber(cs.minHeight) || firstNumber(cs.height) || A4_HEIGHT;
          const margins: PageMargins = {
            top: firstNumber(cs.paddingTop),
            right: firstNumber(cs.paddingRight),
            bottom: firstNumber(cs.paddingBottom),
            left: firstNumber(cs.paddingLeft),
          };
          const headerEl = source.querySelector<HTMLElement>(":scope > header");
          const footerEl = source.querySelector<HTMLElement>(":scope > footer");
          const notes = Array.from(source.children).filter(
            (el): el is HTMLElement =>
              el instanceof HTMLElement &&
              el.tagName !== "HEADER" &&
              el.tagName !== "ARTICLE" &&
              el.tagName !== "FOOTER"
          );

          const chrome: PageChrome = {
            header: headerEl ? prepareChrome(headerEl) : null,
            footer: footerEl ? prepareChrome(footerEl) : null,
            notes: notes.map(prepareNote),
            headerHeight: 0,
            footerHeight: 0,
          };
          const measured = measureChrome(width, margins, chrome);
          chrome.headerHeight = measured.headerHeight;
          chrome.footerHeight = measured.footerHeight;

          const baseStyle: BaseStyle = {
            fontFamily: cs.fontFamily || defaultBaseStyle().fontFamily,
            fontSize: cs.fontSize && cs.fontSize !== "0px" ? cs.fontSize : "11pt",
            lineHeight: cs.lineHeight && cs.lineHeight !== "normal" ? cs.lineHeight : "1.7",
            color: cs.color || "#000000",
            textAlign: cs.textAlign || "left",
            fontWeight: cs.fontWeight || "400",
            fontStyle: cs.fontStyle || "normal",
          };

          geometries[chromeIndex] = makeGeometry(width, height, margins, chrome, baseStyle);

          const pageBlocks: HTMLElement[] = [];
          const articles = Array.from(source.querySelectorAll<HTMLElement>(":scope > article"));
          articles.forEach((article) => {
            Array.from(article.children).forEach((child) => {
              if (child instanceof HTMLElement) pageBlocks.push(child);
            });
          });

          while (pageBlocks.length > 1 && isEmptyBlock(pageBlocks[pageBlocks.length - 1])) {
            pageBlocks.pop();
          }

          pageBlocks.forEach((block, blockIndex) => {
            block.setAttribute("data-zd-chrome", String(chromeIndex));
            block.setAttribute("data-zd-block-id", nextBlockId());
            if (chromeIndex > 0 && blockIndex === 0) block.setAttribute("data-zd-hard-start", "1");
            blocks.push(block);
          });
        });
      };

      if (sources.length) {
        readSources(sources, 0);
      } else {
        const fallback = sourceRoot;
        if (!fallback.querySelector("article")) {
          const firstArticle = document.createElement("article");
          Array.from(fallback.children).forEach((child) => {
            if (child instanceof HTMLElement) firstArticle.appendChild(child);
          });
          fallback.appendChild(firstArticle);
        }
        readSources([fallback], 0);
      }

      host.innerHTML = "";
      wrapperRef.current = null;
      pagesRef.current = [];
      if (!geometries.length) geometryRef.current = [defaultGeometry()];
      else {
        geometryRef.current = [];
        for (let i = 0; i < geometries.length; i += 1) {
          geometryRef.current[i] = geometries[i] || defaultGeometry();
        }
      }
      createWrapper();

      const holder = startPage(0);
      blocks.forEach((block) => holder.article.appendChild(block));
      rebuild(false);
    }

    function runCommand(command: string, value?: string): boolean {
      const article = getActiveArticle();
      const selection = window.getSelection();
      const canvas = canvasRef.current;
      const insideEditor = !!(
        selection &&
        selection.rangeCount > 0 &&
        selection.anchorNode &&
        canvas &&
        canvas.contains(selection.anchorNode)
      );

      if (!insideEditor && article) {
        article.focus();
        lastArticleRef.current = article;
        const range = document.createRange();
        range.selectNodeContents(article);
        range.collapse(false);
        if (selection) {
          selection.removeAllRanges();
          selection.addRange(range);
        }
      }

      try {
        return value === undefined
          ? document.execCommand(command, false)
          : document.execCommand(command, false, value);
      } catch {
        return false;
      }
    }

    function selectAllPages(): void {
      if (!pagesRef.current.length) return;
      const first = pagesRef.current[0].article;
      const last = pagesRef.current[pagesRef.current.length - 1].article;
      const range = document.createRange();
      range.setStart(first, 0);
      range.setEnd(last, last.childNodes.length);
      last.focus();
      const selection = window.getSelection();
      if (selection) {
        selection.removeAllRanges();
        selection.addRange(range);
      }
    }

    function focusDocument(position: "start" | "end" = "start"): void {
      if (!pagesRef.current.length) return;
      const page =
        position === "end"
          ? pagesRef.current[pagesRef.current.length - 1]
          : pagesRef.current[0];
      const article = page.article;
      article.focus();
      lastArticleRef.current = article;
      const range = document.createRange();
      range.selectNodeContents(article);
      range.collapse(position !== "end");
      const selection = window.getSelection();
      if (selection) {
        selection.removeAllRanges();
        selection.addRange(range);
      }
    }

    function readSelectionStyles(): SelectionStyles {
      const el = selectionElement();
      if (!el) return {};
      const cs = window.getComputedStyle(el);
      const size = parseFloat(cs.fontSize);
      return {
        fontFamily: cs.fontFamily?.split(",")[0]?.replace(/["']/g, "").trim() || undefined,
        fontSize: Number.isFinite(size) ? String(Math.round(size * 0.75)) : undefined,
        color: rgbToHex(cs.color),
      };
    }

    function insertPageBreak(): void {
      const article = getActiveArticle();
      if (!article) return;
      const selection = window.getSelection();
      const range = selection && selection.rangeCount > 0 ? selection.getRangeAt(0) : null;

      if (!range || !article.contains(range.startContainer)) {
        const p = document.createElement("p");
        p.innerHTML = "<br>";
        p.setAttribute("data-zd-hard-start", "1");
        p.setAttribute("data-zd-chrome", article.closest("section")?.getAttribute("data-zd-chrome") || "0");
        p.setAttribute("data-zd-block-id", nextBlockId());
        article.appendChild(p);
        rebuild(false);
        return;
      }

      let block = blockFromNode(range.startContainer);
      const marker = document.createElement("span");
      marker.setAttribute("data-zd-caret", "1");
      marker.style.cssText =
        "display:inline-block;width:0;height:0;overflow:hidden;vertical-align:baseline;pointer-events:none;";
      const caret = range.cloneRange();
      caret.collapse(false);
      caret.insertNode(marker);

      if (!block || !article.contains(block)) {
        block = article.lastElementChild instanceof HTMLElement ? article.lastElementChild : null;
      }

      let tailId: string | null = null;
      if (block) {
        const tail = block.cloneNode(false) as HTMLElement;
        tail.removeAttribute("data-zd-hard-start");
        tail.removeAttribute("contenteditable");
        tail.removeAttribute("spellcheck");
        tailId = nextBlockId();
        tail.setAttribute("data-zd-block-id", tailId);
        tail.setAttribute("data-zd-chrome", block.getAttribute("data-zd-chrome") || "0");

        const after = document.createRange();
        after.setStartAfter(marker);
        after.setEnd(block, block.childNodes.length);
        try {
          tail.appendChild(after.extractContents());
        } catch {
          /* ignore invalid ranges */
        }

        if (!(tail.textContent || "").trim() && !tail.querySelector("br,img,input,hr")) {
          tail.innerHTML = "<br>";
        }
        if (!(block.textContent || "").trim() && !block.querySelector("br,img,input,hr")) {
          block.innerHTML = "<br>";
        }

        tail.setAttribute("data-zd-hard-start", "1");
        block.parentNode?.insertBefore(tail, block.nextSibling);
      }

      marker.remove();
      rebuild(false);

      if (tailId) {
        const target = wrapperRef.current?.querySelector<HTMLElement>(
          `[data-zd-block-id="${tailId}"]`
        );
        if (target) {
          const targetRange = document.createRange();
          targetRange.selectNodeContents(target);
          targetRange.collapse(true);
          const targetArticle = target.closest("article");
          if (targetArticle instanceof HTMLElement) targetArticle.focus();
          const nextSelection = window.getSelection();
          if (nextSelection) {
            nextSelection.removeAllRanges();
            nextSelection.addRange(targetRange);
          }
        }
      }
    }

    function handleInput(): void {
      if (composingRef.current) return;
      scheduleReflow(true, 300);
    }

    function handleCompositionStart(): void {
      composingRef.current = true;
    }

    function handleCompositionEnd(): void {
      composingRef.current = false;
      scheduleReflow(true, 300);
    }

    function handleFocusIn(event: React.FocusEvent<HTMLDivElement>): void {
      const article = (event.target as HTMLElement).closest("article");
      if (article instanceof HTMLElement) lastArticleRef.current = article;
    }

    useEffect(() => {
      const layer = zoomLayerRef.current;
      if (layer) layer.style.setProperty("zoom", String(zoom / 100));
    }, [zoom]);

    useEffect(() => {
      pagesRef.current.forEach((page) => {
        page.section.style.marginBottom = `${showPageBreaks ? PAGE_GAP : 0}px`;
        page.section.style.boxShadow = showPageBreaks ? "0 2px 8px rgba(32,43,54,0.14)" : "none";
      });
    }, [showPageBreaks]);

    useEffect(() => {
      pagesRef.current.forEach((page) => {
        page.article.spellcheck = spellCheck;
      });
    }, [spellCheck]);

    useEffect(() => {
      const token = ++loadTokenRef.current;
      if (docxBuffer) {
        void loadDocx(docxBuffer, token);
      } else {
        loadHtml(initialHtml || "");
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [docxBuffer, loadKey, initialHtml]);

    useEffect(() => {
      return () => {
        if (reflowTimerRef.current) clearTimeout(reflowTimerRef.current);
        observerRef.current?.disconnect();
      };
    }, []);

    useImperativeHandle(ref, () => ({
      getHTML: () => serializeDocument(true),
      setHTML: (html: string) => loadHtml(html),
      focus: (position?: "start" | "end") => focusDocument(position),
      scrollToPage: (index: number) => {
        const page = pagesRef.current[index];
        if (!page) return;
        page.section.scrollIntoView({ behavior: "smooth", block: "start" });
        callbacksRef.current.onActivePageChange?.(index);
      },
      exec: (command: string, value?: string) => runCommand(command, value),
      queryState: (command: string) => {
        try {
          return document.queryCommandState(command);
        } catch {
          return false;
        }
      },
      insertPageBreak: () => insertPageBreak(),
      requestReflow: (preserveCaret = true) => scheduleReflow(preserveCaret, 0),
      setSpellCheck: (on: boolean) => {
        pagesRef.current.forEach((page) => {
          page.article.spellcheck = on;
        });
      },
      getActiveArticle: () => getActiveArticle(),
      getSelectionStyles: () => readSelectionStyles(),
      getSelectionBlock: () => blockFromNode(selectionElement()),
      selectAll: () => selectAllPages(),
      focusEnd: () => focusDocument("end"),
    }));

    const handleInputEvent = useCallback(() => handleInput(), []);
    const handleCompositionStartEvent = useCallback(() => handleCompositionStart(), []);
    const handleCompositionEndEvent = useCallback(() => handleCompositionEnd(), []);
    const handleFocusInEvent = useCallback(
      (event: React.FocusEvent<HTMLDivElement>) => handleFocusIn(event),
      []
    );

    return (
      <div
        id="editor-canvas"
        ref={canvasRef}
        className={`zd-canvas${showPageBreaks ? "" : " zd-hide-breaks"}`}
        style={{
          flex: 1,
          minWidth: 0,
          overflowY: "auto",
          overflowX: "auto",
          background: "var(--editor-workspace)",
          padding: "24px 0 64px",
          position: "relative",
        }}
      >
        <div ref={styleHostRef} aria-hidden="true" style={{ display: "none" }} />
        <div
          ref={zoomLayerRef}
          className="zd-zoom-layer"
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            width: "100%",
          }}
        >
          <div
            ref={hostRef}
            className="zd-host"
            onInput={handleInputEvent}
            onCompositionStart={handleCompositionStartEvent}
            onCompositionEnd={handleCompositionEndEvent}
            onFocus={handleFocusInEvent}
            style={{
              width: "100%",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          />
        </div>
      </div>
    );
  }
);

PaginatedDocumentCanvas.displayName = "PaginatedDocumentCanvas";

export default PaginatedDocumentCanvas;
