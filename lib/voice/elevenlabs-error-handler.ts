"use client";

import { VoiceConversation } from "@elevenlabs/client";

/** ElevenLabs client crashes when error_event is missing; guard before useConversation. */
export function patchElevenLabsErrorHandler() {
  const proto = Object.getPrototypeOf(VoiceConversation.prototype) as {
    handleErrorEvent?: (event: { error_event?: unknown }) => void;
    onError?: (message: string, context?: unknown) => void;
    __orinErrorHandlerPatched?: boolean;
  };

  if (proto.__orinErrorHandlerPatched || !proto.handleErrorEvent) {
    return;
  }

  const original = proto.handleErrorEvent;

  proto.handleErrorEvent = function (event) {
    if (!event?.error_event) {
      this.onError?.("Voice call error", {
        details: "The voice server returned an error without details.",
      });
      return;
    }

    original.call(this, event);
  };

  proto.__orinErrorHandlerPatched = true;
}
