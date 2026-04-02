import { Events, MessageReaction, PartialMessageReaction, User } from "discord.js";
import { getPingRolesPanel } from "../utils/pingRolesPanel";
import { getRoleIdForReactionEmoji } from "../utils/pingRoles";

async function handleReaction(
  reaction: MessageReaction | PartialMessageReaction,
  user: User
) {
  const reactor = user.partial ? await user.fetch() : user;
  if (reactor.bot) return;

  const panel = await getPingRolesPanel();
  if (!panel) return;

  try {
    if (reaction.partial) {
      await reaction.fetch();
    }
  } catch {
    return;
  }

  const message = reaction.message;
  if (!message.guild) return;
  if (message.id !== panel.messageId || message.channelId !== panel.channelId) {
    return;
  }

  const emoji = reaction.emoji;
  const roleId = getRoleIdForReactionEmoji(emoji.name, emoji.id);
  if (!roleId) return;

  try {
    const member = await message.guild.members.fetch(reactor.id);
    await member.roles.add(roleId);
  } catch {
    return;
  }
}

export const event = {
  name: Events.MessageReactionAdd,
  once: false,
  execute: async (
    reaction: MessageReaction | PartialMessageReaction,
    user: User
  ) => {
    await handleReaction(reaction, user);
  },
};
