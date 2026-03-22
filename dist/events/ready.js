"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.event = void 0;
const discord_js_1 = require("discord.js");
exports.event = {
    name: discord_js_1.Events.ClientReady,
    once: true,
    execute(client) {
        console.log(`Ready! Logged in as ${client.user?.tag}`);
        client.user?.setActivity("Mobber Uni", { type: discord_js_1.ActivityType.Listening });
    }
};
