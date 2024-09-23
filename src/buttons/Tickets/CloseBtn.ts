import { GuildMember, StringSelectMenuInteraction } from "discord.js";
import { CustomClient } from "structures/CustomClient";
import {
  sendErrorEmbedWithCountdown,
  sendValidEmbedWithCountdown,
} from "utils/MessageUtils";
import { BaseButton } from "structures/BaseButton";
import { closeTicket } from "modules/TicketModule";
import { Logger } from "services/Logger";

export class CloseBtn extends BaseButton {
  public constructor(client: CustomClient) {
    super(client, {
      id: "close_ticket",
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

    try {
      await closeTicket(interaction);
    } catch (error) {
      // Répondre en cas d'erreur
      Logger.error("CloseBtn", error);
      await sendErrorEmbedWithCountdown(interaction, [
        "Une erreur est survenue lors de la suppression du ticket.",
      ]);
    }
  }
}
