import {
  ApplicationCommandType,
  ContextMenuCommandBuilder,
  PermissionFlagsBits,
} from "discord.js";
import { ContextMenuCommand } from "../../interfaces/ContextMenuCommand";
import {
  removeWatchlistUser,
  showAddWatchlistModal,
  showWatchlistForUser,
} from "../../commands/moderation/watchlist";

export const contextMenus: ContextMenuCommand[] = [
  {
    data: new ContextMenuCommandBuilder()
      .setName("Tilføj til watchlisten")
      .setType(ApplicationCommandType.User)
      .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers),
    execute: async (interaction) => {
      const { targetUser } = interaction;
      await showAddWatchlistModal(interaction, targetUser.id);
    },
  },
  {
    data: new ContextMenuCommandBuilder()
      .setName("Fjern fra watchlisten")
      .setType(ApplicationCommandType.User)
      .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers),
    execute: async (interaction) => {
      const { targetUser } = interaction;
      await interaction.deferReply({ ephemeral: true });
      await removeWatchlistUser(interaction, targetUser);
    },
  },
];
