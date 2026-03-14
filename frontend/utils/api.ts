const API = process.env.NEXT_PUBLIC_API_URL || "https://zipdrop.onrender.com";

/* Upload Files */

export const uploadFile = async (formData: FormData) => {

  const res = await fetch(`${API}/upload`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    throw new Error(`Upload failed: ${res.status}`);
  }

  return res.json();

};

/* Share Text */

export const shareText = async (text: string) => {

  const res = await fetch(`${API}/share-text`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ text }),
  });

  if (!res.ok) {
    throw new Error(`Share failed: ${res.status}`);
  }

  return res.json();

};

/* Receive Files or Text */

export const receiveData = async (code: string) => {

  const res = await fetch(`${API}/receive/${code}`);

  if (!res.ok) {
    throw new Error(`Receive failed: ${res.status}`);
  }

  return res.json();

};