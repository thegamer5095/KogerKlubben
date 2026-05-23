import { Client, Collection } from "discord.js";
import { readdirSync } from "fs";
import { join } from "path";
import { Modal } from "../interfaces/Modal";
import { Bot } from "../index";

const scriptExt = __filename.endsWith(".js") ? ".js" : ".ts";

export class ModalHandler {
  private client: Bot; // Change from Client to Bot
  private modals: Collection<string, Modal>;

  constructor(client: Bot) {
    // Change from Client to Bot
    this.client = client;
    this.modals = new Collection();
  }

  async loadModals() {
    const modalPath = join(__dirname, "..", "modals");

    for (const dir of readdirSync(modalPath)) {
      const modals = readdirSync(join(modalPath, dir)).filter((file) =>
        file.endsWith(scriptExt)
      );

      for (const file of modals) {
        const { modal } = await import(join(modalPath, dir, file));
        this.modals.set(modal.customId, modal);
        console.log(`Loaded modal: ${modal.customId}`);
      }
    }

    // Set the modals on the client
    this.client.modals = this.modals;
    return this.modals;
  }

  getModal(customId: string): Modal | undefined {
    return this.modals.get(customId);
  }
}
