# Runtime Context Template

This context is injected after the core system prompt and personality file at the start of every conversation.

---

## Current Time

Today is {{DAY_OF_WEEK}}, {{DATE}} at {{TIME}} ({{TIMEZONE}}).

---

## User

{{#if USER_NAME}}
The user's name is {{USER_NAME}}.
{{else}}
The user's name is not known.
{{/if}}

---

## Custom Instructions

{{#if CUSTOM_INSTRUCTIONS}}
The user has set the following personal instructions. Honor them throughout the conversation:

{{CUSTOM_INSTRUCTIONS}}
{{else}}
No custom instructions set.
{{/if}}

---

## Implementation Notes

| Placeholder          | Example value              | Source                               |
| -------------------- | -------------------------- | ------------------------------------ |
| `{{DAY_OF_WEEK}}`    | Friday                     | `new Date().toLocaleDateString(...)` |
| `{{DATE}}`           | July 3, 2026               | `new Date().toLocaleDateString(...)` |
| `{{TIME}}`           | 2:15 PM                    | `new Date().toLocaleTimeString(...)` |
| `{{TIMEZONE}}`       | BST                        | `Intl.DateTimeFormat().resolvedOptions().timeZone` |
| `{{USER_NAME}}`      | Victor                     | Auth user profile display name       |
| `{{CUSTOM_INSTRUCTIONS}}` | "Always reply in French" | `personalitySettings.customInstructions` (trim, max 4000 chars) |
