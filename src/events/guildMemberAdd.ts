import { ActivityType, Client, Colors, EmbedBuilder, Events, GuildMember } from "discord.js";
import { startContentAlerts } from "../services/contentAlerts";
import { ensureDefaultContentBlockRules } from "../utils/contentBlock";
import { AltDetector } from "discord-alt-detector";
import config from "../config.json";

export const event = {
    name: Events.GuildMemberAdd,
    once: true,
    async execute(member: GuildMember) {
        const altDetector = new AltDetector({
            ageWeight: 1,
            statusWeight:1, 
            activityWeight:1, 
            usernameWordsWeight: 1, 
            usernameSymbolsWeight: 2,
            displaynameWordsWeight: 1, 
            displaynameCapsWeight: 1, 
            displaynameSymbolsWeight: 1, 
            flagsWeight: 2,
            boosterWeight: 1, 
            pfpWeight: 2, 
            bannerWeight: 1,	
        });
        const result = altDetector.check(member);
        const category = altDetector.getCategory(result);

        if (result.total < 1) {

            const embed = new EmbedBuilder()
                .setColor(Colors.Red)
                .setTitle("Mistænkelig bruger opdaget")
                .setDescription(`${member.user.displayName} har lige tilsluttet sig discorden, og er blevet markeret som ${category}\n\nVær ekstra opmærksom på denne bruger, og tag de nøvendige handlinger, hvis det skønnes nødvendigt!`)
                .setFooter({ text: `ID: ${member.user.id}` })


                const channel = await member.guild.channels.fetch(config.channels.logs)
                if (channel?.isTextBased()) {
                    await channel.send({ embeds: [embed] })
                }
            }
    }
}; 