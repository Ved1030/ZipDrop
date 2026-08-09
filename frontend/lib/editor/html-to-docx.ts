/**
 * HTML → DOCX converter using the `docx` library.
 * Pure JavaScript, no filesystem dependencies — works in any Node.js environment.
 */

import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  LevelFormat,
  ExternalHyperlink,
  ImageRun,
  BorderStyle,
  convertInchesToTwip,
  ILevelsOptions,
  INumberingOptions,
  NumberFormat,
  Table,
  TableRow,
  TableCell,
  WidthType,
  VerticalAlign,
  TableLayoutType,
  ShadingType,
} from "docx";

type TagNode = { type: "tag"; tag: string; attrs: Record<string, string>; children: Node[] };

function isTagNode(n: Node): n is TagNode {
  return n.type === "tag";
}

/* ── color normalization ──────────────────────────────────────────── */

const NAMED_COLORS: Record<string, string> = {
  aliceblue: "F0F8FF", antiquewhite: "FAEBD7", aqua: "00FFFF", aquamarine: "7FFFD4",
  azure: "F0FFFF", beige: "F5F5DC", bisque: "FFE4C4", black: "000000",
  blanchedalmond: "FFEBCD", blue: "0000FF", blueviolet: "8A2BE2", brown: "A52A2A",
  burlywood: "DEB887", cadetblue: "5F9EA0", chartreuse: "7FFF00", chocolate: "D2691E",
  coral: "FF7F50", cornflowerblue: "6495ED", cornsilk: "FFF8DC", crimson: "DC143C",
  cyan: "00FFFF", darkblue: "00008B", darkcyan: "008B8B", darkgoldenrod: "B8860B",
  darkgray: "A9A9A9", darkgreen: "006400", darkkhaki: "BDB76B", darkmagenta: "8B008B",
  darkolivegreen: "556B2F", darkorange: "FF8C00", darkorchid: "9932CC", darkred: "8B0000",
  darksalmon: "E9967A", darkseagreen: "8FBC8F", darkslateblue: "483D8B", darkslategray: "2F4F4F",
  darkturquoise: "00CED1", darkviolet: "9400D3", deeppink: "FF1493", deepskyblue: "00BFFF",
  dimgray: "696969", dodgerblue: "1E90FF", firebrick: "B22222", floralwhite: "FFFAF0",
  forestgreen: "228B22", fuchsia: "FF00FF", gainsboro: "DCDCDC", ghostwhite: "F8F8FF",
  gold: "FFD700", goldenrod: "DAA520", gray: "808080", green: "008000",
  greenyellow: "ADFF2F", honeydew: "F0FFF0", hotpink: "FF69B4", indianred: "CD5C5C",
  indigo: "4B0082", ivory: "FFFFF0", khaki: "F0E68C", lavender: "E6E6FA",
  lavenderblush: "FFF0F5", lawngreen: "7CFC00", lemonchiffon: "FFFACD", lightblue: "ADD8E6",
  lightcoral: "F08080", lightcyan: "E0FFFF", lightgoldenrodyellow: "FAFAD2",
  lightgray: "D3D3D3", lightgreen: "90EE90", lightpink: "FFB6C1", lightsalmon: "FFA07A",
  lightseagreen: "20B2AA", lightskyblue: "87CEFA", lightslategray: "778899",
  lightsteelblue: "B0C4DE", lightyellow: "FFFFE0", lime: "00FF00", limegreen: "32CD32",
  linen: "FAF0E6", magenta: "FF00FF", maroon: "800000", mediumaquamarine: "66CDAA",
  mediumblue: "0000CD", mediumorchid: "BA55D3", mediumpurple: "9370DB",
  mediumseagreen: "3CB371", mediumslateblue: "7B68EE", mediumspringgreen: "00FA9A",
  mediumturquoise: "48D1CC", mediumvioletred: "C71585", midnightblue: "191970",
  mintcream: "F5FFFA", mistyrose: "FFE4E1", moccasin: "FFE4B5", navajowhite: "FFDEAD",
  navy: "000080", oldlace: "FDF5E6", olive: "808000", olivedrab: "6B8E23",
  orange: "FFA500", orangered: "FF4500", orchid: "DA70D6", palegoldenrod: "EEE8AA",
  palegreen: "98FB98", paleturquoise: "AFEEEE", palevioletred: "DB7093", papayawhip: "FFEFD5",
  peachpuff: "FFDAB9", peru: "CD853F", pink: "FFC0CB", plum: "DDA0DD",
  powderblue: "B0E0E6", purple: "800080", rebeccapurple: "663399", red: "FF0000",
  rosybrown: "BC8F8F", royalblue: "4169E1", saddlebrown: "8B4513", salmon: "FA8072",
  sandybrown: "F4A460", seagreen: "2E8B57", seashell: "FFF5EE", sienna: "A0522D",
  silver: "C0C0C0", skyblue: "87CEEB", slateblue: "6A5ACD", slategray: "708090",
  snow: "FFFAFA", springgreen: "00FF7F", steelblue: "4682B4", tan: "D2B48C",
  teal: "008080", thistle: "D8BFD8", tomato: "FF6347", turquoise: "40E0D0",
  violet: "EE82EE", wheat: "F5DEB3", white: "FFFFFF", whitesmoke: "F5F5F5",
  yellow: "FFFF00", yellowgreen: "9ACD32",
};

export function normalizeColor(color: string): string {
  if (!color) return "000000";
  const trimmed = color.trim().toLowerCase();

  if (trimmed === "transparent") return "000000";

  if (/^#[0-9a-f]{6}$/i.test(trimmed)) return trimmed.slice(1).toUpperCase();
  if (/^#[0-9a-f]{3}$/i.test(trimmed))
    return (trimmed[1] + trimmed[1] + trimmed[2] + trimmed[2] + trimmed[3] + trimmed[3]).toUpperCase();

  const rgbMatch = trimmed.match(/^rgba?\(\s*(-?\d+)\s*,\s*(-?\d+)\s*,\s*(-?\d+)/);
  if (rgbMatch) {
    const r = Math.min(255, Math.max(0, parseInt(rgbMatch[1], 10)));
    const g = Math.min(255, Math.max(0, parseInt(rgbMatch[2], 10)));
    const b = Math.min(255, Math.max(0, parseInt(rgbMatch[3], 10)));
    return ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase();
  }

  if (NAMED_COLORS[trimmed]) return NAMED_COLORS[trimmed];

  return "000000";
}

/* ── helpers ────────────────────────────────────────────────────────── */

function decodeHtmlEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ");
}

function stripTags(html: string): string {
  return decodeHtmlEntities(html.replace(/<[^>]*>/g, ""));
}

function parseInlineStyle(style: string): Record<string, string> {
  const out: Record<string, string> = {};
  if (!style) return out;
  style.split(";").forEach((decl) => {
    const [k, v] = decl.split(":").map((s) => s.trim());
    if (k && v) out[k] = v;
  });
  return out;
}

function parseFontSize(raw: string): number | undefined {
  if (!raw) return undefined;
  const trimmed = raw.trim();
  const ptMatch = trimmed.match(/^([\d.]+)\s*pt$/);
  if (ptMatch) {
    const pt = parseFloat(ptMatch[1]);
    if (!isNaN(pt)) return Math.round(pt * 2);
  }
  const pxMatch = trimmed.match(/^([\d.]+)\s*(?:px)?$/);
  if (pxMatch) {
    const px = parseFloat(pxMatch[1]);
    if (!isNaN(px)) return Math.round(px * 2);
  }
  return undefined;
}

function parseLineHeight(raw: string): number | undefined {
  if (!raw) return undefined;
  const trimmed = raw.trim();
  const numMatch = trimmed.match(/^([\d.]+)$/);
  if (numMatch) {
    const val = parseFloat(numMatch[1]);
    if (!isNaN(val) && val > 0) return Math.round(val * 240);
  }
  const pxMatch = trimmed.match(/^([\d.]+)\s*px$/);
  if (pxMatch) {
    const px = parseFloat(pxMatch[1]);
    if (!isNaN(px) && px > 0) return Math.round((px / 12) * 240);
  }
  return undefined;
}

function parseMargin(raw: string): number | undefined {
  if (!raw) return undefined;
  const px = parseInt(raw, 10);
  if (!isNaN(px) && px > 0) return Math.round(px * 15);
  return undefined;
}

function extractBase64Buffer(src: string): { buf: Buffer; imgType: "jpg" | "png" | "gif" | "bmp" } | null {
  const match = src.match(/^data:image\/(\w+)[^;]*;base64,(.+)$/);
  if (!match) return null;
  try {
    const ext = match[1].toLowerCase();
    let imgType: "jpg" | "png" | "gif" | "bmp" = "png";
    if (ext === "jpeg" || ext === "jpg") imgType = "jpg";
    else if (ext === "gif") imgType = "gif";
    else if (ext === "bmp") imgType = "bmp";
    return { buf: Buffer.from(match[2], "base64"), imgType };
  } catch {
    return null;
  }
}

/* ── simple HTML tokenizer ─────────────────────────────────────────── */

type Node =
  | { type: "text"; text: string }
  | { type: "tag"; tag: string; attrs: Record<string, string>; children: Node[] };

function parseHTML(html: string): Node[] {
  const nodes: Node[] = [];
  let i = 0;
  while (i < html.length) {
    if (html[i] === "<") {
      const closeIdx = html.indexOf(">", i);
      if (closeIdx === -1) {
        nodes.push({ type: "text", text: html.slice(i) });
        break;
      }
      const raw = html.slice(i, closeIdx + 1);
      i = closeIdx + 1;

      if (raw.startsWith("</")) continue;

      const openMatch = raw.match(/^<(\w+)([^>]*)\/?>/);
      if (!openMatch) continue;
      const tag = openMatch[1].toLowerCase();
      const attrStr = openMatch[2];
      const attrs: Record<string, string> = {};
      const attrRe = /(\w[\w-]*)="([^"]*)"/g;
      let m: RegExpExecArray | null;
      while ((m = attrRe.exec(attrStr))) {
        attrs[m[1]] = m[2];
      }

      const voidTags = ["br", "hr", "img", "input"];
      if (voidTags.includes(tag)) {
        nodes.push({ type: "tag", tag, attrs, children: [] });
        continue;
      }

      const closeTag = `</${tag}>`;
      const contentStart = i;
      let depth = 1;
      let searchFrom = contentStart;
      while (depth > 0) {
        const nextOpen = html.indexOf(`<${tag}`, searchFrom);
        const nextClose = html.indexOf(closeTag, searchFrom);
        if (nextClose === -1) break;
        if (nextOpen !== -1 && nextOpen < nextClose) {
          depth++;
          searchFrom = nextOpen + tag.length;
        } else {
          depth--;
          if (depth === 0) {
            const inner = html.slice(contentStart, nextClose);
            i = nextClose + closeTag.length;
            const children = parseHTML(inner);
            nodes.push({ type: "tag", tag, attrs, children });
          } else {
            searchFrom = nextClose + closeTag.length;
          }
        }
      }
      if (depth > 0) {
        nodes.push({ type: "text", text: html.slice(contentStart) });
        break;
      }
    } else {
      const nextTag = html.indexOf("<", i);
      const text = html.slice(i, nextTag === -1 ? html.length : nextTag);
      if (text) nodes.push({ type: "text", text: decodeHtmlEntities(text) });
      i = nextTag === -1 ? html.length : nextTag;
    }
  }
  return nodes;
}

/* ── inline runs ────────────────────────────────────────────────────── */

interface RunStyle {
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strike?: boolean;
  superscript?: boolean;
  subscript?: boolean;
  fontFamily?: string;
  fontSize?: string;
  color?: string;
  highlight?: string;
  code?: boolean;
}

function nodesToRuns(
  nodes: Node[],
  inherited: RunStyle = {}
): (TextRun | ExternalHyperlink | ImageRun)[] {
  const runs: (TextRun | ExternalHyperlink | ImageRun)[] = [];

  for (const node of nodes) {
    if (node.type === "text") {
      if (!node.text) continue;
      const opts: any = { text: node.text };
      if (inherited.bold) opts.bold = true;
      if (inherited.italic) opts.italics = true;
      if (inherited.underline) opts.underline = {};
      if (inherited.strike) opts.strike = true;
      if (inherited.superscript) opts.superScript = true;
      if (inherited.subscript) opts.subScript = true;
      if (inherited.fontFamily) opts.font = { name: inherited.fontFamily };
      if (inherited.fontSize) {
        const halfPt = parseFontSize(inherited.fontSize);
        if (halfPt) opts.size = halfPt;
      }
      if (inherited.color) opts.color = normalizeColor(inherited.color);
      if (inherited.highlight) opts.highlight = { color: normalizeColor(inherited.highlight) };
      if (inherited.code) {
        opts.font = { name: "Courier New" };
        opts.shading = { fill: "f0f0f0", type: ShadingType.CLEAR };
      }
      runs.push(new TextRun(opts));
      continue;
    }

    const s = { ...inherited };
    const style = parseInlineStyle(node.attrs.style || "");

    switch (node.tag) {
      case "strong":
      case "b":
        s.bold = true;
        break;
      case "em":
      case "i":
        s.italic = true;
        break;
      case "u":
        s.underline = true;
        break;
      case "s":
      case "del":
      case "strike":
        s.strike = true;
        break;
      case "sup":
        s.superscript = true;
        break;
      case "sub":
        s.subscript = true;
        break;
      case "code":
        s.code = true;
        break;
      case "mark": {
        const markStyle = parseInlineStyle(node.attrs.style || "");
        s.highlight = markStyle["background-color"] || markStyle["color"] || "#ffff00";
        break;
      }
      case "span": {
        if (style["font-family"]) s.fontFamily = style["font-family"].replace(/['"]/g, "");
        if (style["font-size"]) s.fontSize = style["font-size"];
        if (style["color"]) s.color = style["color"];
        if (style["background-color"]) s.highlight = style["background-color"];
        if (style["font-weight"] === "bold" || parseInt(style["font-weight"] || "0") >= 700) s.bold = true;
        if (style["font-style"] === "italic") s.italic = true;
        if (style["text-decoration"]?.includes("underline")) s.underline = true;
        if (style["text-decoration"]?.includes("line-through")) s.strike = true;
        break;
      }
      case "a": {
        const children = nodesToRuns(node.children, s);
        const href = node.attrs.href || "#";
        runs.push(new ExternalHyperlink({ children, link: href }));
        continue;
      }
      case "img": {
        const src = node.attrs.src || "";
        if (src.startsWith("data:image/")) {
          const extracted = extractBase64Buffer(src);
          if (extracted) {
            const w = parseInt(node.attrs.width || "300", 10) || 300;
            const h = parseInt(node.attrs.height || "200", 10) || 200;
            runs.push(new ImageRun({ type: extracted.imgType, data: extracted.buf, transformation: { width: w, height: h } }));
          }
        }
        continue;
      }
      case "br": {
        runs.push(new TextRun({ break: 1 }));
        continue;
      }
      case "p":
      case "div":
      case "blockquote":
      case "pre":
        break;
    }

    runs.push(...nodesToRuns(node.children, s));
  }

  return runs;
}

/* ── list numbering definitions ─────────────────────────────────────── */

let bulletRef = 0;
let orderedRef = 0;

function makeNumbering(): { numbering: INumberingOptions; bulletId: string; orderedId: string } {
  const bulletId = String(bulletRef++);
  const orderedId = String(orderedRef++);

  const levels: ILevelsOptions[] = [
    {
      level: 0,
      format: LevelFormat.BULLET,
      text: "\u2022",
      alignment: AlignmentType.LEFT,
      style: { paragraph: { indent: { left: convertInchesToTwip(0.5), hanging: convertInchesToTwip(0.25) } } },
    },
    {
      level: 1,
      format: LevelFormat.BULLET,
      text: "\u25E6",
      alignment: AlignmentType.LEFT,
      style: { paragraph: { indent: { left: convertInchesToTwip(1), hanging: convertInchesToTwip(0.25) } } },
    },
  ];

  const orderedLevels: ILevelsOptions[] = [
    {
      level: 0,
      format: LevelFormat.DECIMAL,
      text: "%1.",
      alignment: AlignmentType.LEFT,
      style: { paragraph: { indent: { left: convertInchesToTwip(0.5), hanging: convertInchesToTwip(0.25) } } },
    },
    {
      level: 1,
      format: LevelFormat.DECIMAL,
      text: "%2.",
      alignment: AlignmentType.LEFT,
      style: { paragraph: { indent: { left: convertInchesToTwip(1), hanging: convertInchesToTwip(0.25) } } },
    },
  ];

  return {
    numbering: {
      config: [
        { reference: bulletId, levels },
        { reference: orderedId, levels: orderedLevels },
      ],
    },
    bulletId,
    orderedId,
  };
}

/* ── paragraph-level conversion ─────────────────────────────────────── */

function getAlignment(node: Node): (typeof AlignmentType)[keyof typeof AlignmentType] | undefined {
  if (node.type === "text") return undefined;
  const style = parseInlineStyle(node.attrs.style || "");
  const align = style["text-align"];
  if (align === "center") return AlignmentType.CENTER;
  if (align === "right") return AlignmentType.RIGHT;
  if (align === "justify") return AlignmentType.JUSTIFIED;
  return undefined;
}

function getIndent(node: Node): number | undefined {
  if (node.type === "text") return undefined;
  const style = parseInlineStyle(node.attrs.style || "");
  const ml = style["margin-left"];
  if (ml) {
    const px = parseInt(ml, 10);
    if (!isNaN(px) && px > 0) return Math.floor(px / 40);
  }
  return undefined;
}

function buildDocxTable(tableNode: TagNode, numbering: { bulletId: string; orderedId: string }): Table {
  const rows: TableRow[] = [];

  function findRows(node: Node) {
    if (node.type === "tag" && node.tag === "tr") {
      rows.push(buildRow(node));
    } else if (node.type === "tag") {
      for (const child of node.children) findRows(child);
    }
  }

  function buildRow(trNode: TagNode): TableRow {
    const cells: TableCell[] = [];
    for (const child of trNode.children) {
      if (child.type === "tag" && (child.tag === "td" || child.tag === "th")) {
        cells.push(buildCell(child));
      }
    }
    return new TableRow({ children: cells });
  }

  function buildCell(cellNode: TagNode): TableCell {
    const isHeader = cellNode.tag === "th";
    const cellStyle = parseInlineStyle(cellNode.attrs.style || "");
    const cellChildren: (Paragraph | Table)[] = [];

    function processContent(nodes: Node[]) {
      for (const child of nodes) {
        if (child.type === "text") {
          const text = child.text;
          if (text) {
            cellChildren.push(
              new Paragraph({
                children: [new TextRun({ text, bold: isHeader })],
              })
            );
          }
        } else if (child.type === "tag") {
          if (child.tag === "p" || child.tag === "div") {
            const pStyle = parseInlineStyle(child.attrs.style || "");
            const align = getAlignment(child);
            const runs = nodesToRuns(child.children, isHeader ? { bold: true } : {});
            const pOpts: any = { children: runs };
            if (align) pOpts.alignment = align;
            const lh = parseLineHeight(pStyle["line-height"]);
            if (lh) pOpts.spacing = { line: lh };
            cellChildren.push(new Paragraph(pOpts));
          } else if (child.tag === "ul" || child.tag === "ol") {
            cellChildren.push(...blockToParagraphs(child, numbering));
          } else if (child.tag === "table") {
            cellChildren.push(buildDocxTable(child, numbering));
          } else {
            const runs = nodesToRuns([child], isHeader ? { bold: true } : {});
            cellChildren.push(new Paragraph({ children: runs }));
          }
        }
      }
    }

    processContent(cellNode.children);

    if (cellChildren.length === 0) {
      cellChildren.push(new Paragraph({ children: [] }));
    }

    const vAlign = cellStyle["vertical-align"];
    let verticalAlign: "top" | "center" | "bottom" = "top";
    if (vAlign === "middle" || vAlign === "center") verticalAlign = "center";
    else if (vAlign === "bottom") verticalAlign = "bottom";

    const cellOpts: any = {
      children: cellChildren,
      verticalAlign,
    };

    const colspan = parseInt(cellNode.attrs.colspan || "0", 10);
    if (colspan > 1) cellOpts.columnSpan = colspan;

    const rowspan = parseInt(cellNode.attrs.rowspan || "0", 10);
    if (rowspan > 1) cellOpts.rowSpan = rowspan;

    if (isHeader) {
      cellOpts.shading = { fill: "E8E8E8", type: ShadingType.CLEAR };
    }

    return new TableCell(cellOpts);
  }

  findRows(tableNode);

  return new Table({
    rows,
    width: { size: 100, type: WidthType.PERCENTAGE },
    layout: TableLayoutType.FIXED,
  });
}

function blockToParagraphs(
  node: Node,
  numbering: { bulletId: string; orderedId: string }
): (Paragraph | Table)[] {
  if (node.type === "text") {
    const text = node.text.trim();
    if (!text) return [];
    return [
      new Paragraph({
        children: [new TextRun({ text })],
      }),
    ];
  }

  const tag = node.tag;
  const align = getAlignment(node);
  const indent = getIndent(node);
  const style = parseInlineStyle(node.attrs.style || "");

  if (tag === "h1" || tag === "h2" || tag === "h3" || tag === "h4" || tag === "h5" || tag === "h6") {
    const headingMap: Record<string, (typeof HeadingLevel)[keyof typeof HeadingLevel]> = {
      h1: HeadingLevel.HEADING_1,
      h2: HeadingLevel.HEADING_2,
      h3: HeadingLevel.HEADING_3,
      h4: HeadingLevel.HEADING_4,
      h5: HeadingLevel.HEADING_5,
      h6: HeadingLevel.HEADING_6,
    };
    const pOpts: any = {
      heading: headingMap[tag],
      children: nodesToRuns(node.children),
    };
    if (align) pOpts.alignment = align;
    const lh = parseLineHeight(style["line-height"]);
    if (lh) pOpts.spacing = { line: lh };
    const mt = parseMargin(style["margin-top"]);
    const mb = parseMargin(style["margin-bottom"]);
    if (mt || mb) {
      pOpts.spacing = { ...pOpts.spacing, before: mt, after: mb };
    }
    return [new Paragraph(pOpts)];
  }

  if (tag === "pre" || (tag === "code" && node.children.some(c => c.type === "text" && c.text.includes("\n")))) {
    const lines = (node.children.map((c) => (c.type === "text" ? c.text : "")).join("")).split("\n");
    return lines.map(
      (line) =>
        new Paragraph({
          children: [
            new TextRun({
              text: line || " ",
              font: { name: "Courier New" },
              size: 20,
            }),
          ],
          shading: { fill: "f5f5f5", type: ShadingType.CLEAR },
          spacing: { before: 40, after: 40 },
        })
    );
  }

  if (tag === "blockquote") {
    return [
      new Paragraph({
        indent: { left: convertInchesToTwip(0.5) },
        border: {
          left: { style: BorderStyle.SINGLE, size: 6, color: "999999", space: 10 },
        },
        children: nodesToRuns(node.children),
      }),
    ];
  }

  if (tag === "hr") {
    return [
      new Paragraph({
        border: {
          bottom: { style: BorderStyle.SINGLE, size: 6, color: "CCCCCC", space: 1 },
        },
        spacing: { before: 200, after: 200 },
        children: [],
      }),
    ];
  }

  if (tag === "ul") {
    const paragraphs: (Paragraph | Table)[] = [];
    for (const child of node.children) {
      if (child.type === "tag" && child.tag === "li") {
        paragraphs.push(
          new Paragraph({
            numbering: { reference: numbering.bulletId, level: 0 },
            children: nodesToRuns(child.children),
          })
        );
      }
    }
    return paragraphs;
  }

  if (tag === "ol") {
    const paragraphs: (Paragraph | Table)[] = [];
    for (const child of node.children) {
      if (child.type === "tag" && child.tag === "li") {
        paragraphs.push(
          new Paragraph({
            numbering: { reference: numbering.orderedId, level: 0 },
            children: nodesToRuns(child.children),
          })
        );
      }
    }
    return paragraphs;
  }

  if (tag === "li") {
    return [
      new Paragraph({
        children: nodesToRuns(node.children),
      }),
    ];
  }

  if (tag === "table") {
    return [buildDocxTable(node as TagNode, numbering)];
  }

  if (tag === "thead" || tag === "tbody") {
    return nodesToBlockParagraphs(node.children, numbering);
  }

  if (tag === "img") {
    const src = node.attrs.src || "";
    if (src.startsWith("data:image/")) {
      const extracted = extractBase64Buffer(src);
      if (extracted) {
        const w = parseInt(node.attrs.width || "300", 10) || 300;
        const h = parseInt(node.attrs.height || "200", 10) || 200;
        return [
          new Paragraph({
            children: [new ImageRun({ type: extracted.imgType, data: extracted.buf, transformation: { width: w, height: h } })],
          }),
        ];
      }
    }
    return [];
  }

  if (tag === "p" || tag === "div" || tag === "section" || tag === "article") {
    const pOpts: any = {};
    if (align) pOpts.alignment = align;
    if (indent) pOpts.indent = { left: convertInchesToTwip(indent * 0.5) };
    const children = nodesToRuns(node.children);
    if (children.length > 0) pOpts.children = children;
    else pOpts.children = [];

    const lh = parseLineHeight(style["line-height"]);
    const mt = parseMargin(style["margin-top"]);
    const mb = parseMargin(style["margin-bottom"]);
    if (lh || mt || mb) {
      pOpts.spacing = {};
      if (lh) pOpts.spacing.line = lh;
      if (mt) pOpts.spacing.before = mt;
      if (mb) pOpts.spacing.after = mb;
    }

    return [new Paragraph(pOpts)];
  }

  return nodesToBlockParagraphs(node.children, numbering);
}

function nodesToBlockParagraphs(
  nodes: Node[],
  numbering: { bulletId: string; orderedId: string }
): (Paragraph | Table)[] {
  const paragraphs: (Paragraph | Table)[] = [];
  for (const node of nodes) {
    paragraphs.push(...blockToParagraphs(node, numbering));
  }
  return paragraphs;
}

/* ── public API ─────────────────────────────────────────────────────── */

export interface DocxStyles {
  defaultFont?: string;
  fontSize?: number;
  lineHeight?: number;
}

export async function htmlToDocx(
  html: string,
  filename?: string,
  styles?: DocxStyles
): Promise<Buffer> {
  bulletRef = 0;
  orderedRef = 0;

  const num = makeNumbering();
  const nodes = parseHTML(html);
  const paragraphs = nodesToBlockParagraphs(nodes, num);

  if (paragraphs.length === 0) {
    paragraphs.push(new Paragraph({ children: [] }));
  }

  const defaultFont = styles?.defaultFont || "Calibri";
  const defaultSize = Math.round((styles?.fontSize || 11) * 2);
  const defaultLine = Math.round((styles?.lineHeight || 1.7) * 240);

  const doc = new Document({
    numbering: num.numbering,
    styles: {
      default: {
        document: {
          run: {
            font: defaultFont,
            size: defaultSize,
            color: "000000",
          },
          paragraph: {
            spacing: {
              before: 0,
              after: 120,
              line: defaultLine,
            },
          },
        },
      },
    },
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: convertInchesToTwip(1),
              bottom: convertInchesToTwip(1),
              left: convertInchesToTwip(1.25),
              right: convertInchesToTwip(1.25),
            },
          },
        },
        children: paragraphs,
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);
  return Buffer.from(buffer);
}
