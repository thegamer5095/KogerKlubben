"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.command = void 0;
const discord_js_1 = require("discord.js");
const config_json_1 = __importDefault(require("../../config.json"));
const pingRoles_1 = require("../../utils/pingRoles");
const pingRolesPanel_1 = require("../../utils/pingRolesPanel");
function isStaff(interaction) {
    if (!interaction.inGuild())
        return false;
    const member = interaction.member;
    return member.roles.cache.has(config_json_1.default.roles.moderatorRole);
}
exports.command = {
    data: new discord_js_1.SlashCommandBuilder()
        .setName("pingroles")
        .setDescription("Opsæt ping-roller via reaktioner på en besked")
        .addSubcommand((s) => s
        .setName("panel")
        .setDescription("Sender embed-panelet i denne kanal (kun moderatorer)")),
    execute: async (interaction) => {
        const sub = interaction.options.getSubcommand();
        if (sub !== "panel")
            return;
        if (!interaction.inGuild() || !interaction.channel?.isTextBased()) {
            await interaction.reply({
                content: "Kan kun bruges i en tekstkanal på serveren.",
                ephemeral: true,
            });
            return;
        }
        if (!isStaff(interaction)) {
            await interaction.reply({
                content: "Kun moderatorer kan opsætte panelet.",
                ephemeral: true,
            });
            return;
        }
        const configured = (0, pingRoles_1.getConfiguredPingDefinitions)();
        if (configured.length === 0) {
            await interaction.reply({
                content: "Ingen ping-roller er sat i `config.json` under `roles.pingStream`, `pingNyheder` og `pingYoutube`.",
                ephemeral: true,
            });
            return;
        }
        await interaction.deferReply({ ephemeral: true });
        const lines = pingRoles_1.PING_REACTION_DEFINITIONS.map((d) => {
            const active = configured.some((c) => c.configKey === d.configKey);
            const status = active ? `${d.emoji} — aktiv` : `${d.emoji} — mangler rolle-ID i config`;
            return `**${d.label}** · ${status}\n${d.description}`;
        });
        const embed = new discord_js_1.EmbedBuilder()
            .setTitle("Ping-roller")
            .setDescription("Tryk på reaktionen under denne besked for at få rollen. Fjern din reaktion for at fjerne rollen igen.\n\n" +
            lines.join("\n\n"))
            .setColor(config_json_1.default.bot.color);
        const msg = await interaction.channel.send({ embeds: [embed] });
        for (const def of configured) {
            await msg.react(def.emoji);
        }
        await (0, pingRolesPanel_1.setPingRolesPanel)({
            channelId: msg.channelId,
            messageId: msg.id,
        });
        await interaction.editReply({
            content: `Panel sendt. Besked-ID: \`${msg.id}\` (gemmes automatisk til reaktioner).`,
        });
    },
};
