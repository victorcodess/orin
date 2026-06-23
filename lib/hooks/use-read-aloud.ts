"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { toast } from "@/components/nexus-ui/toaster";
import { fetchReadAloudAudio } from "@/lib/elevenlabs/read-aloud-client";

function readAloudCacheKey(messageId: string, voiceId: string) {
  return `${messageId}:${voiceId}`;
}

export function useReadAloud(voiceId: string) {
  const [activeMessageId, setActiveMessageId] = useState<string | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const requestIdRef = useRef(0);
  const sessionRef = useRef(0);
  const cacheRef = useRef(new Map<string, string>());

  const detachAudio = useCallback(() => {
    audioRef.current?.pause();
    audioRef.current = null;
  }, []);

  const clearCache = useCallback(() => {
    for (const objectUrl of cacheRef.current.values()) {
      URL.revokeObjectURL(objectUrl);
    }
    cacheRef.current.clear();
  }, []);

  const resetPlayback = useCallback(() => {
    requestIdRef.current += 1;
    detachAudio();
    setActiveMessageId(null);
    setIsPaused(false);
    setIsLoading(false);
  }, [detachAudio]);

  const stop = useCallback(() => {
    resetPlayback();
    clearCache();
    sessionRef.current += 1;
  }, [clearCache, resetPlayback]);

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
      await audio.play();
    },
    [resetPlayback]
  );

  const toggle = useCallback(
    async (messageId: string, text: string) => {
      const cacheKey = readAloudCacheKey(messageId, voiceId);

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

      const cachedUrl = cacheRef.current.get(cacheKey);
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
      const sessionAtStart = sessionRef.current;

      try {
        const objectUrl = await fetchReadAloudAudio(text, voiceId);

        if (sessionRef.current !== sessionAtStart) {
          URL.revokeObjectURL(objectUrl);
          return;
        }

        if (requestIdRef.current !== requestId) {
          cacheRef.current.set(cacheKey, objectUrl);
          return;
        }

        cacheRef.current.set(cacheKey, objectUrl);
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
    ]
  );

  useEffect(() => stop, [stop]);

  return {
    activeMessageId,
    isPaused,
    isLoading,
    toggle,
    stop,
  };
}

export type ReadAloudState = ReturnType<typeof useReadAloud>;
