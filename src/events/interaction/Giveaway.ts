import {
  ChatInputCommandInteraction,
  Collection,
  Events,
  Guild,
  Interaction,
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

export class GiveawayReactionEvent extends BaseEvent {
  constructor(client: CustomClient) {
    super(client, {
      name: Events.InteractionCreate,
      description: "Giveaway Interaction Event",
      once: false,
    });
  }

  async execute(interaction: Interaction) {
    if (!interaction.isButton()) return;

    const buttonId = interaction.customId;

    if (!buttonId.startsWith("giveaway-")) return; // This is not a giveaway btn

    const guild = interaction.guild as Guild;
    const userInteraction = interaction.user;
    const giveawayId = buttonId.split("-")[1];

    if (await isParticipant(giveawayId, guild.id, userInteraction.id)) {
      await sendErrorEmbedWithCountdown(interaction, [
        "Vous avez déjà participé à ce giveaway !",
      ]);
      return;
    }

    const giveaway = await addParticipant(
      giveawayId,
      guild.id,
      userInteraction.id,
    );

    if (!giveaway) return;

    await addParticipantGiveawayEmbed(guild, giveaway);

    await sendValidEmbedWithCountdown(interaction, [
      "Vous avez bien participé au giveaway !",
    ]);
  }
}
