import {
  ActionRowBuilder,
  ModalBuilder,
  SlashCommandBuilder,
  SlashCommandSubcommandBuilder,
  TextInputBuilder,
  TextInputStyle,
} from "discord.js";
import { Command } from "../../interfaces/Command";
import prisma from "../../utils/database";
import axios from "axios";
import config from "../../config.json";

export const command: Command = {
  data: new SlashCommandBuilder()
    .setName("watchlist")
    .setDescription("Interager med kogerklubbens watch liste")
    .addSubcommand(
      new SlashCommandSubcommandBuilder()
        .setName("opret")
        .setDescription("Indsæt en ny person på watchlisten")
        .addUserOption((option) =>
          option
            .setName("person")
            .setDescription("Personen der skal tilføjes watchlisten")
            .setRequired(true)
        )
    )
    .addSubcommand(
      new SlashCommandSubcommandBuilder()
        .setName("list")
        .setDescription("Få en liste med alle der er på vores watchlist")
    ),
  execute: async (interaction) => {
    const subcommand = interaction.options.getSubcommand();

    if (subcommand === "opret") {
      const user = interaction.options.getUser("person");

      if (!user) {
        await interaction.reply({
          content: "Du skal huske at angive en bruger",
          ephemeral: true,
        });
        return;
      }

      const modal = new ModalBuilder()
        .setCustomId("add-watchlist")
        .setTitle(`Tilføjelse af ${user.username} til watchlisten`);

      const reason = new TextInputBuilder()
        .setCustomId("reason")
        .setLabel("Hvorfor skal denne bruger på listen?")
        .setStyle(TextInputStyle.Paragraph)
        .setRequired(true);

      const username = new TextInputBuilder()
        .setCustomId("username")
        .setLabel("Hvad er denne brugers username?")
        .setPlaceholder(`${user.username}`)
        .setStyle(TextInputStyle.Short)
        .setRequired(true);

        const reasonRow = new ActionRowBuilder<TextInputBuilder>().addComponents(
          reason
        );
        const usernameRow = new ActionRowBuilder<TextInputBuilder>().addComponents(
          username
        );

      modal.addComponents(reasonRow, usernameRow);

      await interaction.showModal(modal);
    }
  },
};
