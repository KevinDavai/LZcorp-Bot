import {
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
  ModalBuilder,
  EmbedBuilder,
} from "discord.js";
import { BaseModal } from "structures/BaseModal";

import { s } from "@sapphire/shapeshift";

export class AuthorModal extends BaseModal {
  public readonly customId = "edit-author";

  public createModal(embed: EmbedBuilder): ModalBuilder {
    const modal = new ModalBuilder()
      .setCustomId(this.customId)
      .setTitle("Modification de l'autheur");

    const authorNameInput = new TextInputBuilder()
      .setCustomId("authorName-input")
      .setLabel("Autheur")
      .setStyle(TextInputStyle.Short)
      .setValue(embed.data?.author?.name ?? "")
      .setMaxLength(256)
      .setRequired(false);

    const authorURLInput = new TextInputBuilder()
      .setCustomId("authorURL-input")
      .setLabel("Autheur URL")
      .setStyle(TextInputStyle.Short)
      .setValue(embed.data?.author?.url ?? "")
      .setRequired(false);

    const authorIconURLInput = new TextInputBuilder()
      .setCustomId("authorIconURL-input")
      .setLabel("Autheur Icon URL")
      .setStyle(TextInputStyle.Short)
      .setValue(embed.data?.author?.icon_url ?? "")
      .setRequired(false);

    const firstActionRow =
      new ActionRowBuilder<TextInputBuilder>().addComponents(authorNameInput);

    const secondActionRow =
      new ActionRowBuilder<TextInputBuilder>().addComponents(authorURLInput);

    const thirdActionRow =
      new ActionRowBuilder<TextInputBuilder>().addComponents(
        authorIconURLInput,
      );

    modal.addComponents(firstActionRow, secondActionRow, thirdActionRow);

    return modal;
  }

  public updateEmbed(
    embed: EmbedBuilder,
    updates: Record<string, string>,
  ): { embed: EmbedBuilder; errors?: string[] } {
    const errors: string[] = [];

    const authorName = updates["authorName-input"]?.trim();
    const authorURL = updates["authorURL-input"]?.trim();
    const authorIconURL = updates["authorIconURL-input"]?.trim();

    let validAuthorURL: string | null = null;
    let validAuthorIconURL: string | null = null;

    if (authorURL) {
      try {
        s.string().url().parse(authorURL);
        validAuthorURL = authorURL;
      } catch {
        errors.push("L'URL de l'auteur fournie n'est pas une URL valide.");
      }
    }

    if (authorIconURL) {
      try {
        s.string().url().parse(authorIconURL);
        validAuthorIconURL = authorIconURL;
      } catch {
        errors.push(
          "L'URL de l'icône de l'auteur fournie n'est pas une URL valide.",
        );
      }
    }

    if (!authorName) {
      embed.setAuthor(null);
    } else {
      embed.setAuthor({
        name: authorName,
        iconURL: validAuthorIconURL ?? undefined,
        url: validAuthorURL ?? undefined,
      });
    }

    return { embed, errors: errors.length > 0 ? errors : undefined };
  }
}
