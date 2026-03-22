import {
  ContextMenuCommandBuilder,
  UserContextMenuCommandInteraction,
} from "discord.js";

export interface ContextMenuCommand {
  data: ContextMenuCommandBuilder;
  execute: (interaction: UserContextMenuCommandInteraction) => Promise<void>;
}
