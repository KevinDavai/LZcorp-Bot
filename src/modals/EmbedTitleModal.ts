import {
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
  ModalBuilder,
  EmbedBuilder,
} from "discord.js";
import { BaseModal } from "structures/BaseModal";

import { s } from "@sapphire/shapeshift";

export class TitreModal extends BaseModal {
  public readonly customId = "edit-title";

  public createModal(embed: EmbedBuilder): ModalBuilder {
    const modal = new ModalBuilder()
      .setCustomId(this.customId)
      .setTitle("Modification du titre");

    const titleInput = new TextInputBuilder()
      .setCustomId("title-input")
      .setLabel("Quel est le titre de votre embed?")
      .setStyle(TextInputStyle.Short)
      .setValue(embed.data?.title ?? "")
      .setMaxLength(256)
      .setRequired(false);

    const titleURLInput = new TextInputBuilder()
      .setCustomId("titleURL-input")
      .setLabel("Quel est le lien du titre de votre embed?")
      .setStyle(TextInputStyle.Short)
      .setValue(embed.data?.url ?? "")
      .setRequired(false);

    const firstActionRow =
      new ActionRowBuilder<TextInputBuilder>().addComponents(titleInput);

    const secondActionRow =
      new ActionRowBuilder<TextInputBuilder>().addComponents(titleURLInput);

    modal.addComponents(firstActionRow, secondActionRow);

    return modal;
  }

  public updateEmbed(
    embed: EmbedBuilder,
    updates: Record<string, string>,
  ): { embed: EmbedBuilder; errors?: string[] } {
    const errors: string[] = [];

    embed.setTitle(updates["title-input"] || null);

    const newURL = updates["titleURL-input"]?.trim();

    if (newURL) {
      try {
        s.string().url().parse(newURL);

        embed.setURL(newURL);
      } catch {
        embed.setURL(null);
        errors.push("L'URL fournie n'est pas une URL valide.");
      }
    } else {
      embed.setURL(null);
    }

    return { embed, errors: errors.length > 0 ? errors : undefined };
  }
}
