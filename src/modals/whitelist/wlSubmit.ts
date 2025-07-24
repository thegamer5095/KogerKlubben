import { EmbedBuilder, ModalSubmitInteraction } from 'discord.js';
import { Modal } from '../../interfaces/Modal';
import prisma from '../../utils/database';
import config from '../../config.json';

export const modal: Modal = {
    customId: 'wlSubmit',
    execute: async (interaction: ModalSubmitInteraction) => {
        const agreed = interaction.fields.getTextInputValue('agreed');
        const staff = interaction.fields.getTextInputValue('samtalen');
        const time = interaction.fields.getTextInputValue('time');
        const normal = interaction.fields.getTextInputValue('normal');


        const session = await prisma.whitelistSession.findFirst({
            where: {
                endTime: null,
                staffId: interaction.user.id
            },
            orderBy: {
                startTime: 'desc'
            }
        });


        if (!session) {
            await interaction.reply({ 
                content: 'Ingen aktiv whitelist samtale fundet!', 
                flags: ['Ephemeral'] 
            });
            return;
        }

        const oldDate = session.startTime;
        const newDate = new Date();
        const timeDiff = Math.abs(newDate.getTime() - oldDate.getTime());
        
        const minutes = Math.floor(timeDiff / (1000 * 60));
        const seconds = Math.floor((timeDiff % (1000 * 60)) / 1000);
        
        const timeFormatted = `${minutes} minutter ${seconds} sekunder`;

        if (minutes < 3) {
            const lessEmbed = new EmbedBuilder()
                .setColor('Red')
                .setTitle('🚨 Mistænkelig whitelist-samtale!')
                .setDescription(`👤 Bruger: <@${session.userId}>\n🛡️ Staff: ${interaction.user}\n⏳ Varighed: ${timeFormatted}\n❌ Status: Rapporteret til admin 🔴\n🔎 En administrator bør gennemgå samtalen.`)
                .setTimestamp();
            
            const channel = interaction.guild?.channels.cache.get(config.channels.whiteChannelId);
            if (channel?.isTextBased()) {
                await channel.send({ content: `<@${config.roles.staffId}>`, embeds: [lessEmbed] });
            }
        } else if (minutes >= 3) {


            await prisma.whitelistSession.update({
                where: { id: session.id },
                data: {
                    notes: `Betalt: ${agreed}\nSamtale: ${staff}\nTid: ${time}\nNormal: ${normal}`,
                    endTime: new Date(),
                }
            });

            const embed = new EmbedBuilder()
                .setColor('Green')
                .setTitle('📋 Whitelist Samtale Afsluttet!')
                .setDescription(`👤 Bruger: <@${session.userId}>\n🛡️ Staff: ${interaction.user}\n⏳ Varighed: ${timeFormatted}\n✅ Status: Afsluttet 🟢`)
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });
        }
    }
};