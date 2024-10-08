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
import { CustomClient } from "../../structures/CustomClient";
import { BaseEvent } from "../../structures/BaseEvent";

export class ButtonEvent extends BaseEvent {
  constructor(client: CustomClient) {
    super(client, {
      name: Events.InteractionCreate,
      description: "Button Interaction Event",
      once: false,
    });
  }

  async execute(interaction: Interaction) {
    if (!interaction.inCachedGuild()) return;
    if (!interaction.isStringSelectMenu()) return;

    if (!interaction.member) return;

    const btn = this.client.buttons.get(interaction.values[0]);

    if (!btn) return;

    const embed = interaction.message.embeds[0];
    const { message } = interaction;
    await message.edit({ embeds: [embed] });

    if (btn.permission && !interaction.memberPermissions.has(btn.permission)) {
      await sendErrorEmbedWithCountdown(interaction, [
        "Vous n'avez pas la permission d'utiliser ce bouton.",
      ]);
      return;
    }

    if (btn.roles && btn.roles.length > 0) {
      console.log("test");
      if (
        !interaction.member.roles.cache.some((role) =>
          btn.roles!.includes(role.id),
        )
      ) {
        await sendErrorEmbedWithCountdown(interaction, [
          "Vous n'avez pas le rôle nécessaire pour utiliser ce bouton.",
        ]);
        return;
      }
    }

    try {
      await btn.execute(interaction);
    } catch (error) {
      Logger.error("ButtonEvent", error);
      await sendErrorEmbedWithCountdown(interaction, [
        "Une erreur est survenue lors de l'exécution de cette interaction.",
      ]);
    }
  }
}
