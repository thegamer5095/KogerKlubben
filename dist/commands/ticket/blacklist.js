"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.command = void 0;
const discord_js_1 = require("discord.js");
const database_1 = __importDefault(require("../../utils/database"));
exports.command = {
    data: new discord_js_1.SlashCommandBuilder()
        .setName('blacklist')
        .setDescription('Denne command vil banlyse en bruger fra bruge ticket systemet!')
        .addUserOption((option) => option
        .setName('user')
        .setDescription('Brugeren der skal blive blacklisted')
        .setRequired(true)),
    execute: async (interaction) => {
        const user = interaction.options.getUser('user');
        if (user) {
            const list = await database_1.default.blacklist.findMany({
                where: {
                    userId: user?.id,
                }
            });
            if (list.length > 0) {
                await interaction.reply({
                    content: 'Denne bruger er allerede blacklisted',
                    ephemeral: true,
                });
                return;
            }
            await database_1.default.blacklist.create({
                data: {
                    userId: user?.id,
                    staffId: interaction.user.id,
                    reason: 'Blacklisted via ticket system',
                },
            });
            await interaction.reply({
                content: 'Brugeren er blevet blacklisted',
                ephemeral: true,
            });
        }
    }
};
