import { StringSelectMenuInteraction } from "discord.js";

export interface SelectMenu {
  customId: string;
  execute: (interaction: StringSelectMenuInteraction) => Promise<void>;
}
