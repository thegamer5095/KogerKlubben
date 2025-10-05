import { StringSelectMenuInteraction, EmbedBuilder } from "discord.js";
import { SelectMenu } from "../../interfaces/SelectMenu";
import config from "../../config.json";

export const selectMenu: SelectMenu = {
  customId: "punishment-select",
  execute: async (interaction: StringSelectMenuInteraction) => {
    const punishment = interaction.values[0];
    const userId = interaction.customId.split("-")[2];

    if (!userId) {
      await interaction.reply({
        content: "Kunne ikke finde bruger ID.",
        flags: ['Ephemeral']
      });
      return;
    }

    if (userId === interaction.user.id) {
        await interaction.reply({
            content: "Du kan ikke give dig selv en straf.",
            flags: ['Ephemeral']
        });
        return;
    }

    if (userId === config.bot.clientId) {
        await interaction.reply({
            content: "Du kan ikke give botten en straf!",
            flags: ['Ephemeral']
        });
        return;
    }

    let punishmentText = "";
    let punishmentEmoji = "";

    switch (punishment) {
      case "warning":
        punishmentText = "Advarsel";
        punishmentEmoji = "⚠️";
        break;
      case "timeout_5min":
        punishmentText = "Timeout (1 time)";
        punishmentEmoji = "⏰";

        const user = await interaction.guild?.members.fetch(userId);

        if (!user) {
          await interaction.reply({
            content: "Brugerne har forladt discorden, og jeg kan derfor ikke give en timeout!",
            flags: ['Ephemeral']
          })
          return;
        }

        await user?.timeout(1 * 60 * 60 * 1000);
        break;
      case "timeout_10min":
        punishmentText = "Timeout (24 timer)";
        punishmentEmoji = "⏰";

        const twoUser = await interaction.guild?.members.fetch(userId);

        if (!twoUser) {
          await interaction.reply({
            content: "Brugerne har forladt discorden, og jeg kan derfor ikke give en timeout!",
            flags: ['Ephemeral']
          })
          return;
        }

        await twoUser?.timeout(24 * 60 * 60 * 1000);
        break;
      case "timeout_1hour":
        punishmentText = "Timeout (7 dage)";
        punishmentEmoji = "⏰";

        const sevenUser = await interaction.guild?.members.fetch(userId);

        if (!sevenUser) {
          await interaction.reply({
            content: "Brugerne har forladt discorden, og jeg kan derfor ikke give en timeout!",
            flags: ['Ephemeral']
          })
          return;
        }

        await sevenUser?.timeout(7 * 24 * 60 * 60 * 1000);
        break;
      case "kick":
        punishmentText = "Kick";
        punishmentEmoji = "👢";

        const kickUser = await interaction.guild?.members.fetch(userId);

        if (!kickUser) {
          await interaction.reply({
            content: "Brugerne har forladt discorden, og jeg kan derfor ikke give et kick!",
            flags: ['Ephemeral']
          })
          return;
        }

        await kickUser?.kick('Kicked via watchlist');
        break;
      case "none":
        punishmentText = "Ingen straf";
        punishmentEmoji = "✅";
        break;
    }

    const embed = new EmbedBuilder()
      .setTitle("En ny bruger er blevet oprette på watchlisten!")
      .setDescription(
        `👤 Bruger: <@${userId}>\n🛡️ Staff: <@${
          interaction.user.id
        }>\n🕒 Advarsel givet klokken: ${new Date().toLocaleTimeString(
          "da-DK",
          { hour12: false }
        )}\n${punishmentEmoji} Straf: ${punishmentText}`
      )
      .setThumbnail(interaction.user.displayAvatarURL())
      .setTimestamp();

    const channel = interaction.guild?.channels.cache.get(
      config.channels.watchchannel
    );

    if (!channel?.isTextBased()) {
      await interaction.reply({
        content: "Den angivet kanal (i configgen) skal være en text kanal!",
        flags: ['Ephemeral']
      });
      return;
    }

    await channel.send({ embeds: [embed] });
    await interaction.reply({
      content: `Brugeren er blevet sat på watchlisten med straf: ${punishmentText}`,
      flags: ['Ephemeral']
    });
  },
};
