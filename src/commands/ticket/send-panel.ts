import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  SlashCommandBuilder,
} from "discord.js";
import { Command } from "../../interfaces/Command";
import config from "../../config.json";

export const command: Command = {
  data: new SlashCommandBuilder()
    .setName("send-panel")
    .setDescription("Opretter et ticket panel"),
  execute: async (interaction) => {
    const channel = interaction.guild?.channels.cache.get(
      config.channels.ticketChannel
    );

    if (!channel?.isTextBased()) {
      await interaction.reply({
        content: "Den angivet kanal (i configgen) skal være en text kanal!",
        ephemeral: true,
      });
      return;
    }

    const embed = new EmbedBuilder()
    .setColor('Blue')
    .setDescription('Tryk på knappen nedenunder, for at kontakte mod teamet!')
    .setFooter({text: 'Kogerklubbens mod team' })

    const panel = new ButtonBuilder()
      .setCustomId("ticket_create")
      .setLabel("Opret et ticket")
      .setStyle(ButtonStyle.Primary);

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(panel);
    await channel.send({ embeds: [embed], components: [row] });
    await interaction.reply({
      content: "Panelen er blevet sendt!",
      ephemeral: true,
    });
  },
};
