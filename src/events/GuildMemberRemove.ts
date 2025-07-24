import { ColorResolvable, EmbedBuilder, Events, GuildMember } from 'discord.js';
import config from '../config.json'

export const event = {
    name: Events.GuildMemberAdd,
    once: false,
    async execute(member: GuildMember) {

        const JoinChannel = member.guild.channels.cache.get(config.channels.whiteChannelId);

        const embed = new EmbedBuilder()
            .setColor(config.bot.color as ColorResolvable)
            .setTitle('En bruger har forladt discorden!')
            .setDescription(`Brugeren <@${member.user.id}> har lige forladt discorden!`)

        if (JoinChannel?.isTextBased()) {
            JoinChannel.send({ embeds: [embed] });
        }

        
    }
};
