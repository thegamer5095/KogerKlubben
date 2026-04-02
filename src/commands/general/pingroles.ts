import {
  ChatInputCommandInteraction,
  ColorResolvable,
  EmbedBuilder,
  GuildMember,
  SlashCommandBuilder,
} from "discord.js";
import { Command } from "../../interfaces/Command";
import config from "../../config.json";
import {
  getConfiguredPingDefinitions,
  PING_REACTION_DEFINITIONS,
} from "../../utils/pingRoles";
import { setPingRolesPanel } from "../../utils/pingRolesPanel";

function isStaff(interaction: ChatInputCommandInteraction): boolean {
  if (!interaction.inGuild()) return false;
  const member = interaction.member as GuildMember;
  return member.roles.cache.has(config.roles.moderatorRole);
}

export const command: Command = {
  data: new SlashCommandBuilder()
    .setName("pingroles")
    .setDescription("Opsæt ping-roller via reaktioner på en besked")
    .addSubcommand((s) =>
      s
        .setName("panel")
        .setDescription("Sender embed-panelet i denne kanal (kun moderatorer)")
    ),
  execute: async (interaction) => {
    const sub = interaction.options.getSubcommand();
    if (sub !== "panel") return;

    if (!interaction.inGuild() || !interaction.channel?.isTextBased()) {
      await interaction.reply({
        content: "Kan kun bruges i en tekstkanal på serveren.",
        ephemeral: true,
      });
      return;
    }

    if (!isStaff(interaction)) {
      await interaction.reply({
        content: "Kun moderatorer kan opsætte panelet.",
        ephemeral: true,
      });
      return;
    }

    const configured = getConfiguredPingDefinitions();
    if (configured.length === 0) {
      await interaction.reply({
        content:
          "Ingen ping-roller er sat i `config.json` under `roles.pingStream`, `pingNyheder` og `pingYoutube`.",
        ephemeral: true,
      });
      return;
    }

    await interaction.deferReply({ ephemeral: true });

    const lines = PING_REACTION_DEFINITIONS.map((d) => {
      const active = configured.some((c) => c.configKey === d.configKey);
      const status = active ? `${d.emoji} — aktiv` : `${d.emoji} — mangler rolle-ID i config`;
      return `**${d.label}** · ${status}\n${d.description}`;
    });

    const embed = new EmbedBuilder()
      .setTitle("Ping-roller")
      .setDescription(
        "Tryk på reaktionen under denne besked for at få rollen. Fjern din reaktion for at fjerne rollen igen.\n\n" +
          lines.join("\n\n")
      )
      .setColor(config.bot.color as ColorResolvable);

    const msg = await interaction.channel.send({ embeds: [embed] });

    for (const def of configured) {
      await msg.react(def.emoji);
    }

    await setPingRolesPanel({
      channelId: msg.channelId,
      messageId: msg.id,
    });

    await interaction.editReply({
      content: `Panel sendt. Besked-ID: \`${msg.id}\` (gemmes automatisk til reaktioner).`,
    });
  },
};
