import { EmbedBuilder, ModalSubmitInteraction } from 'discord.js';
import { Modal } from '../../interfaces/Modal';
import prisma from '../../utils/database';
import config from '../../config.json';

export const modal: Modal = {
    customId: 'add-watchlist',
    execute: async (interaction: ModalSubmitInteraction) => {
        const user = interaction.fields.getTextInputValue('person');
        const reason = interaction.fields.getTextInputValue('reason')

        console.log(user, reason)
    }
}