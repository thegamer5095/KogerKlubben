import { Client, Collection, REST, Routes } from "discord.js";
import { readdirSync } from "fs";
import { join } from "path";
import { Command } from "../interfaces/Command";
import { ContextMenuCommand } from "../interfaces/ContextMenuCommand";
import { Bot } from "../index";
import config from "../config.json";

export class CommandHandler {
  private client: Bot;
  private commands: Collection<string, Command>;
  private contextMenus: Collection<string, ContextMenuCommand>;

  constructor(client: Bot) {
    this.client = client;
    this.commands = new Collection();
    this.contextMenus = new Collection();
  }

  async loadCommands() {
    const commandPath = join(__dirname, "..", "commands");

    for (const dir of readdirSync(commandPath)) {
      // Check for both .ts and .js files depending on environment
      const fileExtension =
        process.env.NODE_ENV === "production" ? ".js" : ".ts";
      const commands = readdirSync(join(commandPath, dir)).filter((file) =>
        file.endsWith(fileExtension)
      );

      for (const file of commands) {
        const { command } = await import(join(commandPath, dir, file));
        if (command && command.data) {
          this.commands.set(command.data.name, command);
          console.log(`Loaded command: ${command.data.name}`);
        } else {
          console.warn(
            `Command in file ${file} is missing required properties`
          );
        }
      }
    }

    this.client.commands = this.commands;
    return this.commands;
  }

  async loadContextMenus() {
    const commandPath = join(__dirname, "..", "context-menus");

    for (const dir of readdirSync(commandPath)) {
      const fileExtension =
        process.env.NODE_ENV === "production" ? ".js" : ".ts";
      const files = readdirSync(join(commandPath, dir)).filter((file) =>
        file.endsWith(fileExtension)
      );

      for (const file of files) {
        const mod = await import(join(commandPath, dir, file));
        if (Array.isArray(mod.contextMenus)) {
          for (const cm of mod.contextMenus as ContextMenuCommand[]) {
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
    const rest = new REST().setToken(config.bot.token);
    const slashPayload = [...this.commands.values()].map((command) =>
      command.data.toJSON()
    );
    const contextPayload = [...this.contextMenus.values()].map((cm) =>
      cm.data.toJSON()
    );
    const commands = [...slashPayload, ...contextPayload];

    try {
      console.log("Started refreshing application (/) commands.");
      console.log(
        `Found ${slashPayload.length} slash commands and ${contextPayload.length} context menus to register`
      );

      if (commands.length === 0) {
        console.warn(
          "No commands found to register! Check your command loading process."
        );
        return;
      }

      console.log("Commands being registered:", commands);

      await rest.put(Routes.applicationCommands(config.bot.clientId), {
        body: commands,
      });

      console.log("Successfully reloaded application (/) commands.");
    } catch (error) {
      console.error("Error registering commands:", error);
      if (error instanceof Error) {
        console.error("Error details:", error.message);
        console.error("Stack trace:", error.stack);
      }
    }
  }
}
