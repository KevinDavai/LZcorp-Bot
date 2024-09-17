import {
  ChatInputCommandInteraction,
  EmbedBuilder,
  PermissionFlagsBits,
} from "discord.js";
import { CustomClient } from "structures/CustomClient";
import { BaseCommand } from "structures/BaseCommand";
import { SlashCommandBuilder } from "@discordjs/builders";

import {
  getOrFetchMemberById,
  sendErrorEmbedWithCountdown,
  sendValidEmbedWithCountdown,
} from "utils/MessageUtils";
import {
  addWarnToUser,
  getUserById,
  removeWarnToUser,
} from "database/utils/UserUtils";
import { Logger } from "services/Logger";
import { Warning } from "database/models/UserModel";

export class Warn extends BaseCommand {
  public constructor(client: CustomClient) {
    super(client, {
      data: new SlashCommandBuilder()
        .setName("warn")
        .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers)
        .setDescription("Créer / Supprimer / Lister les warns d'un utilisateur")
        .addSubcommand((subcommand) =>
          subcommand
            .setName("add")
            .setDescription("Ajouter un warn")
            .addUserOption((option) =>
              option
                .setName("user")
                .setDescription("L'utilisateur à warn")
                .setRequired(true),
            )
            .addStringOption((option) =>
              option
                .setName("reason")
                .setDescription("La raison du warn")
                .setRequired(true),
            ),
        )
        .addSubcommand((subcommand) =>
          subcommand
            .setName("remove")
            .setDescription("Supprimer un warn")
            .addUserOption((option) =>
              option
                .setName("user")
                .setDescription("L'utilisateur à unwarn")
                .setRequired(true),
            )
            .addNumberOption((option) =>
              option
                .setName("warn_id")
                .setDescription("ID du warn à supprimer")
                .setRequired(true),
            ),
        )
        .addSubcommand((subcommand) =>
          subcommand
            .setName("list")
            .setDescription("Lister les warns d'un utilisateur")
            .addUserOption((option) =>
              option
                .setName("user")
                .setDescription("L'utilisateur à lister")
                .setRequired(true),
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
      add: async () => {
        await this.addWarnCmd(interaction);
      },
      remove: async () => {
        await this.removeWarnCmd(interaction);
      },
      list: async () => {
        await this.listWarnCmd(interaction);
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

  private async addWarnCmd(
    interaction: ChatInputCommandInteraction,
  ): Promise<void> {
    const user = interaction.options.getUser("user", true);
    const reason = interaction.options.getString("reason", true);

    const member = await getOrFetchMemberById(interaction.guild!, user.id);

    if (!member) {
      await sendErrorEmbedWithCountdown(interaction, [
        "L'utilisateur n'existe pas ou est introuvable.",
      ]);
      return;
    }

    try {
      const userDb = await getUserById(user.id, interaction.guild!.id);

      await addWarnToUser(userDb, reason);

      await sendValidEmbedWithCountdown(interaction, [
        `L'utilisateur ${user.tag} a été warn avec succès.`,
        `Raison: ${reason}`,
      ]);
    } catch (error) {
      Logger.error(this.client.lang.error.warnCommand, user.id, error);
      await sendErrorEmbedWithCountdown(interaction, [
        "Une erreur est survenue lors de la création du warn.",
      ]);
    }
  }

  private async removeWarnCmd(
    interaction: ChatInputCommandInteraction,
  ): Promise<void> {
    const user = interaction.options.getUser("user", true);
    const warnId = interaction.options.getNumber("warn_id", true);

    const member = await getOrFetchMemberById(interaction.guild!, user.id);

    if (!member) {
      await sendErrorEmbedWithCountdown(interaction, [
        "L'utilisateur n'existe pas ou est introuvable.",
      ]);
      return;
    }

    try {
      const userDb = await getUserById(user.id, interaction.guild!.id);

      if (!userDb.warnings.find((warn) => warn.id === warnId)) {
        await sendErrorEmbedWithCountdown(interaction, [
          "Le warn spécifié n'existe pas.",
        ]);
        return;
      }

      await removeWarnToUser(userDb, warnId);

      await sendValidEmbedWithCountdown(interaction, [
        `Le warn ${warnId} de l'utilisateur ${user.tag} a été supprimé avec succès.`,
      ]);
    } catch (error) {
      Logger.error(this.client.lang.error.unWarnCommand, user.id, error);
      await sendErrorEmbedWithCountdown(interaction, [
        "Une erreur est survenue lors de la création du warn.",
      ]);
    }
  }

  private async listWarnCmd(
    interaction: ChatInputCommandInteraction,
  ): Promise<void> {
    const user = interaction.options.getUser("user", true);

    const member = await getOrFetchMemberById(interaction.guild!, user.id);

    if (!member) {
      await sendErrorEmbedWithCountdown(interaction, [
        "L'utilisateur n'existe pas ou est introuvable.",
      ]);
      return;
    }

    const userDb = await getUserById(user.id, interaction.guild!.id);
    const warns = userDb.warnings;

    if (warns.length === 0) {
      await sendValidEmbedWithCountdown(interaction, [
        "L'utilisateur n'a aucun warn.",
      ]);
      return;
    }

    const warnEmbed = this.listWarnEmbed(warns);

    await interaction.reply({ embeds: [warnEmbed] });
  }

  private listWarnEmbed(warns: Warning[]): EmbedBuilder {
    const warnEmbed = new EmbedBuilder()
      .setColor("#87CEFA")
      .setTitle("Liste des avertissements")
      .setDescription(
        "Voici la liste des avertissements pour cet utilisateur.",
      );

    // Ajouter chaque avertissement à l'embed
    warns.forEach((warn, index) => {
      warnEmbed.addFields({
        name: `Avertissement #${index + 1}`,
        value: `**ID :** ${warn.id}\n**Raison :** ${warn.reason}`,
        inline: false,
      });
    });

    return warnEmbed;
  }
}
