"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.event = void 0;
const discord_js_1 = require("discord.js");
exports.event = {
    name: discord_js_1.Events.InteractionCreate,
    async execute(interaction) {
        if (!interaction.isModalSubmit())
            return;
        const client = interaction.client;
        const modal = client.modals.get(interaction.customId);
        if (!modal) {
            console.error(`No modal matching ${interaction.customId} was found.`);
            return;
        }
        try {
            await modal.execute(interaction);
        }
        catch (error) {
            console.error(error);
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp({ content: 'Der opstod en fejl under behandling af denne modal!', flags: ['Ephemeral'] });
            }
            else {
                await interaction.reply({ content: 'Der opstod en fejl under behandling af denne modal!', flags: ['Ephemeral'] });
            }
        }
    }
};
