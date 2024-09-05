import {
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
  ModalBuilder,
  EmbedBuilder,
} from "discord.js";
import { BaseModal } from "structures/BaseModal";

import { s } from "@sapphire/shapeshift";

export class FooterModal extends BaseModal {
  public readonly customId = "edit-footer";

  public createModal(embed: EmbedBuilder): ModalBuilder {
    const modal = new ModalBuilder()
      .setCustomId(this.customId)
      .setTitle("Modification du footer");

    const footerTextInput = new TextInputBuilder()
      .setCustomId("footerText-input")
      .setLabel("Texte du footer")
      .setStyle(TextInputStyle.Short)
      .setValue(embed.data?.footer?.text ?? "")
      .setMaxLength(2048)
      .setRequired(false);

    const footerIconURLInput = new TextInputBuilder()
      .setCustomId("footerIconUrl-input")
      .setLabel("Footer Icon URL")
      .setStyle(TextInputStyle.Short)
      .setValue(embed.data?.footer?.icon_url ?? "")
      .setRequired(false);

    const firstActionRow =
      new ActionRowBuilder<TextInputBuilder>().addComponents(footerTextInput);

    const secondActionRow =
      new ActionRowBuilder<TextInputBuilder>().addComponents(
        footerIconURLInput,
      );

    modal.addComponents(firstActionRow, secondActionRow);

    return modal;
  }

  public updateEmbed(
    embed: EmbedBuilder,
    updates: Record<string, string>,
  ): { embed: EmbedBuilder; errors?: string[] } {
    const errors: string[] = [];

    const footerText = updates["footerText-input"]?.trim();
    const footerIconURL = updates["footerIconUrl-input"]?.trim();

    let validFooterIconURL: string | null = null;

    if (footerIconURL) {
      try {
        s.string().url().parse(footerIconURL);
        validFooterIconURL = footerIconURL;
      } catch {
        errors.push(
          "L'URL de l'icône du footer fournie n'est pas une URL valide.",
        );
      }
    }

    if (!footerText) {
      embed.setFooter(null);
    } else {
      embed.setFooter({
        text: footerText,
        iconURL: validFooterIconURL ?? undefined,
      });
    }

    return { embed, errors: errors.length > 0 ? errors : undefined };
  }
}
