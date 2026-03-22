"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.modal = void 0;
const discord_js_1 = require("discord.js");
const database_1 = __importDefault(require("../../utils/database"));
exports.modal = {
    customId: "add-watchlist",
    execute: async (interaction) => {
        const user = interaction.fields.getTextInputValue("username");
        const grundlag = interaction.fields.getTextInputValue("reason");
        const session = await database_1.default.watchList.create({
            data: {
                userId: user,
                staffId: interaction.user.id,
                startTime: new Date(),
                reason: grundlag,
                action: "pending",
            },
        });
        if (!session) {
            await interaction.reply({
                content: "Der opstod en fejl under oprettelsen af brugeren. Kontakt .the_gamer, hvis dette problem fortsætter :)",
                flags: ['Ephemeral']
            });
            return;
        }
        const selectMenu = new discord_js_1.StringSelectMenuBuilder()
            .setCustomId(`punishment-select-${user}`)
            .setPlaceholder("Vælg straf for denne bruger")
            .addOptions([
            {
                label: "Advarsel",
                value: "warning",
                description: "Giv brugeren en advarsel",
            },
            {
                label: "Timeout (1 time)",
                value: "timeout_5min",
                description: "Timeout brugeren i 5 minutter",
            },
            {
                label: "Timeout (24 timer)",
                value: "timeout_10min",
                description: "Timeout brugeren i 10 minutter",
            },
            {
                label: "Timeout (7 dage)",
                value: "timeout_1hour",
                description: "Timeout brugeren i 1 time",
            },
            {
                label: "Kick",
                value: "kick",
                description: "Kick brugeren fra serveren",
            },
            {
                label: "Ingen straf",
                value: "none",
                description: "Ingen straf - kun tilføj til watchlist",
            },
        ]);
        const row = new discord_js_1.ActionRowBuilder().addComponents(selectMenu);
        await interaction.reply({
            content: `Brugeren <@${user}> er blevet tilføjet til watchlisten.\n**Grundlag:** ${grundlag}\n**Handling:** Afventer strafvalg\n\nVælg nu hvilken straf der skal gives:`,
            components: [row],
            flags: ['Ephemeral']
        });
    },
};
