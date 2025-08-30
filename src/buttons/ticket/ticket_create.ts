import { ActionRowBuilder, ButtonBuilder, ButtonInteraction, ButtonStyle, ChannelType, EmbedBuilder } from "discord.js";
import config from "../../config.json";
import prisma from "../../utils/database";

export const button = {
    customId: "ticket_create",
    execute: async (interaction: ButtonInteraction) => {

        const list = await prisma.blacklist.findMany({
            where: {
                userId: interaction.user.id,
            }
        })
        
        if (list.length > 0) {
            await interaction.reply({content: 'Du er blacklisted fra at oprette tickets!', ephemeral: true})
            return;
        }

        const existChan = interaction.guild?.channels.cache.filter(channel => channel.name === `-${interaction.user.username}`)

        if (existChan && existChan.size > 0) {
            await interaction.reply({content: `Du har allerede en ticket oprettet her: <#${existChan}>`, ephemeral: true})
            return;
        }

        const ticketChannel = await interaction.guild?.channels.create({
            name: `support-${interaction.user.username}`,
            type: ChannelType.GuildText,
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
                    id: config.roles.moderatorRole,
                    allow: ['ViewChannel', 'SendMessages', 'ReadMessageHistory'],
                }
            ]
        })

        await interaction.reply({content: `Ticket oprettet i <#${(ticketChannel)?.id}>`, flags: ['Ephemeral']})
        const timestamp = Math.floor(Date.now() / 1000);

        const embed = new EmbedBuilder()
        .setDescription(`> Vi gøre vores bedste for at hjælpe.\nTicket åbnet - <t:${timestamp}>`);
    
        const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder()
                .setCustomId('close_ticket')
                .setLabel('Luk Ticket')
                .setStyle(ButtonStyle.Danger),
        );
    
        (await ticketChannel)?.send({content: `**Hej <@${interaction.user.id}>**\nDu har netop oprettet en ticket i vores system, og du har i den forbindelse tilkaldt en fra mod-teamet.\n\nSkriv gerne i ticketen hvad du skal have hjælp til, og prøv så detaljeret som du nu kan.\n\nDu konkluderer selv når ticketen er færdig - Vi takker på forhånd! 🙂\nFor at lukke ticketen - Skal du trykke på den røde knap forneden! 🔒`, embeds: [embed], components: [row]})
        
    }
}