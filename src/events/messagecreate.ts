import { EmbedBuilder, Events, Message } from "discord.js";
import config from "../config.json";
import { getMatchingContentBlockRules } from "../utils/contentBlock";

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

    const channel = await message.guild.channels.fetch(config.channels.logs);
    if (channel?.isTextBased()) {
      await channel.send({ embeds: [embed] });
    }
  },
};
