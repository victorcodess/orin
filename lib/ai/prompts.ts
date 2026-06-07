import type { AssistantConfig } from "@/lib/orin/defaults";

export function buildSystemPrompt(config: AssistantConfig): string {
  return `Your name is ${config.name}.

${config.personality}`;
}
