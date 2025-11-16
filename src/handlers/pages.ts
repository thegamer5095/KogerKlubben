import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  ChatInputCommandInteraction,
  Client,
  Message,
  MessageComponentInteraction,
  APIEmbed,
  InteractionReplyOptions,
} from "discord.js";

export const embedPages = async (
  client: Client,
  interaction: ChatInputCommandInteraction,
  embeds: EmbedBuilder[]
): Promise<void> => {
  const pages: Record<string, number> = {};

  const getRow = (id: string) => {
    const row = new ActionRowBuilder<ButtonBuilder>();
    row.addComponents(
      new ButtonBuilder()
        .setLabel("◀")
        .setCustomId("prev_embed")
        .setStyle(ButtonStyle.Primary)
        .setDisabled(pages[id] === 0)
    );
    row.addComponents(
      new ButtonBuilder()
        .setLabel("▶")
        .setCustomId("next_embed")
        .setStyle(ButtonStyle.Primary)
        .setDisabled(pages[id] === embeds.length - 1)
    );
    return row;
  };

  const id = interaction.user.id;
  pages[id] = pages[id] || 0;
  const Pagemax = embeds.length;

  const embed = embeds[pages[id]];
  embed.setFooter({
    text: `Page ${pages[id] + 1} from ${Pagemax}`,
  });

  let replyEmbed: Message;
  if (interaction.deferred || interaction.replied) {
    await interaction.editReply({
      embeds: [embed],
      components: [getRow(id)],
    });
    replyEmbed = (await interaction.fetchReply()) as Message;
  } else {
    replyEmbed = (await interaction.reply({
      embeds: [embed],
      components: [getRow(id)],
      ephemeral: true,
      fetchReply: true,
    })) as Message;
  }

  const filter = (i: MessageComponentInteraction) =>
    i.user.id === interaction.user.id;
  const time = 1000 * 60 * 5;

  const collector = replyEmbed.createMessageComponentCollector({
    filter,
    time,
  });

  collector.on("collect", async (b: MessageComponentInteraction) => {
    if (!b) return;
    if (b.customId !== "prev_embed" && b.customId !== "next_embed") return;

    await b.deferUpdate();

    if (b.customId === "prev_embed" && pages[id] > 0) {
      --pages[id];
    } else if (b.customId === "next_embed" && pages[id] < embeds.length - 1) {
      ++pages[id];
    }

    embeds[pages[id]].setFooter({
      text: `side ${pages[id] + 1} af ${Pagemax}`,
    });

    await interaction.editReply({
      embeds: [embeds[pages[id]]],
      components: [getRow(id)],
    });
  });

  collector.on("end", async (reason: string) => {
    if (reason === "time") {
      const warningEmbed = new EmbedBuilder()
        .setColor("Yellow")
        .setDescription("⚠️ |  Unfortunately, the embed has expired!");

      await interaction.editReply({
        embeds: [warningEmbed],
        components: [],
      });
    }
  });
};
