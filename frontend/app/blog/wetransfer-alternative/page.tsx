export default function Page() {
  return (
    <main style={{ maxWidth: "800px", margin: "50px auto", padding: "20px" }}>
      <h1>Free WeTransfer Alternative for Fast File Sharing</h1>

      <p>
        ZipDrop is a free WeTransfer alternative that lets users share files
        and text through a 4-digit code, with no account needed.
      </p>

      <h2>Features</h2>

      <ul>
        <li>No registration</li>
        <li>No compression, so quality is preserved</li>
        <li>Cross-device sharing through a browser</li>
        <li>Up to 10 files per transfer, 1 GB per file</li>
        <li>Simple user interface</li>
      </ul>

      <h2>Why choose ZipDrop?</h2>

      <p>
        ZipDrop focuses on simplicity. Upload a file, receive a code, and open it
        on another device.
      </p>
      <div className="mt-10">
  <a
    href="/"
    className="inline-block rounded-lg bg-blue-600 px-6 py-3 text-white font-medium hover:bg-blue-700"
  >
    Try ZipDrop Now
  </a>
</div>
    </main>
    
  );
}