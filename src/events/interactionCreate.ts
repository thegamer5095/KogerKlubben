import { Events, Interaction } from "discord.js";
import { Bot } from "../index";
import { withInteractionErrorHandling } from "../utils/interactionReply";

const ERR_COMMAND =
  "Der opstod en fejl under udførelse af kommandoen! Kontakt .the_gamer hvis dette fortsætter.";
const ERR_GENERIC = "Der opstod en fejl!";
const ERR_MODAL =
  "Der opstod en fejl under behandling af denne modal!";

export const event = {
  name: Events.InteractionCreate,
  once: false,
  async execute(interaction: Interaction) {
    const client = interaction.client as Bot;

    if (interaction.isModalSubmit()) {
      const modal = client.modals.get(interaction.customId);
      if (!modal) {
        console.error(`No modal matching ${interaction.customId} was found.`);
        return;
      }
      await withInteractionErrorHandling(
        interaction,
        () => modal.execute(interaction),
        ERR_MODAL
      );
      return;
    }

    if (interaction.isContextMenuCommand()) {
      if (interaction.isUserContextMenuCommand()) {
        const contextMenu = client.contextMenus.get(interaction.commandName);
        if (!contextMenu) {
          console.error(
            `No user context menu matching ${interaction.commandName} was found.`
          );
          return;
        }
        await withInteractionErrorHandling(
          interaction,
          () => contextMenu.execute(interaction),
          ERR_COMMAND
        );
        return;
      }
    }

    if (interaction.isChatInputCommand()) {
      const command = client.commands.get(interaction.commandName);
      if (!command) {
        console.error(
          `No command matching ${interaction.commandName} was found.`
        );
        return;
      }
      await withInteractionErrorHandling(
        interaction,
        () => command.execute(interaction),
        ERR_COMMAND
      );
      return;
    }

    if (interaction.isButton()) {
      const button = client.buttons.get(interaction.customId);
      if (!button) {
        console.error(`No button handler found for ${interaction.customId}`);
        return;
      }
      await withInteractionErrorHandling(
        interaction,
        () => button.execute(interaction),
        ERR_GENERIC
      );
      return;
    }

    if (interaction.isStringSelectMenu()) {
      const selectMenu = client.selectMenuHandler.getSelectMenu(
        interaction.customId
      );
      if (!selectMenu) {
        console.error(
          `No select menu handler found for ${interaction.customId}`
        );
        return;
      }
      await withInteractionErrorHandling(
        interaction,
        () => selectMenu.execute(interaction),
        ERR_GENERIC
      );
    }
  },
};
