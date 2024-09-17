import { ChatInputCommandInteraction, PermissionFlagsBits } from "discord.js";
import { CustomClient } from "structures/CustomClient";
import { BaseCommand } from "structures/BaseCommand";
import { SlashCommandBuilder } from "@discordjs/builders";
import {
  getOrFetchMemberById,
  sendErrorEmbedWithCountdown,
  sendValidEmbedWithCountdown,
} from "utils/MessageUtils";
import { Logger } from "services/Logger";

export class Ban extends BaseCommand {
  public constructor(client: CustomClient) {
    super(client, {
      data: new SlashCommandBuilder()
        .setName("ban")
        .setDescription("Banni un utilisateur")
        .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
        .addUserOption((option) =>
          option
            .setName("user")
            .setDescription("L'utilisateur à bannir")
            .setRequired(true),
        )
        .addStringOption((option) =>
          option
            .setName("reason")
            .setDescription("La raison du ban")
            .setRequired(false),
        ),
    });
  }

  public async execute(
    interaction: ChatInputCommandInteraction,
  ): Promise<void> {
    const user = interaction.options.getUser("user");
    const reason = interaction.options.getString("reason") || "Aucune raison";

    if (!user) {
      await sendErrorEmbedWithCountdown(interaction, [
        "L'utilisateur n'existe pas ou est introuvable.",
      ]);
      return;
    }

    const member = await getOrFetchMemberById(interaction.guild!, user.id);

    if (!member) {
      await sendErrorEmbedWithCountdown(interaction, [
        "L'utilisateur n'existe pas ou est introuvable.",
      ]);
      return;
    }

    if (!member.bannable) {
      await sendErrorEmbedWithCountdown(interaction, [
        "Je ne peux pas bannir cet utilisateur.",
      ]);
      return;
    }

    try {
      await member.ban({ reason });
      await sendValidEmbedWithCountdown(interaction, [
        `Utilisateur <@${member.id}> banni avec succès`,
      ]);
    } catch (error) {
      Logger.error(
        this.client.lang.error.banCommand,
        member.id,
        interaction.guild!.id,
        error,
      );
      await sendErrorEmbedWithCountdown(interaction, [
        `Une erreur est survenue lors du ban de l'utilisateur <@${member.id}>.`,
      ]);
    }
  }
}
