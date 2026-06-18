"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { RealtimeEvents, Scribe } from "@elevenlabs/client"
import type {
  AudioFormat,
  AudioOptions,
  CommitStrategy,
  CommittedTranscriptMessage,
  CommittedTranscriptWithTimestampsMessage,
  MicrophoneOptions,
  PartialTranscriptMessage,
  RealtimeConnection,
  ScribeAuthErrorMessage,
  ScribeChunkSizeExceededErrorMessage,
  ScribeCommitThrottledErrorMessage,
  ScribeErrorMessage,
  ScribeInputErrorMessage,
  ScribeInsufficientAudioActivityErrorMessage,
  ScribeQueueOverflowErrorMessage,
  ScribeQuotaExceededErrorMessage,
  ScribeRateLimitedErrorMessage,
  ScribeResourceExhaustedErrorMessage,
  ScribeSessionTimeLimitExceededErrorMessage,
  ScribeTranscriberErrorMessage,
  ScribeUnacceptedTermsErrorMessage,
} from "@elevenlabs/client"

// ============= Types =============

export type ScribeStatus =
  | "disconnected"
  | "connecting"
  | "connected"
  | "transcribing"
  | "error"

export interface TranscriptSegment {
  id: string
  text: string
  timestamp: number
  isFinal: boolean
}

export interface ScribeCallbacks {
  onSessionStarted?: () => void
  onPartialTranscript?: (data: { text: string }) => void
  onCommittedTranscript?: (data: { text: string }) => void
  onCommittedTranscriptWithTimestamps?: (data: {
    text: string
    timestamps?: { start: number; end: number }[]
  }) => void
  /** Called for any error (also called when specific error callbacks fire) */
  onError?: (error: Error | Event) => void
  onAuthError?: (data: { error: string }) => void
  onQuotaExceededError?: (data: { error: string }) => void
  onCommitThrottledError?: (data: { error: string }) => void
  onTranscriberError?: (data: { error: string }) => void
  onUnacceptedTermsError?: (data: { error: string }) => void
  onRateLimitedError?: (data: { error: string }) => void
  onInputError?: (data: { error: string }) => void
  onQueueOverflowError?: (data: { error: string }) => void
  onResourceExhaustedError?: (data: { error: string }) => void
  onSessionTimeLimitExceededError?: (data: { error: string }) => void
  onChunkSizeExceededError?: (data: { error: string }) => void
  onInsufficientAudioActivityError?: (data: { error: string }) => void

  onConnect?: () => void
  onDisconnect?: () => void
}

export interface ScribeHookOptions extends ScribeCallbacks {
  // Connection options
  token?: string
  modelId?: string
  baseUri?: string

  // VAD options
  commitStrategy?: CommitStrategy
  vadSilenceThresholdSecs?: number
  vadThreshold?: number
  minSpeechDurationMs?: number
  minSilenceDurationMs?: number
  languageCode?: string

  // Microphone options (for automatic microphone mode)
  microphone?: {
    deviceId?: string
    echoCancellation?: boolean
    noiseSuppression?: boolean
    autoGainControl?: boolean
    channelCount?: number
  }

  // Manual audio options
  audioFormat?: AudioFormat
  sampleRate?: number

  // Auto-connect on mount
  autoConnect?: boolean

  // Include timestamps
  includeTimestamps?: boolean
}

export interface UseScribeReturn {
  // State
  status: ScribeStatus
  isConnected: boolean
  isTranscribing: boolean
  partialTranscript: string
  committedTranscripts: TranscriptSegment[]
  error: string | null

  // Connection methods
  connect: (options?: Partial<ScribeHookOptions>) => Promise<void>
  disconnect: (options?: { skipCommit?: boolean }) => void

  // Audio methods (for manual mode)
  sendAudio: (
    audioBase64: string,
    options?: { commit?: boolean; sampleRate?: number; previousText?: string }
  ) => void
  commit: () => void

  // Utility methods
  clearTranscripts: () => void
  getConnection: () => RealtimeConnection | null
}

// ============= Hook Implementation =============

export function useScribe(options: ScribeHookOptions = {}): UseScribeReturn {
  const {
    // Callbacks
    onSessionStarted,
    onPartialTranscript,
    onCommittedTranscript,
    onCommittedTranscriptWithTimestamps,
    onError,
    onAuthError,
    onQuotaExceededError,
    onCommitThrottledError,
    onTranscriberError,
    onUnacceptedTermsError,
    onRateLimitedError,
    onInputError,
    onQueueOverflowError,
    onResourceExhaustedError,
    onSessionTimeLimitExceededError,
    onChunkSizeExceededError,
    onInsufficientAudioActivityError,
    onConnect,
    onDisconnect,

    // Connection options
    token: defaultToken,
    modelId: defaultModelId,
    baseUri: defaultBaseUri,
    commitStrategy: defaultCommitStrategy,
    vadSilenceThresholdSecs: defaultVadSilenceThresholdSecs,
    vadThreshold: defaultVadThreshold,
    minSpeechDurationMs: defaultMinSpeechDurationMs,
    minSilenceDurationMs: defaultMinSilenceDurationMs,
    languageCode: defaultLanguageCode,

    // Mode options
    microphone: defaultMicrophone,
    audioFormat: defaultAudioFormat,
    sampleRate: defaultSampleRate,

    // Auto-connect
    autoConnect = false,
  } = options

  const connectionRef = useRef<RealtimeConnection | null>(null)
  const connectionIdCounterRef = useRef(0)
  const activeConnectionIdRef = useRef<number | null>(null)
  const disconnectingRef = useRef(false)

  const [status, setStatus] = useState<ScribeStatus>("disconnected")
  const [partialTranscript, setPartialTranscript] = useState<string>("")
  const [committedTranscripts, setCommittedTranscripts] = useState<
    TranscriptSegment[]
  >([])
  const [error, setError] = useState<string | null>(null)

  const disconnect = useCallback(
    (options?: { skipCommit?: boolean }) => {
      const connection = connectionRef.current
      if (!connection) {
        setStatus("disconnected")
        activeConnectionIdRef.current = null
        return
      }

      disconnectingRef.current = true
      activeConnectionIdRef.current = null
      connectionRef.current = null

      try {
        gracefulCloseScribeConnection(connection, options)
      } catch (err) {
        console.warn("[useScribe] Failed to close connection", err)
      } finally {
        setStatus("disconnected")
        onDisconnect?.()
        setTimeout(() => {
          disconnectingRef.current = false
        }, 250)
      }
    },
    [onDisconnect]
  )

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect()
    }
  }, [disconnect])

  const connect = useCallback(
    async (runtimeOptions: Partial<ScribeHookOptions> = {}) => {
      if (connectionRef.current) {
        console.warn("Already connected")
        return
      }

      const connectionId = connectionIdCounterRef.current + 1
      connectionIdCounterRef.current = connectionId

      try {
        setStatus("connecting")
        setError(null)

        // Merge default options with runtime options
        const token = runtimeOptions.token || defaultToken
        const modelId = runtimeOptions.modelId || defaultModelId

        if (!token) {
          throw new Error("Token is required")
        }
        if (!modelId) {
          throw new Error("Model ID is required")
        }

        // Determine mode: microphone or manual
        const microphone = runtimeOptions.microphone || defaultMicrophone
        const audioFormat = runtimeOptions.audioFormat || defaultAudioFormat
        const sampleRate = runtimeOptions.sampleRate || defaultSampleRate

        let connection: RealtimeConnection

        const includeTimestamps =
          runtimeOptions.includeTimestamps ??
          !!(
            runtimeOptions.onCommittedTranscriptWithTimestamps ||
            onCommittedTranscriptWithTimestamps
          )

        if (microphone) {
          // Microphone mode
          connection = Scribe.connect({
            token,
            modelId,
            baseUri: runtimeOptions.baseUri || defaultBaseUri,
            commitStrategy:
              runtimeOptions.commitStrategy || defaultCommitStrategy,
            vadSilenceThresholdSecs:
              runtimeOptions.vadSilenceThresholdSecs ||
              defaultVadSilenceThresholdSecs,
            vadThreshold: runtimeOptions.vadThreshold || defaultVadThreshold,
            minSpeechDurationMs:
              runtimeOptions.minSpeechDurationMs || defaultMinSpeechDurationMs,
            minSilenceDurationMs:
              runtimeOptions.minSilenceDurationMs ||
              defaultMinSilenceDurationMs,
            languageCode: runtimeOptions.languageCode || defaultLanguageCode,
            microphone,
            includeTimestamps,
          } as MicrophoneOptions)
        } else if (audioFormat && sampleRate) {
          // Manual audio mode
          connection = Scribe.connect({
            token,
            modelId,
            baseUri: runtimeOptions.baseUri || defaultBaseUri,
            commitStrategy:
              runtimeOptions.commitStrategy || defaultCommitStrategy,
            vadSilenceThresholdSecs:
              runtimeOptions.vadSilenceThresholdSecs ||
              defaultVadSilenceThresholdSecs,
            vadThreshold: runtimeOptions.vadThreshold || defaultVadThreshold,
            minSpeechDurationMs:
              runtimeOptions.minSpeechDurationMs || defaultMinSpeechDurationMs,
            minSilenceDurationMs:
              runtimeOptions.minSilenceDurationMs ||
              defaultMinSilenceDurationMs,
            languageCode: runtimeOptions.languageCode || defaultLanguageCode,
            includeTimestamps,
            audioFormat,
            sampleRate,
          } as AudioOptions)
        } else {
          throw new Error(
            "Either microphone options or (audioFormat + sampleRate) must be provided"
          )
        }

        connectionRef.current = connection
        activeConnectionIdRef.current = connectionId

        const runIfCurrent =
          <Args extends unknown[]>(handler: (...args: Args) => void) =>
          (...args: Args) => {
            if (activeConnectionIdRef.current !== connectionId) {
              return
            }
            handler(...args)
          }

        // Set up event listeners
        connection.on(
          RealtimeEvents.SESSION_STARTED,
          runIfCurrent(() => {
            setStatus("connected")
            onSessionStarted?.()
          })
        )

        connection.on(
          RealtimeEvents.PARTIAL_TRANSCRIPT,
          runIfCurrent((data: unknown) => {
            const message = data as PartialTranscriptMessage
            setPartialTranscript(message.text)
            setStatus("transcribing")
            onPartialTranscript?.(message)
          })
        )

        connection.on(
          RealtimeEvents.COMMITTED_TRANSCRIPT,
          runIfCurrent((data: unknown) => {
            const message = data as CommittedTranscriptMessage
            const segment: TranscriptSegment = {
              id: `${Date.now()}-${Math.random()}`,
              text: message.text,
              timestamp: Date.now(),
              isFinal: true,
            }
            setCommittedTranscripts((prev) => [...prev, segment])
            setPartialTranscript("")
            onCommittedTranscript?.(message)
          })
        )

        connection.on(
          RealtimeEvents.COMMITTED_TRANSCRIPT_WITH_TIMESTAMPS,
          runIfCurrent((data: unknown) => {
            const message = data as CommittedTranscriptWithTimestampsMessage
            const segment: TranscriptSegment = {
              id: `${Date.now()}-${Math.random()}`,
              text: message.text,
              timestamp: Date.now(),
              isFinal: true,
            }
            setCommittedTranscripts((prev) => [...prev, segment])
            setPartialTranscript("")
            onCommittedTranscriptWithTimestamps?.(message)
          })
        )

        connection.on(
          RealtimeEvents.ERROR,
          runIfCurrent((err: unknown) => {
            const errorMessage = normalizeScribeError(err)
            if (
              disconnectingRef.current ||
              isExpectedDisconnectError(errorMessage)
            ) {
              return
            }
            setError(errorMessage)
            setStatus("error")
            onError?.(new Error(errorMessage))
          })
        )

        connection.on(
          RealtimeEvents.AUTH_ERROR,
          runIfCurrent((data: unknown) => {
            const message = data as ScribeAuthErrorMessage
            setError(message.error)
            setStatus("error")
            onAuthError?.(message)
          })
        )

        connection.on(
          RealtimeEvents.QUOTA_EXCEEDED,
          runIfCurrent((data: unknown) => {
            const message = data as ScribeQuotaExceededErrorMessage
            setError(message.error)
            setStatus("error")
            onQuotaExceededError?.(message)
          })
        )

        connection.on(
          RealtimeEvents.COMMIT_THROTTLED,
          runIfCurrent((data: unknown) => {
            const message = data as ScribeCommitThrottledErrorMessage
            setError(message.error)
            setStatus("error")
            onCommitThrottledError?.(message)
          })
        )

        connection.on(
          RealtimeEvents.TRANSCRIBER_ERROR,
          runIfCurrent((data: unknown) => {
            const message = data as ScribeTranscriberErrorMessage
            setError(message.error)
            setStatus("error")
            onTranscriberError?.(message)
          })
        )

        connection.on(
          RealtimeEvents.UNACCEPTED_TERMS,
          runIfCurrent((data: unknown) => {
            const message = data as ScribeUnacceptedTermsErrorMessage
            setError(message.error)
            setStatus("error")
            onUnacceptedTermsError?.(message)
          })
        )

        connection.on(
          RealtimeEvents.RATE_LIMITED,
          runIfCurrent((data: unknown) => {
            const message = data as ScribeRateLimitedErrorMessage
            setError(message.error)
            setStatus("error")
            onRateLimitedError?.(message)
          })
        )

        connection.on(
          RealtimeEvents.INPUT_ERROR,
          runIfCurrent((data: unknown) => {
            const message = data as ScribeInputErrorMessage
            setError(message.error)
            setStatus("error")
            onInputError?.(message)
          })
        )

        connection.on(
          RealtimeEvents.QUEUE_OVERFLOW,
          runIfCurrent((data: unknown) => {
            const message = data as ScribeQueueOverflowErrorMessage
            setError(message.error)
            setStatus("error")
            onQueueOverflowError?.(message)
          })
        )

        connection.on(
          RealtimeEvents.RESOURCE_EXHAUSTED,
          runIfCurrent((data: unknown) => {
            const message = data as ScribeResourceExhaustedErrorMessage
            setError(message.error)
            setStatus("error")
            onResourceExhaustedError?.(message)
          })
        )

        connection.on(
          RealtimeEvents.SESSION_TIME_LIMIT_EXCEEDED,
          runIfCurrent((data: unknown) => {
            const message = data as ScribeSessionTimeLimitExceededErrorMessage
            setError(message.error)
            setStatus("error")
            onSessionTimeLimitExceededError?.(message)
          })
        )

        connection.on(
          RealtimeEvents.CHUNK_SIZE_EXCEEDED,
          runIfCurrent((data: unknown) => {
            const message = data as ScribeChunkSizeExceededErrorMessage
            setError(message.error)
            setStatus("error")
            onChunkSizeExceededError?.(message)
          })
        )

        connection.on(
          RealtimeEvents.INSUFFICIENT_AUDIO_ACTIVITY,
          runIfCurrent((data: unknown) => {
            const message = data as ScribeInsufficientAudioActivityErrorMessage
            setError(message.error)
            setStatus("error")
            onInsufficientAudioActivityError?.(message)
          })
        )

        connection.on(
          RealtimeEvents.OPEN,
          runIfCurrent(() => {
            onConnect?.()
          })
        )

        connection.on(
          RealtimeEvents.CLOSE,
          runIfCurrent(() => {
            activeConnectionIdRef.current = null
            connectionRef.current = null
            setStatus("disconnected")
            onDisconnect?.()
          })
        )
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to connect"
        setError(errorMessage)
        setStatus("error")
        throw err
      }
    },
    [
      defaultToken,
      defaultModelId,
      defaultBaseUri,
      defaultCommitStrategy,
      defaultVadSilenceThresholdSecs,
      defaultVadThreshold,
      defaultMinSpeechDurationMs,
      defaultMinSilenceDurationMs,
      defaultLanguageCode,
      defaultMicrophone,
      defaultAudioFormat,
      defaultSampleRate,
      onSessionStarted,
      onPartialTranscript,
      onCommittedTranscript,
      onCommittedTranscriptWithTimestamps,
      onError,
      onAuthError,
      onQuotaExceededError,
      onCommitThrottledError,
      onTranscriberError,
      onUnacceptedTermsError,
      onRateLimitedError,
      onInputError,
      onQueueOverflowError,
      onResourceExhaustedError,
      onSessionTimeLimitExceededError,
      onChunkSizeExceededError,
      onInsufficientAudioActivityError,
      onConnect,
      onDisconnect,
    ]
  )

  const sendAudio = useCallback(
    (
      audioBase64: string,
      options?: { commit?: boolean; sampleRate?: number; previousText?: string }
    ) => {
      if (!connectionRef.current) {
        throw new Error("Not connected to Scribe")
      }
      connectionRef.current.send({ audioBase64, ...options })
    },
    []
  )

  const commit = useCallback(() => {
    if (!connectionRef.current) {
      throw new Error("Not connected to Scribe")
    }
    connectionRef.current.commit()
  }, [])

  const clearTranscripts = useCallback(() => {
    setCommittedTranscripts([])
    setPartialTranscript("")
  }, [])

  const getConnection = useCallback(() => {
    return connectionRef.current
  }, [])

  // Auto-connect if enabled
  useEffect(() => {
    if (autoConnect) {
      void connect()
    }
  }, [autoConnect, connect])

  return {
    // State
    status,
    isConnected: status === "connected" || status === "transcribing",
    isTranscribing: status === "transcribing",
    partialTranscript,
    committedTranscripts,
    error,

    // Methods
    connect,
    disconnect,
    sendAudio,
    commit,
    clearTranscripts,
    getConnection,
  }
}

type ScribeConnectionInternals = {
  websocket?: WebSocket
  _audioCleanup?: () => void
}

function normalizeScribeError(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }

  if (
    typeof error === "object" &&
    error !== null &&
    "error" in error &&
    typeof (error as ScribeErrorMessage).error === "string"
  ) {
    return (error as ScribeErrorMessage).error
  }

  return "Unknown transcription error"
}

function isExpectedDisconnectError(message: string): boolean {
  return message.includes("WebSocket closed unexpectedly: 1006") ||
    message.includes("WebSocket closed unexpectedly: 1005")
}

function gracefulCloseScribeConnection(
  connection: RealtimeConnection,
  options?: { skipCommit?: boolean }
) {
  const internals = connection as unknown as ScribeConnectionInternals
  const websocket = internals.websocket

  if (!options?.skipCommit && websocket?.readyState === WebSocket.OPEN) {
    try {
      connection.commit()
    } catch {
      // Socket may already be closing.
    }
  }

  // Close the WebSocket before stopping the mic. The SDK's close() does the
  // opposite and often triggers abnormal closure (1006).
  if (
    websocket &&
    websocket.readyState !== WebSocket.CLOSED &&
    websocket.readyState !== WebSocket.CLOSING
  ) {
    try {
      websocket.close(1000, "User ended session")
    } catch {
      // Socket may already be closing.
    }
  }

  if (internals._audioCleanup) {
    internals._audioCleanup()
  }
}

// Export types and enums from client for convenience
export { AudioFormat, CommitStrategy, RealtimeEvents } from "@elevenlabs/client"
export type { RealtimeConnection } from "@elevenlabs/client"
