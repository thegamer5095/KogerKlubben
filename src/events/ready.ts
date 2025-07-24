import { ActivityType, Client, Events } from 'discord.js';
import config from '../config.json'
import axios from 'axios'
const ip = config.server['Server-ip']

if (!ip) {
    throw new Error('Du har ikke angivet en server ip.');
}



export const event = {
    name: Events.ClientReady,
    once: true,
    execute(client: Client) {
        console.log(`Ready! Logged in as ${client.user?.tag}`);

    }
}; 