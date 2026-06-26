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
    input: { arrayBuffer: ArrayBuffer },
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

declare global {
  interface Window {
    gtag: (...args: any[]) => void;
  }
}

export {};
