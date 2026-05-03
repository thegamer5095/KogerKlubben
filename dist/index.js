"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Bot = void 0;
require("dotenv").config();
const discord_js_1 = require("discord.js");
const CommandHandler_1 = require("./handlers/CommandHandler");
const EventHandler_1 = require("./handlers/EventHandler");
const ModalHandler_1 = require("./handlers/ModalHandler");
const Buttonhandler_1 = require("./handlers/Buttonhandler");
const SelectMenuHandler_1 = require("./handlers/SelectMenuHandler");
const config_json_1 = __importDefault(require("./config.json"));
const mysql_1 = require("./utils/mysql");
class Bot extends discord_js_1.Client {
    constructor() {
        super({
            intents: [
                discord_js_1.GatewayIntentBits.Guilds,
                discord_js_1.GatewayIntentBits.GuildMessages,
                discord_js_1.GatewayIntentBits.GuildMembers,
                discord_js_1.GatewayIntentBits.GuildMessageReactions,
                discord_js_1.GatewayIntentBits.MessageContent,
            ],
            partials: [
                discord_js_1.Partials.Message,
                discord_js_1.Partials.Channel,
                discord_js_1.Partials.Reaction,
            ],
        });
        this.commands = new discord_js_1.Collection();
        this.contextMenus = new discord_js_1.Collection();
        this.modals = new discord_js_1.Collection();
        this.buttons = new discord_js_1.Collection();
        this.selectMenus = new discord_js_1.Collection();
        this.commandHandler = new CommandHandler_1.CommandHandler(this);
        this.eventHandler = new EventHandler_1.EventHandler(this);
        this.modalHandler = new ModalHandler_1.ModalHandler(this);
        this.buttonHandler = new Buttonhandler_1.ButtonHandler(this);
        this.selectMenuHandler = new SelectMenuHandler_1.SelectMenuHandler(this);
    }
    async initialize() {
        try {
            if (config_json_1.default.database.enabled) {
                await mysql_1.db.getConnection();
                console.log("[Bot] Connected to database");
            }
            await this.commandHandler.loadCommands();
            await this.commandHandler.loadContextMenus();
            await this.commandHandler.registerCommands();
            await this.eventHandler.loadEvents();
            await this.modalHandler.loadModals();
            await this.buttonHandler.loadButtons();
            await this.selectMenuHandler.loadSelectMenus();
            const token = process.env.DISCORD_TOKEN?.trim();
            if (!token) {
                throw new Error("Missing DISCORD_TOKEN in environment (.env).");
            }
            await this.login(token);
        }
        catch (error) {
            console.error("[Bot] Failed to initialize:", error);
        }
    }
}
exports.Bot = Bot;
// Create and initialize the bot
const bot = new Bot();
bot.initialize();
