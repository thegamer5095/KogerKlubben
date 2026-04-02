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
        .setDescription("Tjek Twitch API, YouTube RSS og announce-kanal")
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
      const { twitch, youtube, announce } = await runContentAlertsDiagnostics(interaction.client);
      const allOk = twitch.ok && youtube.ok && announce.ok;
      const embed = new EmbedBuilder()
        .setTitle("Content alerts — diagnose")
        .setColor(allOk ? Colors.Green : Colors.Orange)
        .addFields(
          { name: `${twitch.ok ? "✅" : "❌"} Twitch`, value: clip(twitch.text), inline: false },
          { name: `${youtube.ok ? "✅" : "❌"} YouTube`, value: clip(youtube.text), inline: false },
          { name: `${announce.ok ? "✅" : "❌"} Announce-kanal`, value: clip(announce.text), inline: false }
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
      const { twitch, youtube } = buildContentAlertsPreviewEmbeds();
      try {
        await ch.send({ embeds: [twitch, youtube] });
        await interaction.reply({ content: "Test-embeds sendt.", ephemeral: true });
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
