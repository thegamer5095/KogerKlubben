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
        .setDescription("Tjek Twitch API, YouTube RSS og announce-kanal"))
        .addSubcommand(new discord_js_1.SlashCommandSubcommandBuilder()
        .setName("preview")
        .setDescription("Send test-embeds i denne kanal (som ved rigtige beskeder)")),
    execute: async (interaction) => {
        const sub = interaction.options.getSubcommand(true);
        if (sub === "check") {
            await interaction.deferReply({ ephemeral: true });
            const { twitch, youtube, announce } = await (0, contentAlerts_1.runContentAlertsDiagnostics)(interaction.client);
            const allOk = twitch.ok && youtube.ok && announce.ok;
            const embed = new discord_js_1.EmbedBuilder()
                .setTitle("Content alerts — diagnose")
                .setColor(allOk ? discord_js_1.Colors.Green : discord_js_1.Colors.Orange)
                .addFields({ name: `${twitch.ok ? "✅" : "❌"} Twitch`, value: clip(twitch.text), inline: false }, { name: `${youtube.ok ? "✅" : "❌"} YouTube`, value: clip(youtube.text), inline: false }, { name: `${announce.ok ? "✅" : "❌"} Announce-kanal`, value: clip(announce.text), inline: false });
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
            const { twitch, youtube } = (0, contentAlerts_1.buildContentAlertsPreviewEmbeds)();
            try {
                await ch.send({ embeds: [twitch, youtube] });
                await interaction.reply({ content: "Test-embeds sendt.", ephemeral: true });
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
