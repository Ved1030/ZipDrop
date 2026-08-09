declare module "mammoth" {
  interface MammothResult {
    value: string;
    messages: Array<{ type: string; message: string }>;
  }
  interface ConvertToHtmlOptions {
    arrayBuffer: ArrayBuffer;
    convertImage?: any;
  }
  export function convertToHtml(
    input: { buffer: Buffer },
    options?: { convertImage?: any }
  ): Promise<MammothResult>;
  export namespace images {
    function imgElement(
      converter: (image: {
        contentType: string;
        read: (encoding: string) => Promise<string>;
      }) => Promise<{ src: string }>
    ): any;
  }
}

declare module "html2canvas" {
  interface Options {
    [key: string]: any;
  }
  export default function html2canvas(
    element: HTMLElement,
    options?: Options
  ): Promise<HTMLCanvasElement>;
}

declare module "jspdf" {
  interface jsPDF {
    internal: {
      pageSize: {
        getWidth: () => number;
        getHeight: () => number;
      };
    };
    addImage: (
      imageData: string,
      format: string,
      x: number,
      y: number,
      width: number,
      height: number
    ) => void;
    addPage: () => void;
    save: (filename: string) => void;
  }
  export default function jsPDF(orientation?: string, unit?: string, format?: string): jsPDF;
}

declare module "html-docx-js" {
  export function asBlob(html: string, options?: any): Blob;
}

declare module "file-saver" {
  export function saveAs(data: Blob, filename: string): void;
}

declare global {
  interface Window {
    gtag: (...args: any[]) => void;
  }
}

export {};
