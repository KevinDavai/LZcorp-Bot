import {
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
  ModalBuilder,
  EmbedBuilder,
} from "discord.js";
import { BaseModal } from "structures/BaseModal";

export class DescriptionModal extends BaseModal {
  public readonly customId = "edit-description";

  public createModal(embed: EmbedBuilder): ModalBuilder {
    const modal = new ModalBuilder()
      .setCustomId(this.customId)
      .setTitle("Modification de la description");

    const descriptionInput = new TextInputBuilder()
      .setCustomId("description-input")
      .setLabel("Quel est la description de votre embed?")
      .setStyle(TextInputStyle.Paragraph)
      .setValue(embed.data?.description ?? "")
      .setMaxLength(4000)
      .setRequired(false);

    const firstActionRow =
      new ActionRowBuilder<TextInputBuilder>().addComponents(descriptionInput);

    modal.addComponents(firstActionRow);

    return modal;
  }

  public updateEmbed(
    embed: EmbedBuilder,
    updates: Record<string, string>,
  ): { embed: EmbedBuilder; errors?: string[] } {
    const errors: string[] = [];

    embed.setDescription(updates["description-input"] || null);

    return { embed, errors: errors.length > 0 ? errors : undefined };
  }
}
