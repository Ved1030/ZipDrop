import {
  RefreshCw,
  FileText,
  Image,
  Archive,
  Type,
  Wrench,
  PenTool,
  FileCode,
  FileSpreadsheet,
  Presentation,
  FileImage,
  FileText as FilePdf,
  Lock,
  Unlock,
  RotateCcw,
  Scissors,
  Plus,
  Minus,
  LayoutGrid,
  Edit,
  Zap,
  QrCode,
  Hash,
  Search,
  Eye,
  Key,
  Link2,
  Loader,
  Download,
  Settings,
  Archive as ArchiveIcon,
} from "lucide-react";

interface LucideIconProps extends React.SVGProps<SVGSVGElement> {
  size?: number | string;
  strokeWidth?: number | string;
  absoluteStrokeWidth?: boolean;
}

type LucideIcon = React.ForwardRefExoticComponent<
  Omit<LucideIconProps, "ref"> & React.RefAttributes<SVGSVGElement>
>;

export interface Tool {
  id: string;
  name: string;
  description: string;
  href: string;
  icon?: LucideIcon;
  iconColor?: string;
  available: boolean;
  comingSoon?: boolean;
}

export interface ToolGroup {
  title: string;
  tools: Tool[];
}

export interface ToolCategory {
  id: string;
  name: string;
  description: string;
  icon: LucideIcon;
  iconColor: string;
  iconBg: string;
  groups: ToolGroup[];
  viewAllHref: string;
  status: "completed" | "next" | "planned" | "available";
}

export const TOOL_CATEGORIES: ToolCategory[] = [
  {
    id: "conversion-tools",
    name: "Conversion Tools",
    description: "Convert between PDF, Word, Excel, PowerPoint, images and other formats.",
    icon: RefreshCw,
    iconColor: "#07999A",
    iconBg: "var(--teal-light)",
    status: "completed",
    viewAllHref: "/conversion",
    groups: [
      {
        title: "PDF Conversions",
        tools: [
          { id: "pdf-to-word", name: "PDF to Word", description: "Convert PDF to editable DOCX with layout preservation", href: "/conversion/pdf-to-word", available: true, icon: FileText, iconColor: "#3189D5" },
          { id: "pdf-to-excel", name: "PDF to Excel", description: "Extract tables from PDF to XLSX spreadsheets", href: "/conversion/pdf-to-excel", available: true, icon: FileSpreadsheet, iconColor: "#269B62" },
          { id: "pdf-to-ppt", name: "PDF to PowerPoint", description: "Convert PDF pages to editable PPTX slides", href: "/conversion/pdf-to-ppt", available: true, icon: Presentation, iconColor: "#E57940" },
          { id: "pdf-to-jpg", name: "PDF to JPG", description: "Rasterize PDF pages to high-quality JPG images", href: "/conversion/pdf-to-jpg", available: true, icon: FileImage, iconColor: "#9152D4" },
          { id: "pdf-to-png", name: "PDF to PNG", description: "Rasterize PDF pages to PNG with transparency support", href: "/conversion/pdf-to-png", available: true, icon: FileImage, iconColor: "#9152D4" },
          { id: "pdf-to-txt", name: "PDF to Text", description: "Extract plain text from PDF documents", href: "/conversion/pdf-to-txt", available: true, icon: FileCode, iconColor: "#6686A5" },
          { id: "pdf-to-html", name: "PDF to HTML", description: "Convert PDF to structured HTML with layout preservation", href: "/conversion/pdf-to-html", available: true, icon: FileCode, iconColor: "#6686A5" },
          { id: "pdf-to-pdfa", name: "PDF to PDF/A", description: "Convert to archival PDF/A standard", href: "/conversion/pdf-to-pdfa", available: true, icon: FilePdf, iconColor: "#E45B55" },
        ],
      },
      {
        title: "Office to PDF",
        tools: [
          { id: "word-to-pdf", name: "Word to PDF", description: "Convert DOCX/DOC to PDF preserving formatting", href: "/conversion/word-to-pdf", available: true, icon: FilePdf, iconColor: "#E45B55" },
          { id: "excel-to-pdf", name: "Excel to PDF", description: "Convert XLSX/XLS to PDF with sheet fidelity", href: "/conversion/excel-to-pdf", available: true, icon: FilePdf, iconColor: "#E45B55" },
          { id: "ppt-to-pdf", name: "PowerPoint to PDF", description: "Convert PPTX/PPT to PDF preserving slides", href: "/conversion/ppt-to-pdf", available: true, icon: FilePdf, iconColor: "#E45B55" },
        ],
      },
      {
        title: "Office Document Conversions",
        tools: [
          { id: "word-to-txt", name: "Word to Text", description: "Extract plain text from Word documents", href: "/conversion/word-to-txt", available: true, icon: FileCode, iconColor: "#6686A5" },
          { id: "word-to-html", name: "Word to HTML", description: "Convert DOCX to clean HTML", href: "/conversion/word-to-html", available: true, icon: FileCode, iconColor: "#6686A5" },
          { id: "excel-to-csv", name: "Excel to CSV", description: "Convert spreadsheets to CSV format", href: "/conversion/excel-to-csv", available: true, icon: FileSpreadsheet, iconColor: "#269B62" },
        ],
      },
      {
        title: "Image Conversions",
        tools: [
          { id: "jpg-to-png", name: "JPG to PNG", description: "Convert JPG to lossless PNG with transparency", href: "/conversion/jpg-to-png", available: true, icon: FileImage, iconColor: "#9152D4" },
          { id: "png-to-jpg", name: "PNG to JPG", description: "Convert PNG to compressed JPG", href: "/conversion/png-to-jpg", available: true, icon: FileImage, iconColor: "#9152D4" },
          { id: "webp-to-jpg", name: "WEBP to JPG", description: "Convert WEBP to widely compatible JPG", href: "/conversion/webp-to-jpg", available: true, icon: FileImage, iconColor: "#9152D4" },
          { id: "jpg-to-webp", name: "JPG to WEBP", description: "Convert JPG to modern WEBP format", href: "/conversion/jpg-to-webp", available: true, icon: FileImage, iconColor: "#9152D4" },
          { id: "png-to-webp", name: "PNG to WEBP", description: "Convert PNG to WEBP with transparency", href: "/conversion/png-to-webp", available: true, icon: FileImage, iconColor: "#9152D4" },
          { id: "svg-to-png", name: "SVG to PNG", description: "Rasterize vector SVG to PNG", href: "/conversion/svg-to-png", available: true, icon: FileImage, iconColor: "#9152D4" },
          { id: "images-to-pdf", name: "Images to PDF", description: "Combine multiple images into a single PDF", href: "/conversion/images-to-pdf", available: true, icon: FilePdf, iconColor: "#E45B55" },
        ],
      },
      {
        title: "Other Conversions",
        tools: [
          { id: "txt-to-pdf", name: "Text to PDF", description: "Convert plain text files to PDF", href: "/conversion/txt-to-pdf", available: true, icon: FilePdf, iconColor: "#E45B55" },
          { id: "html-to-pdf", name: "HTML to PDF", description: "Convert HTML pages to PDF documents", href: "/conversion/html-to-pdf", available: true, icon: FilePdf, iconColor: "#E45B55" },
          { id: "csv-to-excel", name: "CSV to Excel", description: "Convert CSV data to XLSX spreadsheets", href: "/conversion/csv-to-excel", available: true, icon: FileSpreadsheet, iconColor: "#269B62" },
          { id: "rtf-to-docx", name: "RTF to Word", description: "Convert Rich Text Format to DOCX", href: "/conversion/rtf-to-word", available: true, icon: FileText, iconColor: "#3189D5" },
        ],
      },
    ],
  },
  {
    id: "pdf-tools",
    name: "PDF Tools",
    description: "Merge, split, compress, rotate, protect, unlock, organize and edit PDFs.",
    icon: FilePdf,
    iconColor: "#2696D6",
    iconBg: "var(--blue-light)",
    status: "next",
    viewAllHref: "/conversion?category=pdf-tools",
    groups: [
      {
        title: "Organize PDF",
        tools: [
          { id: "merge-pdf", name: "Merge PDF", description: "Combine multiple PDFs into one document", href: "/conversion/pdf-tools/merge", available: false, comingSoon: true, icon: Plus, iconColor: "#E45B55" },
          { id: "split-pdf", name: "Split PDF", description: "Split PDF into separate files", href: "/conversion/pdf-tools/split", available: false, comingSoon: true, icon: Scissors, iconColor: "#E45B55" },
          { id: "organize-pdf", name: "Organize PDF Pages", description: "Reorder, rotate, delete pages", href: "/conversion/pdf-tools/organize", available: false, comingSoon: true, icon: LayoutGrid, iconColor: "#E45B55" },
          { id: "delete-pdf-pages", name: "Delete PDF Pages", description: "Remove unwanted pages from PDF", href: "/conversion/pdf-tools/delete-pages", available: false, comingSoon: true, icon: Minus, iconColor: "#E45B55" },
          { id: "extract-pdf-pages", name: "Extract PDF Pages", description: "Extract specific pages as new PDF", href: "/conversion/pdf-tools/extract", available: false, comingSoon: true, icon: Scissors, iconColor: "#E45B55" },
          { id: "rotate-pdf", name: "Rotate PDF", description: "Rotate PDF pages", href: "/conversion/pdf-tools/rotate", available: false, comingSoon: true, icon: RotateCcw, iconColor: "#E45B55" },
          { id: "add-page-numbers", name: "Add Page Numbers", description: "Add page numbers to PDF", href: "/conversion/pdf-tools/page-numbers", available: false, comingSoon: true, icon: Hash, iconColor: "#E45B55" },
          { id: "add-watermark", name: "Add Watermark", description: "Add text or image watermark", href: "/conversion/pdf-tools/watermark", available: false, comingSoon: true, icon: Eye, iconColor: "#E45B55" },
        ],
      },
      {
        title: "Optimize PDF",
        tools: [
          { id: "compress-pdf", name: "Compress PDF", description: "Reduce PDF file size", href: "/compression/pdf", available: true, icon: Zap, iconColor: "#E45B55" },
        ],
      },
      {
        title: "Secure PDF",
        tools: [
          { id: "protect-pdf", name: "Protect PDF", description: "Add password protection to PDF", href: "/conversion/pdf-tools/protect", available: false, comingSoon: true, icon: Lock, iconColor: "#E45B55" },
          { id: "unlock-pdf", name: "Unlock PDF", description: "Remove password from PDF", href: "/conversion/pdf-tools/unlock", available: false, comingSoon: true, icon: Unlock, iconColor: "#E45B55" },
        ],
      },
      {
        title: "Edit and Convert PDF",
        tools: [
          { id: "edit-pdf", name: "Edit PDF", description: "Edit PDF content directly", href: "/conversion/pdf-tools/edit", available: false, comingSoon: true, icon: Edit, iconColor: "#E45B55" },
          { id: "pdf-to-word", name: "PDF to Word", description: "Convert PDF to editable DOCX", href: "/conversion/pdf-to-word", available: true, icon: FileText, iconColor: "#3189D5" },
          { id: "pdf-to-jpg", name: "PDF to JPG", description: "Convert PDF pages to JPG images", href: "/conversion/pdf-to-jpg", available: true, icon: FileImage, iconColor: "#9152D4" },
          { id: "pdf-to-png", name: "PDF to PNG", description: "Convert PDF pages to PNG images", href: "/conversion/pdf-to-png", available: true, icon: FileImage, iconColor: "#9152D4" },
        ],
      },
    ],
  },
  {
    id: "document-tools",
    name: "Document Tools",
    description: "Create, edit and process Word, Excel and PowerPoint documents.",
    icon: FileText,
    iconColor: "#25A85A",
    iconBg: "var(--green-light)",
    status: "planned",
    viewAllHref: "/conversion?category=document-tools",
    groups: [
      {
        title: "Word Documents",
        tools: [
          { id: "word-editor", name: "Word Editor", description: "Edit DOCX documents online", href: "/editor", available: true, icon: PenTool, iconColor: "#3189D5" },
          { id: "pdf-to-word", name: "PDF to Word", description: "Convert PDF to editable DOCX", href: "/conversion/pdf-to-word", available: true, icon: FileText, iconColor: "#3189D5" },
          { id: "word-to-pdf", name: "Word to PDF", description: "Convert DOCX to PDF", href: "/conversion/word-to-pdf", available: true, icon: FilePdf, iconColor: "#E45B55" },
          { id: "word-to-txt", name: "Word to Text", description: "Extract text from Word documents", href: "/conversion/word-to-txt", available: true, icon: FileCode, iconColor: "#6686A5" },
          { id: "word-to-html", name: "Word to HTML", description: "Convert DOCX to clean HTML", href: "/conversion/word-to-html", available: true, icon: FileCode, iconColor: "#6686A5" },
        ],
      },
      {
        title: "Spreadsheets",
        tools: [
          { id: "excel-to-csv", name: "Excel to CSV", description: "Convert spreadsheets to CSV", href: "/conversion/excel-to-csv", available: true, icon: FileSpreadsheet, iconColor: "#269B62" },
          { id: "csv-to-excel", name: "CSV to Excel", description: "Convert CSV data to XLSX", href: "/conversion/csv-to-excel", available: true, icon: FileSpreadsheet, iconColor: "#269B62" },
          { id: "excel-to-pdf", name: "Excel to PDF", description: "Convert spreadsheets to PDF", href: "/conversion/excel-to-pdf", available: true, icon: FilePdf, iconColor: "#E45B55" },
        ],
      },
      {
        title: "Presentations",
        tools: [
          { id: "ppt-to-pdf", name: "PowerPoint to PDF", description: "Convert PPTX to PDF", href: "/conversion/ppt-to-pdf", available: true, icon: FilePdf, iconColor: "#E45B55" },
        ],
      },
      {
        title: "Document Processing",
        tools: [
          { id: "rtf-to-docx", name: "RTF to Word", description: "Convert RTF to DOCX", href: "/conversion/rtf-to-word", available: true, icon: FileText, iconColor: "#3189D5" },
          { id: "txt-to-pdf", name: "Text to PDF", description: "Convert plain text to PDF", href: "/conversion/txt-to-pdf", available: true, icon: FilePdf, iconColor: "#E45B55" },
          { id: "html-to-pdf", name: "HTML to PDF", description: "Convert HTML pages to PDF", href: "/conversion/html-to-pdf", available: true, icon: FilePdf, iconColor: "#E45B55" },
        ],
      },
    ],
  },
  {
    id: "image-tools",
    name: "Image Tools",
    description: "Convert, optimize, resize, crop and edit images.",
    icon: Image,
    iconColor: "#9347D5",
    iconBg: "var(--purple-light)",
    status: "planned",
    viewAllHref: "/conversion?category=image-tools",
    groups: [
      {
        title: "Image Conversion",
        tools: [
          { id: "jpg-to-png", name: "JPG to PNG", description: "Convert JPG to lossless PNG", href: "/conversion/jpg-to-png", available: true, icon: FileImage, iconColor: "#9152D4" },
          { id: "png-to-jpg", name: "PNG to JPG", description: "Convert PNG to compressed JPG", href: "/conversion/png-to-jpg", available: true, icon: FileImage, iconColor: "#9152D4" },
          { id: "jpg-to-webp", name: "JPG to WEBP", description: "Convert JPG to modern WEBP", href: "/conversion/jpg-to-webp", available: true, icon: FileImage, iconColor: "#9152D4" },
          { id: "png-to-webp", name: "PNG to WEBP", description: "Convert PNG to WEBP with transparency", href: "/conversion/png-to-webp", available: true, icon: FileImage, iconColor: "#9152D4" },
          { id: "webp-to-jpg", name: "WEBP to JPG", description: "Convert WEBP to JPG", href: "/conversion/webp-to-jpg", available: true, icon: FileImage, iconColor: "#9152D4" },
          { id: "svg-to-png", name: "SVG to PNG", description: "Rasterize vector SVG to PNG", href: "/conversion/svg-to-png", available: true, icon: FileImage, iconColor: "#9152D4" },
          { id: "images-to-pdf", name: "Images to PDF", description: "Combine images into PDF", href: "/conversion/images-to-pdf", available: true, icon: FilePdf, iconColor: "#E45B55" },
        ],
      },
      {
        title: "Image Optimization",
        tools: [
          { id: "compress-jpg", name: "Compress JPG", description: "Reduce JPG file size", href: "/compression/jpg", available: true, icon: Zap, iconColor: "#9152D4" },
          { id: "compress-png", name: "Compress PNG", description: "Reduce PNG file size", href: "/compression/png", available: true, icon: Zap, iconColor: "#9152D4" },
          { id: "compress-webp", name: "Compress WEBP", description: "Reduce WEBP file size", href: "/compression/webp", available: true, icon: Zap, iconColor: "#9152D4" },
        ],
      },
      {
        title: "Image Editing",
        tools: [
          { id: "resize-image", name: "Image Resizer", description: "Resize images to custom dimensions", href: "/conversion/image-tools/resize", available: false, comingSoon: true, icon: LayoutGrid, iconColor: "#9152D4" },
          { id: "crop-image", name: "Image Cropper", description: "Crop images precisely", href: "/conversion/image-tools/crop", available: false, comingSoon: true, icon: Scissors, iconColor: "#9152D4" },
          { id: "image-editor", name: "Image Editor", description: "Edit images online", href: "/conversion/image-tools/editor", available: false, comingSoon: true, icon: Edit, iconColor: "#9152D4" },
        ],
      },
      {
        title: "Background Tools",
        tools: [
          { id: "remove-background", name: "Background Remover", description: "Remove image backgrounds automatically", href: "/conversion/image-tools/remove-bg", available: false, comingSoon: true, icon: Eye, iconColor: "#9152D4" },
        ],
      },
    ],
  },
  {
    id: "compression-tools",
    name: "Compression Tools",
    description: "Reduce file sizes for PDF and images with professional-grade compression.",
    icon: ArchiveIcon,
    iconColor: "#E58A35",
    iconBg: "var(--orange-light)",
    status: "available",
    viewAllHref: "/compression",
    groups: [
      {
        title: "PDF Compression",
        tools: [
          { id: "pdf", name: "Compress PDF", description: "Reduce PDF file size with 3 compression levels", href: "/compression/pdf", available: true, icon: FilePdf, iconColor: "#E45B55" },
        ],
      },
      {
        title: "Image Compression",
        tools: [
          { id: "jpg", name: "Compress JPG", description: "Adjustable quality with progressive option", href: "/compression/jpg", available: true, icon: Image, iconColor: "#9152D4" },
          { id: "png", name: "Compress PNG", description: "Lossless or optimized compression", href: "/compression/png", available: true, icon: Image, iconColor: "#9152D4" },
          { id: "webp", name: "Compress WEBP", description: "Lossy and lossless modes", href: "/compression/webp", available: true, icon: Image, iconColor: "#9152D4" },
        ],
      },
      {
        title: "Bulk Compression",
        tools: [
          { id: "bulk-images", name: "Bulk Image Compressor", description: "Multiple images → ZIP archive", href: "/compression/bulk-images", available: true, icon: Download, iconColor: "#25A85A" },
        ],
      },
    ],
  },
  {
    id: "text-tools",
    name: "Text Tools",
    description: "Analyze, compare, transform and format text.",
    icon: Type,
    iconColor: "#368BD2",
    iconBg: "var(--blue-light)",
    status: "planned",
    viewAllHref: "/conversion?category=text-tools",
    groups: [
      {
        title: "Text Analysis",
        tools: [
          { id: "word-counter", name: "Word Counter", description: "Count words, characters, sentences", href: "/conversion/text-tools/word-counter", available: false, comingSoon: true, icon: Hash, iconColor: "#6686A5" },
          { id: "character-counter", name: "Character Counter", description: "Count characters with/without spaces", href: "/conversion/text-tools/character-counter", available: false, comingSoon: true, icon: Hash, iconColor: "#6686A5" },
          { id: "sentence-counter", name: "Sentence Counter", description: "Count sentences and paragraphs", href: "/conversion/text-tools/sentence-counter", available: false, comingSoon: true, icon: Hash, iconColor: "#6686A5" },
        ],
      },
      {
        title: "Text Formatting",
        tools: [
          { id: "case-converter", name: "Case Converter", description: "Convert text case (upper, lower, title, sentence)", href: "/conversion/text-tools/case-converter", available: false, comingSoon: true, icon: Type, iconColor: "#6686A5" },
          { id: "remove-extra-spaces", name: "Remove Extra Spaces", description: "Clean up whitespace in text", href: "/conversion/text-tools/remove-spaces", available: false, comingSoon: true, icon: Scissors, iconColor: "#6686A5" },
          { id: "remove-duplicate-lines", name: "Remove Duplicate Lines", description: "Remove duplicate lines from text", href: "/conversion/text-tools/remove-duplicates", available: false, comingSoon: true, icon: Minus, iconColor: "#6686A5" },
          { id: "text-formatter", name: "Text Formatter", description: "Format and beautify text", href: "/conversion/text-tools/formatter", available: false, comingSoon: true, icon: Edit, iconColor: "#6686A5" },
          { id: "text-sorter", name: "Text Sorter", description: "Sort lines alphabetically", href: "/conversion/text-tools/sorter", available: false, comingSoon: true, icon: LayoutGrid, iconColor: "#6686A5" },
        ],
      },
      {
        title: "Text Comparison",
        tools: [
          { id: "text-compare", name: "Text Compare", description: "Compare two texts and highlight differences", href: "/conversion/text-tools/compare", available: false, comingSoon: true, icon: Search, iconColor: "#6686A5" },
        ],
      },
      {
        title: "Text Utilities",
        tools: [
          { id: "find-replace", name: "Find and Replace", description: "Find and replace text patterns", href: "/conversion/text-tools/find-replace", available: false, comingSoon: true, icon: Search, iconColor: "#6686A5" },
        ],
      },
    ],
  },
  {
    id: "utility-tools",
    name: "Utility Tools",
    description: "Useful utilities for files, data and everyday tasks.",
    icon: Wrench,
    iconColor: "#8054C8",
    iconBg: "var(--purple-light)",
    status: "planned",
    viewAllHref: "/conversion?category=utility-tools",
    groups: [
      {
        title: "File Utilities",
        tools: [
          { id: "file-hash", name: "File Hash Generator", description: "Generate MD5, SHA-1, SHA-256 hashes", href: "/conversion/utility-tools/file-hash", available: false, comingSoon: true, icon: Hash, iconColor: "#07999A" },
          { id: "file-type-detector", name: "File Type Detector", description: "Identify file types and MIME types", href: "/conversion/utility-tools/file-type", available: false, comingSoon: true, icon: Search, iconColor: "#07999A" },
          { id: "metadata-viewer", name: "Metadata Viewer", description: "View file metadata and EXIF data", href: "/conversion/utility-tools/metadata", available: false, comingSoon: true, icon: Eye, iconColor: "#07999A" },
        ],
      },
      {
        title: "Generators",
        tools: [
          { id: "qr-generator", name: "QR Code Generator", description: "Generate QR codes for URLs, text, WiFi", href: "/conversion/utility-tools/qr-generator", available: false, comingSoon: true, icon: QrCode, iconColor: "#07999A" },
          { id: "password-generator", name: "Password Generator", description: "Generate secure random passwords", href: "/conversion/utility-tools/password-generator", available: false, comingSoon: true, icon: Key, iconColor: "#07999A" },
        ],
      },
      {
        title: "Encoders and Decoders",
        tools: [
          { id: "base64-encode", name: "Base64 Encoder", description: "Encode text/files to Base64", href: "/conversion/utility-tools/base64-encode", available: false, comingSoon: true, icon: Loader, iconColor: "#07999A" },
          { id: "base64-decode", name: "Base64 Decoder", description: "Decode Base64 to text/files", href: "/conversion/utility-tools/base64-decode", available: false, comingSoon: true, icon: Loader, iconColor: "#07999A" },
          { id: "url-encode", name: "URL Encoder", description: "Encode URLs and special characters", href: "/conversion/utility-tools/url-encode", available: false, comingSoon: true, icon: Link2, iconColor: "#07999A" },
          { id: "url-decode", name: "URL Decoder", description: "Decode URL-encoded strings", href: "/conversion/utility-tools/url-decode", available: false, comingSoon: true, icon: Link2, iconColor: "#07999A" },
        ],
      },
    ],
  },
  {
    id: "online-editor",
    name: "Online Editor",
    description: "Edit Word documents and PDFs through the ZipDrop editing workflow.",
    icon: PenTool,
    iconColor: "#22A765",
    iconBg: "var(--green-light)",
    status: "available",
    viewAllHref: "/editor",
    groups: [
      {
        title: "Document Editing",
        tools: [
          { id: "word-editor", name: "Word Editor", description: "Edit DOCX documents online with full formatting", href: "/editor", available: true, icon: PenTool, iconColor: "#3189D5" },
          { id: "edit-docx", name: "Edit DOCX", description: "Open and edit Word documents", href: "/editor", available: true, icon: FileText, iconColor: "#3189D5" },
        ],
      },
      {
        title: "PDF Editing",
        tools: [
          { id: "pdf-editor", name: "PDF Editor", description: "Edit PDF content directly", href: "/conversion/editor/pdf", available: false, comingSoon: true, icon: FilePdf, iconColor: "#E45B55" },
          { id: "edit-pdf", name: "Edit PDF", description: "Open and edit PDF documents", href: "/conversion/editor/pdf", available: false, comingSoon: true, icon: Edit, iconColor: "#E45B55" },
        ],
      },
      {
        title: "Document Viewing",
        tools: [
          { id: "document-viewer", name: "Document Viewer", description: "View documents without editing", href: "/editor", available: true, icon: Eye, iconColor: "#6686A5" },
        ],
      },
    ],
  },
];

export function getCategoryById(id: string): ToolCategory | undefined {
  return TOOL_CATEGORIES.find((cat) => cat.id === id);
}

export const DEFAULT_CATEGORY_ID = "conversion-tools";