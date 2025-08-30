import { SlashCommandBuilder } from 'discord.js';
import { Command } from '../../interfaces/Command';
import prisma from '../../utils/database';
import config from '../../config.json';

export const command: Command = {
    data: new SlashCommandBuilder()
        .setName('blacklist')
        .setDescription('Denne command vil banlyse en bruger fra bruge ticket systemet!')
        .addUserOption((option) =>
            option
                .setName('user')
                .setDescription('Brugeren der skal blive blacklisted')
                .setRequired(true)
        ),
    execute: async (interaction) => {
        const user = interaction.options.getUser('user');

        if (user) {
            const list = await prisma.blacklist.findMany({
                where: {
                    userId: user?.id,
                }
            })
    
            if (list.length > 0) {
                await interaction.reply({
                    content: 'Denne bruger er allerede blacklisted',
                    ephemeral: true,
                });
                return;
            }
    
            await prisma.blacklist.create({
                data: {
                    userId: user?.id,
                    staffId: interaction.user.id,
                    reason: 'Blacklisted via ticket system',
                },
            });
    
            await interaction.reply({
                content: 'Brugeren er blevet blacklisted',
                ephemeral: true,
            });
        }
    }
}; 