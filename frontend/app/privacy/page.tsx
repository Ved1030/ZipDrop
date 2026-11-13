import type { Metadata } from "next";
import PageShell from "@/components/PageShell";
import { CONTACT_EMAIL } from "@/lib/site";

export const metadata: Metadata = {
  alternates: { canonical: "/privacy" },
  title: "Privacy Policy",
  description:
    "How ZipDrop handles your files and data: where files are stored, which third-party services are used, what is logged, and how retention currently works.",
};

export default function PrivacyPage() {
  return (
    <PageShell title="Privacy Policy" updated="2 November 2026">
      <p>
        ZipDrop is a free file and text sharing service operated by Ved Mehta and
        Virti Panchamia. This page explains, in plain language, what data ZipDrop
        handles, where it is stored, and what you should know before uploading a
        file.
      </p>

      <h2>What we collect</h2>
      <ul>
        <li>
          <strong>Content you upload:</strong> the files and text you choose to
          share, along with file names and sizes.
        </li>
        <li>
          <strong>Transfer details:</strong> the 4-digit code generated for a
          transfer, the upload time, and an expiry timestamp.
        </li>
        <li>
          <strong>Technical data:</strong> IP address, browser and device type,
          and requested pages. This may be recorded in server logs at our hosting
          provider.
        </li>
        <li>
          <strong>Analytics data:</strong> aggregated page views and performance
          measurements from Vercel Analytics and Speed Insights, and visit data
          from Google Analytics (which uses cookies).
        </li>
      </ul>

      <p>
        ZipDrop has no user accounts, so we do not collect names, email addresses,
        or passwords from people using the service.
      </p>

      <h2>Where your data is processed</h2>
      <ul>
        <li>
          <strong>Supabase</strong> stores uploaded files and the database records
          that connect a 4-digit code to a transfer.
        </li>
        <li>
          <strong>Vercel</strong> hosts the website, runs the server functions,
          and provides Vercel Analytics and Speed Insights.
        </li>
        <li>
          <strong>Google Analytics</strong> collects usage statistics through the
          gtag.js script. Google Analytics sets cookies in your browser.
        </li>
        <li>
          <strong>Google Fonts</strong> serves the fonts used on the site; your
          browser connects to Google&rsquo;s servers to load them.
        </li>
      </ul>

      <p>
        Each provider processes data under its own terms and privacy policy. These
        providers may store data outside your country, including in the United
        States.
      </p>

      <h2>Uploaded files are stored in a public storage bucket</h2>
      <p>
        Files are stored in a Supabase storage bucket that is publicly readable.
        That means each uploaded file has a direct URL that can be opened by
        anyone who has it, without entering the 4-digit code. The code is how
        people normally find a transfer, but it is not the only way a file can be
        reached. ZipDrop is not a private vault, and you should not upload
        confidential documents, identity papers, financial records, or anything
        else you would not want to be publicly reachable.
      </p>

      <h2>How access works</h2>
      <p>
        A 4-digit code has only 10,000 possible values, and ZipDrop does not
        currently rate-limit attempts to look up a code. Someone could guess a
        code, and files can be found through their storage URL as described above.
        For these reasons, upload only content you are comfortable sharing with a
        stranger.
      </p>

      <h2>Retention and deletion</h2>
      <p>
        Each transfer is given a 48-hour expiry timestamp, but{" "}
        <strong>automatic deletion is not implemented yet</strong>. Files are not
        removed automatically when that time passes. They stay in storage until we
        remove them manually.
      </p>
      <p>
        If you want a file or transfer removed, email{" "}
        <a href={`mailto:${CONTACT_EMAIL}?subject=ZipDrop%20deletion%20request`}>
          {CONTACT_EMAIL}
        </a>{" "}
        with the 4-digit code or the file URL and enough detail for us to identify
        it. We will remove it as soon as we reasonably can. Copies may remain in
        provider backups for a limited period. This policy will be updated when
        automatic cleanup is added.
      </p>

      <h2>Cookies and analytics</h2>
      <ul>
        <li>
          Google Analytics uses cookies to distinguish visits and measure usage.
        </li>
        <li>
          Vercel Analytics and Speed Insights collect aggregated, privacy-oriented
          usage and performance data.
        </li>
        <li>
          You can block or delete cookies in your browser settings. Blocking them
          does not prevent you from uploading or downloading files.
        </li>
      </ul>

      <h2>What we do not do</h2>
      <ul>
        <li>We do not sell your data.</li>
        <li>We do not require an account or email address to share a file.</li>
        <li>We do not use your files to train machine-learning models.</li>
        <li>
          We do not provide end-to-end encryption. Files are readable by the
          service while they are stored.
        </li>
      </ul>

      <h2>When we may share information</h2>
      <p>
        We may disclose information if required by law, to respond to a valid
        legal request, to investigate misuse, or to protect the safety and rights
        of others. Misuse reports are handled as described on the{" "}
        <a href="/contact">Contact page</a>.
      </p>

      <h2>Children</h2>
      <p>
        ZipDrop is not intended for children under 13, and we do not knowingly
        collect their data. If you believe a child has uploaded personal
        information, contact us so we can remove it.
      </p>

      <h2>Your choices</h2>
      <p>
        You can ask what data we hold about a transfer, request deletion, or raise
        a privacy concern by emailing{" "}
        <a href={`mailto:${CONTACT_EMAIL}?subject=ZipDrop%20privacy%20request`}>
          {CONTACT_EMAIL}
        </a>
        . Because there are no accounts, we may need the transfer code or file URL
        to identify the relevant record.
      </p>

      <h2>Changes to this policy</h2>
      <p>
        We will update this page when the service changes, for example when
        automatic deletion is added. The date at the top shows when it was last
        revised.
      </p>

      <h2>Contact</h2>
      <p>
        Questions about this policy can be sent to{" "}
        <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>. You can also read
        more <a href="/about">about ZipDrop</a>.
      </p>
    </PageShell>
  );
}
