"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.contextMenus = void 0;
const discord_js_1 = require("discord.js");
const watchlist_1 = require("../../commands/moderation/watchlist");
exports.contextMenus = [
    {
        data: new discord_js_1.ContextMenuCommandBuilder()
            .setName("Tilføj til watchlisten")
            .setType(discord_js_1.ApplicationCommandType.User)
            .setDefaultMemberPermissions(discord_js_1.PermissionFlagsBits.KickMembers),
        execute: async (interaction) => {
            const { targetUser } = interaction;
            const modal = new discord_js_1.ModalBuilder()
                .setCustomId("add-watchlist")
                .setTitle("Tilføjelse af en bruger til watchlisten");
            const reason = new discord_js_1.TextInputBuilder()
                .setCustomId("reason")
                .setLabel("Hvorfor skal denne bruger på listen?")
                .setStyle(discord_js_1.TextInputStyle.Paragraph)
                .setRequired(true);
            const username = new discord_js_1.TextInputBuilder()
                .setCustomId("username")
                .setLabel("Hvad er denne brugers discord ID?")
                .setStyle(discord_js_1.TextInputStyle.Short)
                .setRequired(true)
                .setValue(targetUser.id);
            const reasonRow = new discord_js_1.ActionRowBuilder().addComponents(reason);
            const usernameRow = new discord_js_1.ActionRowBuilder().addComponents(username);
            modal.addComponents(reasonRow, usernameRow);
            await interaction.showModal(modal);
        },
    },
    {
        data: new discord_js_1.ContextMenuCommandBuilder()
            .setName("Fjern fra watchlisten")
            .setType(discord_js_1.ApplicationCommandType.User)
            .setDefaultMemberPermissions(discord_js_1.PermissionFlagsBits.KickMembers),
        execute: async (interaction) => {
            const { targetUser } = interaction;
            await interaction.deferReply({ ephemeral: true });
            await (0, watchlist_1.removeWatchlistUser)(interaction, targetUser);
        },
    },
];
