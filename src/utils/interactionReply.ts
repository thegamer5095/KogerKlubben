import { MessageFlags, RepliableInteraction } from "discord.js";

export async function safeReplyEphemeral(
  interaction: RepliableInteraction,
  content: string
): Promise<void> {
  try {
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({ content, flags: MessageFlags.Ephemeral });
    } else {
      await interaction.reply({ content, flags: MessageFlags.Ephemeral });
    }
  } catch (err) {
    console.error("Failed to send error message:", err);
  }
}

export async function withInteractionErrorHandling(
  interaction: RepliableInteraction,
  fn: () => Promise<void>,
  errorContent: string
): Promise<void> {
  try {
    await fn();
  } catch (error) {
    console.error(error);
    await safeReplyEphemeral(interaction, errorContent);
  }
}
