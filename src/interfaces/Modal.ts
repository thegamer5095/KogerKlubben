import { ModalSubmitInteraction, ActionRowBuilder, TextInputBuilder } from 'discord.js';

export interface Modal {
    customId: string;
    execute: (interaction: ModalSubmitInteraction) => Promise<void>;
    components?: ActionRowBuilder<TextInputBuilder>[];
} 