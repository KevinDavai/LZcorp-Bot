import {
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
  ModalBuilder,
  EmbedBuilder,
} from "discord.js";
import { BaseModal } from "structures/BaseModal";

import { s } from "@sapphire/shapeshift";

export class RemoveFieldModal extends BaseModal {
  public readonly customId = "edit-removeField";

  public createModal(embed: EmbedBuilder): ModalBuilder {
    const modal = new ModalBuilder()
      .setCustomId(this.customId)
      .setTitle("Supprimer un field");

    const fieldNumberInput = new TextInputBuilder()
      .setCustomId("fieldNumber-input")
      .setLabel("Numéro du field à supprimer")
      .setStyle(TextInputStyle.Short)
      .setValue("")
      .setMaxLength(256)
      .setRequired(true);

    const firstActionRow =
      new ActionRowBuilder<TextInputBuilder>().addComponents(fieldNumberInput);

    modal.addComponents(firstActionRow);

    return modal;
  }

  public updateEmbed(
    embed: EmbedBuilder,
    updates: Record<string, string>,
  ): { embed: EmbedBuilder; errors?: string[] } {
    const errors: string[] = [];

    const fieldNumber = updates["fieldNumber-input"]?.trim();

    embed.spliceFields(parseInt(fieldNumber, 10) - 1, 1);

    return { embed, errors: errors.length > 0 ? errors : undefined };
  }
}
