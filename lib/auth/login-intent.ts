export type AuthIntent = "login" | "signup";

export function parseAuthIntent(value: string | null | undefined): AuthIntent {
  return value === "signup" ? "signup" : "login";
}

export function getLoginPageCopy(intent: AuthIntent) {
  if (intent === "signup") {
    return {
      title: "Create your account",
      description: "Sign up to save chats and sync across devices.",
      buttonLabel: "Continue with Google",
    };
  }

  return {
    title: "Welcome back",
    description: "Log in to pick up where you left off.",
    buttonLabel: "Continue with Google",
  };
}
