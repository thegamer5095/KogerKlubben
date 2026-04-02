"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.command = void 0;
const discord_js_1 = require("discord.js");
const config_json_1 = __importDefault(require("../../config.json"));
const database_1 = __importDefault(require("../../utils/database"));
const contentBlock_1 = require("../../utils/contentBlock");
function isModerator(interaction) {
    if (!interaction.inGuild())
        return false;
    const member = interaction.member;
    return member.roles.cache.has(config_json_1.default.roles.moderatorRole);
}
exports.command = {
    data: new discord_js_1.SlashCommandBuilder()
        .setName("contentblock")
        .setDescription("Administrér automatisk blokering af links og billeder")
        .setDefaultMemberPermissions(discord_js_1.PermissionFlagsBits.KickMembers)
        .addSubcommand(new discord_js_1.SlashCommandSubcommandBuilder()
        .setName("tilfoej")
        .setDescription("Tilføj et match til blokeringssystemet")
        .addStringOption((o) => o
        .setName("type")
        .setDescription("Hvad der skal matches")
        .setRequired(true)
        .addChoices({ name: "Link / tekst", value: contentBlock_1.RULE_LINK }, { name: "Billede (URL eller vedhæftning)", value: contentBlock_1.RULE_IMAGE }))
        .addStringOption((o) => o
        .setName("match")
        .setDescription("Tekst der skal findes (URL-fragment, domæne osv.). For alle billeder: skriv *")
        .setRequired(true)
        .setMinLength(1)
        .setMaxLength(500)))
        .addSubcommand(new discord_js_1.SlashCommandSubcommandBuilder()
        .setName("fjern")
        .setDescription("Fjern en regel med ID fra listen")
        .addIntegerOption((o) => o
        .setName("id")
        .setDescription("Regel-ID (fra /contentblock liste)")
        .setRequired(true)
        .setMinValue(1)))
        .addSubcommand(new discord_js_1.SlashCommandSubcommandBuilder()
        .setName("liste")
        .setDescription("Vis alle aktive blokeringer")),
    execute: async (interaction) => {
        if (!isModerator(interaction)) {
            await interaction.reply({
                content: "Kun moderatorer kan bruge denne kommando.",
                ephemeral: true,
            });
            return;
        }
        const sub = interaction.options.getSubcommand();
        if (sub === "tilfoej") {
            await interaction.deferReply({ ephemeral: true });
            const type = interaction.options.getString("type", true);
            let match = interaction.options.getString("match", true).trim();
            if (type === contentBlock_1.RULE_IMAGE && match !== "*") {
                match = match.toLowerCase();
            }
            else if (type === contentBlock_1.RULE_LINK) {
                match = match.toLowerCase();
            }
            try {
                await database_1.default.contentBlockRule.create({
                    data: {
                        pattern: match,
                        ruleType: type,
                        staffId: interaction.user.id,
                    },
                });
            }
            catch {
                await interaction.editReply({
                    content: "Denne regel findes allerede (samme type og match).",
                });
                return;
            }
            await interaction.editReply({
                content: `Regel tilføjet: **${type}** / \`${match}\``,
            });
            return;
        }
        if (sub === "fjern") {
            await interaction.deferReply({ ephemeral: true });
            const id = interaction.options.getInteger("id", true);
            try {
                await database_1.default.contentBlockRule.delete({ where: { id } });
            }
            catch {
                await interaction.editReply({
                    content: "Ingen regel med det ID.",
                });
                return;
            }
            await interaction.editReply({ content: `Regel #${id} er fjernet.` });
            return;
        }
        if (sub === "liste") {
            await interaction.deferReply({ ephemeral: true });
            const rows = await database_1.default.contentBlockRule.findMany({
                orderBy: { id: "asc" },
            });
            if (rows.length === 0) {
                await interaction.editReply({ content: "Ingen regler endnu." });
                return;
            }
            const lines = rows.map((r) => `\`#${r.id}\` **${r.ruleType}** — \`${r.pattern}\` (staff: <@${r.staffId}>)`);
            const embed = new discord_js_1.EmbedBuilder()
                .setTitle("Indholdsblokering")
                .setDescription(lines.join("\n").slice(0, 3900))
                .setTimestamp();
            await interaction.editReply({ embeds: [embed] });
        }
    },
};
