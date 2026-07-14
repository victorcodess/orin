import Link from "next/link";

import { LegalPage } from "@/components/marketing/legal-page";
import { createPageMetadata } from "@/lib/seo/metadata";

export const metadata = createPageMetadata({
  title: "About",
  description:
    "Orin is a voice-enabled AI companion for text and voice conversations. Learn what it does, how to use it, and how it was built.",
  path: "/about",
});

export default function AboutPage() {
  return (
    <LegalPage
      title="About Orin"
      description="A voice-enabled AI companion you can text and talk to."
      activePage="about"
    >
      <p>
        Orin is an AI companion built for <strong>conversation</strong>. You can
        type when you want to think quietly, or start a voice call when speaking
        out loud feels better. Either way, you are talking to the same Orin, in
        the same thread, with the same memory of what you have already said.
      </p>

      <h2>Start a conversation</h2>
      <p>
        Open <Link href="/new">New chat</Link> and type whatever is on your mind.
        Not sure where to begin? Pick a suggestion from one of four categories:
      </p>
      <ul>
        <li>
          <strong>Vent</strong> for things you need to get off your chest
        </li>
        <li>
          <strong>Celebrate</strong> for good news worth sharing
        </li>
        <li>
          <strong>Decide</strong> when you are weighing a choice
        </li>
        <li>
          <strong>Reflect</strong> when you want to think something through
        </li>
      </ul>
      <p>
        You can also dictate a message with the microphone button in the composer,
        then send it like any other text.
      </p>
      <p>
        You do not need an account to try Orin. Without signing in, you get a
        small demo allowance in your browser. Sign in with Google when you want
        to:
      </p>
      <ul>
        <li>Save your conversation history</li>
        <li>Start voice calls and use read-aloud</li>
        <li>Pick up chats on another device</li>
      </ul>
      <p>
        If you had chats before signing in, they carry over automatically.
      </p>

      <h2>Text chat</h2>
      <p>
        Orin replies in a streaming back-and-forth thread. A few shortcuts worth
        knowing:
      </p>
      <ul>
        <li>
          <code>Enter</code> to send
        </li>
        <li>
          <code>Shift + Enter</code> for a new line
        </li>
        <li>
          <code>Escape</code> to stop a response midstream
        </li>
      </ul>
      <p>Message actions appear on Orin&apos;s replies; hover your own messages for:</p>
      <ul>
        <li>
          <strong>Copy</strong> any message
        </li>
        <li>
          <strong>Retry</strong> to ask Orin for a new reply
        </li>
        <li>
          <strong>Edit</strong> one of your messages and send it again
        </li>
        <li>
          <strong>Read aloud</strong>{" "} on Orin&apos;s replies to hear them spoken
        </li>
      </ul>
      <p>
        Your chats show up in the sidebar under <strong>Recent</strong>. Favorite
        a conversation to pin it under <strong>Favorites</strong>. The title is
        generated from your first message, and you can rename it anytime from the
        chat header or sidebar menu.
      </p>

      <h2>Voice calls</h2>
      <p>
        Voice is where Orin feels most like company. Tap the phone icon in the
        chat header to start a call in the conversation you already have open.
        You will need to be signed in.
      </p>
      <p>During a call:</p>
      <ul>
        <li>What you and Orin say appears live in the chat thread below</li>
        <li>The transcript stays in the conversation after you hang up</li>
        <li>
          You can mute yourself, expand to fullscreen, or end the call from the
          overlay
        </li>
      </ul>
      <p>
        Voice calls use your free allowance, measured in minutes.{" "}
        <strong>Read aloud</strong> on individual messages is separate and works
        well when you want to listen to one reply without starting a full call.
      </p>

      <h2>Make Orin yours</h2>
      <p>
        After your first sign-in, onboarding walks you through the basics:
        personality style, custom instructions, voice, and speaking speed. You can
        skip it and adjust everything later in <strong>Settings</strong>.
      </p>
      <p>From Settings you can change:</p>
      <ul>
        <li>Theme, language, and chat bubble layout</li>
        <li>
          Personality style (Warm, Curious, Playful, Calm, or Direct) and custom
          instructions
        </li>
        <li>Voice and speaking speed</li>
      </ul>
      <p>
        The same settings apply to both text chat and voice calls, so Orin feels
        consistent no matter how you reach it.
      </p>
      <p>
        If you use Orin regularly and run through the free allowance, you can add
        your own API keys in Settings:
      </p>
      <ul>
        <li>
          <strong>OpenAI</strong> for text chat and voice responses
        </li>
        <li>
          <strong>ElevenLabs</strong> for voice calls and read-aloud
        </li>
      </ul>
      <p>
        Orin uses them automatically when the platform quota runs out. Your keys
        are encrypted and never shown in full after you save them.
      </p>

      <h2>Your data</h2>
      <p>Your conversations belong to you. From Settings you can:</p>
      <ul>
        <li>Export everything as JSON</li>
        <li>Delete individual chats from the sidebar</li>
        <li>Remove your account entirely</li>
      </ul>
      <p>
        Read the <Link href="/privacy">Privacy Policy</Link> for the full picture
        on what is stored and how it is handled.
      </p>

      <h2>How Orin is built</h2>
      <p>
        Orin is an independent project I built and maintain as a portfolio
        piece. The core idea is simple: <strong>one assistant, one brain, two
        surfaces</strong>. Text chat and voice calls share the same conversation
        thread, the same personality config, and the same AI logic.
      </p>
      <p>The stack, in brief:</p>
      <ol>
        <li>
          <strong>Next.js</strong> on Vercel for the web app and API routes
        </li>
        <li>
          <strong>shadcn/ui</strong> for settings, forms, and general UI
          components
        </li>
        <li>
          <strong>Nexus UI</strong> for chat threads, messages, and the composer
        </li>
        <li>
          <strong>Supabase</strong> for auth, Postgres, and row-level security
        </li>
        <li>
          <strong>Vercel AI SDK</strong> for streaming text responses
        </li>
        <li>
          <strong>ElevenLabs Speech Engine</strong> for real-time voice, via a
          separate Node sidecar
        </li>
      </ol>
      <p>
        Voice runs outside serverless on purpose. Real-time audio needs a
        persistent WebSocket connection, which is a poor fit for short-lived
        functions. The sidecar calls the same shared AI layer as{" "}
        <code>/api/chat</code>, so Orin never gets two different personalities
        depending on how you talk to it.
      </p>
      <p>
        Every message, whether typed or spoken, lands in the same{" "}
        <code>messages</code> table. Voice turns are marked as spoken so you can
        tell them apart in the thread. Quotas and API key resolution happen on
        the server, not in the browser.
      </p>
      <p>
        The source is open on{" "}
        <Link href="https://github.com/victorcodess/orin" target="_blank">
          GitHub
        </Link>
        , including architecture decision records in <code>docs/adr/</code> if
        you want the deeper technical write-up. Bugs, ideas, and contributions
        are welcome through GitHub Issues.
      </p>

      <h2>Try it</h2>
      <p>
        <Link href="/new">Start a conversation</Link> or sign in with Google to
        unlock voice and save your history.
      </p>
      <p>
        Follow{" "}
        <Link href="https://x.com/orin__chat" target="_blank">
          @orin__chat
        </Link>{" "}
        for updates, or reach out through{" "}
        <Link href="https://victorwilliams.me" target="_blank">
          victorwilliams.me
        </Link>
        .
      </p>
    </LegalPage>
  );
}
