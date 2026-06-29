import { ORIN_NAME, type AssistantConfig } from "@/lib/orin/defaults";

export function buildSystemPrompt(config: AssistantConfig): string {
  return `Your name is ${ORIN_NAME}.

${config.personality}`;
}
