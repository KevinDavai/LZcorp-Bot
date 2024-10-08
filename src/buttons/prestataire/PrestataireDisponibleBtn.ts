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

export class PrestataireDisponibleBtn extends BaseButton {
  public constructor(client: CustomClient) {
    super(client, {
      id: "prestataire_disponible",
      roles: [
        "953056804215095346",
        "953056807188836422",
        "953056811001462885",
        "953057826652180490",
        "1137408301492093009",
        "953059691699773530",
        "953264702652305499",
        "953264709707116574",
        "958110292670312570",
        "974776075596988436",
        "978217560623435776",
        "958113912820232252",
        "963199682534854656",
        "964134348880244766",
        "1153331052711006361",
        "1167915570394574998",
        "929474843630530601",
        "934485706502438992",
        "1150902076499566613",
      ],
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
    const role1 = "985358328634933291"; // Exemple ID pour le rôle 1
    const role2 = "985358566712041512"; // Exemple ID pour le rôle 2

    // Récupérer le rôle sélectionné depuis l'interaction

    try {
      // Vérifier si le membre a déjà le rôle sélectionné
      if (member.roles.cache.has(role1)) {
        await sendErrorEmbedWithCountdown(interaction, [
          "Vous avez déjà ce rôle.",
        ]);
        return;
      }

      if (member.roles.cache.has(role2)) {
        await member.roles.remove(role2);
      }
      // Ajouter le rôle 2
      await member.roles.add(role1);
      await sendValidEmbedWithCountdown(interaction, [
        "Rôle ajouté avec succès.",
      ]);
    } catch (error) {
      // Répondre en cas d'erreur
      console.log("error: ", error);
      await sendErrorEmbedWithCountdown(interaction, [
        "Une erreur est survenue lors de la gestion du rôle.",
      ]);
    }
  }
}
