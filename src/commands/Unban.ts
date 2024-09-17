import { ChatInputCommandInteraction, PermissionFlagsBits } from "discord.js";
import { CustomClient } from "structures/CustomClient";
import { BaseCommand } from "structures/BaseCommand";
import { SlashCommandBuilder } from "@discordjs/builders";
import {
  sendErrorEmbedWithCountdown,
  sendValidEmbedWithCountdown,
} from "utils/MessageUtils";
import { Logger } from "services/Logger";

export class Unban extends BaseCommand {
  public constructor(client: CustomClient) {
    super(client, {
      data: new SlashCommandBuilder()
        .setName("unban")
        .setDescription("Débannir un utilisateur")
        .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
        .addStringOption((option) =>
          option
            .setName("user")
            .setDescription("L'id de l'utilisateur à débannir")
            .setRequired(true),
        ),
    });
  }

  public async execute(
    interaction: ChatInputCommandInteraction,
  ): Promise<void> {
    const userId = interaction.options.getString("user", true);

    // Vérifier si le serveur existe
    if (!interaction.guild) {
      await interaction.reply({
        content: "Impossible de trouver le serveur.",
        ephemeral: true,
      });
      return;
    }

    try {
      const bannedUsers = await interaction.guild.bans.fetch();
      const bannedUser = bannedUsers.get(userId);

      if (!bannedUser) {
        await sendErrorEmbedWithCountdown(interaction, [
          "Cet utilisateur n'est pas banni.",
        ]);
        return;
      }

      await interaction.guild.members.unban(userId);

      await sendValidEmbedWithCountdown(interaction, [
        `L'utilisateur avec l'ID ${userId} a été débanni avec succès.`,
      ]);
    } catch (error) {
      Logger.error(
        this.client.lang.error.unbanCommand,
        userId,
        interaction.guild.id,
        error,
      );
      await sendErrorEmbedWithCountdown(interaction, [
        `Une erreur est survenue lors du débannissement de l'utilisateur avec l'ID ${userId}.`,
      ]);
    }
  }
}
