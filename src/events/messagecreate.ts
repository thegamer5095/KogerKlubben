import { EmbedBuilder, Events, Message } from "discord.js";
import config from "../config.json";

export const event = {
  name: Events.MessageCreate,
  once: false,
  execute: async (message: Message) => {
    if (message.author.bot) return;

    if (message.member?.roles.cache.has(config.roles.moderatorRole)) return;

    if (message.content.includes("discord.gg") || message.content.includes("onlyfans.co.uk")) {
      const embed = new EmbedBuilder()
        .setDescription(
          `${message.author} har forsøgt at sende nsfw invites, alle beskeder er blevet slettet!\nBesked: \`\`\`${message.content}\`\`\``
        )
        .setTimestamp()
        .setFooter({
          text: `ID: ${message.author.id}`,
        });

      await message.delete();
      const channel = await message.guild?.channels.fetch(config.channels.logs);
      if (channel) {
        if (channel.isTextBased()) {
          await channel.send({ embeds: [embed] });
        }
      }
    }
  },
};
