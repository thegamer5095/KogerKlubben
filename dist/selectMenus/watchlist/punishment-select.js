"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.selectMenu = void 0;
const discord_js_1 = require("discord.js");
const config_json_1 = __importDefault(require("../../config.json"));
const database_1 = __importDefault(require("../../utils/database"));
exports.selectMenu = {
    customId: "punishment-select",
    execute: async (interaction) => {
        const punishment = interaction.values[0];
        const userId = interaction.customId.split("-")[2];
        if (!userId) {
            await interaction.reply({
                content: "Kunne ikke finde bruger ID.",
                flags: ['Ephemeral']
            });
            return;
        }
        if (userId === interaction.user.id) {
            await interaction.reply({
                content: "Du kan ikke give dig selv en straf.",
                flags: ['Ephemeral']
            });
            return;
        }
        if (userId === config_json_1.default.bot.clientId) {
            await interaction.reply({
                content: "Du kan ikke give botten en straf!",
                flags: ['Ephemeral']
            });
            return;
        }
        let punishmentText = "";
        let punishmentEmoji = "";
        switch (punishment) {
            case "warning":
                punishmentText = "Advarsel";
                punishmentEmoji = "⚠️";
                break;
            case "timeout_5min":
                punishmentText = "Timeout (1 time)";
                punishmentEmoji = "⏰";
                try {
                    const user = await interaction.guild?.members.fetch(userId);
                    await user?.timeout(1 * 60 * 60 * 1000);
                }
                catch (error) {
                    await interaction.reply({
                        content: "Brugerne har forladt discorden, og jeg kan derfor ikke give en timeout!",
                        flags: ['Ephemeral']
                    });
                    return;
                }
                break;
            case "timeout_10min":
                punishmentText = "Timeout (24 timer)";
                punishmentEmoji = "⏰";
                try {
                    const twoUser = await interaction.guild?.members.fetch(userId);
                    await twoUser?.timeout(24 * 60 * 60 * 1000);
                }
                catch (error) {
                    await interaction.reply({
                        content: "Brugerne har forladt discorden, og jeg kan derfor ikke give en timeout!",
                        flags: ['Ephemeral']
                    });
                    return;
                }
                break;
            case "timeout_1hour":
                punishmentText = "Timeout (7 dage)";
                punishmentEmoji = "⏰";
                try {
                    const sevenUser = await interaction.guild?.members.fetch(userId);
                    await sevenUser?.timeout(7 * 24 * 60 * 60 * 1000);
                }
                catch (error) {
                    await interaction.reply({
                        content: "Brugerne har forladt discorden, og jeg kan derfor ikke give en timeout!",
                        flags: ['Ephemeral']
                    });
                    return;
                }
                break;
            case "kick":
                punishmentText = "Kick";
                punishmentEmoji = "👢";
                try {
                    const kickUser = await interaction.guild?.members.fetch(userId);
                    await kickUser?.kick('Kicked via watchlist');
                }
                catch (error) {
                    await interaction.reply({
                        content: "Brugerne har forladt discorden, og jeg kan derfor ikke give et kick!",
                        flags: ['Ephemeral']
                    });
                    return;
                }
                break;
            case "none":
                punishmentText = "Ingen straf";
                punishmentEmoji = "✅";
                break;
        }
        await database_1.default.watchList.updateMany({
            where: {
                userId: userId,
                action: "pending"
            },
            data: {
                action: punishment
            }
        });
        const watchListEntry = await database_1.default.watchList.findFirst({
            where: {
                userId: userId,
                action: punishment
            }
        });
        const embed = new discord_js_1.EmbedBuilder()
            .setTitle("En ny bruger er blevet oprette på watchlisten!")
            .setDescription(`👤 Bruger: <@${userId}>\n🛡️ Staff: <@${interaction.user.id}>\n🕒 Advarsel givet klokken: ${new Date().toLocaleTimeString("da-DK", { hour12: false })}\n${punishmentEmoji} Straf: ${punishmentText}\n📝 Grundlag: ${watchListEntry?.reason || "Ingen grundlag angivet"}`)
            .setThumbnail(interaction.user.displayAvatarURL())
            .setTimestamp();
        const channel = interaction.guild?.channels.cache.get(config_json_1.default.channels.watchchannel);
        if (!channel?.isTextBased()) {
            await interaction.reply({
                content: "Den angivet kanal (i configgen) skal være en text kanal!",
                flags: ['Ephemeral']
            });
            return;
        }
        await channel.send({ embeds: [embed] });
        await interaction.reply({
            content: `Brugeren er blevet sat på watchlisten med straf: ${punishmentText}`,
            flags: ['Ephemeral']
        });
    },
};
