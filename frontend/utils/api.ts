// All requests proxied via next.config.js: /api/* → http://localhost:5000/*

export const uploadFile = async (formData: FormData) => {
  const res = await fetch(`/api/upload`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) throw new Error(`Upload failed: ${res.status}`);
  return res.json();
};

export const shareText = async (text: string) => {
  const res = await fetch(`/api/share-text`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ text }),
  });

  if (!res.ok) throw new Error(`Share failed: ${res.status}`);
  return res.json();
};