import { Events, Interaction } from "discord.js";
import { Bot } from "../index";

export const event = {
  name: Events.InteractionCreate,
  once: false,
  async execute(interaction: Interaction) {
    const client = interaction.client as Bot;

    // Handle slash commands
    if (interaction.isChatInputCommand()) {
      const command = client.commands.get(interaction.commandName);

      if (!command) {
        console.error(
          `No command matching ${interaction.commandName} was found.`
        );
        return;
      }

      try {
        await command.execute(interaction);
      } catch (error) {
        console.error(error);
        if (interaction.replied || interaction.deferred) {
          await interaction.followUp({
            content: "Der opstod en fejl under udførelse af kommandoen! Kontakt .the_gamer hvis dette fortsætter.",
            ephemeral: true,
          });
        } else {
          await interaction.reply({
            content: "Der opstod en fejl under udførelse af kommandoen! Kontakt .the_gamer hvis dette fortsætter.",
            ephemeral: true,
          });
        }
      }
    }

    // Handle button interactions
    if (interaction.isButton()) {
      const button = client.buttons.get(interaction.customId);

      if (!button) {
        console.error(`No button handler found for ${interaction.customId}`);
        return;
      }

      try {
        await button.execute(interaction);
      } catch (error) {
        console.error(error);
        if (interaction.replied || interaction.deferred) {
          await interaction.followUp({
            content: "Der opstod en fejl!",
            ephemeral: true,
          });
        } else {
          await interaction.reply({
            content: "Der opstod en fejl!",
            ephemeral: true,
          });
        }
      }
    }
  },
};
