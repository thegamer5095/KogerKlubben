"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.event = void 0;
const discord_js_1 = require("discord.js");
const config_json_1 = __importDefault(require("../config.json"));
exports.event = {
    name: discord_js_1.Events.MessageCreate,
    once: false,
    execute: async (message) => {
        if (message.author.bot)
            return;
        if (message.member?.roles.cache.has(config_json_1.default.roles.moderatorRole))
            return;
        if (message.content.includes("discord.gg") || message.content.includes("onlyfans.co.uk")) {
            const embed = new discord_js_1.EmbedBuilder()
                .setDescription(`${message.author} har forsøgt at sende nsfw invites, alle beskeder er blevet slettet!\nBesked: \`\`\`${message.content}\`\`\``)
                .setTimestamp()
                .setFooter({
                text: `ID: ${message.author.id}`,
            });
            await message.delete();
            const channel = await message.guild?.channels.fetch(config_json_1.default.channels.logs);
            if (channel) {
                if (channel.isTextBased()) {
                    await channel.send({ embeds: [embed] });
                }
            }
        }
    },
};
