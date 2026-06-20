import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "How to Transfer Files From iPhone to Windows",
  description:
    "Learn how to transfer files from iPhone to Windows quickly without cables or complicated software.",
};

export default function Page() {
  return (
    <main className="max-w-4xl mx-auto p-8">
      <h1>How to Transfer Files From iPhone to Windows</h1>

      <p>
        Sharing files between iPhone and Windows devices can be frustrating.
        Many methods require cables, software installation, or cloud accounts.
      </p>

      <h2>Common Challenges</h2>

      <ul>
        <li>Compatibility issues</li>
        <li>Multiple transfer steps</li>
        <li>Extra software requirements</li>
        <li>Slow workflows</li>
      </ul>

      <h2>Use ZipDrop Instead</h2>

      <p>
        ZipDrop enables fast file sharing between iPhone and Windows devices
        using a simple 4-digit code.
      </p>

      <ol>
        <li>Open ZipDrop on your iPhone.</li>
        <li>Upload your file.</li>
        <li>Receive a 4-digit code.</li>
        <li>Open ZipDrop on your Windows PC.</li>
        <li>Enter the code.</li>
        <li>Download instantly.</li>
      </ol>

      <h2>Benefits</h2>

      <ul>
        <li>No cables required</li>
        <li>No account creation</li>
        <li>Works across devices</li>
        <li>Simple and secure</li>
      </ul>

      <p>
        ZipDrop provides a fast and convenient way to transfer files from
        iPhone to Windows.
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