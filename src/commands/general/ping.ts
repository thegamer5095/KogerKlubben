import {
    SlashCommandBuilder,
    PermissionFlagsBits,
    EmbedBuilder,
    ModalBuilder,
    ActionRowBuilder,
    LabelBuilder,
    UserSelectMenuBuilder,
  } from "discord.js";
  import { Command } from "../../interfaces/Command";

export const command: Command = {
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Replies with Pong!'),
    execute: async (interaction) => {
        const modal = new ModalBuilder()
    .setCustomId("test-modal")
    .setTitle('Jeg nørder')


    const selectMenu = new LabelBuilder()
    .setLabel('User Select')
    .setUserSelectMenuComponent(
        new UserSelectMenuBuilder()
        .setCustomId('test-select')
        .setPlaceholder('Select a user')
        .setMinValues(1)
        .setMaxValues(2)
    )


    modal.addLabelComponents(selectMenu);

    await interaction.showModal(modal);
    }
}; 