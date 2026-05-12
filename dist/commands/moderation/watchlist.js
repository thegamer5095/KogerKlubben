"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.command = void 0;
exports.showAddWatchlistModal = showAddWatchlistModal;
exports.showWatchlistForUser = showWatchlistForUser;
exports.removeWatchlistUser = removeWatchlistUser;
const discord_js_1 = require("discord.js");
const database_1 = __importDefault(require("../../utils/database"));
const pages_1 = require("../../handlers/pages");
async function showAddWatchlistModal(interaction, userId) {
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
        .setRequired(true);
    if (userId) {
        username.setValue(userId);
    }
    const reasonRow = new discord_js_1.ActionRowBuilder().addComponents(reason);
    const usernameRow = new discord_js_1.ActionRowBuilder().addComponents(username);
    modal.addComponents(reasonRow, usernameRow);
    await interaction.showModal(modal);
}
async function showWatchlistForUser(interaction, user) {
    const watchlist = await database_1.default.watchList.findMany({
        where: {
            userId: user.id,
        },
    });
    if (watchlist.length === 0) {
        await interaction.editReply({
            content: "Denne bruger er ikke på watchlisten",
        });
        return;
    }
    const warningCounts = {};
    for (const entry of watchlist) {
        warningCounts[entry.userId] = (warningCounts[entry.userId] || 0) + 1;
    }
    const embed = new discord_js_1.EmbedBuilder()
        .setTitle(`${user.username} watchlisten`)
        .setDescription(watchlist
        .map((entry) => `👤 Bruger: <@${entry.userId}>\n🛡️ Staff: <@${entry.staffId}>\n🕒 Bruger tilføjet den: ${new Date(entry.startTime).toLocaleString("da-DK", { hour12: false })}\n📄 Grundlag: ${entry.reason}\nHvilken handling er blevet taget?: ${entry.action}\n🔔 Antal advarsler: ${warningCounts[entry.userId] || 0}`)
        .join("\n"))
        .setTimestamp();
    await interaction.editReply({ embeds: [embed] });
}
async function removeWatchlistUser(interaction, user) {
    const watchlist = await database_1.default.watchList.findMany();
    const userToRemove = watchlist.find((entry) => entry.userId === user.id);
    if (!userToRemove) {
        await interaction.editReply({
            content: "Denne bruger er ikke på watchlisten",
        });
        return;
    }
    const embed = new discord_js_1.EmbedBuilder()
        .setTitle("Bruger fjernet fra watchlisten")
        .setDescription(`👤 Bruger: <@${userToRemove.userId}>\n🛡️ Staff: <@${userToRemove.staffId}>`)
        .setTimestamp();
    await database_1.default.watchList.delete({
        where: {
            id: userToRemove.id,
        },
    });
    await interaction.editReply({ embeds: [embed] });
}
function chunkArray(arr, size) {
    const result = [];
    for (let i = 0; i < arr.length; i += size) {
        result.push(arr.slice(i, i + size));
    }
    return result;
}
exports.command = {
    data: new discord_js_1.SlashCommandBuilder()
        .setName("watchlist")
        .setDescription("Interager med kogerklubbens watch liste")
        .setDefaultMemberPermissions(discord_js_1.PermissionFlagsBits.KickMembers)
        .addSubcommand(new discord_js_1.SlashCommandSubcommandBuilder()
        .setName("opret")
        .setDescription("Indsæt en ny person på watchlisten"))
        .addSubcommand(new discord_js_1.SlashCommandSubcommandBuilder()
        .setName("list")
        .setDescription("Få en liste med alle der er på vores watchlist")
        .addUserOption((option) => option
        .setName("person")
        .setDescription("Personen der skal tilføjes watchlisten")
        .setRequired(false)))
        .addSubcommand(new discord_js_1.SlashCommandSubcommandBuilder()
        .setName("fjern")
        .setDescription("Fjern en bruger fra watchlisten")
        .addUserOption((option) => option
        .setName("person")
        .setDescription("Personen der skal fjernes fra watchlisten")
        .setRequired(true))),
    execute: async (interaction) => {
        const subcommand = interaction.options.getSubcommand();
        if (subcommand === "opret") {
            await showAddWatchlistModal(interaction);
        }
        else if (subcommand === "list") {
            await interaction.deferReply({ ephemeral: true });
            const user = interaction.options.getUser("person");
            if (user) {
                await showWatchlistForUser(interaction, user);
                return;
            }
            const watchlist = await database_1.default.watchList.findMany();
            const warningCounts = {};
            for (const entry of watchlist) {
                warningCounts[entry.userId] = (warningCounts[entry.userId] || 0) + 1;
            }
            const uniqueUsers = Object.values(watchlist.reduce((acc, entry) => {
                if (!acc[entry.userId])
                    acc[entry.userId] = entry;
                return acc;
            }, {}));
            const chunks = chunkArray(uniqueUsers, 5);
            const embeds = chunks.map((chunk) => {
                return new discord_js_1.EmbedBuilder()
                    .setTitle("Watchlisten")
                    .setDescription(chunk
                    .map((entry) => `👤 Bruger: <@${entry.userId}>\n🛡️ Staff: <@${entry.staffId}>\n🕒 Bruger tilføjet den: ${new Date(entry.startTime).toLocaleString("da-DK", { hour12: false })}\n📄 Grundlag: ${entry.reason}\nHvilken handling er blevet taget?: ${entry.action}\n🔔 Antal advarsler: ${warningCounts[entry.userId] || 0}`)
                    .join("\n----------------------\n"))
                    .setTimestamp();
            });
            if (embeds.length > 1) {
                await (0, pages_1.embedPages)(interaction.client, interaction, embeds);
            }
            else {
                await interaction.editReply({ embeds: embeds });
            }
        }
        else if (subcommand === "fjern") {
            await interaction.deferReply({ ephemeral: true });
            const user = interaction.options.getUser("person");
            if (!user) {
                await interaction.editReply({
                    content: "Du skal huske at angive en bruger"
                });
                return;
            }
            await removeWatchlistUser(interaction, user);
        }
    },
};
