import { Events, ModalSubmitInteraction } from 'discord.js';
import { Bot } from '../index';

export const event = {
    name: Events.InteractionCreate,
    async execute(interaction: ModalSubmitInteraction) {
        if (!interaction.isModalSubmit()) return;

        const client = interaction.client as Bot;
        const modal = client.modals.get(interaction.customId);

        if (!modal) {
            console.error(`No modal matching ${interaction.customId} was found.`);
            return;
        }

        try {
            await modal.execute(interaction);
        } catch (error) {
            console.error(error);
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp({ content: 'Der opstod en fejl under behandling af denne modal!', flags: ['Ephemeral'] });
            } else {
                await interaction.reply({ content: 'Der opstod en fejl under behandling af denne modal!', flags: ['Ephemeral'] });
            }
        }
    }
}; 