import type { Metadata } from "next";
import Link from "next/link";

import { LegalPage, LEGAL_LAST_UPDATED } from "@/components/marketing/legal-page";

export const metadata: Metadata = {
  title: "Terms of Service · Orin",
  description: "Terms of Service for Orin, a voice-enabled AI companion.",
};

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms of Service"
      description="Rules and guidelines for using Orin, an independent AI companion project."
      lastUpdated={LEGAL_LAST_UPDATED}
      activePage="terms"
    >
      <p>
        Orin is an independent portfolio project operated by Victor Williams
        (&ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;). By
        accessing or using Orin at{" "}
        <Link href="https://orin.chat">orin.chat</Link>, you agree to these
        Terms of Service.
      </p>

      <h2>About Orin</h2>
      <p>
        Orin is a voice-enabled AI companion you can text and call. It is
        provided as a personal project for public use on a best-effort basis.
        Features, limits, and availability may change or be discontinued at
        any time without notice.
      </p>

      <h2>Eligibility</h2>
      <p>
        You must be at least 13 years old to use Orin. If you are under 18, you
        may only use the service with permission from a parent or legal guardian.
      </p>

      <h2>Accounts</h2>
      <p>
        You may sign in with Google through our authentication provider,
        Supabase. You are responsible for activity under your account and for
        keeping access to your Google account secure. You may update your
        display name, export your data, delete conversations, or delete your
        account from Settings.
      </p>

      <h2>Acceptable use</h2>
      <p>You agree not to:</p>
      <ul>
        <li>Use Orin for unlawful, harmful, or abusive purposes</li>
        <li>Attempt to bypass usage limits, quotas, or security controls</li>
        <li>Reverse engineer, scrape, or overload the service</li>
        <li>Upload or generate content that violates others&apos; rights</li>
        <li>Impersonate others or misrepresent your affiliation with Orin</li>
      </ul>
      <p>
        We may suspend or terminate access if we believe these terms have been
        violated or if continued use poses risk to the service or other users.
      </p>

      <h2>AI-generated content</h2>
      <p>
        Orin uses third-party AI models to generate responses. Output may be
        inaccurate, incomplete, or inappropriate. Do not rely on Orin for medical,
        legal, financial, or other professional advice. You are responsible for
        how you use generated content.
      </p>

      <h2>Voice features</h2>
      <p>
        Voice calls and read-aloud features process audio through third-party
        providers, including ElevenLabs. Microphone access requires your browser
        permission. You are responsible for ensuring you have the right to
        record or transmit any audio you provide.
      </p>

      <h2>Usage limits and API keys</h2>
      <p>
        Orin may offer free usage allowances and optional bring-your-own-key
        (BYOK) support for certain providers. We may change limits, pricing
        models, or feature availability at any time. You are responsible for
        charges incurred through API keys you connect to your account.
      </p>

      <h2>Intellectual property</h2>
      <p>
        Orin, its branding, and underlying software remain our property. You
        retain rights to content you submit, but grant us the limited rights
        needed to operate the service, including storing conversations and
        processing them with third-party AI and voice providers.
      </p>

      <h2>Third-party services</h2>
      <p>
        Orin relies on third-party services such as Supabase, Google, OpenAI,
        ElevenLabs, and Vercel. Your use of Orin is also subject to those
        providers&apos; terms and policies where applicable.
      </p>

      <h2>Disclaimer of warranties</h2>
      <p>
        Orin is provided &ldquo;as is&rdquo; and &ldquo;as available&rdquo;
        without warranties of any kind, whether express or implied, including
        merchantability, fitness for a particular purpose, and non-infringement.
        We do not guarantee uninterrupted, secure, or error-free operation.
      </p>

      <h2>Limitation of liability</h2>
      <p>
        To the fullest extent permitted by law, we are not liable for indirect,
        incidental, special, consequential, or punitive damages, or for any loss
        of data, profits, or goodwill arising from your use of Orin. Our total
        liability for any claim related to the service is limited to the greater
        of USD $50 or the amount you paid us in the twelve months before the
        claim, if any.
      </p>

      <h2>Changes</h2>
      <p>
        We may update these terms from time to time. Continued use of Orin after
        changes become effective constitutes acceptance of the revised terms.
      </p>

      <h2>Contact</h2>
      <p>
        Questions about these terms can be sent via{" "}
        <Link
          href="https://github.com/victorcodess/orin/issues"
          target="_blank"
        >
          GitHub Issues
        </Link>{" "}
        or through{" "}
        <Link href="https://victorwilliams.me" target="_blank">
          victorwilliams.me
        </Link>
        .
      </p>
    </LegalPage>
  );
}
