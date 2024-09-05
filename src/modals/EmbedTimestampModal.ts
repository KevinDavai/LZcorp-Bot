import {
  EmbedBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
} from "discord.js";
import { BaseModal } from "structures/BaseModal";
import { parse, isValid, format } from "date-fns";

export class TimestampModal extends BaseModal {
  public readonly customId = "edit-timestamp";

  public createModal(embed: EmbedBuilder): ModalBuilder {
    const modal = new ModalBuilder()
      .setCustomId(this.customId)
      .setTitle("Modification de la date de l'embed");

    const timestampInput = new TextInputBuilder()
      .setCustomId("timestamp-input")
      .setLabel("Date de l'embed (dd/MM/yyyy-HH:mm:ss)")
      .setStyle(TextInputStyle.Short)
      .setValue(this.formatTimestamp(embed.data?.timestamp))
      .setRequired(false);

    const firstActionRow =
      new ActionRowBuilder<TextInputBuilder>().addComponents(timestampInput);
    modal.addComponents(firstActionRow);

    return modal;
  }

  public updateEmbed(
    embed: EmbedBuilder,
    updates: Record<string, string>,
  ): { embed: EmbedBuilder; errors?: string[] } {
    const timestampInput = updates["timestamp-input"]?.trim();
    const errors: string[] = [];

    const { parsedDate, parseError } = this.parseDate(timestampInput);

    if (parseError) {
      errors.push(parseError);
    } else {
      embed.setTimestamp(parsedDate || null);
    }

    return { embed, errors: errors.length > 0 ? errors : undefined };
  }

  private parseDate(dateString: string | undefined): {
    parsedDate: Date | null;
    parseError?: string;
  } {
    if (!dateString) return { parsedDate: null };

    const formatPattern = /^\d{2}\/\d{2}\/\d{4}-\d{2}:\d{2}:\d{2}$/;
    if (!formatPattern.test(dateString)) {
      return {
        parsedDate: null,
        parseError:
          "Le format de la date est invalide. Utilisez le format dd/MM/yyyy-HH:mm:ss.",
      };
    }

    const parsedDate = parse(dateString, "dd/MM/yyyy-HH:mm:ss", new Date());

    return isValid(parsedDate)
      ? { parsedDate }
      : {
          parsedDate: null,
          parseError:
            "La date fournie n'est pas valide. Assurez-vous que le format est dd/MM/yyyy-HH:mm:ss.",
        };
  }

  private formatTimestamp(timestamp: string | undefined): string {
    if (!timestamp) return "";

    const date = new Date(timestamp);
    return Number.isNaN(date.getTime())
      ? ""
      : format(date, "dd/MM/yyyy-HH:mm:ss");
  }
}
