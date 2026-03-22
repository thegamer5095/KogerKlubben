"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.embedPages = void 0;
const discord_js_1 = require("discord.js");
const embedPages = async (client, interaction, embeds) => {
    const pages = {};
    const getRow = (id) => {
        const row = new discord_js_1.ActionRowBuilder();
        row.addComponents(new discord_js_1.ButtonBuilder()
            .setLabel("◀")
            .setCustomId("prev_embed")
            .setStyle(discord_js_1.ButtonStyle.Primary)
            .setDisabled(pages[id] === 0));
        row.addComponents(new discord_js_1.ButtonBuilder()
            .setLabel("▶")
            .setCustomId("next_embed")
            .setStyle(discord_js_1.ButtonStyle.Primary)
            .setDisabled(pages[id] === embeds.length - 1));
        return row;
    };
    const id = interaction.user.id;
    pages[id] = pages[id] || 0;
    const Pagemax = embeds.length;
    const embed = embeds[pages[id]];
    embed.setFooter({
        text: `Page ${pages[id] + 1} from ${Pagemax}`,
    });
    let replyEmbed;
    if (interaction.deferred || interaction.replied) {
        await interaction.editReply({
            embeds: [embed],
            components: [getRow(id)],
        });
        replyEmbed = (await interaction.fetchReply());
    }
    else {
        replyEmbed = (await interaction.reply({
            embeds: [embed],
            components: [getRow(id)],
            ephemeral: true,
            fetchReply: true,
        }));
    }
    const filter = (i) => i.user.id === interaction.user.id;
    const time = 1000 * 60 * 5;
    const collector = replyEmbed.createMessageComponentCollector({
        filter,
        time,
    });
    collector.on("collect", async (b) => {
        if (!b)
            return;
        if (b.customId !== "prev_embed" && b.customId !== "next_embed")
            return;
        await b.deferUpdate();
        if (b.customId === "prev_embed" && pages[id] > 0) {
            --pages[id];
        }
        else if (b.customId === "next_embed" && pages[id] < embeds.length - 1) {
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
    collector.on("end", async (reason) => {
        if (reason === "time") {
            const warningEmbed = new discord_js_1.EmbedBuilder()
                .setColor("Yellow")
                .setDescription("⚠️ |  Unfortunately, the embed has expired!");
            await interaction.editReply({
                embeds: [warningEmbed],
                components: [],
            });
        }
    });
};
exports.embedPages = embedPages;
