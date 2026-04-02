import { ActivityType, Client, Events } from "discord.js";
import { startContentAlerts } from "../services/contentAlerts";
import { ensureDefaultContentBlockRules } from "../utils/contentBlock";

export const event = {
    name: Events.ClientReady,
    once: true,
    async execute(client: Client) {
        console.log(`Ready! Logged in as ${client.user?.tag}`);
        client.user?.setActivity("Mobber Uni", { type: ActivityType.Listening });
        await ensureDefaultContentBlockRules();
        startContentAlerts(client);
    }
}; 