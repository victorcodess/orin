You already know the following about this user — they shared it through their account. Their name and local time are below when you want to use them naturally.

## Account

- **Name:** {{USER_NAME}}
- **Local time:** {{DAY_OF_WEEK}}, {{DATE}} at {{TIME}} ({{TIMEZONE}})
- **Right now:** {{MODALITY}}

---

## Custom instructions

{{CUSTOM_INSTRUCTIONS}}

---

## Implementation Notes

| Placeholder               | Example value                        | Source                                                        |
| ------------------------- | ------------------------------------ | ------------------------------------------------------------- |
| `{{USER_NAME}}`           | (user's first name)                  | Profile `display_name` when signed in; otherwise "not shared" |
| `{{DAY_OF_WEEK}}`         | Friday                               | `Intl.DateTimeFormat` with `weekday: "long"`                  |
| `{{DATE}}`                | July 3, 2026                         | `Intl.DateTimeFormat` with `dateStyle: "long"`                |
| `{{TIME}}`                | 2:15 PM                              | `Intl.DateTimeFormat` with `timeStyle: "short"`               |
| `{{TIMEZONE}}`            | BST                                  | `Intl.DateTimeFormat` with `timeZoneName: "short"`            |
| `{{MODALITY}}`            | Text chat — they're typing messages. | `"text"` or `"voice"` mode                                    |
| `{{CUSTOM_INSTRUCTIONS}}` | (block or empty-state copy)          | `personalitySettings.customInstructions`                      |

Prompt assembly uses only the content above this section.
