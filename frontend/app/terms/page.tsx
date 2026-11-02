import type { Metadata } from "next";
import PageShell from "@/components/PageShell";
import { CONTACT_EMAIL } from "@/lib/site";

export const metadata: Metadata = {
  title: "Terms of Use",
  description:
    "The terms that apply when you use ZipDrop: acceptable use, file limits, storage and retention, and the limits of the service.",
};

export default function TermsPage() {
  return (
    <PageShell title="Terms of Use" updated="2 November 2026">
      <p>
        These terms apply when you use ZipDrop, a free file and text sharing
        service operated by Ved Mehta and Virti Panchamia. By using the site, you
        agree to them. If you do not agree, do not use ZipDrop.
      </p>

      <h2>The service</h2>
      <ul>
        <li>ZipDrop is free to use and requires no account.</li>
        <li>
          You can upload up to 10 files per transfer, with a maximum of 1 GB per
          file.
        </li>
        <li>
          Each upload produces a 4-digit code. Anyone who enters that code can
          open the transfer.
        </li>
        <li>Text can also be shared through the same code-based flow.</li>
      </ul>

      <h2>Acceptable use</h2>
      <p>You must not use ZipDrop to upload, store, or share:</p>
      <ul>
        <li>content that is illegal where you or the recipient are located;</li>
        <li>
          malware, phishing material, or files designed to harm devices or people;
        </li>
        <li>
          child sexual abuse material, or any sexual content involving minors;
        </li>
        <li>
          intimate images shared without the consent of the person shown, or
          other non-consensual content;
        </li>
        <li>material that infringes copyright, trademark, or other rights;</li>
        <li>
          private information about another person that you have no right to
          share;
        </li>
        <li>
          content that is abusive, threatening, or intended to harass, or that
          promotes violence or hatred.
        </li>
      </ul>
      <p>
        We may remove content and restrict access to the service if we believe
        these rules have been broken. We are not obliged to review uploads before
        they are stored.
      </p>

      <h2>Your content and your responsibility</h2>
      <p>
        You keep ownership of the content you upload. You give us permission to
        store it, process it, and serve it so that the transfer can work. You are
        responsible for having the right to share what you upload and for
        complying with the law.
      </p>
      <p>
        ZipDrop is not a private storage service. Files are kept in a publicly
        readable storage bucket, and a 4-digit code can be guessed. Do not upload
        confidential, financial, medical, identity, or otherwise sensitive
        material. You are responsible for deciding what is appropriate to share.
      </p>

      <h2>No account, no guarantee of availability</h2>
      <p>
        There are no accounts and no service-level agreement. ZipDrop runs on
        third-party infrastructure, and the site may be unavailable, slow, or
        changed without notice. Transfers may be lost. Keep your own copy of any
        file you upload.
      </p>

      <h2>Retention</h2>
      <p>
        Each transfer is given a 48-hour expiry timestamp, but automatic deletion
        is not implemented yet. Files remain in storage until we remove them
        manually. See the <a href="/privacy">Privacy Policy</a> for details and
        for how to request removal.
      </p>

      <h2>Security</h2>
      <p>
        Traffic between your browser and ZipDrop uses HTTPS. ZipDrop does not
        provide end-to-end encryption: files are stored on our server in a form
        the service can read, and access is controlled by the 4-digit code. This
        makes ZipDrop suitable for everyday, non-sensitive sharing, not for
        confidential material.
      </p>

      <h2>Third-party services</h2>
      <p>
        ZipDrop relies on Supabase for storage and Vercel for hosting. The site
        also loads Google Analytics and Google Fonts. These services have their
        own terms, which apply to their processing.
      </p>

      <h2>Disclaimer</h2>
      <p>
        ZipDrop is provided &ldquo;as is&rdquo; and &ldquo;as available&rdquo;,
        without warranties of any kind, whether express or implied, including
        warranties of merchantability, fitness for a particular purpose, and
        non-infringement. We do not warrant that the service will be
        uninterrupted, error-free, or that files will be stored or delivered
        successfully.
      </p>

      <h2>Limitation of liability</h2>
      <p>
        To the fullest extent permitted by law, Ved Mehta, Virti Panchamia, and
        ZipDrop are not liable for indirect, incidental, special, consequential,
        or punitive damages, or for lost data, lost profits, or lost
        opportunities, arising from your use of the service. Because ZipDrop is
        free, our total liability for any claim is limited to the amount you paid
        to use it, which is zero. Nothing in these terms limits liability that
        cannot be limited under applicable law.
      </p>

      <h2>Changes and termination</h2>
      <p>
        We may change, suspend, or discontinue any part of ZipDrop at any time. We
        may update these terms; the date at the top shows the current version.
        Continued use after a change means you accept the updated terms.
      </p>

      <h2>Governing law</h2>
      <p>
        These terms are governed by the laws of India. Disputes are subject to the
        jurisdiction of the courts of Mumbai, Maharashtra, without affecting any
        mandatory consumer protections that apply where you live.
      </p>

      <h2>Contact</h2>
      <p>
        Questions about these terms can be sent to{" "}
        <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>. To report
        content, use the <a href="/report-abuse">Report Abuse</a> page.
      </p>
    </PageShell>
  );
}
