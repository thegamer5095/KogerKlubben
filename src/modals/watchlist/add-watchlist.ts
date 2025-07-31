import { EmbedBuilder, ModalSubmitInteraction } from "discord.js";
import { Modal } from "../../interfaces/Modal";
import prisma from "../../utils/database";
import config from "../../config.json";

export const modal: Modal = {
  customId: "add-watchlist",
  execute: async (interaction: ModalSubmitInteraction) => {
    const user = interaction.fields.getTextInputValue("username");
    const grundlag = interaction.fields.getTextInputValue("reason");

    const session = await prisma.watchList.create({
      data: {
        userId: user,
        staffId: interaction.user.id,
        startTime: new Date(),
        reason: grundlag,
      },
    });

    if (!session) {
      await interaction.reply({
        content:
          "Der opstod en fejl under oprettelsen af brugeren. Kontakt .the_gamer, hvis dette problem fortsætter :)",
        ephemeral: true,
      });
      return;
    }

    const embed = new EmbedBuilder()
    .setTitle('En ny bruger er blevet oprette på watchlisten!')
    .setDescription(`👤 Bruger: <@${user}>\n🛡️ Staff: <@${interaction.user.id}>\n🕒 Starttidspunkt: ${new Date().toLocaleTimeString('da-DK', { hour12: false })}\nGrundlag: ${grundlag}`)
    .setThumbnail(interaction.user.displayAvatarURL())
    .setTimestamp();

    const channel = interaction.guild?.channels.cache.get(config.channels.watchchannel)

    if (!channel?.isTextBased()) {
        await interaction.reply({content: 'Den angivet kanal (i configgen) skal være en text kanal!'})
        return;
    }

    await channel.send({ embeds: [embed]})
    await interaction.reply({content: 'Brugeren er blevet sat på watchlisten!', ephemeral: true})
  },
};
