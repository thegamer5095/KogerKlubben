import { ColorResolvable, EmbedBuilder, Events, GuildMember } from 'discord.js';
import config from '../config.json'

export const event = {
    name: Events.GuildMemberAdd,
    once: false,
    async execute(member: GuildMember) {
            await member.roles.add(config.roles.afvwlRole);
    }
};
