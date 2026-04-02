"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.event = void 0;
const discord_js_1 = require("discord.js");
const config_json_1 = __importDefault(require("../config.json"));
const contentBlock_1 = require("../utils/contentBlock");
exports.event = {
    name: discord_js_1.Events.MessageCreate,
    once: false,
    execute: async (message) => {
        if (message.author.bot)
            return;
        if (!message.guild)
            return;
        if (message.member?.roles.cache.has(config_json_1.default.roles.moderatorRole))
            return;
        const matched = await (0, contentBlock_1.getMatchingContentBlockRules)(message);
        if (matched.length === 0)
            return;
        const summary = matched
            .map((m) => `${m.ruleType}:${m.pattern}`)
            .join(", ");
        let kindLabel = "blokeret indhold";
        const hasLink = matched.some((m) => m.ruleType === contentBlock_1.RULE_LINK);
        const hasImage = matched.some((m) => m.ruleType === contentBlock_1.RULE_IMAGE);
        if (hasLink && hasImage)
            kindLabel = "blokerede links/billeder";
        else if (hasImage)
            kindLabel = "blokerede billeder/links til billeder";
        else if (hasLink)
            kindLabel = "blokerede links";
        const preview = message.content?.slice(0, 800) ||
            (message.attachments.size > 0 ? "[vedhæftning/billede]" : "[tom besked]");
        const embed = new discord_js_1.EmbedBuilder()
            .setDescription(`${message.author} har forsøgt at sende ${kindLabel}.\n**Regler:** ${summary}\n**Besked:** \`\`\`${preview}\`\`\``)
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
        const channel = await message.guild.channels.fetch(config_json_1.default.channels.logs);
        if (channel?.isTextBased()) {
            await channel.send({ embeds: [embed] });
        }
    },
};
