import {
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

  max?: number;

  constructor(client: CustomClient, options: CommandOptions) {
    this.client = client;
    this.data = options.data;
    this.cooldown = options.cooldown;
    this.max = options.max;
  }

  abstract execute(interaction: CommandInteraction): Promise<void> | void;
}
