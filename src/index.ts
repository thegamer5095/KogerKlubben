require("dotenv").config();
import { Client, Collection, GatewayIntentBits, Partials } from "discord.js";
import { Command } from "./interfaces/Command";
import { ContextMenuCommand } from "./interfaces/ContextMenuCommand";
import { Modal } from "./interfaces/Modal";
import { SelectMenu } from "./interfaces/SelectMenu";
import { CommandHandler } from "./handlers/CommandHandler";
import { EventHandler } from "./handlers/EventHandler";
import { ModalHandler } from "./handlers/ModalHandler";
import { ButtonHandler } from "./handlers/Buttonhandler";
import { SelectMenuHandler } from "./handlers/SelectMenuHandler";
import config from "./config.json";
import { db } from "./utils/mysql";

export class Bot extends Client {
  public commands: Collection<string, Command>;
  public contextMenus: Collection<string, ContextMenuCommand>;
  public modals: Collection<string, Modal>;
  public buttons: Collection<string, any>;
  public selectMenus: Collection<string, SelectMenu>;
  private commandHandler: CommandHandler;
  private eventHandler: EventHandler;
  private modalHandler: ModalHandler;
  private buttonHandler: ButtonHandler;
  public selectMenuHandler: SelectMenuHandler;

  constructor() {
    super({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.MessageContent,
      ],
      partials: [
        Partials.Message,
        Partials.Channel,
        Partials.Reaction,
      ],
    });

    this.commands = new Collection();
    this.contextMenus = new Collection();
    this.modals = new Collection();
    this.buttons = new Collection();
    this.selectMenus = new Collection();
    this.commandHandler = new CommandHandler(this);
    this.eventHandler = new EventHandler(this);
    this.modalHandler = new ModalHandler(this);
    this.buttonHandler = new ButtonHandler(this);
    this.selectMenuHandler = new SelectMenuHandler(this);
  }

  async initialize() {
    try {
      if (config.database.enabled) {
        await db.getConnection();
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
    } catch (error) {
      console.error("[Bot] Failed to initialize:", error);
    }
  }
}

// Create and initialize the bot
const bot = new Bot();
bot.initialize();
