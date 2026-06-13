import { Metadata } from "next";

export const metadata: Metadata = {
  title: "How to Share Files Between Phone and PC",
  description:
    "Learn how to transfer files between your phone and PC without cables.",
};

export default function Page() {
  return (
    <main className="max-w-4xl mx-auto p-8">
      <h1>How to Share Files Between Phone and PC</h1>

      <p>
        Transferring files between phones and PCs is something millions of users
        do every day. Whether you need to move photos, videos, PDFs, or
        documents, the process should be simple and reliable.
      </p>

      <h2>Traditional Methods</h2>

      <p>
        USB cables have long been used for file transfers, but they are not
        always convenient. Users may not have the correct cable available, and
        connecting devices can sometimes create compatibility issues.
      </p>

      <h2>Other Common Methods</h2>

      <ul>
        <li>Email attachments</li>
        <li>Cloud storage services</li>
        <li>Messaging applications</li>
        <li>External storage devices</li>
      </ul>

      <p>
        While these methods work, they often require additional accounts,
        software, or multiple steps.
      </p>

      <h2>How ZipDrop Simplifies File Sharing</h2>

      <p>
        ZipDrop allows users to share files and text between devices using a
        secure 4-digit code.
      </p>

      <ol>
        <li>Open ZipDrop on your phone.</li>
        <li>Upload a file.</li>
        <li>Receive a code.</li>
        <li>Open ZipDrop on your PC.</li>
        <li>Enter the code.</li>
        <li>Download the file instantly.</li>
      </ol>

      <h2>Benefits</h2>

      <ul>
        <li>No cables required</li>
        <li>No login needed</li>
        <li>Works on modern browsers</li>
        <li>Simple and fast</li>
        <li>Cross-platform compatibility</li>
      </ul>

      <h2>Conclusion</h2>

      <p>
        ZipDrop provides a quick and user-friendly way to share files between
        phones and PCs without complicated setup or extra software.
      </p>
    </main>
  );
}