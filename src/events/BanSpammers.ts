import { Colors, EmbedBuilder, Events, Message } from "discord.js";
import config from "../config.json";

const TIMEOUT_DURATION_MS = 1000 * 60 * 60 * 24 * 7;

function errorText(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function messagePreview(message: Message): string {
  const content = message.content?.replace(/```/g, "ˋˋˋ").slice(0, 950);
  if (content) return `\`\`\`${content}\`\`\``;
  return "[tom besked]";
}

async function sendLog(message: Message, embed: EmbedBuilder): Promise<void> {
  const channel = await message.guild?.channels
    .fetch(config.channels.logs)
    .catch(() => null);
  if (!channel?.isTextBased()) {
    console.warn(`[BanSpammers] Log-kanal ${config.channels.logs} findes ikke eller er ikke en tekstkanal.`);
    return;
  }
  await channel.send({ embeds: [embed] }).catch((error) => {
    console.error("[BanSpammers] Kunne ikke sende log:", error);
  });
}

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

    const preview = messagePreview(message);
    const attachments = [...message.attachments.values()]
      .map((a) => a.url)
      .join("\n")
      .slice(0, 1000);

    let deleteStatus = "✅ Slettet";
    try {
      await message.delete();
    } catch (error) {
      deleteStatus = `❌ Kunne ikke slette: ${errorText(error)}`;
      console.error(`[BanSpammers] Kunne ikke slette besked ${message.id}:`, error);
    }

    const spammer = await message.guild.members
      .fetch(message.author.id)
      .catch(() => null);

    let timeoutStatus: string;
    let timedOut = false;
    if (!spammer) {
      timeoutStatus = "❌ Brugeren er ikke længere på serveren";
    } else if (!spammer.moderatable) {
      timeoutStatus =
        '❌ Kan ikke give timeout: botten mangler "Moderate Members", brugerens rolle er højere end bottens, eller brugeren er admin/ejer.';
      console.warn(`[BanSpammers] Kan ikke give ${spammer.user.tag} (${spammer.id}) timeout.`);
    } else {
      try {
        await spammer.timeout(TIMEOUT_DURATION_MS, "Spamming");
        timeoutStatus = "✅ 1 uge";
        timedOut = true;
      } catch (error) {
        timeoutStatus = `❌ Timeout fejlede: ${errorText(error)}`;
        console.error(
          `[BanSpammers] Failed to timeout ${spammer.user.tag} (${spammer.id}):`,
          error
        );
      }
    }

    const user = message.author;
    const embed = new EmbedBuilder()
      .setColor(timedOut ? Colors.Orange : Colors.Red)
      .setTitle(timedOut ? "Automatisk timeout — spam/hack" : "Spam opdaget — timeout fejlede")
      .setDescription(`${user} skrev i ${message.channel}.`)
      .addFields(
        { name: "Bruger", value: `${user.tag}\n\`${user.id}\``, inline: true },
        { name: "Kanal", value: `${message.channel}`, inline: true },
        { name: "Besked", value: preview },
        ...(attachments ? [{ name: "Vedhæftninger", value: attachments }] : []),
        { name: "Sletning", value: deleteStatus.slice(0, 1024), inline: true },
        { name: "Timeout", value: timeoutStatus.slice(0, 1024), inline: true },
        {
          name: "Vigtigt",
          value: "Personen er muligvis hacket. Fjern **ikke** timeout uden aftale med admins.",
        }
      )
      .setThumbnail(user.displayAvatarURL({ size: 256 }))
      .setTimestamp()
      .setFooter({ text: `ID: ${user.id}` });

    await sendLog(message, embed);
  },
};
