import {
  AutocompleteInteraction,
  ButtonInteraction,
  CommandInteraction,
  PermissionsBitField,
  RESTPostAPIApplicationCommandsJSONBody,
  RESTPostAPIApplicationGuildCommandsJSONBody,
  SlashCommandBuilder,
  StringSelectMenuInteraction,
} from "discord.js";
import { ButtonOptions } from "../@types/ButtonOptions";
import { CommandOptions } from "../@types/CommandOptions";
import { CustomClient } from "./CustomClient";

export abstract class BaseButton {
  client: CustomClient;

  id: string;

  permission?: PermissionsBitField;

  roles?: string[];

  constructor(client: CustomClient, options: ButtonOptions) {
    this.client = client;
    this.id = options.id;
    this.permission = options.permission;
    this.roles = options.roles;
  }

  abstract execute(
    interaction: StringSelectMenuInteraction,
  ): Promise<void> | void;
}
