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

export class Kick extends BaseCommand {
  public constructor(client: CustomClient) {
    super(client, {
      data: new SlashCommandBuilder()
        .setName("kick")
        .setDescription("Expulse un utilisateur du serveur.")
        .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers) // Permissions pour ceux qui peuvent kicker
        .addUserOption((option) =>
          option
            .setName("user")
            .setDescription("L'utilisateur à expulser")
            .setRequired(true),
        )
        .addStringOption((option) =>
          option
            .setName("reason")
            .setDescription("La raison du kick")
            .setRequired(false),
        ),
    });
  }

  public async execute(
    interaction: ChatInputCommandInteraction,
  ): Promise<void> {
    const user = interaction.options.getUser("user", true); // Récupérer l'utilisateur

    const reason =
      interaction.options.getString("reason") || "Aucune raison spécifiée"; // Récupérer la raison ou utiliser un message par défaut

    const member = await getOrFetchMemberById(interaction.guild!, user.id); // Récupérer le membre

    // Vérification si l'utilisateur est dans le serveur
    if (!member) {
      await sendErrorEmbedWithCountdown(interaction, [
        "L'utilisateur n'existe pas ou est introuvable.",
      ]);
      return;
    }

    // Vérifier si l'utilisateur peut être kické (ex: ne pas kicker un administrateur)
    if (!member.kickable) {
      await sendErrorEmbedWithCountdown(interaction, [
        "Je ne peux pas expulser cet utilisateur. Il a peut-être un rôle plus élevé.",
      ]);

      return;
    }

    try {
      // Expulser l'utilisateur avec la raison spécifiée
      await member.kick(reason);

      // Répondre avec un message de succès
      await sendValidEmbedWithCountdown(interaction, [
        `${user.tag} a été expulsé du serveur.`,
        `Raison: ${reason}`,
      ]);
    } catch (error) {
      Logger.error(this.client.lang.error.kickCommand, user.id, error);
      await sendErrorEmbedWithCountdown(interaction, [
        "Une erreur est survenue lors de la tentative d'expulsion de l'utilisateur.",
      ]);
    }
  }
}
