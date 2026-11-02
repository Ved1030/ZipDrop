export interface PageMargins {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export interface PageInfo {
  id: string;
  index: number;
  width: number;
  height: number;
  thumbnailHtml: string;
  thumbnailWidth: number;
  thumbnailHeight: number;
}

export interface SelectionStyles {
  fontFamily?: string;
  fontSize?: string;
  color?: string;
}

export interface PaginatedEditorHandle {
  getHTML(): string;
  setHTML(html: string): void;
  focus(position?: "start" | "end"): void;
  scrollToPage(index: number): void;
  exec(command: string, value?: string): boolean;
  queryState(command: string): boolean;
  insertPageBreak(): void;
  requestReflow(preserveCaret?: boolean): void;
  setSpellCheck(on: boolean): void;
  getActiveArticle(): HTMLElement | null;
  getSelectionStyles(): SelectionStyles;
  getSelectionBlock(): HTMLElement | null;
  selectAll(): void;
  focusEnd(): void;
}
