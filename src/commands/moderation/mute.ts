import {
    Colors,
    EmbedBuilder,
    SlashCommandBuilder,
    type GuildMember,
} from "discord.js";
import { Command } from "../../interfaces/Command";
import config from "../../config.json";

const MAX_MUTE_DURATION_SECONDS = Math.floor(2_147_483_647 / 1000);

function scheduleMuteRemoval(member: GuildMember, duration: number, reason: string) {
    setTimeout(async () => {
        try {
            const refreshedMember = await member.guild.members.fetch(member.id).catch(() => null);

            if (!refreshedMember?.roles.cache.has(config.roles.mutedRole)) {
                return;
            }

            await refreshedMember.roles.remove(config.roles.mutedRole);

            const embed = new EmbedBuilder()
                .setTitle("Mute udløbet")
                .setDescription(`${refreshedMember.user.username} er ikke længere muted.\n**Grundlag:** ${reason}`)
                .setColor(Colors.Green)
                .setTimestamp();

            const channel = await member.guild.channels.fetch(config.channels.logs);
            if (channel?.isTextBased()) {
                await channel.send({ embeds: [embed] });
            }
        } catch (error) {
            console.error(`Error removing mute role from ${member.id}:`, error);
        }
    }, duration * 1000);
}

export const command: Command = {
    data: new SlashCommandBuilder()
        .setName('mute')
        .setDescription('Mute en bruger på serveren')
        .addUserOption((option) =>
            option.setName('user')
            .setDescription('Brugeren der skal mutees')
            .setRequired(true)
        )
        .addIntegerOption((option) =>
            option.setName('duration')
            .setDescription('Mute-varigheden i sekunder')
            .setMinValue(1)
            .setMaxValue(MAX_MUTE_DURATION_SECONDS)
            .setRequired(true)
        )
        .addStringOption((option) =>
            option.setName('reason')
            .setDescription('Grundlag for mute')
            .setRequired(true)
        ),
    execute: async (interaction) => {
        const user = interaction.options.getUser('user');
        const duration = interaction.options.getInteger('duration');
        const reason = interaction.options.getString('reason');

        if (!user) {
            return interaction.reply({ content: "Du skal angive en bruger!", ephemeral: true })
        }

        if (!duration || duration < 1 || duration > MAX_MUTE_DURATION_SECONDS) {
            return interaction.reply({ content: "Du skal angive en mute-varighed!", ephemeral: true })
        }

        if (!reason) {
            return interaction.reply({ content: "Du skal angive en grundlag for mute!", ephemeral: true })
        }
        
        const member = await interaction.guild?.members.fetch(user.id);

        if (!member) {
            return interaction.reply({ content: "Brugeren er ikke på serveren!", ephemeral: true })
        }

        const result = await member.roles.add(config.roles.mutedRole)

        if (!result) {
            interaction.reply({ content: "Der opstod en fejl!", ephemeral: true })
            console.error(`Error adding mute role to ${user?.id}: ${result}`)  
            return;
        }

        const embed = new EmbedBuilder()
        .setTitle("Bruger muted")
        .setDescription(`${user?.username} er blevet muted af ${interaction.user.username} for ${duration} sekunder med grundlag: ${reason}`)
        .setColor(Colors.Red)
        .setTimestamp()

        const channel = await interaction.guild?.channels.fetch(config.channels.logs)
        if (channel?.isTextBased()) {
            await channel.send({ embeds: [embed] })
        }

        scheduleMuteRemoval(member, duration, reason);

        await interaction.reply({ content: "Brugeren er blevet muted!", ephemeral: true })
    }
}; 