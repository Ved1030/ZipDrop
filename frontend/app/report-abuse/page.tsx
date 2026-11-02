import type { Metadata } from "next";
import PageShell from "@/components/PageShell";
import { CONTACT_EMAIL } from "@/lib/site";

export const metadata: Metadata = {
  title: "Report Abuse",
  description:
    "How to report illegal or harmful content shared through ZipDrop, what to include, and what happens next.",
};

const abuseMailto = `mailto:${CONTACT_EMAIL}?subject=ZipDrop%20abuse%20report&body=Transfer%20code%20or%20file%20URL%3A%0A%0ADescription%20of%20the%20problem%3A%0A%0AYour%20contact%20email%20(optional)%3A%0A`;

export default function ReportAbusePage() {
  return (
    <PageShell title="Report Abuse">
      <p>
        ZipDrop is a small, free service, but it must not be used to distribute
        illegal or harmful material. If you find content on ZipDrop that breaks
        the <a href="/terms">Terms of Use</a>, please tell us.
      </p>

      <h2>How to report</h2>
      <p>
        Email{" "}
        <a href={abuseMailto}>{CONTACT_EMAIL}</a> with the subject{" "}
        <strong>&ldquo;Abuse report&rdquo;</strong> and include:
      </p>
      <ul>
        <li>the 4-digit transfer code and, if you have it, the file URL;</li>
        <li>what the content is and why you believe it is illegal or harmful;</li>
        <li>
          if you are reporting on behalf of someone else, your relationship to
          them;
        </li>
        <li>a way to contact you if you want a reply.</li>
      </ul>

      <h2>What we do</h2>
      <ul>
        <li>We review the report and the referenced transfer.</li>
        <li>
          If the content appears to break our terms, we remove the files and the
          transfer record.
        </li>
        <li>
          We may preserve relevant records and report serious matters, including
          child sexual abuse material, to the appropriate authorities.
        </li>
        <li>
          We cannot notify you about every step, but we will reply if you have
          given us a contact address and a reply is appropriate.
        </li>
      </ul>

      <h2>Urgent cases</h2>
      <p>
        If someone is in immediate danger, contact your local emergency services
        first. Email reports do not provide an emergency response.
      </p>

      <h2>Good faith</h2>
      <p>
        Please report in good faith. Knowingly false reports, or reports made to
        silence lawful speech, may be ignored.
      </p>

      <h2>Privacy of reports</h2>
      <p>
        We handle reports as described in the{" "}
        <a href="/privacy">Privacy Policy</a>. We do not publish the names of
        people who report content.
      </p>

      <div className="cta-row">
        <a className="cta" href={abuseMailto}>
          Email an abuse report
        </a>
        <a className="cta secondary" href="/contact">
          General contact
        </a>
      </div>
    </PageShell>
  );
}
