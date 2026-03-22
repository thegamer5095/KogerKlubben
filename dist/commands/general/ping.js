"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.command = void 0;
const discord_js_1 = require("discord.js");
exports.command = {
    data: new discord_js_1.SlashCommandBuilder()
        .setName('ping')
        .setDescription('Replies with Pong!'),
    execute: async (interaction) => {
        const modal = new discord_js_1.ModalBuilder()
            .setCustomId("test-modal")
            .setTitle('Jeg nørder');
        const selectMenu = new discord_js_1.LabelBuilder()
            .setLabel('User Select')
            .setUserSelectMenuComponent(new discord_js_1.UserSelectMenuBuilder()
            .setCustomId('test-select')
            .setPlaceholder('Select a user')
            .setMinValues(1)
            .setMaxValues(2));
        modal.addLabelComponents(selectMenu);
        await interaction.showModal(modal);
    }
};
