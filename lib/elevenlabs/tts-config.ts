/** Live voice calls — Speech Engine only, not available on REST TTS. */
export const VOICE_CALL_TTS_MODEL = "eleven_v3_conversational";

/** Read-aloud and voice previews — closest REST match to call voice. */
export const READ_ALOUD_TTS_MODEL = "eleven_v3";

/** v3 models cap around 5k chars per request. */
export const READ_ALOUD_MAX_CHARS = 5_000;

export const READ_ALOUD_BUCKET = "read-aloud";
