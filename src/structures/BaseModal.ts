import { EmbedBuilder } from "@discordjs/builders";
import {
  APIEmbedField,
  ChatInputCommandInteraction,
  EmbedField,
  Interaction,
  ModalBuilder,
} from "discord.js";

export abstract class BaseModal {
  public abstract readonly customId: string;

  public abstract createModal(embed: EmbedBuilder): ModalBuilder;

  public abstract updateEmbed(
    embed: EmbedBuilder,
    updates: Record<string, string>,
  ): { embed: EmbedBuilder; errors?: string[] };
}
