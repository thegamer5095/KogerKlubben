"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.button = void 0;
const discord_js_1 = require("discord.js");
const discordTranscripts = __importStar(require("discord-html-transcripts"));
const config_json_1 = __importDefault(require("../../config.json"));
exports.button = {
    customId: "close_ticket",
    execute: async (interaction) => {
        if (interaction.channel?.type !== discord_js_1.ChannelType.GuildText) {
            await interaction.reply({
                content: "Denne kommando kan kun bruges i en ticket-kanal.",
                ephemeral: true,
            });
            return;
        }
        await interaction.deferReply({ ephemeral: true });
        const transcript = await discordTranscripts.createTranscript(interaction.channel, {
            limit: -1,
            filename: `transcript-${interaction.channel.name}.html`,
            saveImages: true,
            poweredBy: false,
        });
        const logChannel = interaction.guild?.channels.cache.get(config_json_1.default.channels.logs);
        if (logChannel?.type !== discord_js_1.ChannelType.GuildText) {
            await interaction.editReply({ content: "Logkanalen kunne ikke findes eller er ikke en tekstkanal." });
            return;
        }
        const logEmbed = new discord_js_1.EmbedBuilder()
            .setTitle("🎫 Ticket lukket")
            .setColor(0xff0000)
            .setDescription(`Ticket: ${interaction.channel.name} lukket af ${interaction.user}`)
            .setTimestamp();
        await logChannel.send({
            embeds: [logEmbed],
            files: [transcript],
        });
        await interaction.editReply({ content: "Ticket bliver lukket og transcript er sendt til logkanalen." });
        await interaction.channel.delete();
    },
};
