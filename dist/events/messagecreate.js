"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.event = void 0;
const discord_js_1 = require("discord.js");
const config_json_1 = __importDefault(require("../config.json"));
const contentBlock_1 = require("../utils/contentBlock");
const CONTENT_BLOCK_LOG_COOLDOWN_MS = 60000;
const contentBlockLogCooldowns = new Map();
function shouldSendContentBlockLog(message, matchedRuleIds) {
    const now = Date.now();
    for (const [key, expiresAt] of contentBlockLogCooldowns) {
        if (expiresAt <= now) {
            contentBlockLogCooldowns.delete(key);
        }
    }
    const key = `${message.guild?.id}:${message.author.id}:${matchedRuleIds}`;
    const expiresAt = contentBlockLogCooldowns.get(key);
    if (expiresAt && expiresAt > now) {
        return false;
    }
    contentBlockLogCooldowns.set(key, now + CONTENT_BLOCK_LOG_COOLDOWN_MS);
    return true;
}
exports.event = {
    name: discord_js_1.Events.MessageCreate,
    once: false,
    execute: async (message) => {
        if (message.author.bot)
            return;
        if (!message.guild)
            return;
        const member = message.member;
        if (member && member.roles.cache.has(config_json_1.default.roles.moderatorRole)) {
            return;
        }
        const matched = await (0, contentBlock_1.getMatchingContentBlockRules)(message);
        if (matched.length === 0)
            return;
        const summary = matched.map((m) => m.pattern).join(", ");
        const matchedRuleIds = matched
            .map((m) => m.id)
            .sort((a, b) => a - b)
            .join(",");
        const preview = message.content?.slice(0, 800) ||
            (message.attachments.size > 0 ? "[vedhæftning]" : "[tom besked]");
        const embed = new discord_js_1.EmbedBuilder()
            .setDescription(`${message.author} har forsøgt at sende blokeret tekst/link.\n**Regler:** ${summary}\n**Besked:** \`\`\`${preview}\`\`\``)
            .setTimestamp()
            .setFooter({
            text: `ID: ${message.author.id}`,
        });
        try {
            await message.delete();
        }
        catch {
            return;
        }
        if (!shouldSendContentBlockLog(message, matchedRuleIds)) {
            return;
        }
        const channel = await message.guild.channels.fetch(config_json_1.default.channels.logs);
        if (channel?.isTextBased()) {
            await channel.send({ embeds: [embed] });
        }
    },
};
