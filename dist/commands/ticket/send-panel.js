"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.command = void 0;
const discord_js_1 = require("discord.js");
const config_json_1 = __importDefault(require("../../config.json"));
exports.command = {
    data: new discord_js_1.SlashCommandBuilder()
        .setName("send-panel")
        .setDescription("Opretter et ticket panel"),
    execute: async (interaction) => {
        const channel = interaction.guild?.channels.cache.get(config_json_1.default.channels.ticketChannel);
        if (!channel?.isTextBased()) {
            await interaction.reply({
                content: "Den angivet kanal (i configgen) skal være en text kanal!",
                ephemeral: true,
            });
            return;
        }
        const embed = new discord_js_1.EmbedBuilder()
            .setColor('Blue')
            .setDescription('Tryk på knappen nedenunder, for at kontakte mod teamet!')
            .setFooter({ text: 'Kogerklubbens mod team' });
        const panel = new discord_js_1.ButtonBuilder()
            .setCustomId("ticket_create")
            .setLabel("Opret et ticket")
            .setStyle(discord_js_1.ButtonStyle.Primary);
        const row = new discord_js_1.ActionRowBuilder().addComponents(panel);
        await channel.send({ embeds: [embed], components: [row] });
        await interaction.reply({
            content: "Panelen er blevet sendt!",
            ephemeral: true,
        });
    },
};
