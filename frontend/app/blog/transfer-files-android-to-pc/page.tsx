import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "How to Transfer Files From Android to PC",
  description:
    "Learn how to transfer files from Android to PC without cables or additional software.",
};

export default function Page() {
  return (
    <main className="max-w-4xl mx-auto p-8">
      <h1>How to Transfer Files From Android to PC</h1>

      <p>
        Moving files from an Android phone to a PC should be simple. Whether
        you're sharing photos, videos, documents, or presentations, traditional
        methods often require extra steps.
      </p>

      <h2>Common Transfer Methods</h2>

      <ul>
        <li>USB cables</li>
        <li>Email attachments</li>
        <li>Cloud storage services</li>
        <li>Messaging apps</li>
      </ul>

      <p>
        These methods can be slow, inconvenient, or require additional accounts.
      </p>

      <h2>How ZipDrop Works</h2>

      <ol>
        <li>Open ZipDrop on your Android device.</li>
        <li>Upload your file.</li>
        <li>Receive a 4-digit code.</li>
        <li>Open ZipDrop on your PC.</li>
        <li>Enter the code.</li>
        <li>Download instantly.</li>
      </ol>

      <h2>Benefits</h2>

      <ul>
        <li>No cables required</li>
        <li>No account needed</li>
        <li>Works in any browser</li>
        <li>Fast and secure</li>
      </ul>

      <p>
        ZipDrop makes transferring files from Android to PC simple and
        convenient.
      </p>
    </main>
  );
}