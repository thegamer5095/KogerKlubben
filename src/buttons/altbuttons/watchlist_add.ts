import { ButtonInteraction } from "discord.js";
import { Button } from "../../interfaces/Button";
import { showAddWatchlistModal } from "../../commands/moderation/watchlist";

function getUserIdFromWatchlistMessage(interaction: ButtonInteraction) {
  const footerText = interaction.message.embeds[0]?.footer?.text;
  return footerText?.match(/\d{17,20}/)?.[0];
}

export const button: Button = {
  customId: "watchlist_add",
  execute: async (interaction: ButtonInteraction) => {
    await showAddWatchlistModal(
      interaction,
      getUserIdFromWatchlistMessage(interaction)
    );
  },
};