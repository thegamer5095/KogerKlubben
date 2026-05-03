"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.modal = void 0;
const config_json_1 = __importDefault(require("../../config.json"));
const contentBlock_1 = require("../../utils/contentBlock");
exports.modal = {
    customId: "contentblock-add-link",
    execute: async (interaction) => {
        if (!interaction.inGuild()) {
            await interaction.reply({
                content: "Kun på serveren.",
                ephemeral: true,
            });
            return;
        }
        const member = interaction.member;
        if (!member.roles.cache.has(config_json_1.default.roles.moderatorRole)) {
            await interaction.reply({
                content: "Kun moderatorer.",
                ephemeral: true,
            });
            return;
        }
        const match = interaction.fields.getTextInputValue("match").trim().toLowerCase();
        if (!match) {
            await interaction.reply({
                content: "Match kan ikke være tomt.",
                ephemeral: true,
            });
            return;
        }
        const result = await (0, contentBlock_1.createContentBlockRule)(match, interaction.user.id);
        if (!result.ok) {
            await interaction.reply({
                content: "Denne regel findes allerede.",
                ephemeral: true,
            });
            return;
        }
        await interaction.reply({
            content: `Regel tilføjet: \`${match}\``,
            ephemeral: true,
        });
    },
};
