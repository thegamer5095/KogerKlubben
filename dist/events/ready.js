"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.event = void 0;
const discord_js_1 = require("discord.js");
const contentAlerts_1 = require("../services/contentAlerts");
const contentBlock_1 = require("../utils/contentBlock");
exports.event = {
    name: discord_js_1.Events.ClientReady,
    once: true,
    async execute(client) {
        console.log(`Ready! Logged in as ${client.user?.tag}`);
        client.user?.setActivity("Mobber Uni", { type: discord_js_1.ActivityType.Listening });
        await (0, contentBlock_1.ensureDefaultContentBlockRules)();
        (0, contentAlerts_1.startContentAlerts)(client);
    }
};
