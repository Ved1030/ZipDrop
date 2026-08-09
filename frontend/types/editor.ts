export type FileType =
  | "document"
  | "pdf"
  | "image"
  | "video"
  | "audio"
  | "zip"
  | "unsupported";

export type ExportFormat =
  | "docx"
  | "pdf"
  | "txt"
  | "md"
  | "html";

export interface FileData {
  fileName: string;
  fileUrl: string;
  fileSize?: number;
  mimeType?: string;
  recipientCode?: string;
}

export interface EditorFileData {
  fileName: string;
  fileType: string;
  fileSize: string;
  content: string;
}

export interface DocumentParser {
  parse(data: ArrayBuffer): Promise<string>;
}
