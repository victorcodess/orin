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
import { getVoiceOrbColors } from "@/lib/elevenlabs/voices"

// Minimal shared preview player: one <audio> element, one active clip at a time.
const usePreview = create<{ currentId: string | null; isPlaying: boolean }>(
  () => ({ currentId: null, isPlaying: false })
)

let previewAudio: HTMLAudioElement | null = null

function togglePreview(id: string, src: string) {
  if (typeof window === "undefined") return
  if (!previewAudio) {
    previewAudio = new Audio()
    previewAudio.addEventListener("ended", () =>
      usePreview.setState({ currentId: null, isPlaying: false })
    )
  }
  const { currentId, isPlaying } = usePreview.getState()
  if (currentId === id && isPlaying) {
    previewAudio.pause()
    usePreview.setState({ isPlaying: false })
    return
  }
  if (currentId !== id) previewAudio.src = src
  void previewAudio.play()
  usePreview.setState({ currentId: id, isPlaying: true })
}

interface VoicePickerProps {
  voices: ElevenLabs.Voice[]
  value?: string
  onValueChange?: (value: string) => void
  placeholder?: string
  className?: string
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

function VoicePicker({
  voices,
  value,
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

  React.useEffect(
    () => () => {
      previewAudio?.pause()
      usePreview.setState({ currentId: null, isPlaying: false })
    },
    []
  )

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
        <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
          <Command>
            <CommandInput placeholder="Search voices..." />
            <CommandList>
              <CommandEmpty>No voice found.</CommandEmpty>
              <CommandGroup>
                {voices.map((voice) => (
                  <VoicePickerItem
                    key={voice.voiceId}
                    voice={voice}
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
  isSelected: boolean
  onSelect: () => void
}

function VoicePickerItem({
  voice,
  isSelected,
  onSelect,
}: VoicePickerItemProps) {
  const [isHovered, setIsHovered] = React.useState(false)

  const preview = voice.previewUrl
  const currentId = usePreview((s) => s.currentId)
  const playing = usePreview((s) => s.isPlaying)
  const isPlaying = Boolean(preview) && currentId === voice.voiceId && playing

  const handlePreview = React.useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      e.stopPropagation()
      if (preview) togglePreview(voice.voiceId!, preview)
    },
    [preview, voice.voiceId]
  )

  return (
    <CommandItem
      value={voice.voiceId!}
      keywords={[
        voice.name,
        voice.labels?.accent,
        voice.labels?.gender,
        voice.labels?.age,
        voice.labels?.description,
        voice.labels?.["use case"],
      ].filter((k): k is string => Boolean(k))}
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
        {preview && isHovered && (
          <div className="pointer-events-none absolute inset-0 flex size-8 shrink-0 items-center justify-center rounded-full bg-black/40 backdrop-blur-sm transition-opacity hover:bg-black/50">
            {isPlaying ? (
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
        )}
      </div>

      <div className="flex flex-1 flex-col gap-0.5">
        <span className="font-medium">{voice.name}</span>
        {voice.labels && (
          <div className="text-muted-foreground flex items-center gap-1.5 text-xs">
            {voice.labels.accent && <span>{voice.labels.accent}</span>}
            {voice.labels.gender && <span>•</span>}
            {voice.labels.gender && (
              <span className="capitalize">{voice.labels.gender}</span>
            )}
            {voice.labels.age && <span>•</span>}
            {voice.labels.age && (
              <span className="capitalize">{voice.labels.age}</span>
            )}
          </div>
        )}
      </div>

      <HugeiconsIcon
        icon={Tick02Icon}
        strokeWidth={2}
        className={cn(
          "ml-auto size-4 shrink-0",
          isSelected ? "opacity-100" : "opacity-0"
        )}
      />
    </CommandItem>
  )
}

export { VoicePicker, VoicePickerItem }
