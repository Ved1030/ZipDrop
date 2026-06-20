export default function Page() {
  return (
    <main style={{ maxWidth: "800px", margin: "50px auto", padding: "20px" }}>
      <h1>Free WeTransfer Alternative for Fast File Sharing</h1>

      <p>
        ZipDrop is a free WeTransfer alternative that lets users share files
        and text instantly through a secure 4-digit code.
      </p>

      <h2>Features</h2>

      <ul>
        <li>Fast uploads</li>
        <li>No registration</li>
        <li>Instant code generation</li>
        <li>Cross-device sharing</li>
        <li>Simple user interface</li>
      </ul>

      <h2>Why choose ZipDrop?</h2>

      <p>
        ZipDrop focuses on simplicity. Upload a file, receive a code, and
        access it from another device in seconds.
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