import {
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
  ModalBuilder,
  EmbedBuilder,
} from "discord.js";
import { BaseModal } from "structures/BaseModal";

import { s } from "@sapphire/shapeshift";

export class AddFieldModal extends BaseModal {
  public readonly customId = "edit-addField";

  public createModal(embed: EmbedBuilder): ModalBuilder {
    const modal = new ModalBuilder()
      .setCustomId(this.customId)
      .setTitle("Ajout d'un field");

    const fieldNameInput = new TextInputBuilder()
      .setCustomId("fieldName-input")
      .setLabel("Nom du field")
      .setStyle(TextInputStyle.Short)
      .setValue("")
      .setMaxLength(256)
      .setRequired(true);

    const fieldValueInput = new TextInputBuilder()
      .setCustomId("fieldValue-input")
      .setLabel("description du field")
      .setStyle(TextInputStyle.Paragraph)
      .setValue("")
      .setRequired(true);

    const isInlineInput = new TextInputBuilder()
      .setCustomId("isInline-input")
      .setLabel("Inline (true / false)")
      .setStyle(TextInputStyle.Short)
      .setValue("false")
      .setRequired(false);

    const firstActionRow =
      new ActionRowBuilder<TextInputBuilder>().addComponents(fieldNameInput);

    const secondActionRow =
      new ActionRowBuilder<TextInputBuilder>().addComponents(fieldValueInput);

    const thirdActionRow =
      new ActionRowBuilder<TextInputBuilder>().addComponents(isInlineInput);

    modal.addComponents(firstActionRow, secondActionRow, thirdActionRow);

    return modal;
  }

  public updateEmbed(
    embed: EmbedBuilder,
    updates: Record<string, string>,
  ): { embed: EmbedBuilder; errors?: string[] } {
    const errors: string[] = [];

    const fieldName = updates["fieldName-input"]?.trim();
    const fieldValue = updates["fieldValue-input"]?.trim();
    const isInline = updates["isInline-input"]?.trim();

    embed.addFields({
      name: fieldName,
      value: fieldValue,
      inline: isInline === "true",
    });

    return { embed, errors: errors.length > 0 ? errors : undefined };
  }
}
