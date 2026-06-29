"use client"

import * as React from "react"
import type { ElevenLabs } from "@elevenlabs/elevenlabs-js"
import {
  PauseIcon,
  PlayIcon,
  Tick02Icon,
  UnfoldMoreIcon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { create } from "zustand"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { Orb } from "@/components/elevenlabs/orb"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { getVoiceOrbColors, voicePreviewUrl } from "@/lib/elevenlabs/voices"
import type { VoiceSpeed } from "@/lib/orin/voice/speed"

type PreviewState = {
  voiceId: string | null
  status: "idle" | "loading" | "playing"
}

const usePreview = create<PreviewState>(() => ({
  voiceId: null,
  status: "idle",
}))

let previewAudio: HTMLAudioElement | null = null

function ensurePreviewAudio() {
  if (previewAudio) {
    return previewAudio
  }

  previewAudio = new Audio()
  previewAudio.addEventListener("ended", () => {
    usePreview.setState({ voiceId: null, status: "idle" })
  })
  previewAudio.addEventListener("error", () => {
    usePreview.setState({ voiceId: null, status: "idle" })
  })

  return previewAudio
}

function stopPreview() {
  previewAudio?.pause()
  usePreview.setState({ voiceId: null, status: "idle" })
}

function waitForAudioReady(audio: HTMLAudioElement) {
  if (audio.readyState >= HTMLMediaElement.HAVE_ENOUGH_DATA) {
    return Promise.resolve()
  }

  return new Promise<void>((resolve, reject) => {
    const onReady = () => {
      cleanup()
      resolve()
    }
    const onError = () => {
      cleanup()
      reject(new Error("Preview failed to load"))
    }
    const cleanup = () => {
      audio.removeEventListener("canplaythrough", onReady)
      audio.removeEventListener("error", onError)
    }

    audio.addEventListener("canplaythrough", onReady)
    audio.addEventListener("error", onError)
  })
}

async function toggleVoicePreview(voiceId: string, src: string) {
  const audio = ensurePreviewAudio()
  const { voiceId: activeId, status } = usePreview.getState()

  if (activeId === voiceId && status === "playing") {
    audio.pause()
    usePreview.setState({ status: "idle" })
    return
  }

  usePreview.setState({ voiceId, status: "loading" })

  const resolvedSrc = new URL(src, window.location.origin).href
  if (audio.src !== resolvedSrc) {
    audio.src = src
    audio.load()
  }

  try {
    await waitForAudioReady(audio)
    await audio.play()
    usePreview.setState({ voiceId, status: "playing" })
  } catch {
    usePreview.setState({ voiceId: null, status: "idle" })
  }
}

interface VoicePickerProps {
  voices: ElevenLabs.Voice[]
  value?: string
  voiceSpeed?: VoiceSpeed
  onValueChange?: (value: string) => void
  placeholder?: string
  className?: string
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

function VoicePicker({
  voices,
  value,
  voiceSpeed,
  onValueChange,
  placeholder = "Select a voice...",
  className,
  open,
  onOpenChange,
}: VoicePickerProps) {
  const [internalOpen, setInternalOpen] = React.useState(false)
  const isControlled = open !== undefined
  const isOpen = isControlled ? open : internalOpen
  const setIsOpen = isControlled ? onOpenChange : setInternalOpen

  const selectedVoice = voices.find((v) => v.voiceId === value)

  React.useEffect(() => () => stopPreview(), [])
  React.useEffect(() => stopPreview(), [voiceSpeed])

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={isOpen}
          className={cn("w-full justify-between", className)}
        >
          {selectedVoice ? (
            <div className="flex items-center gap-2 overflow-hidden">
              <div className="relative size-6 shrink-0 overflow-visible">
                <Orb
                  colors={getVoiceOrbColors(selectedVoice.voiceId)}
                  agentState="thinking"
                  className="absolute inset-0"
                />
              </div>
              <span className="truncate">{selectedVoice.name}</span>
            </div>
          ) : (
            placeholder
          )}
          <HugeiconsIcon
            icon={UnfoldMoreIcon}
            strokeWidth={2}
            className="ml-2 size-4 shrink-0 opacity-50"
          />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-(--radix-popover-trigger-width) p-0">
        <Command>
          <CommandInput placeholder="Search voices..." />
          <CommandList>
            <CommandEmpty>No voice found.</CommandEmpty>
            <CommandGroup>
              {voices.map((voice) => (
                <VoicePickerItem
                  key={voice.voiceId}
                  voice={voice}
                  voiceSpeed={voiceSpeed}
                  isSelected={value === voice.voiceId}
                  onSelect={() => {
                    onValueChange?.(voice.voiceId!)
                  }}
                />
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

interface VoicePickerItemProps {
  voice: ElevenLabs.Voice
  voiceSpeed?: VoiceSpeed
  isSelected: boolean
  onSelect: () => void
}

function VoicePickerItem({
  voice,
  voiceSpeed,
  isSelected,
  onSelect,
}: VoicePickerItemProps) {
  const [isHovered, setIsHovered] = React.useState(false)

  const preview = voice.voiceId
    ? voicePreviewUrl(voice.voiceId, voiceSpeed)
    : null
  const { voiceId: activeId, status } = usePreview()
  const isPlaying = activeId === voice.voiceId && status === "playing"
  const isLoadingPreview = activeId === voice.voiceId && status === "loading"

  const handlePreview = React.useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      e.stopPropagation()

      if (!preview || !voice.voiceId) {
        return
      }

      void toggleVoicePreview(voice.voiceId, preview)
    },
    [preview, voice.voiceId],
  )

  return (
    <CommandItem
      value={voice.voiceId!}
      keywords={[voice.name].filter((k): k is string => Boolean(k))}
      onSelect={onSelect}
      className="flex items-center gap-3"
    >
      <div
        className="relative z-10 size-8 shrink-0 cursor-pointer overflow-visible"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={handlePreview}
      >
        <Orb
          colors={getVoiceOrbColors(voice.voiceId)}
          agentState={isPlaying ? "talking" : undefined}
          className="pointer-events-none absolute inset-0"
        />
        {isHovered && preview ? (
          <div className="pointer-events-none absolute inset-0 flex size-8 shrink-0 items-center justify-center rounded-full bg-black/40 backdrop-blur-sm transition-opacity">
            {isLoadingPreview ? (
              <span className="size-3 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            ) : isPlaying ? (
              <HugeiconsIcon
                icon={PauseIcon}
                strokeWidth={2}
                className="size-3 text-white"
              />
            ) : (
              <HugeiconsIcon
                icon={PlayIcon}
                strokeWidth={2}
                className="size-3 text-white"
              />
            )}
          </div>
        ) : null}
      </div>

      <span className="flex-1 font-medium">{voice.name}</span>

      <HugeiconsIcon
        icon={Tick02Icon}
        strokeWidth={2}
        className={cn(
          "ml-auto size-4 shrink-0",
          isSelected ? "opacity-100" : "opacity-0",
        )}
      />
    </CommandItem>
  )
}

export { VoicePicker, VoicePickerItem }
