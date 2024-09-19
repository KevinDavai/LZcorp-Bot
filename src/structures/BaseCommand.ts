import {
  AutocompleteInteraction,
  CommandInteraction,
  RESTPostAPIApplicationCommandsJSONBody,
  RESTPostAPIApplicationGuildCommandsJSONBody,
  SlashCommandBuilder,
} from "discord.js";
import { CommandOptions } from "../@types/CommandOptions";
import { CustomClient } from "./CustomClient";

export abstract class BaseCommand {
  client: CustomClient;

  data:
    | RESTPostAPIApplicationCommandsJSONBody
    | RESTPostAPIApplicationGuildCommandsJSONBody
    | SlashCommandBuilder;

  cooldown?: number;

  subcommands?: Record<
    string,
    {
      max?: number; // Max limit for this subcommand
      // Other subcommand-specific properties
    }
  >;

  guildIdOnly?: string;

  constructor(client: CustomClient, options: CommandOptions) {
    this.client = client;
    this.data = options.data;
    this.cooldown = options.cooldown;
    this.subcommands = options.subcommands;
    this.guildIdOnly = options.guildIdOnly;
  }

  abstract execute(interaction: CommandInteraction): Promise<void> | void;
  autocomplete?(interaction: AutocompleteInteraction): Promise<void> | void;
}
