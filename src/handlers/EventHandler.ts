import { Client } from "discord.js";
import { readdirSync } from "fs";
import { join } from "path";
import { scriptExt } from "../utils/scriptExt";

export class EventHandler {
  private client: Client;

  constructor(client: Client) {
    this.client = client;
  }

  async loadEvents() {
    const eventPath = join(__dirname, "..", "events");
    const eventFiles = readdirSync(eventPath).filter((file) =>
      file.endsWith(scriptExt)
    );

    for (const file of eventFiles) {
      const { event } = await import(join(eventPath, file));

      if (event.once) {
        this.client.once(event.name, (...args) => event.execute(...args));
      } else {
        this.client.on(event.name, (...args) => event.execute(...args));
      }
    }
  }
} 