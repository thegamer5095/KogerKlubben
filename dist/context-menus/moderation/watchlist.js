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
            await (0, watchlist_1.showAddWatchlistModal)(interaction, targetUser.id);
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
