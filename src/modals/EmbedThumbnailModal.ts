import {
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
  ModalBuilder,
  EmbedBuilder,
} from "discord.js";
import { BaseModal } from "structures/BaseModal";

import { s } from "@sapphire/shapeshift";

export class ThumbnailModal extends BaseModal {
  public readonly customId = "edit-thumbnail";

  public createModal(embed: EmbedBuilder): ModalBuilder {
    const modal = new ModalBuilder()
      .setCustomId(this.customId)
      .setTitle("Modification du thumbnail");

    const thumbnailURLInput = new TextInputBuilder()
      .setCustomId("thumbnailURL-input")
      .setLabel("Thumbnail Image URL")
      .setStyle(TextInputStyle.Short)
      .setValue(embed.data?.thumbnail?.url ?? "")
      .setMaxLength(256)
      .setRequired(false);

    const firstActionRow =
      new ActionRowBuilder<TextInputBuilder>().addComponents(thumbnailURLInput);

    modal.addComponents(firstActionRow);

    return modal;
  }

  public updateEmbed(
    embed: EmbedBuilder,
    updates: Record<string, string>,
  ): { embed: EmbedBuilder; errors?: string[] } {
    const errors: string[] = [];

    const thumbnailURL = updates["thumbnailURL-input"]?.trim();

    if (thumbnailURL) {
      try {
        s.string().url().parse(thumbnailURL);

        embed.setThumbnail(thumbnailURL || null);
      } catch {
        embed.setThumbnail(null);
        errors.push("L'URL fournie n'est pas une URL valide.");
      }
    } else {
      embed.setThumbnail(null);
    }

    return { embed, errors: errors.length > 0 ? errors : undefined };
  }
}
