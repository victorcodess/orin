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
) {
  if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
    return Promise.resolve();
  }

  if (!warmPromise) {
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
      })
      .catch(() => {})
      .finally(() => {
        warmPromise = null;
      });
  }

  return warmPromise;
}
