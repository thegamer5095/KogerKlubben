import {
  EmbedBuilder,
  ModalSubmitInteraction,
  StringSelectMenuBuilder,
  ActionRowBuilder,
} from "discord.js";
import { Modal } from "../../interfaces/Modal";
import prisma from "../../utils/database";
import config from "../../config.json";

export const modal: Modal = {
  customId: "add-watchlist",
  execute: async (interaction: ModalSubmitInteraction) => {
    const user = interaction.fields.getTextInputValue("username");
    const grundlag = interaction.fields.getTextInputValue("reason");
    const action = interaction.fields.getTextInputValue("action");

    const session = await prisma.watchList.create({
      data: {
        userId: user,
        staffId: interaction.user.id,
        startTime: new Date(),
        reason: grundlag,
        action: action,
      } as any,
    });

    if (!session) {
      await interaction.reply({
        content:
          "Der opstod en fejl under oprettelsen af brugeren. Kontakt .the_gamer, hvis dette problem fortsætter :)",
          flags: ['Ephemeral']
      });
      return;
    }

    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId(`punishment-select-${user}`)
      .setPlaceholder("Vælg straf for denne bruger")
      .addOptions([
        {
          label: "Advarsel",
          value: "warning",
          description: "Giv brugeren en advarsel",
        },
        {
          label: "Timeout (1 time)",
          value: "timeout_5min",
          description: "Timeout brugeren i 5 minutter",
        },
        {
          label: "Timeout (24 timer)",
          value: "timeout_10min",
          description: "Timeout brugeren i 10 minutter",
        },
        {
          label: "Timeout (7 dage)",
          value: "timeout_1hour",
          description: "Timeout brugeren i 1 time",
        },
        {
          label: "Kick",
          value: "kick",
          description: "Kick brugeren fra serveren",
        },
        {
          label: "Ingen straf",
          value: "none",
          description: "Ingen straf - kun tilføj til watchlist",
        },
      ]);

    const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
      selectMenu
    );

    await interaction.reply({
      content: `Brugeren <@${user}> er blevet tilføjet til watchlisten.\n**Grundlag:** ${grundlag}\n**Handling:** ${action}\n\nVælg nu hvilken straf der skal gives:`,
      components: [row],
      flags: ['Ephemeral']
    });
  },
};
