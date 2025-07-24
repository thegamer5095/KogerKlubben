import { EmbedBuilder, Events, Message } from "discord.js";
import { Bot } from "../index";
import config from '../config.json'

export const event = {
  name: Events.MessageCreate,
  once: false,
  async execute(message: Message) {
    const client = message.client as Bot;

    if (!config.linkOnly.channels.includes(message.channel.id)) return;

    if (message.author.bot) return;

    if ( !message.content.includes('https://') &&
    !message.content.includes('http://') &&
    !message.attachments.some(attachment =>
      attachment.contentType?.startsWith('image/') ||
      attachment.url.toLowerCase().match(/\.(jpg|jpeg|png|gif|webp)$/)
    )) {
        message.delete()

        const embed = new EmbedBuilder()
        .setColor('Aqua')
        .setTitle('Der er blevet sendt en besked uden et link!')
        .setDescription(`<@${message.author.id}> har sendt en besked i <#${message.channel.id}>, der ikke indholdte et link!`)

        const NotifyChannel = message.guild?.channels.cache.get('833402838692003871')
        if (NotifyChannel?.isTextBased()) {
            await NotifyChannel.send({embeds: [embed]})
        }
    }
  }
};
