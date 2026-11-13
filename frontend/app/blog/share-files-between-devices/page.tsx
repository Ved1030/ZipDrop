import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "How to Share Files Between Devices (No App Needed)",
  description:
    "Share files between phones, laptops and tablets with a 4-digit code. ZipDrop works in the browser with no app or account, up to 10 files of 1 GB each.",
  alternates: { canonical: "/blog/share-files-between-devices" },
};

export default function Page() {
  return (
    <main style={{ maxWidth: "800px", margin: "50px auto", padding: "20px" }}>
      <h1>How to Share Files Between Devices</h1>

      <p>
        Sharing files between phones, laptops, tablets, and desktops can be
        frustrating. ZipDrop makes the process simple.
      </p>

      <h2>Steps</h2>

      <ol>
        <li>Upload your file.</li>
        <li>Get a unique 4-digit code.</li>
        <li>Open ZipDrop on another device.</li>
        <li>Enter the code.</li>
        <li>Download the file.</li>
      </ol>

      <p>
        No USB cables, no accounts, and no complicated setup required.
      </p>
      <div className="mt-10">
  <a
    href="/"
    className="zd-blog-cta"
  >
    Try ZipDrop Now
  </a>
</div>
    </main>
  );
}