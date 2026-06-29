import type { Metadata } from "next";
import DocEditor from "@/components/DocEditor";

export const metadata: Metadata = {
  title: "ZipDrop Editor",
  description: "Edit your documents online with ZipDrop",
};

export default function EditorPage({
  searchParams,
}: {
  searchParams: { fileUrl?: string; filename?: string; code?: string };
}) {
  const fileUrl = searchParams.fileUrl || "";
  const filename = searchParams.filename || "document.docx";
  const recipientCode = searchParams.code || "";

  if (!fileUrl) {
    return (
      <main className="max-w-4xl mx-auto p-8">
        <p className="text-gray-500">No file specified.</p>
      </main>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      <DocEditor
        fileUrl={fileUrl}
        filename={filename}
        defaultRecipientCode={recipientCode}
      />
    </div>
  );
}
