"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.command = void 0;
const discord_js_1 = require("discord.js");
const contentAlerts_1 = require("../../services/contentAlerts");
function clip(s, max = 1024) {
    return s.length <= max ? s : `${s.slice(0, max - 1)}…`;
}
exports.command = {
    data: new discord_js_1.SlashCommandBuilder()
        .setName("contentalertstest")
        .setDescription("Test af Twitch- og YouTube-beskeder")
        .setDefaultMemberPermissions(discord_js_1.PermissionFlagsBits.ManageGuild)
        .addSubcommand(new discord_js_1.SlashCommandSubcommandBuilder()
        .setName("check")
        .setDescription("Tjek Twitch API, YouTube RSS og Twitch/YouTube announce-kanaler"))
        .addSubcommand(new discord_js_1.SlashCommandSubcommandBuilder()
        .setName("preview")
        .setDescription("Send test-embeds i denne kanal (som ved rigtige beskeder)")),
    execute: async (interaction) => {
        const sub = interaction.options.getSubcommand(true);
        if (sub === "check") {
            await interaction.deferReply({ ephemeral: true });
            const { twitch, youtube, announceTwitch, announceYoutube } = await (0, contentAlerts_1.runContentAlertsDiagnostics)(interaction.client);
            const allOk = twitch.ok && youtube.ok && announceTwitch.ok && announceYoutube.ok;
            const embed = new discord_js_1.EmbedBuilder()
                .setTitle("Content alerts — diagnose")
                .setColor(allOk ? discord_js_1.Colors.Green : discord_js_1.Colors.Orange)
                .addFields({ name: `${twitch.ok ? "✅" : "❌"} Twitch API`, value: clip(twitch.text), inline: false }, { name: `${youtube.ok ? "✅" : "❌"} YouTube RSS`, value: clip(youtube.text), inline: false }, { name: `${announceTwitch.ok ? "✅" : "❌"} Twitch announce`, value: clip(announceTwitch.text), inline: false }, { name: `${announceYoutube.ok ? "✅" : "❌"} YouTube announce`, value: clip(announceYoutube.text), inline: false });
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
            const { twitch, youtube, twitchOutgoing, youtubeOutgoing } = (0, contentAlerts_1.buildContentAlertsPreviewEmbeds)();
            try {
                await ch.send({ ...twitchOutgoing, embeds: [twitch] });
                await ch.send({ ...youtubeOutgoing, embeds: [youtube] });
                await interaction.reply({ content: "Test-beskeder sendt (Twitch + YouTube, som ved rigtige alerts).", ephemeral: true });
            }
            catch (e) {
                const msg = e instanceof Error ? e.message : String(e);
                await interaction.reply({
                    content: `Kunne ikke sende embeds: ${msg}`,
                    ephemeral: true,
                });
            }
        }
    },
};
