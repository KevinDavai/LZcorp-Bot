import { ChatInputCommandInteraction, PermissionFlagsBits } from "discord.js";
import { CustomClient } from "structures/CustomClient";
import { BaseCommand } from "structures/BaseCommand";
import ms from "ms";
import { SlashCommandBuilder } from "@discordjs/builders";
import {
  getOrFetchMemberById,
  sendErrorEmbedWithCountdown,
  sendValidEmbedWithCountdown,
} from "utils/MessageUtils";
import { Logger } from "services/Logger";

export class Unmute extends BaseCommand {
  public constructor(client: CustomClient) {
    super(client, {
      data: new SlashCommandBuilder()
        .setName("unmute")
        .setDescription("Démuter un utilisateur")
        .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers)
        .addUserOption((option) =>
          option
            .setName("user")
            .setDescription("L'utilisateur à démuté")
            .setRequired(true),
        ),
    });
  }

  public async execute(
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

    if (!member.isCommunicationDisabled()) {
      await sendErrorEmbedWithCountdown(interaction, [
        "Cet utilisateur n'est pas muté.",
      ]);
      return;
    }

    try {
      await member.disableCommunicationUntil(null); // En passant `null`, la communication n'est plus restreinte
      await sendValidEmbedWithCountdown(interaction, [
        `${user.tag} a été démuté avec succès.`,
      ]);
    } catch (error) {
      Logger.error(this.client.lang.error.unmuteCommand, user.id, error);
      await sendErrorEmbedWithCountdown(interaction, [
        "Une erreur est survenue lors de la tentative de démuting de l'utilisateur.",
      ]);
    }
  }
}
