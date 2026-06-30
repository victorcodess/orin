// OpenAI — companion brain (text + voice LLM)
/** Text chat — balance quality, cost, and streaming latency. */
export const TEXT_CHAT_MODEL = "gpt-4o-mini";

/** Voice call replies — favor time-to-first-token over frontier reasoning. */
export const VOICE_CHAT_MODEL = "gpt-4o-mini";

// ElevenLabs — speech-to-text
/** Composer dictation (Scribe realtime). */
export const DICTATION_STT_MODEL = "scribe_v2_realtime";

// ElevenLabs — text-to-speech
/** Live voice calls — Speech Engine only, not available on REST TTS. */
export const VOICE_CALL_TTS_MODEL = "eleven_v3_conversational";

/** Read-aloud and voice previews — closest REST match to call voice. */
export const READ_ALOUD_TTS_MODEL = "eleven_v3";
