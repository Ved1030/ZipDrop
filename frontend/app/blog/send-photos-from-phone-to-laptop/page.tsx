import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "How to Send Photos From Phone to Laptop",
  description:
    "Learn how to transfer photos from your phone to your laptop quickly without cables or extra software.",
};

export default function Page() {
  return (
    <main className="max-w-4xl mx-auto p-8">
      <h1>How to Send Photos From Phone to Laptop</h1>

      <p>
        Whether you're backing up memories, sharing work, or moving screenshots,
        sending photos from your phone to your laptop should be quick and easy.
      </p>

      <h2>Traditional Methods</h2>

      <ul>
        <li>USB cables</li>
        <li>Email attachments</li>
        <li>Cloud storage services</li>
        <li>Messaging apps</li>
      </ul>

      <p>
        These methods often require extra setup, accounts, or can reduce image
        quality.
      </p>

      <h2>How ZipDrop Works</h2>

      <ol>
        <li>Open ZipDrop on your phone.</li>
        <li>Select and upload your photos.</li>
        <li>Receive a 4-digit code.</li>
        <li>Open ZipDrop on your laptop.</li>
        <li>Enter the code and download your photos instantly.</li>
      </ol>

      <h2>Why Use ZipDrop?</h2>

      <ul>
        <li>No cables required</li>
        <li>No account creation</li>
        <li>Works on any device</li>
        <li>Simple and secure sharing</li>
      </ul>

      <p>
        ZipDrop helps you transfer photos from your phone to your laptop in
        seconds.
      </p>
    </main>
  );
}