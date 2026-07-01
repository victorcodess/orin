export type AuthIntent = "login" | "signup";

export function parseAuthIntent(value: string | null | undefined): AuthIntent {
  return value === "signup" ? "signup" : "login";
}

export function getLoginPageCopy(intent: AuthIntent) {
  if (intent === "signup") {
    return {
      title: "Create your account",
      description:
        "Sign up with Google to save chats, unlock voice, and carry your conversations across devices.",
      buttonLabel: "Sign up with Google",
    };
  }

  return {
    title: "Welcome back",
    description:
      "Log in with Google to sync your chats and pick up where you left off.",
    buttonLabel: "Log in with Google",
  };
}
