export type ClientPromptContext = {
  timeZone: string;
};

export function getClientPromptContext(): ClientPromptContext {
  return {
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  };
}
