import {
  GuildMember,
  ModalSubmitInteraction,
} from "discord.js";
import { Modal } from "../../interfaces/Modal";
import config from "../../config.json";
import { createContentBlockRule } from "../../utils/contentBlock";

export const modal: Modal = {
  customId: "contentblock-add-link",
  execute: async (interaction: ModalSubmitInteraction) => {
    if (!interaction.inGuild()) {
      await interaction.reply({
        content: "Kun på serveren.",
        ephemeral: true,
      });
      return;
    }
    const member = interaction.member as GuildMember;
    if (!member.roles.cache.has(config.roles.moderatorRole)) {
      await interaction.reply({
        content: "Kun moderatorer.",
        ephemeral: true,
      });
      return;
    }

    const match = interaction.fields.getTextInputValue("match").trim().toLowerCase();
    if (!match) {
      await interaction.reply({
        content: "Match kan ikke være tomt.",
        ephemeral: true,
      });
      return;
    }

    const result = await createContentBlockRule(match, interaction.user.id);
    if (!result.ok) {
      await interaction.reply({
        content: "Denne regel findes allerede.",
        ephemeral: true,
      });
      return;
    }

    await interaction.reply({
      content: `Regel tilføjet: \`${match}\``,
      ephemeral: true,
    });
  },
};
