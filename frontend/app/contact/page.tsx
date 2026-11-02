import type { Metadata } from "next";
import PageShell from "@/components/PageShell";
import { CONTACT_EMAIL } from "@/lib/site";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Contact ZipDrop for feedback, bug reports, privacy or deletion requests, and abuse reports.",
};

export default function ContactPage() {
  return (
    <PageShell title="Contact ZipDrop">
      <p>
        ZipDrop is run by two students, so email is the best way to reach us. Send
        a message to{" "}
        <a href={`mailto:${CONTACT_EMAIL}?subject=ZipDrop%20enquiry`}>
          {CONTACT_EMAIL}
        </a>
        .
      </p>

      <h2>Feedback and bug reports</h2>
      <p>
        Tell us what you were trying to do, what happened instead, and which
        browser and device you used. If a transfer failed, include the 4-digit
        code if you still have it.
      </p>

      <h2>Privacy and deletion requests</h2>
      <p>
        Because ZipDrop has no accounts, we need something that identifies the
        transfer: the 4-digit code or the file URL. Read the{" "}
        <a href="/privacy">Privacy Policy</a> for what we store and how long it is
        kept.
      </p>

      <h2>Abuse reports</h2>
      <p>
        If content on ZipDrop is illegal or harmful, please follow the steps on
        the <a href="/report-abuse">Report Abuse</a> page so we can act on it
        quickly.
      </p>

      <h2>Security issues</h2>
      <p>
        If you find a vulnerability, email us with enough detail to reproduce it,
        and give us a reasonable chance to fix it before making it public. Please
        do not access, download, or share other people&rsquo;s files while
        testing.
      </p>

      <div className="cta-row">
        <a
          className="cta"
          href={`mailto:${CONTACT_EMAIL}?subject=ZipDrop%20feedback`}
        >
          Email ZipDrop
        </a>
        <a className="cta secondary" href="/report-abuse">
          Report abuse
        </a>
      </div>
    </PageShell>
  );
}
