import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "How to Transfer Files Without a USB Cable",
  description:
    "Discover how to transfer files between devices without using USB cables.",
};

export default function Page() {
  return (
    <main className="max-w-4xl mx-auto p-8">
      <h1>How to Transfer Files Without a USB Cable</h1>

      <p>
        USB cables have been used for file transfers for years, but they are not
        always convenient. Users often lose cables, use incompatible connectors,
        or simply want a faster solution.
      </p>

      <h2>Problems With USB Transfers</h2>

      <ul>
        <li>Cables can be misplaced or damaged</li>
        <li>Different devices use different connectors</li>
        <li>Transfers require physical access</li>
        <li>Additional software may be needed</li>
      </ul>

      <h2>A Simpler Alternative</h2>

      <p>
        ZipDrop lets you transfer files between devices using a secure 4-digit
        code directly in your browser.
      </p>

      <ol>
        <li>Open ZipDrop on your first device.</li>
        <li>Upload your file.</li>
        <li>Receive a 4-digit code.</li>
        <li>Open ZipDrop on your second device.</li>
        <li>Enter the code and download instantly.</li>
      </ol>

      <h2>Benefits</h2>

      <ul>
        <li>No cables required</li>
        <li>No apps or software installation</li>
        <li>Works across platforms</li>
        <li>Fast and secure file sharing</li>
      </ul>

      <p>
        ZipDrop makes transferring files between devices simple, fast, and
        cable-free.
      </p>
    </main>
  );
}