import {
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
  ModalBuilder,
  EmbedBuilder,
} from "discord.js";
import { BaseModal } from "structures/BaseModal";

import { s } from "@sapphire/shapeshift";

export class ImageModal extends BaseModal {
  public readonly customId = "edit-image";

  public createModal(embed: EmbedBuilder): ModalBuilder {
    const modal = new ModalBuilder()
      .setCustomId(this.customId)
      .setTitle("Modification de l'image");

    const imageURLInput = new TextInputBuilder()
      .setCustomId("imageURL-input")
      .setLabel("Image URL")
      .setStyle(TextInputStyle.Short)
      .setValue(embed.data?.image?.url ?? "")
      .setMaxLength(256)
      .setRequired(false);

    const firstActionRow =
      new ActionRowBuilder<TextInputBuilder>().addComponents(imageURLInput);

    modal.addComponents(firstActionRow);

    return modal;
  }

  public updateEmbed(
    embed: EmbedBuilder,
    updates: Record<string, string>,
  ): { embed: EmbedBuilder; errors?: string[] } {
    const errors: string[] = [];

    const imageURL = updates["imageURL-input"]?.trim();

    if (imageURL) {
      try {
        s.string().url().parse(imageURL);

        embed.setImage(imageURL || null);
      } catch {
        embed.setImage(null);
        errors.push("L'URL fournie n'est pas une URL valide.");
      }
    } else {
      embed.setImage(null);
    }

    return { embed, errors: errors.length > 0 ? errors : undefined };
  }
}
