export async function openFileInEditor(file: {
  file_name: string;
  file_url: string;
  file_size?: number;
  recipient_code?: string;
}): Promise<void> {
  const params = new URLSearchParams({
    fileUrl: file.file_url,
    filename: file.file_name,
  });
  if (file.recipient_code) params.set("code", file.recipient_code);
  window.open(`/editor?${params.toString()}`, "_blank");
}
