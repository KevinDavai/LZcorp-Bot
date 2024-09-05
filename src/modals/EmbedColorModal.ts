import { EmbedBuilder } from "@discordjs/builders";
import {
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
  ModalBuilder,
} from "discord.js";
import { BaseModal } from "structures/BaseModal";

export class ColorModal extends BaseModal {
  public readonly customId = "edit-color";

  public createModal(embed: EmbedBuilder): ModalBuilder {
    const modal = new ModalBuilder()
      .setCustomId(this.customId)
      .setTitle("Modification de la couleur");

    const colorInput = new TextInputBuilder()
      .setCustomId("color-input")
      .setLabel("Couleur de l'embed")
      .setStyle(TextInputStyle.Short)
      .setValue(this.toHexColor(embed.data?.color) ?? "")
      .setRequired(false);

    const firstActionRow =
      new ActionRowBuilder<TextInputBuilder>().addComponents(colorInput);

    modal.addComponents(firstActionRow);

    return modal;
  }

  public updateEmbed(
    embed: EmbedBuilder,
    updates: Record<string, string>,
  ): { embed: EmbedBuilder; errors?: string[] } {
    const colorInput = updates["color-input"]?.trim();
    const errors: string[] = this.validateColor(colorInput);

    if (errors.length === 0) {
      embed.setColor(this.toColorResolvable(colorInput));
    }

    return { embed, errors: errors.length > 0 ? errors : undefined };
  }

  private validateColor(colorInput: string | undefined): string[] {
    if (!colorInput) return [];

    if (!this.isHexColor(colorInput)) {
      return [
        "La couleur fournie n'est pas valide. Assurez-vous que c'est un code hexadécimal au format #RRGGBB.",
      ];
    }
    return [];
  }

  private isHexColor(value: string): boolean {
    return /^#[0-9A-Fa-f]{6}$/.test(value);
  }

  private toColorResolvable(colorInput: string | undefined): number | null {
    if (!colorInput || !this.isHexColor(colorInput)) return null;

    return parseInt(colorInput.slice(1), 16);
  }

  private toHexColor(colorResolvable: number | undefined): string | null {
    if (colorResolvable === undefined) return null;

    return `#${colorResolvable.toString(16).padStart(6, "0").toUpperCase()}`;
  }
}
