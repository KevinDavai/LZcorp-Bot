import {
  ChatInputCommandInteraction,
  Collection,
  Events,
  Guild,
  Interaction,
} from "discord.js";
import { Logger } from "services/Logger";
import { sendErrorEmbedWithCountdown } from "utils/MessageUtils";

import { CustomClient } from "../../structures/CustomClient";
import { BaseEvent } from "../../structures/BaseEvent";

export class CommandEvent extends BaseEvent {
  constructor(client: CustomClient) {
    super(client, {
      name: Events.InteractionCreate,
      description: "CommandInteraction Event",
      once: false,
    });
  }

  async execute(interaction: Interaction) {
    if (!interaction.isCommand()) return;
    if (!interaction.inCachedGuild()) return;

    const command = this.client.commands.get(interaction.commandName);

    if (!command?.data) {
      return;
    }

    const userId = interaction.user.id;

    if (command.max && this.client.ongoingCommands.has(userId)) {
      await sendErrorEmbedWithCountdown(
        interaction as ChatInputCommandInteraction,
        [
          "Vous avez déjà une creation de profil en cours. \nVeuillez annuler ou terminer la création de profil en cours avant de continuer.",
        ],
      );
      return;
    }

    if (command.max) {
      this.client.ongoingCommands.set(userId, command);
    }

    try {
      await command.execute(interaction);
    } catch (error) {
      Logger.error(
        this.client.lang.error.commandError,
        command.data.name,
        error,
      );
    }
  }
}
