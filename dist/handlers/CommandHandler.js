"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommandHandler = void 0;
const discord_js_1 = require("discord.js");
const fs_1 = require("fs");
const path_1 = require("path");
const config_json_1 = __importDefault(require("../config.json"));
const scriptExt = process.env.NODE_ENV === "production" ? ".js" : ".ts";
class CommandHandler {
    constructor(client) {
        this.client = client;
        this.commands = new discord_js_1.Collection();
        this.contextMenus = new discord_js_1.Collection();
    }
    async loadCommands() {
        const commandPath = (0, path_1.join)(__dirname, "..", "commands");
        for (const dir of (0, fs_1.readdirSync)(commandPath)) {
            const commands = (0, fs_1.readdirSync)((0, path_1.join)(commandPath, dir)).filter((file) => file.endsWith(scriptExt));
            for (const file of commands) {
                const { command } = await Promise.resolve(`${(0, path_1.join)(commandPath, dir, file)}`).then(s => __importStar(require(s)));
                if (command && command.data) {
                    this.commands.set(command.data.name, command);
                    console.log(`Loaded command: ${command.data.name}`);
                }
                else {
                    console.warn(`Command in file ${file} is missing required properties`);
                }
            }
        }
        this.client.commands = this.commands;
        return this.commands;
    }
    async loadContextMenus() {
        const commandPath = (0, path_1.join)(__dirname, "..", "context-menus");
        for (const dir of (0, fs_1.readdirSync)(commandPath)) {
            const files = (0, fs_1.readdirSync)((0, path_1.join)(commandPath, dir)).filter((file) => file.endsWith(scriptExt));
            for (const file of files) {
                const mod = await Promise.resolve(`${(0, path_1.join)(commandPath, dir, file)}`).then(s => __importStar(require(s)));
                if (Array.isArray(mod.contextMenus)) {
                    for (const cm of mod.contextMenus) {
                        if (cm?.data) {
                            this.contextMenus.set(cm.data.name, cm);
                            console.log(`Loaded context menu: ${cm.data.name}`);
                        }
                    }
                }
            }
        }
        this.client.contextMenus = this.contextMenus;
        return this.contextMenus;
    }
    async registerCommands() {
        const rest = new discord_js_1.REST().setToken(config_json_1.default.bot.token);
        const slashPayload = [...this.commands.values()].map((command) => command.data.toJSON());
        const contextPayload = [...this.contextMenus.values()].map((cm) => cm.data.toJSON());
        const commands = [...slashPayload, ...contextPayload];
        try {
            console.log("Started refreshing application (/) commands.");
            console.log(`Found ${slashPayload.length} slash commands and ${contextPayload.length} context menus to register`);
            if (commands.length === 0) {
                console.warn("No commands found to register! Check your command loading process.");
                return;
            }
            await rest.put(discord_js_1.Routes.applicationCommands(config_json_1.default.bot.clientId), {
                body: commands,
            });
            console.log("Successfully reloaded application (/) commands.");
        }
        catch (error) {
            console.error("Error registering commands:", error);
            if (error instanceof Error) {
                console.error("Error details:", error.message);
                console.error("Stack trace:", error.stack);
            }
        }
    }
}
exports.CommandHandler = CommandHandler;
