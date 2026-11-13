import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Document Editor – Open and Edit Shared Files",
  description:
    "Open a document shared through ZipDrop in the browser, make edits, and share the edited copy with a new 4-digit code.",
  alternates: { canonical: "/editor" },
};

export default function EditorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
