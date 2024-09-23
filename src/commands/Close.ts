import {
  ChannelType,
  ChatInputCommandInteraction,
  PermissionFlagsBits,
} from "discord.js";
import { CustomClient } from "structures/CustomClient";
import { BaseCommand } from "structures/BaseCommand";
import { SlashCommandBuilder } from "@discordjs/builders";
import { sendErrorEmbedWithCountdown } from "utils/MessageUtils";
import { getGuildSettings } from "database/utils/GuildsUtils";
import { closeTicket } from "modules/TicketModule";

export class Close extends BaseCommand {
  public constructor(client: CustomClient) {
    super(client, {
      data: new SlashCommandBuilder()
        .setName("close")
        .setDescription("Fermer le ticket.")
        .addStringOption((option) =>
          option
            .setName("reason")
            .setDescription("La raison de la fermeture du ticket.")
            .setRequired(false),
        ),
    });
  }

  public async execute(
    interaction: ChatInputCommandInteraction,
  ): Promise<void> {
    const reason =
      interaction.options.getString("reason") || "Aucune raison spécifiée"; // Récupérer la raison ou utiliser un message par défaut

    const ticketChannel = interaction.channel; // Récupérer le canal où la commande est exécutée

    const guildSettings = await getGuildSettings(interaction.guild!.id);
    if (!guildSettings) {
      await sendErrorEmbedWithCountdown(interaction, [
        "Impossible de récupérer les paramètres du serveur, merci de contacter un administrateur.",
      ]);
      return;
    }
    // Vérifier si le canal est un canal texte et s'il est dans la bonne catégorie
    if (!ticketChannel || ticketChannel.type !== ChannelType.GuildText) {
      await sendErrorEmbedWithCountdown(interaction, [
        "Cette commande doit être exécutée dans un canal texte.",
      ]);
      return;
    }

    const ticketCategoryId = guildSettings.ticket_category_id;
    const ticketCommandeCategoryId = guildSettings.ticket_commande_category_id;

    if (
      ticketChannel.parentId !== ticketCategoryId &&
      ticketChannel.parentId !== ticketCommandeCategoryId
    ) {
      await sendErrorEmbedWithCountdown(interaction, [
        "Cette commande doit être exécutée dans un canal de ticket.",
      ]);
      return;
    }

    await closeTicket(interaction, reason);
  }
}
