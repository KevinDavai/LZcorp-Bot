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
    if (interaction.isAutocomplete()) {
      const command = this.client.commands.get(interaction.commandName);

      if (command?.autocomplete) {
        try {
          await command.autocomplete(interaction);
        } catch (error) {
          console.error(error);
        }
      }
    }

    if (!interaction.isCommand()) return;
    if (!interaction.inCachedGuild()) return;
    if (!interaction.guild) {
      return;
    }

    let command = this.client.commands.get(interaction.commandName);

    if (!command) {
      const commandKey = `${interaction.commandName}_${interaction.guildId}`;
      command = this.client.commands.get(commandKey);
    }

    if (!command?.data) {
      return;
    }

    if (interaction instanceof ChatInputCommandInteraction) {
      const subcommand = interaction.options.getSubcommand(false);
      const subcommandConfig = subcommand
        ? command.subcommands?.[subcommand]
        : undefined;

      if (subcommandConfig && subcommandConfig.max !== undefined) {
        const userId = interaction.user.id;

        if (subcommandConfig.max && this.client.ongoingCommands.has(userId)) {
          await sendErrorEmbedWithCountdown(
            interaction as ChatInputCommandInteraction,
            [
              "Vous avez déjà une action en cours. Veuillez annuler ou terminer l'action en cours avant de continuer.",
            ],
          );
          return;
        }

        if (subcommandConfig.max) {
          this.client.ongoingCommands.set(userId, command);
        }
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
}
