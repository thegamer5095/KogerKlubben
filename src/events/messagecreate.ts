import { EmbedBuilder, Events, Message } from "discord.js";
import config from "../config.json";
import { getMatchingContentBlockRules } from "../utils/contentBlock";

const CONTENT_BLOCK_LOG_COOLDOWN_MS = 60_000;
const contentBlockLogCooldowns = new Map<string, number>();

function shouldSendContentBlockLog(message: Message, matchedRuleIds: string) {
  const now = Date.now();

  for (const [key, expiresAt] of contentBlockLogCooldowns) {
    if (expiresAt <= now) {
      contentBlockLogCooldowns.delete(key);
    }
  }

  const key = `${message.guild?.id}:${message.author.id}:${matchedRuleIds}`;
  const expiresAt = contentBlockLogCooldowns.get(key);

  if (expiresAt && expiresAt > now) {
    return false;
  }

  contentBlockLogCooldowns.set(key, now + CONTENT_BLOCK_LOG_COOLDOWN_MS);
  return true;
}

export const event = {
  name: Events.MessageCreate,
  once: false,
  execute: async (message: Message) => {
    if (message.author.bot) return;
    if (!message.guild) return;

    const member = message.member;
    if (member && member.roles.cache.has(config.roles.moderatorRole)) {
      return;
    }

    const matched = await getMatchingContentBlockRules(message);
    if (matched.length === 0) return;

    const summary = matched.map((m) => m.pattern).join(", ");
    const matchedRuleIds = matched
      .map((m) => m.id)
      .sort((a, b) => a - b)
      .join(",");

    const preview =
      message.content?.slice(0, 800) ||
      (message.attachments.size > 0 ? "[vedhæftning]" : "[tom besked]");

    const embed = new EmbedBuilder()
      .setDescription(
        `${message.author} har forsøgt at sende blokeret tekst/link.\n**Regler:** ${summary}\n**Besked:** \`\`\`${preview}\`\`\``
      )
      .setTimestamp()
      .setFooter({
        text: `ID: ${message.author.id}`,
      });

    try {
      await message.delete();
    } catch {
      return;
    }

    if (!shouldSendContentBlockLog(message, matchedRuleIds)) {
      return;
    }

    const channel = await message.guild.channels.fetch(config.channels.logs);
    if (channel?.isTextBased()) {
      await channel.send({ embeds: [embed] });
    }
  },
};
