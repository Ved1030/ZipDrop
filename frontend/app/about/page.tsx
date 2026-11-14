import type { Metadata } from "next";
import PageShell from "@/components/PageShell";
import { AUTHORS, CONTACT_EMAIL, GITHUB_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: "About",
  description:
    "About ZipDrop: a free, browser-based file and text sharing site built by Ved Mehta and Virti Panchamia, and what it does and does not do.",
};

export default function AboutPage() {
  return (
    <PageShell title="About ZipDrop">
      <p>
        ZipDrop is a free file and text sharing site. You open it in a browser,
        upload what you want to send, and get a 4-digit code. The recipient opens
        the same site, enters the code, and downloads the files. There is no
        account, no app, and no fee.
      </p>

      <h2>Why we built it</h2>
      <p>
        Sharing a file between two devices should not require a login, a
        subscription, or a lesson in folder permissions. We wanted something as
        simple as reading out four numbers, so we built it.
      </p>

      <h2>How it works</h2>
      <ol>
        <li>Upload up to 10 files per transfer.</li>
        <li>ZipDrop uploads them and gives you a 4-digit code.</li>
        <li>You send the code to the person who needs the files.</li>
        <li>They open ZipDrop, enter the code, and download.</li>
      </ol>
      <p>
        Files are uploaded to our server and downloaded from there. ZipDrop does
        not make a direct device-to-device connection.
      </p>

      <h2>What ZipDrop does not do</h2>
      <ul>
        <li>
          It does not provide end-to-end encryption. Traffic uses HTTPS, but files
          are stored on our server in a form the service can read.
        </li>
        <li>
          It does not currently delete files automatically. Each transfer has a
          48-hour expiry timestamp, but that timestamp is not enforced yet.
        </li>
        <li>
          It does not use a private vault. Files sit in a publicly readable
          storage bucket, and a 4-digit code can be guessed. Please do not upload
          sensitive or confidential material.
        </li>
        <li>It does not sell data or use uploaded files to train models.</li>
      </ul>
      <p>
        The <a href="/privacy">Privacy Policy</a> explains storage, logging, and
        retention in more detail.
      </p>

      <h2>Who we are</h2>
      <p>
        ZipDrop is built and maintained by{" "}
        <a href={AUTHORS[0].linkedin} target="_blank" rel="noopener noreferrer">
          Ved Mehta
        </a>{" "}
        and{" "}
        <a href={AUTHORS[1].linkedin} target="_blank" rel="noopener noreferrer">
          Virti Panchamia
        </a>
        , engineering students at DJ Sanghvi College of Engineering. You can find
        our code on{" "}
        <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer">
          GitHub
        </a>
        .
      </p>

      <h2>Get in touch</h2>
      <p>
        Feedback, bug reports, and questions are welcome at{" "}
        <a href={`mailto:${CONTACT_EMAIL}?subject=ZipDrop%20feedback`}>
          {CONTACT_EMAIL}
        </a>
        . The <a href="/contact">Contact</a> page explains what to include.
      </p>

      <div className="cta-row">
        <a className="cta" href="/">
          Try ZipDrop
        </a>
        <a className="cta secondary" href="/contact">
          Contact us
        </a>
      </div>
    </PageShell>
  );
}
