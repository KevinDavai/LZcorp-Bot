import {
  ButtonInteraction,
  ChatInputCommandInteraction,
  GuildMember,
  PermissionFlagsBits,
  StringSelectMenuInteraction,
} from "discord.js";
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
import { BaseButton } from "structures/BaseButton";

export class PrestataireIndisponibleBtn extends BaseButton {
  public constructor(client: CustomClient) {
    super(client, {
      id: "prestataire_indisponible",
      roles: ["1282692402196385882", "1282692348131934229"],
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

    // IDs des rôles
    const role1 = "1286360570580434944"; // Exemple ID pour le rôle 1
    const role2 = "1286360596949897366"; // Exemple ID pour le rôle 2

    // Récupérer le rôle sélectionné depuis l'interaction
    try {
      // Vérifier si le membre a déjà le rôle sélectionné
      if (member.roles.cache.has(role2)) {
        await sendErrorEmbedWithCountdown(interaction, [
          "Vous avez déjà ce rôle.",
        ]);
        return;
      }

      if (member.roles.cache.has(role1)) {
        // Retirer le rôle 1 si le membre le possède
        await member.roles.remove(role1);
      }
      // Ajouter le rôle 2
      await member.roles.add(role2);
      await sendValidEmbedWithCountdown(interaction, [
        "Rôle ajouté avec succès.",
      ]);
    } catch (error) {
      // Répondre en cas d'erreur
      await sendErrorEmbedWithCountdown(interaction, [
        "Une erreur est survenue lors de la gestion du rôle.",
      ]);
    }
  }
}
