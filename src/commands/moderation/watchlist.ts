import {
  ActionRowBuilder,
  EmbedBuilder,
  ModalBuilder,
  PermissionFlagsBits,
  SlashCommandBuilder,
  SlashCommandSubcommandBuilder,
  TextInputBuilder,
  TextInputStyle,
} from "discord.js";
import { Command } from "../../interfaces/Command";
import prisma from "../../utils/database";
import { embedPages } from "../../handlers/pages"; // Adjust path if needed

export const command: Command = {
  data: new SlashCommandBuilder()
    .setName("watchlist")
    .setDescription("Interager med kogerklubbens watch liste")
    .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers)
    .addSubcommand(
      new SlashCommandSubcommandBuilder()
        .setName("opret")
        .setDescription("Indsæt en ny person på watchlisten")
    )
    .addSubcommand(
      new SlashCommandSubcommandBuilder()
        .setName("list")
        .setDescription("Få en liste med alle der er på vores watchlist")
        .addUserOption((option) =>
          option
            .setName("person")
            .setDescription("Personen der skal tilføjes watchlisten")
            .setRequired(false)
        )
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

      const modal = new ModalBuilder()
        .setCustomId("add-watchlist")
        .setTitle(`Tilføjelse af en bruger til watchlisten`);

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
      await interaction.deferReply({ ephemeral: true });

      const user = interaction.options.getUser("person");

      if (user) {
        const watchlist = await prisma.watchList.findMany({
          where: {
            userId: user.id,
          },
        });

        if (watchlist.length === 0) {
          await interaction.editReply({
            content: "Denne bruger er ikke på watchlisten"
          });
          return;
        }

        const warningCounts: Record<string, number> = {};
        for (const entry of watchlist) {
          warningCounts[entry.userId] = (warningCounts[entry.userId] || 0) + 1;
        }

        const embed = new EmbedBuilder()
          .setTitle(`${user.username} watchlisten`) 
          .setDescription(watchlist.map((user: any) => `👤 Bruger: <@${user.userId}>\n🛡️ Staff: <@${user.staffId}>\n🕒 Bruger tilføjet den: ${new Date(user.startTime).toLocaleString("da-DK", { hour12: false })}\n📄 Grundlag: ${user.reason}\nHvilken handling er blevet taget?: ${user.action}\n🔔 Antal advarsler: ${warningCounts[user.userId] || 0}`).join("\n"))
          .setTimestamp();

        await interaction.editReply({ embeds: [embed] });
        return;
      }
      const watchlist = await prisma.watchList.findMany();
      // Count the number of entries per userId
      const warningCounts: Record<string, number> = {};
      for (const entry of watchlist) {
        warningCounts[entry.userId] = (warningCounts[entry.userId] || 0) + 1;
      }

      // Only show unique users (one entry per user in the list)
      const uniqueUsers = Object.values(
        watchlist.reduce((acc: Record<string, (typeof watchlist)[0]>, entry: (typeof watchlist)[0]) => {
          if (!acc[entry.userId]) acc[entry.userId] = entry;
          return acc;
        }, {} as Record<string, (typeof watchlist)[0]>)
      );

      // Helper to chunk array into groups of 5
      function chunkArray<T>(arr: T[], size: number): T[][] {
        const result: T[][] = [];
        for (let i = 0; i < arr.length; i += size) {
          result.push(arr.slice(i, i + size));
        }
        return result;
      }

      const chunks = chunkArray(uniqueUsers, 5);

      const embeds = chunks.map((chunk) => {
        return new EmbedBuilder()
          .setTitle("Watchlisten")
          .setDescription(
            chunk
              .map(
                (user: any) =>
                  `👤 Bruger: <@${user.userId}>\n🛡️ Staff: <@${
                    user.staffId
                  }\n🕒 Bruger tilføjet den: ${new Date(
                    user.startTime
                  ).toLocaleString("da-DK", { hour12: false })}\n📄 Grundlag: ${
                    user.reason
                  }\nHvilken handling er blevet taget?: ${user.action}\n🔔 Antal advarsler: ${warningCounts[user.userId] || 0}`
              )
              .join("\n----------------------\n")
          )
          .setTimestamp();
      });

      if (embeds.length > 1) {
        await embedPages(interaction.client, interaction, embeds);
      } else {
        await interaction.editReply({ embeds: embeds });
      }
    } else if (subcommand === "fjern") {
      await interaction.deferReply({ ephemeral: true });

      const user = interaction.options.getUser("person");

      if (!user) {
        await interaction.editReply({
          content: "Du skal huske at angive en bruger"
        });
        return;
      }

      const watchlist = await prisma.watchList.findMany();

      const userToRemove = watchlist.find((entry: any) => entry.userId === user.id);

      if (!userToRemove) {
        await interaction.editReply({
          content: "Denne bruger er ikke på watchlisten"
        });
        return;
      }

      const embed = new EmbedBuilder()
        .setTitle("Bruger fjernet fra watchlisten")
        .setDescription(
          `👤 Bruger: <@${userToRemove.userId}>\n🛡️ Staff: <@${userToRemove.staffId}>`
        )
        .setTimestamp();

      await prisma.watchList.delete({
        where: {
          id: userToRemove.id,
        },
      });

      await interaction.editReply({ embeds: [embed] });
    }
  },
};
