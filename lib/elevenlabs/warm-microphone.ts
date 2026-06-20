import { dictationLog } from "@/lib/elevenlabs/dictation-debug";
import type { DictationSession } from "@/lib/elevenlabs/dictation-debug";

type MicrophoneConstraints = {
  echoCancellation?: boolean;
  noiseSuppression?: boolean;
  autoGainControl?: boolean;
};

let warmPromise: Promise<void> | null = null;

export function warmMicrophoneAccess(
  constraints: MicrophoneConstraints = {
    echoCancellation: true,
    noiseSuppression: true,
  },
  session: DictationSession | null = null
) {
  if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
    return Promise.resolve();
  }

  if (!warmPromise) {
    dictationLog(session, "microphone warm-up started");

    warmPromise = navigator.mediaDevices
      .getUserMedia({
        audio: {
          echoCancellation: constraints.echoCancellation ?? true,
          noiseSuppression: constraints.noiseSuppression ?? true,
          autoGainControl: constraints.autoGainControl ?? false,
        },
      })
      .then((stream) => {
        for (const track of stream.getTracks()) {
          track.stop();
        }
        dictationLog(session, "microphone warm-up complete");
      })
      .catch((error) => {
        dictationLog(session, "microphone warm-up failed", error);
      })
      .finally(() => {
        warmPromise = null;
      });
  }

  return warmPromise;
}
