"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.button = void 0;
const discord_js_1 = require("discord.js");
const config_json_1 = __importDefault(require("../../config.json"));
const database_1 = __importDefault(require("../../utils/database"));
exports.button = {
    customId: "ticket_create",
    execute: async (interaction) => {
        const list = await database_1.default.blacklist.findMany({
            where: {
                userId: interaction.user.id,
            }
        });
        if (list.length > 0) {
            await interaction.reply({ content: 'Du er blacklisted fra at oprette tickets!', ephemeral: true });
            return;
        }
        const existChan = interaction.guild?.channels.cache.filter(channel => channel.name === `-${interaction.user.username}`);
        if (existChan && existChan.size > 0) {
            await interaction.reply({ content: `Du har allerede en ticket oprettet her: <#${existChan}>`, ephemeral: true });
            return;
        }
        const ticketChannel = await interaction.guild?.channels.create({
            name: `support-${interaction.user.username}`,
            type: discord_js_1.ChannelType.GuildText,
            parent: '914907671507898378',
            permissionOverwrites: [
                {
                    id: interaction.guild?.roles.everyone,
                    deny: ['ViewChannel', 'SendMessages', 'ReadMessageHistory'],
                },
                {
                    id: interaction.user.id,
                    allow: ['ViewChannel', 'SendMessages', 'ReadMessageHistory'],
                },
                {
                    id: config_json_1.default.roles.moderatorRole,
                    allow: ['ViewChannel', 'SendMessages', 'ReadMessageHistory'],
                }
            ]
        });
        await interaction.reply({ content: `Ticket oprettet i <#${(ticketChannel)?.id}>`, flags: ['Ephemeral'] });
        const timestamp = Math.floor(Date.now() / 1000);
        const embed = new discord_js_1.EmbedBuilder()
            .setDescription(`> Vi gøre vores bedste for at hjælpe.\nTicket åbnet - <t:${timestamp}>`);
        const row = new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder()
            .setCustomId('close_ticket')
            .setLabel('Luk Ticket')
            .setStyle(discord_js_1.ButtonStyle.Danger));
        (await ticketChannel)?.send({ content: `**Hej <@${interaction.user.id}>**\nDu har netop oprettet en ticket i vores system, og du har i den forbindelse tilkaldt en fra mod-teamet.\n\nSkriv gerne i ticketen hvad du skal have hjælp til, og prøv så detaljeret som du nu kan.\n\nDu konkluderer selv når ticketen er færdig - Vi takker på forhånd! 🙂\nFor at lukke ticketen - Skal du trykke på den røde knap forneden! 🔒`, embeds: [embed], components: [row] });
    }
};
