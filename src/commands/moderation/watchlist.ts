import {
  ActionRowBuilder,
  EmbedBuilder,
  ModalBuilder,
  SlashCommandBuilder,
  SlashCommandSubcommandBuilder,
  TextInputBuilder,
  TextInputStyle,
} from "discord.js";
import { Command } from "../../interfaces/Command";
import prisma from "../../utils/database";

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
    )
    .addSubcommand(
      new SlashCommandSubcommandBuilder()
        .setName("fjern")
        .setDescription("Fjern en bruger fra watchlisten")
        .addUserOption((option) =>
          option
            .setName("person")
            .setDescription("Personen der skal fjernes fra watchlisten")
            .setRequired(true)
        )
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
        .setLabel("Hvad er denne brugers discord ID?")
        //.setPlaceholder('Hvis du ikke ved hvordan man finder en bruges id, kan denne guide hjælpe dig: https://support.discord.com/hc/en-us/articles/206346498-Where-can-I-find-my-User-Server-Message-ID-')
        .setStyle(TextInputStyle.Short)
        .setRequired(true);

      const reasonRow = new ActionRowBuilder<TextInputBuilder>().addComponents(
        reason
      );
      const usernameRow =
        new ActionRowBuilder<TextInputBuilder>().addComponents(username);

      modal.addComponents(reasonRow, usernameRow);

      await interaction.showModal(modal);
    } else if (subcommand === "list") {
      const watchlist = await prisma.watchList.findMany();

      const embed = new EmbedBuilder()
        .setTitle("Watchlisten")
        .setDescription(
          watchlist.length
            ? watchlist
                .map(
                  (user) =>
                    `👤 Bruger: ${user.userId}\n🛡️ Staff: ${
                      user.staffId
                    }\n🕒 Starttidspunkt: ${new Date(
                      user.startTime
                    ).toLocaleString("da-DK", {
                      hour12: false,
                    })}\n📄 Grundlag: ${user.reason}\n`
                )
                .join("\n----------------------\n")
            : "Ingen brugere på watchlisten."
        )
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
    } else if (subcommand === "fjern") {
      const user = interaction.options.getUser("person");

      if (!user) {
        await interaction.reply({
          content: "Du skal huske at angive en bruger",
          ephemeral: true,
        });
        return;
      }

      const watchlist = await prisma.watchList.findMany();

      const userToRemove = watchlist.find((entry) => entry.userId === user.id);

      if (!userToRemove) {
        await interaction.reply({
          content: "Denne bruger er ikke på watchlisten",
          ephemeral: true,
        });
        return;
      }

      const embed = new EmbedBuilder()
        .setTitle("Bruger fjernet fra watchlisten")
        .setDescription(`👤 Bruger: ${userToRemove.userId}\n🛡️ Staff: ${userToRemove.staffId}`)
        .setTimestamp();

      await prisma.watchList.delete({
        where: {
          id: userToRemove.id,
        },
      });

      await interaction.reply({ embeds: [embed] });
    }
  },
};
