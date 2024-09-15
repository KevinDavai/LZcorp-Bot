import {
  ChatInputCommandInteraction,
  PermissionFlagsBits,
  ChannelType,
} from "discord.js";
import { CustomClient } from "structures/CustomClient";
import { BaseCommand } from "structures/BaseCommand";
import { SlashCommandBuilder } from "@discordjs/builders";

import {
  setBlackListChannel,
  setBlackListRole,
  setLevelUpChannel,
  setSuggestionChannel,
  setWelcomeChannel,
  upsertRoleForLevel,
} from "database/utils/GuildsUtils";
import {
  sendErrorEmbedWithCountdown,
  sendValidEmbedWithCountdown,
} from "utils/MessageUtils";

export class Settings extends BaseCommand {
  public constructor(client: CustomClient) {
    super(client, {
      data: new SlashCommandBuilder()
        .setName("settings")
        .setDescription("Edit settings of the server")
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addSubcommand((subcommand) =>
          subcommand
            .setName("welcome")
            .setDescription("Changer le channel de bienvenue")
            .addChannelOption((option) =>
              option
                .setName("channel")
                .setDescription("Le channel")
                .addChannelTypes(ChannelType.GuildText)
                .setRequired(true),
            ),
        )
        .addSubcommand((subcommand) =>
          subcommand
            .setName("suggestion")
            .setDescription("Changer le channel de suggestion")
            .addChannelOption((option) =>
              option
                .setName("channel")
                .setDescription("Le channel")
                .addChannelTypes(ChannelType.GuildText)
                .setRequired(true),
            ),
        )
        .addSubcommandGroup((subcommand) =>
          subcommand
            .setName("level")
            .setDescription("Modifier les paramètres du module level")
            .addSubcommand((sub) =>
              sub
                .setName("role")
                .setDescription(
                  "Définir un rôle à donner à un utilisateur lorsqu'il atteint un certain niveau",
                )
                .addIntegerOption((option) =>
                  option
                    .setName("level")
                    .setDescription("Le niveau")
                    .setRequired(true)
                    .setMaxValue(100)
                    .setMinValue(1),
                )
                .addRoleOption((option) =>
                  option
                    .setName("role")
                    .setDescription("Le rôle à donner")
                    .setRequired(true),
                ),
            )
            .addSubcommand((sub) =>
              sub
                .setName("channel")
                .setDescription(
                  "Changer le channel ou les messages de level up seront envoyés",
                )
                .addChannelOption((option) =>
                  option
                    .setName("channel")
                    .setDescription("Le channel")
                    .addChannelTypes(ChannelType.GuildText)
                    .setRequired(true),
                ),
            ),
        )
        .addSubcommandGroup((subcommand) =>
          subcommand
            .setName("blacklist")
            .setDescription("Les channels ou rôles blacklist")
            .addSubcommand((sub) =>
              sub
                .setName("channel")
                .setDescription("Le channel blacklist")
                .addChannelOption((option) =>
                  option
                    .setName("channel")
                    .setDescription("Le channel")
                    .addChannelTypes(ChannelType.GuildText)
                    .setRequired(true),
                ),
            )
            .addSubcommand((sub) =>
              sub
                .setName("role")
                .setDescription("Le role blacklist")
                .addRoleOption((option) =>
                  option
                    .setName("role")
                    .setDescription("Le role")
                    .setRequired(true),
                ),
            ),
        ),

      cooldown: 1000,
    });
  }

  public async execute(
    interaction: ChatInputCommandInteraction,
  ): Promise<void> {
    const subcommands: Record<string, () => Promise<void>> = {
      welcome: async () => {
        const channel = interaction.options.getChannel("channel");
        if (channel && channel.type === ChannelType.GuildText) {
          setWelcomeChannel(interaction.guild!, channel.id);
          await sendValidEmbedWithCountdown(interaction, [
            `Le channel de bienvenue est désormais ${channel}`,
          ]);
        } else {
          await sendErrorEmbedWithCountdown(interaction, [
            "Le channel spécifié n'est pas un channel text ou est introuvable.",
          ]);
        }
      },
      suggestion: async () => {
        const channel = interaction.options.getChannel("channel");
        if (channel && channel.type === ChannelType.GuildText) {
          setSuggestionChannel(interaction.guild!, channel.id);
          await sendValidEmbedWithCountdown(interaction, [
            `Le channel de suggestion est désormais ${channel}`,
          ]);
        } else {
          await sendErrorEmbedWithCountdown(interaction, [
            "Le channel spécifié n'est pas un channel text ou est introuvable.",
          ]);
        }
      },
    };

    const subCommandGroups: Record<
      string,
      Record<string, () => Promise<void>>
    > = {
      blacklist: {
        channel: async () => {
          const channel = interaction.options.getChannel("channel");
          if (channel && channel.type === ChannelType.GuildText) {
            await setBlackListChannel(interaction.guild!, channel.id);
            await sendValidEmbedWithCountdown(interaction, [
              `Le channel blacklist est désormais ${channel}`,
            ]);
          } else {
            await sendErrorEmbedWithCountdown(interaction, [
              "Le channel spécifié n'est pas un channel text ou est introuvable.",
            ]);
          }
        },
        role: async () => {
          const role = interaction.options.getRole("role");
          if (role) {
            await setBlackListRole(interaction.guild!, role.id);
            await sendValidEmbedWithCountdown(interaction, [
              `Le role ${role} sera donné aux utilisateurs blacklistés`,
            ]);
          } else {
            await sendErrorEmbedWithCountdown(interaction, [
              "Le role spécifié est invalide.",
            ]);
          }
        },
      },
      level: {
        role: async () => {
          const level = interaction.options.getInteger("level");
          const role = interaction.options.getRole("role");
          if (level && role) {
            await upsertRoleForLevel(interaction.guild!.id, level, role.id);
            await sendValidEmbedWithCountdown(interaction, [
              `Le rôle ${role} sera donné aux utilisateurs atteignant le niveau ${level}`,
            ]);
          } else {
            await sendErrorEmbedWithCountdown(interaction, [
              "Le niveau ou le rôle spécifié est invalide.",
            ]);
          }
        },
        channel: async () => {
          const channel = interaction.options.getChannel("channel");
          if (channel && channel.type === ChannelType.GuildText) {
            await setLevelUpChannel(interaction.guild!, channel.id);
            await sendValidEmbedWithCountdown(interaction, [
              `Le channel de level up est désormais ${channel}`,
            ]);
          } else {
            await sendErrorEmbedWithCountdown(interaction, [
              "Le channel spécifié n'est pas un channel text ou est introuvable.",
            ]);
          }
        },
      },
    };

    const subcommand = interaction.options.getSubcommand();
    const subCommandGroup = interaction.options.getSubcommandGroup();

    if (subCommandGroup && subCommandGroups[subCommandGroup]?.[subcommand]) {
      await subCommandGroups[subCommandGroup][subcommand]();
    } else if (subcommands[subcommand]) {
      await subcommands[subcommand]();
    } else {
      await sendErrorEmbedWithCountdown(interaction, [
        "Sous commande inconnue",
      ]);
    }
  }
}
