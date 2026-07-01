import type { Metadata } from "next";
import Link from "next/link";

import { LegalPage } from "@/components/marketing/legal-page";

export const metadata: Metadata = {
  title: "Privacy Policy · Orin",
  description: "Privacy Policy for Orin, a voice-enabled AI companion.",
};

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      description="What we collect, how we use it, and the choices you have over your data."
      activePage="privacy"
    >
      <p>
        This Privacy Policy explains how Victor Williams (&ldquo;we,&rdquo;
        &ldquo;us,&rdquo; or &ldquo;our&rdquo;) collects, uses, and protects
        information when you use Orin at{" "}
        <Link href="https://orin.chat">orin.chat</Link>.
      </p>

      <h2>Overview</h2>
      <p>
        Orin is an independent portfolio project. We collect only what is needed
        to provide the service, do not sell your personal information, and give
        you tools to export or delete your data.
      </p>

      <h2>Information we collect</h2>
      <h3>Account information</h3>
      <p>
        When you sign in with Google, we receive basic profile information such
        as your name, email address, and profile picture through Supabase Auth.
        You may also set a display name and preferences such as theme and
        language.
      </p>

      <h3>Conversation data</h3>
      <p>
        We store your chat conversations, message history, conversation titles,
        favorites, and related metadata in our database so you can continue
        chats across sessions and devices.
      </p>

      <h3>Voice data</h3>
      <p>
        If you use voice calls or read-aloud features, audio and related session
        data may be processed by ElevenLabs and our voice infrastructure to
        generate speech and enable real-time conversation.
      </p>

      <h3>Usage and technical data</h3>
      <p>
        We may collect basic operational data such as request logs, error
        reports, and usage counts needed to enforce quotas, maintain
        reliability, and prevent abuse. Hosting infrastructure on Vercel may
        also process standard web server logs such as IP address, browser type,
        and timestamps.
      </p>

      <h3>API keys you provide</h3>
      <p>
        If you choose to connect your own provider API keys, we store them in
        encrypted form and use them only to make requests on your behalf within
        Orin.
      </p>

      <h2>How we use information</h2>
      <p>We use collected information to:</p>
      <ul>
        <li>Authenticate you and maintain your account</li>
        <li>Provide chat, voice, and personalization features</li>
        <li>Store and sync your conversations and settings</li>
        <li>Enforce usage limits and protect the service from abuse</li>
        <li>Improve reliability, debug issues, and operate the product</li>
      </ul>

      <h2>Third-party processors</h2>
      <p>We share data with service providers only as needed to run Orin:</p>
      <ul>
        <li>
          <strong>Supabase</strong> — authentication, database, and account
          storage
        </li>
        <li>
          <strong>Google</strong> — sign-in through OAuth
        </li>
        <li>
          <strong>OpenAI</strong> — text generation for chat responses
        </li>
        <li>
          <strong>ElevenLabs</strong> — voice synthesis and conversational audio
          features
        </li>
        <li>
          <strong>Vercel</strong> — application hosting and delivery
        </li>
      </ul>
      <p>
        These providers process data under their own privacy policies. We
        recommend reviewing their documentation if you want more detail on how
        they handle data.
      </p>

      <h2>Data retention</h2>
      <p>
        We retain account and conversation data while your account is active.
        You can delete individual conversations or all conversations from
        Settings. Deleting your account removes associated profile and
        conversation data from our systems, subject to reasonable backup and
        legal retention requirements.
      </p>

      <h2>Your choices</h2>
      <p>You can:</p>
      <ul>
        <li>Update your display name and preferences in Settings</li>
        <li>Export a copy of your account data from Settings</li>
        <li>Delete conversations or your entire account from Settings</li>
        <li>
          Revoke Google sign-in access through your Google account settings
        </li>
        <li>
          Decline microphone permissions in your browser for voice features
        </li>
      </ul>

      <h2>Cookies and local storage</h2>
      <p>
        Orin uses cookies and similar storage needed for authentication, session
        management, and basic app functionality such as theme preferences. We do
        not use third-party advertising cookies.
      </p>

      <h2>Security</h2>
      <p>
        We use industry-standard measures such as encrypted connections and
        encrypted storage for sensitive credentials like BYOK API keys. No
        online service is completely secure, and we cannot guarantee absolute
        security.
      </p>

      <h2>Children</h2>
      <p>
        Orin is not directed at children under 13, and we do not knowingly
        collect personal information from them. If you believe a child has
        provided us information, contact us and we will take appropriate steps
        to delete it.
      </p>

      <h2>International users</h2>
      <p>
        Orin is operated from the United States. If you access the service from
        outside the US, your information may be processed in the US or other
        countries where our providers operate.
      </p>

      <h2>Changes to this policy</h2>
      <p>
        We may update this Privacy Policy from time to time. We will revise the
        &ldquo;Last updated&rdquo; date when we do. Continued use of Orin after
        changes become effective means you accept the updated policy.
      </p>

      <h2>Contact</h2>
      <p>
        Privacy questions or requests can be sent via{" "}
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
