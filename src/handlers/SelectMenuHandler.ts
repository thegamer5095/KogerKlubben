import { Client, Collection } from "discord.js";
import { readdirSync, existsSync, mkdirSync } from "fs";
import { join } from "path";
import { SelectMenu } from "../interfaces/SelectMenu";

export class SelectMenuHandler {
  private client: Client;
  private selectMenus: Collection<string, SelectMenu>;

  constructor(client: Client) {
    this.client = client;
    this.selectMenus = new Collection();
  }

  async loadSelectMenus() {
    const selectMenuPath = join(__dirname, "..", "selectMenus");

    if (!existsSync(selectMenuPath)) {
      console.log(
        "[Bot] SelectMenus directory not found, creating empty directory"
      );
      try {
        mkdirSync(selectMenuPath, { recursive: true });
      } catch (error) {
        console.warn("[Bot] Could not create selectMenus directory:", error);
        return this.selectMenus;
      }
    }

    for (const dir of readdirSync(selectMenuPath)) {
      const selectMenus = readdirSync(join(selectMenuPath, dir)).filter(
        (file) => file.endsWith(".ts") || file.endsWith(".js")
      );

      for (const file of selectMenus) {
        const { selectMenu } = await import(join(selectMenuPath, dir, file));
        if (selectMenu && selectMenu.customId) {
          this.selectMenus.set(selectMenu.customId, selectMenu);
          console.log(`Loaded select menu: ${selectMenu.customId}`);
        }
      }
    }

    return this.selectMenus;
  }

  getSelectMenu(customId: string): SelectMenu | undefined {
    // First try exact match
    let selectMenu = this.selectMenus.get(customId);

    // If no exact match, try to find by prefix (for dynamic custom IDs)
    if (!selectMenu) {
      for (const [id, menu] of this.selectMenus) {
        if (customId.startsWith(id)) {
          selectMenu = menu;
          break;
        }
      }
    }

    return selectMenu;
  }
}
