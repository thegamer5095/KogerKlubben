"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.safeReplyEphemeral = safeReplyEphemeral;
exports.withInteractionErrorHandling = withInteractionErrorHandling;
const discord_js_1 = require("discord.js");
async function safeReplyEphemeral(interaction, content) {
    try {
        if (interaction.replied || interaction.deferred) {
            await interaction.followUp({ content, flags: discord_js_1.MessageFlags.Ephemeral });
        }
        else {
            await interaction.reply({ content, flags: discord_js_1.MessageFlags.Ephemeral });
        }
    }
    catch (err) {
        console.error("Failed to send error message:", err);
    }
}
async function withInteractionErrorHandling(interaction, fn, errorContent) {
    try {
        await fn();
    }
    catch (error) {
        console.error(error);
        await safeReplyEphemeral(interaction, errorContent);
    }
}
