"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { toast } from "@/components/nexus-ui/toaster";
import {
  getReadAloudAudioCache,
  readAloudCacheKey,
  setReadAloudAudioCache,
} from "@/lib/elevenlabs/read-aloud-cache";
import { fetchReadAloudAudio } from "@/lib/elevenlabs/read-aloud-client";
import type { VoiceSpeed } from "@/lib/orin/voice/speed";

export function useReadAloud(voiceId: string, voiceSpeed: VoiceSpeed) {
  const [activeMessageId, setActiveMessageId] = useState<string | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const requestIdRef = useRef(0);

  const detachAudio = useCallback(() => {
    audioRef.current?.pause();
    audioRef.current = null;
  }, []);

  const resetPlayback = useCallback(() => {
    requestIdRef.current += 1;
    detachAudio();
    setActiveMessageId(null);
    setIsPaused(false);
    setIsLoading(false);
  }, [detachAudio]);

  const playFromUrl = useCallback(
    async (objectUrl: string, requestId: number) => {
      const audio = new Audio(objectUrl);
      audioRef.current = audio;

      audio.onended = () => {
        if (requestIdRef.current === requestId) {
          resetPlayback();
        }
      };
      audio.onerror = () => {
        if (requestIdRef.current === requestId) {
          toast.error("Playback failed");
          resetPlayback();
        }
      };

      setIsLoading(false);

      try {
        await audio.play();
      } catch {
        if (requestIdRef.current === requestId) {
          toast.error("Couldn't start playback");
          resetPlayback();
        }
      }
    },
    [resetPlayback],
  );

  const toggle = useCallback(
    async (messageId: string, text: string) => {
      const cacheKey = readAloudCacheKey(messageId, voiceId, voiceSpeed);

      if (activeMessageId === messageId) {
        if (isLoading) {
          return;
        }

        if (!isPaused) {
          audioRef.current?.pause();
          setIsPaused(true);
          return;
        }

        try {
          await audioRef.current?.play();
          setIsPaused(false);
        } catch {
          toast.error("Couldn't resume playback");
          resetPlayback();
        }
        return;
      }

      detachAudio();
      setActiveMessageId(messageId);
      setIsPaused(false);

      const cachedUrl = getReadAloudAudioCache(cacheKey);
      const requestId = ++requestIdRef.current;

      if (cachedUrl) {
        try {
          await playFromUrl(cachedUrl, requestId);
        } catch {
          if (requestIdRef.current === requestId) {
            toast.error("Couldn't play cached audio");
            resetPlayback();
          }
        }
        return;
      }

      setIsLoading(true);

      try {
        const objectUrl = await fetchReadAloudAudio(text, voiceId, voiceSpeed);
        setReadAloudAudioCache(cacheKey, objectUrl);

        if (requestIdRef.current !== requestId) {
          return;
        }

        await playFromUrl(objectUrl, requestId);
      } catch (error) {
        if (requestIdRef.current === requestId) {
          toast.error(
            error instanceof Error ? error.message : "Read aloud failed"
          );
          resetPlayback();
        }
      }
    },
    [
      activeMessageId,
      detachAudio,
      isLoading,
      isPaused,
      playFromUrl,
      resetPlayback,
      voiceId,
      voiceSpeed,
    ]
  );

  useEffect(() => {
    resetPlayback();
  }, [resetPlayback, voiceId, voiceSpeed]);

  return useMemo(
    () => ({
      activeMessageId,
      isPaused,
      isLoading,
      toggle,
      stop: resetPlayback,
    }),
    [activeMessageId, isPaused, isLoading, toggle, resetPlayback],
  );
}

export type ReadAloudState = ReturnType<typeof useReadAloud>;
