import config from "../config.json";

export type PingRoleConfigKey = "pingStream" | "pingNyheder" | "pingYoutube";

export const PING_REACTION_DEFINITIONS: {
  emoji: string;
  label: string;
  description: string;
  configKey: PingRoleConfigKey;
}[] = [
  {
    emoji: "🔴",
    label: "Stream",
    description: "Få ping når der streames.",
    configKey: "pingStream",
  },
  {
    emoji: "📰",
    label: "Nyheder",
    description: "Få ping ved nyheder og opslag.",
    configKey: "pingNyheder",
  },
  {
    emoji: "▶️",
    label: "YouTube",
    description: "Få ping når der uploades videoer.",
    configKey: "pingYoutube",
  },
];

function roleIdFromConfig(key: PingRoleConfigKey): string | null {
  const id = config.roles[key as keyof typeof config.roles];
  if (typeof id !== "string" || !id.trim()) return null;
  return id.trim();
}

export function getConfiguredPingDefinitions() {
  return PING_REACTION_DEFINITIONS.filter((d) => roleIdFromConfig(d.configKey));
}

export function getRoleIdForReactionEmoji(
  name: string | null,
  id: string | null
): string | null {
  if (id) return null;
  if (!name) return null;
  for (const def of PING_REACTION_DEFINITIONS) {
    if (name === def.emoji) {
      return roleIdFromConfig(def.configKey);
    }
  }
  return null;
}
