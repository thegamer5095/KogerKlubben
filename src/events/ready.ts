import { ActivityType, Client, Events } from 'discord.js';
import config from '../config.json'
import axios from 'axios'


export const event = {
    name: Events.ClientReady,
    once: true,
    execute(client: Client) {
        console.log(`Ready! Logged in as ${client.user?.tag}`);
        client.user?.setActivity("Mobber Uni", { type: ActivityType.Listening });
    }
}; 