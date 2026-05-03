"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.event = void 0;
const discord_js_1 = require("discord.js");
const pingRolesPanel_1 = require("../utils/pingRolesPanel");
const pingRoles_1 = require("../utils/pingRoles");
async function handleReaction(reaction, user) {
    const reactor = user.partial ? await user.fetch() : user;
    if (reactor.bot)
        return;
    const panel = await (0, pingRolesPanel_1.getPingRolesPanel)();
    if (!panel)
        return;
    try {
        if (reaction.partial) {
            await reaction.fetch();
        }
    }
    catch {
        return;
    }
    const message = reaction.message;
    if (!message.guild)
        return;
    if (message.id !== panel.messageId || message.channelId !== panel.channelId) {
        return;
    }
    const emoji = reaction.emoji;
    const roleId = (0, pingRoles_1.getRoleIdForReactionEmoji)(emoji.name, emoji.id);
    if (!roleId)
        return;
    try {
        const member = await message.guild.members.fetch(reactor.id);
        await member.roles.add(roleId);
    }
    catch {
        return;
    }
}
exports.event = {
    name: discord_js_1.Events.MessageReactionAdd,
    once: false,
    execute: async (reaction, user) => {
        await handleReaction(reaction, user);
    },
};
