import {
  ChatInputCommandInteraction,
  Collection,
  Events,
  Guild,
  Interaction,
  PermissionFlagsBits,
} from "discord.js";
import { Logger } from "services/Logger";
import {
  sendErrorEmbedWithCountdown,
  sendValidEmbedWithCountdown,
} from "utils/MessageUtils";

import { addParticipantGiveawayEmbed } from "modules/GiveawayModule";
import { addParticipant, isParticipant } from "database/utils/GiveawayUtils";
import { createTicket } from "modules/TicketModule";
import { CustomClient } from "../../structures/CustomClient";
import { BaseEvent } from "../../structures/BaseEvent";

export class TicketEvent extends BaseEvent {
  constructor(client: CustomClient) {
    super(client, {
      name: Events.InteractionCreate,
      description: "Ticket Interaction Event",
      once: false,
    });
  }

  async execute(interaction: Interaction) {
    if (!interaction.inCachedGuild()) return;
    if (!interaction.isStringSelectMenu()) return;

    if (!interaction.member) return;

    const interactionId = interaction.customId;

    if (
      interactionId !== "ticket_lzcorp_support" &&
      interactionId !== "ticket_lzcorp_commande" &&
      interactionId !== "ticket_newsmc"
    ) {
      return;
    }

    const embed = interaction.message.embeds[0];
    const { message } = interaction;
    await message.edit({ embeds: [embed] });

    try {
      createTicket(interaction);
    } catch (error) {
      Logger.error("ButtonEvent", error);
      await sendErrorEmbedWithCountdown(interaction, [
        "Une erreur est survenue lors de l'exécution de cette interaction.",
      ]);
    }
  }
}
