import { SlashCommandBuilder } from "@discordjs/builders";
import {
  ChannelType,
  ChatInputCommandInteraction,
  PermissionFlagsBits,
  PermissionsBitField,
} from "discord.js";
import { BaseCommand } from "structures/BaseCommand";
import { CustomClient } from "structures/CustomClient";
import {
  getOrFetchChannelById,
  getOrFetchMemberById,
  sendErrorEmbedWithCountdown,
  sendValidEmbedWithCountdown,
} from "utils/MessageUtils";

export class Add extends BaseCommand {
  public constructor(client: CustomClient) {
    super(client, {
      data: new SlashCommandBuilder()
        .setName("add")
        .setDescription("Ajouter un role ou un membre à un salon")
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addSubcommand((subcommand) =>
          subcommand
            .setName("membre")
            .setDescription("Ajouter un membre au salon")
            .addUserOption((option) =>
              option
                .setName("membre")
                .setDescription("Le membre")
                .setRequired(true),
            )
            .addChannelOption((option) =>
              option
                .setName("channel")
                .setDescription("Le channel")
                .addChannelTypes(ChannelType.GuildText)
                .setRequired(false),
            ),
        )
        .addSubcommand((subcommand) =>
          subcommand
            .setName("role")
            .setDescription("Ajouter un role au salon")
            .addRoleOption((option) =>
              option
                .setName("role")
                .setDescription("Le role")
                .setRequired(true),
            )
            .addChannelOption((option) =>
              option
                .setName("channel")
                .setDescription("Le channel")
                .addChannelTypes(ChannelType.GuildText)
                .setRequired(false),
            ),
        ),
    });
  }

  public async execute(
    interaction: ChatInputCommandInteraction,
  ): Promise<void> {
    if (!interaction.guild) {
      await sendErrorEmbedWithCountdown(interaction, [
        "Impossible de trouver le serveur.",
      ]);
      return;
    }

    const subcommands: Record<string, () => Promise<void>> = {
      role: async () => {
        await this.addRoleToChannel(interaction);
      },
      membre: async () => {
        await this.addMemberToChannel(interaction);
      },
    };

    const subcommand = interaction.options.getSubcommand();
    if (subcommands[subcommand]) {
      await subcommands[subcommand]();
    } else {
      await sendErrorEmbedWithCountdown(interaction, [
        "Sous commande inconnue.",
      ]);
    }
  }

  private async addRoleToChannel(interaction: ChatInputCommandInteraction) {
    const role = interaction.options.getRole("role", true);
    const channel =
      interaction.options.getChannel("channel") || interaction.channel;

    if (!role) {
      await sendErrorEmbedWithCountdown(interaction, ["role invalide."]);
      return;
    }

    const c = await getOrFetchChannelById(interaction.guild!, channel!.id);

    if (!c) {
      await sendErrorEmbedWithCountdown(interaction, ["Channel invalide."]);
      return;
    }

    if (c.isTextBased() && c.type !== ChannelType.DM && !c.isThread()) {
      c.permissionOverwrites.edit(role.id, {
        ViewChannel: true,
      });

      await sendValidEmbedWithCountdown(interaction, ["Role ajouté au salon."]);
    }
  }

  private async addMemberToChannel(interaction: ChatInputCommandInteraction) {
    const member = interaction.options.getUser("membre", true);
    const channel =
      interaction.options.getChannel("channel") || interaction.channel;

    if (!member) {
      await sendErrorEmbedWithCountdown(interaction, ["Membre invalide."]);
      return;
    }

    const c = await getOrFetchChannelById(interaction.guild!, channel!.id);

    if (!c) {
      await sendErrorEmbedWithCountdown(interaction, ["Channel invalide."]);
      return;
    }

    if (c.isTextBased() && c.type !== ChannelType.DM && !c.isThread()) {
      c.permissionOverwrites.edit(member.id, {
        ViewChannel: true,
      });

      await sendValidEmbedWithCountdown(interaction, [
        "Membre ajouté au salon.",
      ]);
    }
  }
}
