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

export class Mute extends BaseCommand {
  public constructor(client: CustomClient) {
    super(client, {
      data: new SlashCommandBuilder()
        .setName("mute")
        .setDescription("Muté un utilisateur")
        .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers)
        .addUserOption((option) =>
          option
            .setName("user")
            .setDescription("L'utilisateur à muté")
            .setRequired(true),
        )
        .addStringOption((option) =>
          option
            .setName("duration")
            .setDescription("La durée du mute (ex: 1d, 1h, 1m).")
            .setRequired(true),
        ),
    });
  }

  public async execute(
    interaction: ChatInputCommandInteraction,
  ): Promise<void> {
    const user = interaction.options.getUser("user", true);
    const duration = interaction.options.getString("duration", true);
    const member = await getOrFetchMemberById(interaction.guild!, user.id);

    if (!member) {
      await sendErrorEmbedWithCountdown(interaction, [
        "L'utilisateur n'existe pas ou est introuvable.",
      ]);
      return;
    }

    if (member.isCommunicationDisabled()) {
      await sendErrorEmbedWithCountdown(interaction, [
        "Cet utilisateur est déjà muté.",
      ]);
      return;
    }

    const muteDurationMs = ms(duration);

    // Au moin 1 seconde de mute
    if (!muteDurationMs || muteDurationMs < 1000) {
      await sendErrorEmbedWithCountdown(interaction, [
        "Durée invalide. Utilise un format tel que 1d, 1h, 1m, 1s.",
      ]);
      return;
    }

    try {
      await member.disableCommunicationUntil(Date.now() + muteDurationMs); // Si muteDurationMs est null, c'est un mute permanent
      await sendValidEmbedWithCountdown(interaction, [
        `${user?.tag} a été muté ${muteDurationMs ? `pendant ${ms(muteDurationMs, { long: true })}` : "de manière permanente"}.`,
      ]);
    } catch (error) {
      Logger.error(
        this.client.lang.error.muteCommand,
        user.id,
        interaction.guild!.id,
        error,
      );
      await sendErrorEmbedWithCountdown(interaction, [
        `Une erreur est survenue lors du mute de l'utilisateur avec l'ID ${user.id}.`,
      ]);
    }
  }
}
