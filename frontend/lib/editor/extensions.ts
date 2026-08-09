import StarterKit from "@tiptap/starter-kit";
import TextAlign from "@tiptap/extension-text-align";
import { TextStyle } from "@tiptap/extension-text-style";
import FontFamily from "@tiptap/extension-font-family";
import { Color } from "@tiptap/extension-color";
import Highlight from "@tiptap/extension-highlight";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import Placeholder from "@tiptap/extension-placeholder";
import Image from "@tiptap/extension-image";
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableCell } from "@tiptap/extension-table-cell";
import { TableHeader } from "@tiptap/extension-table-header";
import Subscript from "@tiptap/extension-subscript";
import Superscript from "@tiptap/extension-superscript";
import CharacterCount from "@tiptap/extension-character-count";
import Typography from "@tiptap/extension-typography";
import { Extension } from "@tiptap/core";

const FontSize = TextStyle.extend({
  name: "fontSize",
  addAttributes() {
    return {
      ...this.parent?.(),
      fontSize: {
        default: null,
        renderHTML: (attributes) => {
          if (!attributes.fontSize) return {};
          return { style: `font-size: ${attributes.fontSize}px` };
        },
        parseHTML: (element) =>
          element.style.fontSize?.replace("px", "") || null,
      },
    };
  },
  addCommands() {
    return {
      setFontSize:
        (fontSize: string) =>
        ({ commands }: { commands: any }) => {
          return commands.setMark("textStyle", { fontSize });
        },
      unsetFontSize:
        () =>
        ({ commands }: { commands: any }) => {
          return commands.setMark("textStyle", { fontSize: null });
        },
    };
  },
});

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    fontSize: {
      setFontSize: (fontSize: string) => ReturnType;
      unsetFontSize: () => ReturnType;
    };
  }
}

const Indent = Extension.create({
  name: "indent",
  addOptions() {
    return {
      types: ["heading", "paragraph"],
      minLevel: 0,
      maxLevel: 8,
    };
  },
  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          indent: {
            default: 0,
            parseHTML: (element) => {
              const level =
                parseInt(element.style.marginLeft || "0", 10) / 40;
              return Math.min(Math.max(level, 0), 8);
            },
            renderHTML: (attributes) => {
              if (!attributes.indent || attributes.indent <= 0) return {};
              return {
                style: `margin-left: ${attributes.indent * 40}px`,
              };
            },
          },
        },
      },
    ];
  },
  addCommands(): any {
    return {
      indent:
        () =>
        ({
          tr,
          state,
          dispatch,
        }: {
          tr: any;
          state: any;
          dispatch: any;
        }) => {
          const { selection } = state;
          const pos = selection.$from;
          const node = pos.node(pos.depth === 0 ? 0 : pos.depth);
          if (!node) return false;
          const currentIndent = node.attrs.indent || 0;
          if (currentIndent >= 8) return false;
          if (dispatch) {
            tr.setNodeMarkup(
              pos.before(pos.depth === 0 ? 1 : pos.depth),
              undefined,
              { ...node.attrs, indent: currentIndent + 1 }
            );
            dispatch(tr);
          }
          return true;
        },
      outdent:
        () =>
        ({
          tr,
          state,
          dispatch,
        }: {
          tr: any;
          state: any;
          dispatch: any;
        }) => {
          const { selection } = state;
          const pos = selection.$from;
          const node = pos.node(pos.depth === 0 ? 0 : pos.depth);
          if (!node) return false;
          const currentIndent = node.attrs.indent || 0;
          if (currentIndent <= 0) return false;
          if (dispatch) {
            tr.setNodeMarkup(
              pos.before(pos.depth === 0 ? 1 : pos.depth),
              undefined,
              { ...node.attrs, indent: currentIndent - 1 }
            );
            dispatch(tr);
          }
          return true;
        },
    };
  },
  addKeyboardShortcuts() {
    return {
      Tab: () => (this.editor.commands as any).indent(),
      "Shift-Tab": () => (this.editor.commands as any).outdent(),
    };
  },
});

export const editorExtensions = [
  StarterKit.configure({
    heading: { levels: [1, 2, 3, 4, 5, 6] },
    codeBlock: false,
    link: { openOnClick: false, autolink: true },
  }),
  TextStyle,
  FontFamily,
  FontSize,
  TextAlign.configure({ types: ["heading", "paragraph"] }),
  Color,
  Highlight.configure({ multicolor: true }),
  Subscript,
  Superscript,
  TaskList,
  TaskItem.configure({ nested: true }),
  Placeholder.configure({ placeholder: "Start typing..." }),
  Image.configure({ inline: true, allowBase64: true }),
  Table.configure({ resizable: true }),
  TableRow,
  TableCell,
  TableHeader,
  Indent,
  CharacterCount,
  Typography,
];

export const FONT_FAMILIES = [
  "Arial",
  "Calibri",
  "Times New Roman",
  "Georgia",
  "Verdana",
  "Courier New",
  "Helvetica",
  "Trebuchet MS",
  "Palatino",
  "Garamond",
];

export const FONT_SIZES = [
  "8", "9", "10", "11", "12", "14", "16", "18",
  "20", "22", "24", "28", "32", "36", "48", "64", "72",
];
