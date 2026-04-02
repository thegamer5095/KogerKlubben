import {
  ChatInputCommandInteraction,
  EmbedBuilder,
  GuildMember,
  LabelBuilder,
  ModalBuilder,
  PermissionFlagsBits,
  SlashCommandBuilder,
  SlashCommandSubcommandBuilder,
  TextInputBuilder,
  TextInputStyle,
} from "discord.js";
import { Command } from "../../interfaces/Command";
import config from "../../config.json";
import prisma from "../../utils/database";

function isModerator(interaction: ChatInputCommandInteraction): boolean {
  if (!interaction.inGuild()) return false;
  const member = interaction.member as GuildMember;
  return member.roles.cache.has(config.roles.moderatorRole);
}

export const command: Command = {
  data: new SlashCommandBuilder()
    .setName("contentblock")
    .setDescription("Administrér automatisk blokering af tekst og links")
    .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers)
    .addSubcommand(
      new SlashCommandSubcommandBuilder()
        .setName("tilfoej")
        .setDescription("Tilføj en blokering (tekst eller URL-fragment)")
    )
    .addSubcommand(
      new SlashCommandSubcommandBuilder()
        .setName("fjern")
        .setDescription("Fjern en regel med ID fra listen")
        .addIntegerOption((o) =>
          o
            .setName("id")
            .setDescription("Regel-ID (fra /contentblock liste)")
            .setRequired(true)
            .setMinValue(1)
        )
    )
    .addSubcommand(
      new SlashCommandSubcommandBuilder()
        .setName("liste")
        .setDescription("Vis alle aktive blokeringer")
    ),
  execute: async (interaction) => {
    if (!isModerator(interaction)) {
      await interaction.reply({
        content: "Kun moderatorer kan bruge denne kommando.",
        ephemeral: true,
      });
      return;
    }

    const sub = interaction.options.getSubcommand();

    if (sub === "tilfoej") {
      const modal = new ModalBuilder()
        .setCustomId("contentblock-add-link")
        .setTitle("Tilføj blokering")
        .addComponents(
          new LabelBuilder()
            .setLabel("Tekst / URL-fragment der skal blokere")
            .setTextInputComponent(
              new TextInputBuilder()
                .setCustomId("match")
                .setStyle(TextInputStyle.Short)
                .setRequired(true)
                .setMinLength(1)
                .setMaxLength(500)
            )
        );
      await interaction.showModal(modal);
      return;
    }

    if (sub === "fjern") {
      await interaction.deferReply({ ephemeral: true });
      const id = interaction.options.getInteger("id", true);

      try {
        await prisma.contentBlockRule.delete({ where: { id } });
      } catch {
        await interaction.editReply({
          content: "Ingen regel med det ID.",
        });
        return;
      }

      await interaction.editReply({ content: `Regel #${id} er fjernet.` });
      return;
    }

    if (sub === "liste") {
      await interaction.deferReply({ ephemeral: true });
      const rows = await prisma.contentBlockRule.findMany({
        orderBy: { id: "asc" },
      });

      if (rows.length === 0) {
        await interaction.editReply({ content: "Ingen regler endnu." });
        return;
      }

      const lines = rows.map(
        (r) =>
          `\`#${r.id}\` — \`${r.pattern}\` (staff: <@${r.staffId}>)`
      );

      const embed = new EmbedBuilder()
        .setTitle("Indholdsblokering")
        .setDescription(lines.join("\n").slice(0, 3900))
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });
    }
  },
};
