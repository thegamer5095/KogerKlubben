import { Client, Collection, GatewayIntentBits } from "discord.js";
import { Command } from "./interfaces/Command";
import { Modal } from "./interfaces/Modal";
import { CommandHandler } from "./handlers/CommandHandler";
import { EventHandler } from "./handlers/EventHandler";
import { ModalHandler } from "./handlers/ModalHandler";
import { ButtonHandler } from "./handlers/Buttonhandler";
import config from "./config.json";
import { db } from "./utils/mysql";

export class Bot extends Client {
  public commands: Collection<string, Command>;
  public modals: Collection<string, Modal>;
  public buttons: Collection<string, any>;
  private commandHandler: CommandHandler;
  private eventHandler: EventHandler;
  private modalHandler: ModalHandler;
  private buttonHandler: ButtonHandler;

  constructor() {
    super({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.MessageContent,
      ],
    });

    this.commands = new Collection();
    this.modals = new Collection();
    this.buttons = new Collection();
    this.commandHandler = new CommandHandler(this);
    this.eventHandler = new EventHandler(this);
    this.modalHandler = new ModalHandler(this);
    this.buttonHandler = new ButtonHandler(this);
  }

  async initialize() {
    try {
      if (config.database.enabled) {
        // Test database connection
        await db.getConnection().then((connection) => {
          console.log("[Bot] Database connection test successful");
        connection.release();
      });
    }

      // Load commands first
      console.log("Loading commands...");
      this.commands = await this.commandHandler.loadCommands();
      
      // Register commands with Discord API
      console.log("Registering commands...");
      await this.commandHandler.registerCommands();
      
      // Load events
      console.log("Loading events...");
      await this.eventHandler.loadEvents();
      
      // Load modals and buttons
      console.log("Loading modals...");
      this.modals = await this.modalHandler.loadModals();
      console.log("Loading buttons...");
      this.buttons = await this.buttonHandler.loadButtons();
      
      // Login to Discord
      console.log("Logging in...");
      await this.login(config.bot.token);
    } catch (error) {
      console.error("Error during initialization:", error);
    }
  }
}

// Create and initialize the bot
const bot = new Bot();
bot.initialize();
