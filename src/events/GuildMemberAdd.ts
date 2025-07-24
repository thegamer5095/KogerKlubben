import { ColorResolvable, EmbedBuilder, Events, GuildMember } from 'discord.js';
import config from '../config.json'

export const event = {
    name: Events.GuildMemberAdd,
    once: false,
    async execute(member: GuildMember) {

        const JoinChannel = member.guild.channels.cache.get(config.channels.whiteChannelId);
        const errlogs = member.guild.channels.cache.get(config.channels.errorLog);

        const embed = new EmbedBuilder()
            .setColor(config.bot.color as ColorResolvable)
            .setTitle('En ny bruger har lige joinet discord!')
            .setDescription(`Brugeren <@${member.user.id}> har lige joinet discorden, og har modtaget "afventer whitelist"-rollen!`)

        if (JoinChannel?.isTextBased()) {
            JoinChannel.send({ embeds: [embed] });
        }

        try {
            await member.roles.add(config.roles.afvwlRole);
        } catch (error) {
            if (errlogs?.isTextBased()) {
                errlogs.send({ content: `<@${member.user.id}> kunne ikke modtage "afventer whitelist"-rollen!` });
            }
        }
    }
};
