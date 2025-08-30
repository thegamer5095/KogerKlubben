import {
    ButtonInteraction,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ChannelType,
    PermissionFlagsBits,
  } from "discord.js";
  import * as discordTranscripts from "discord-html-transcripts";
  import config from "../../config.json";
  
  export const button = {
    customId: "close_ticket",
    execute: async (interaction: ButtonInteraction) => {

      if (interaction.channel?.type !== ChannelType.GuildText) {
        await interaction.reply({
          content: "Denne kommando kan kun bruges i en ticket-kanal.",
          ephemeral: true,
        });
        return;
      }
  
      await interaction.deferReply({ ephemeral: true });

      const transcript = await discordTranscripts.createTranscript(interaction.channel, {
        limit: -1,
        filename: `transcript-${interaction.channel.name}.html`,
        saveImages: true,
        poweredBy: false,
      });


      const logChannel = interaction.guild?.channels.cache.get(config.channels.logs);
      if (logChannel?.type !== ChannelType.GuildText) {
        await interaction.editReply({ content: "Logkanalen kunne ikke findes eller er ikke en tekstkanal." });
        return;
      }
  
      const logEmbed = new EmbedBuilder()
        .setTitle("🎫 Ticket lukket")
        .setColor(0xff0000)
        .setDescription(`Ticket: ${interaction.channel.name} lukket af ${interaction.user}`)
        .setTimestamp();
  
      await logChannel.send({
        embeds: [logEmbed],
        files: [transcript],
      });
  
      await interaction.editReply({ content: "Ticket bliver lukket og transcript er sendt til logkanalen." });
  

      await interaction.channel.delete();
    },
  };
  