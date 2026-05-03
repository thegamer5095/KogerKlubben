import {
  Colors,
  EmbedBuilder,
  PermissionFlagsBits,
  SlashCommandBuilder,
  SlashCommandSubcommandBuilder,
} from "discord.js";
import { Command } from "../../interfaces/Command";
import {
  buildContentAlertsPreviewEmbeds,
  runContentAlertsDiagnostics,
} from "../../services/contentAlerts";

function clip(s: string, max = 1024): string {
  return s.length <= max ? s : `${s.slice(0, max - 1)}…`;
}

export const command: Command = {
  data: new SlashCommandBuilder()
    .setName("contentalertstest")
    .setDescription("Test af Twitch- og YouTube-beskeder")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand(
      new SlashCommandSubcommandBuilder()
        .setName("check")
        .setDescription("Tjek Twitch API, YouTube RSS og Twitch/YouTube announce-kanaler")
    )
    .addSubcommand(
      new SlashCommandSubcommandBuilder()
        .setName("preview")
        .setDescription("Send test-embeds i denne kanal (som ved rigtige beskeder)")
    ),
  execute: async (interaction) => {
    const sub = interaction.options.getSubcommand(true);
    if (sub === "check") {
      await interaction.deferReply({ ephemeral: true });
      const { twitch, youtube, announceTwitch, announceYoutube } =
        await runContentAlertsDiagnostics(interaction.client);
      const allOk =
        twitch.ok && youtube.ok && announceTwitch.ok && announceYoutube.ok;
      const embed = new EmbedBuilder()
        .setTitle("Content alerts — diagnose")
        .setColor(allOk ? Colors.Green : Colors.Orange)
        .addFields(
          { name: `${twitch.ok ? "✅" : "❌"} Twitch API`, value: clip(twitch.text), inline: false },
          { name: `${youtube.ok ? "✅" : "❌"} YouTube RSS`, value: clip(youtube.text), inline: false },
          { name: `${announceTwitch.ok ? "✅" : "❌"} Twitch announce`, value: clip(announceTwitch.text), inline: false },
          { name: `${announceYoutube.ok ? "✅" : "❌"} YouTube announce`, value: clip(announceYoutube.text), inline: false }
        );
      await interaction.editReply({ embeds: [embed] });
      return;
    }
    if (sub === "preview") {
      const ch = interaction.channel;
      if (!ch?.isTextBased() || ch.isDMBased()) {
        await interaction.reply({
          content: "Kommandoen skal bruges i en server-tekstkanal.",
          ephemeral: true,
        });
        return;
      }
      const { twitch, youtube, twitchOutgoing, youtubeOutgoing } = buildContentAlertsPreviewEmbeds();
      try {
        await ch.send({ ...twitchOutgoing, embeds: [twitch] });
        await ch.send({ ...youtubeOutgoing, embeds: [youtube] });
        await interaction.reply({ content: "Test-beskeder sendt (Twitch + YouTube, som ved rigtige alerts).", ephemeral: true });
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        await interaction.reply({
          content: `Kunne ikke sende embeds: ${msg}`,
          ephemeral: true,
        });
      }
    }
  },
};
