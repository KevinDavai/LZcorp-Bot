import { GuildMember, StringSelectMenuInteraction } from "discord.js";
import { CustomClient } from "structures/CustomClient";
import {
  sendErrorEmbedWithCountdown,
  sendValidEmbedWithCountdown,
} from "utils/MessageUtils";
import { BaseButton } from "structures/BaseButton";

export class NotificationGiveawayBtn extends BaseButton {
  public constructor(client: CustomClient) {
    super(client, {
      id: "notif_giveaway",
    });
  }

  public async execute(
    interaction: StringSelectMenuInteraction,
  ): Promise<void> {
    if (!(interaction.member instanceof GuildMember)) {
      await sendErrorEmbedWithCountdown(interaction, [
        "Cette interaction ne provient pas d'un membre.",
      ]);
      return;
    }

    const member = interaction.member as GuildMember;
    const roleId = "927140939695259698"; // Remplacez par l'ID réel du rôle

    try {
      if (member.roles.cache.has(roleId)) {
        // Si le membre a déjà le rôle, le retirer
        await member.roles.remove(roleId);
        await sendValidEmbedWithCountdown(interaction, [
          "Le rôle a été retiré avec succès.",
        ]);
      } else {
        // Si le membre n'a pas le rôle, l'ajouter
        await member.roles.add(roleId);
        await sendValidEmbedWithCountdown(interaction, [
          "Rôle ajouté avec succès.",
        ]);
      }
    } catch (error) {
      // Répondre en cas d'erreur
      await sendErrorEmbedWithCountdown(interaction, [
        "Une erreur est survenue lors de la gestion du rôle.",
      ]);
    }
  }
}
