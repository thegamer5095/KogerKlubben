import { Colors, EmbedBuilder, Events, Message, TextChannel } from "discord.js";
import config from "../config.json";

const TIMEOUT_DURATION_MS = 1000 * 60 * 60 * 24 * 7;

export const event = {
  name: Events.MessageCreate,
  once: false,
  async execute(message: Message) {
    if (message.author.bot) return;
    if (!message.guild) return;

    const member = message.member;
    if (member && member.roles.cache.has(config.roles.moderatorRole)) {
      return;
    }

    if (message.channel.id !== config.channels.spammerChannel) return;

    const spammer = await message.guild.members
      .fetch(message.author.id)
      .catch(() => null);

    if (!spammer) return;

    try {
      await spammer.timeout(TIMEOUT_DURATION_MS, "Spamming");

      const channel = message.guild.channels.cache.get(config.channels.logs);
      if (channel?.isTextBased()) {
        const embed = new EmbedBuilder()
          .setColor(Colors.Orange)
          .setTitle("Automatisk timeout — spam/hack")
          .setDescription(
            `${spammer} har modtaget timeout for at skrive i ${message.channel}.`
          )
          .addFields(
            {
              name: "Bruger",
              value: `${spammer.user.tag}\n\`${spammer.id}\``,
              inline: true,
            },
            {
              name: "Varighed",
              value: "1 uge",
              inline: true,
            },
            {
              name: "Kanal",
              value: `${message.channel}`,
              inline: true,
            },
            {
              name: "Vigtigt",
              value:
                "Personen er muligvis hacket. Fjern **ikke** timeout uden aftale med admins.",
            }
          )
          .setThumbnail(spammer.user.displayAvatarURL({ size: 256 }))
          .setTimestamp()
          .setFooter({ text: `ID: ${spammer.id}` });

        await (channel as TextChannel).send({ embeds: [embed] });
      }
    } catch (error) {
      console.error(
        `[BanSpammers] Failed to timeout ${spammer.user.tag} (${spammer.id}):`,
        error
      );
    }
  },
};
