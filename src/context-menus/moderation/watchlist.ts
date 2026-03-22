import {
  ActionRowBuilder,
  ApplicationCommandType,
  ContextMenuCommandBuilder,
  ModalBuilder,
  PermissionFlagsBits,
  TextInputBuilder,
  TextInputStyle,
} from "discord.js";
import { ContextMenuCommand } from "../../interfaces/ContextMenuCommand";
import {
  removeWatchlistUser,
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
      const modal = new ModalBuilder()
        .setCustomId("add-watchlist")
        .setTitle("Tilføjelse af en bruger til watchlisten");

      const reason = new TextInputBuilder()
        .setCustomId("reason")
        .setLabel("Hvorfor skal denne bruger på listen?")
        .setStyle(TextInputStyle.Paragraph)
        .setRequired(true);

      const username = new TextInputBuilder()
        .setCustomId("username")
        .setLabel("Hvad er denne brugers discord ID?")
        .setStyle(TextInputStyle.Short)
        .setRequired(true)
        .setValue(targetUser.id);

      const reasonRow = new ActionRowBuilder<TextInputBuilder>().addComponents(
        reason
      );
      const usernameRow =
        new ActionRowBuilder<TextInputBuilder>().addComponents(username);

      modal.addComponents(reasonRow, usernameRow);

      await interaction.showModal(modal);
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
