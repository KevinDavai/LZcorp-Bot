import {
  ActionRow,
  ButtonStyle,
  ChatInputCommandInteraction,
  EmbedBuilder,
  ModalSubmitInteraction,
  TextInputStyle,
} from "discord.js";
import { CustomClient } from "structures/CustomClient";
import { BaseCommand } from "structures/BaseCommand";
import {
  ActionRowBuilder,
  ButtonBuilder,
  ModalBuilder,
  SlashCommandBuilder,
  TextInputBuilder,
} from "@discordjs/builders";

import { sendErrorEmbedWithCountdown } from "utils/MessageUtils";
import { scheduleJob } from "node-schedule";
import { createNewGiveaway } from "database/utils/GiveawayUtils";
import { BaseJobs } from "structures/BaseJobs";

export class Giveaway extends BaseCommand {
  public constructor(client: CustomClient) {
    super(client, {
      data: new SlashCommandBuilder()
        .setName("giveaway")
        .setDescription("Créer / Terminer / Reroll un giveaway")
        .addSubcommand((subcommand) =>
          subcommand.setName("create").setDescription("Créer un giveaway"),
        )
        .addSubcommand((subcommand) =>
          subcommand
            .setName("end")
            .setDescription("Terminer un giveaway")
            .addStringOption((option) =>
              option
                .setName("message_id")
                .setDescription("ID du message du giveaway")
                .setRequired(true),
            ),
        )
        .addSubcommand((subcommand) =>
          subcommand
            .setName("reroll")
            .setDescription("Reroll un giveaway")
            .addStringOption((option) =>
              option
                .setName("message_id")
                .setDescription("ID du message du giveaway")
                .setRequired(true),
            ),
        ),
    });
  }

  public async execute(
    interaction: ChatInputCommandInteraction,
  ): Promise<void> {
    if (!interaction.guild) {
      await sendErrorEmbedWithCountdown(interaction, [
        "Impossible de créer un giveaway en message privé.",
      ]);
      return;
    }

    if (!interaction.channel?.isTextBased() || !interaction.channel) {
      await sendErrorEmbedWithCountdown(interaction, [
        "Impossible de créer un giveaway dans ce type de salon.",
      ]);
      return;
    }

    const subcommands: Record<string, () => Promise<void>> = {
      create: async () => {
        await this.createGiveaway(interaction);
      },
      end: async () => {
        await this.endGiveaway(interaction);
      },
      reroll: async () => {
        await this.rerollGiveaway(interaction);
      },
    };

    const subcommand = interaction.options.getSubcommand();
    if (subcommands[subcommand]) {
      await subcommands[subcommand]();
    } else {
      await sendErrorEmbedWithCountdown(interaction, [
        "Sous commande inconnue.",
      ]);
    }
  }

  private async createGiveaway(
    interaction: ChatInputCommandInteraction,
  ): Promise<void> {
    const modal = this.createModal();
    await interaction.showModal(modal);

    interaction
      .awaitModalSubmit({ time: 60_000 })
      .then((i) => this.submitGiveaway(i, interaction));
  }

  private async endGiveaway(
    interaction: ChatInputCommandInteraction,
  ): Promise<void> {
    // Code here
  }

  private async rerollGiveaway(
    interaction: ChatInputCommandInteraction,
  ): Promise<void> {
    // Code here
  }

  public async submitGiveaway(
    modalInteraction: ModalSubmitInteraction,
    initialInteraction: ChatInputCommandInteraction,
  ) {
    const { channel } = initialInteraction;
    const title = modalInteraction.fields.getTextInputValue("title-input");
    const description = modalInteraction.fields.getTextInputValue("desc-input");
    const time = modalInteraction.fields.getTextInputValue("time-input");

    const [isValid, timeInMs] = this.parseTime(time);

    if (!isValid || !timeInMs) {
      await sendErrorEmbedWithCountdown(modalInteraction, [
        "Le temps n'est pas valide. Utilisez un format comme 1d, 1h, ou 1m.",
      ]);
      return;
    }

    await modalInteraction.deferUpdate();

    const endDate = new Date(Date.now() + timeInMs);

    scheduleJob(endDate, async () => {
      // TODO : Finir le giveaway
    });

    const embed = new EmbedBuilder()
      .setTitle(title)
      .setDescription(description)
      .setFooter({ text: `Fin dans ${time}` });

    await channel!.send({ embeds: [embed] }).then(async (msg) => {
      await createNewGiveaway(
        msg.id,
        new Date(),
        endDate,
        msg.channel.id,
        modalInteraction.guildId!,
      );

      const btn = new ButtonBuilder()
        .setCustomId("giveaway-" + msg.id)
        .setLabel("Participer")
        .setStyle(ButtonStyle.Primary);

      const newGiveawayJob: BaseJobs = {
        client: this.client,
        name: `giveaway-${msg.id}`,
        description: `Giveaway ${title}`,
        schedule: endDate,
        log: true,
        execute: async () => {
          // TODO : Finir le giveaway
          console.log("Giveaway terminé");
        },
      };

      const row = new ActionRowBuilder<ButtonBuilder>().addComponents(btn);

      await this.client.jobService.addJob(newGiveawayJob);

      await msg.edit({ embeds: [embed], components: [row] });
    });
  }

  private parseTime(time: string): [boolean, number?] {
    const timeRegex = /^(\d+)([dhm])$/;
    const match = time.match(timeRegex);

    if (!match) {
      return [false]; // Format invalide
    }

    const value = parseInt(match[1], 10);
    const unit = match[2];

    if (value <= 0) {
      return [false]; // Valeur invalide
    }

    let timeInMs: number;
    switch (unit) {
      case "d":
        timeInMs = value * 24 * 60 * 60 * 1000; // Conversion des jours en millisecondes
        break;
      case "h":
        timeInMs = value * 60 * 60 * 1000; // Conversion des heures en millisecondes
        break;
      case "m":
        timeInMs = value * 60 * 1000; // Conversion des minutes en millisecondes
        break;
      default:
        return [false]; // Ne devrait pas arriver avec le regex, mais par sécurité
    }

    return [true, timeInMs]; // Retourne un booléen et la durée en millisecondes
  }

  private createModal(): ModalBuilder {
    const modal = new ModalBuilder()
      .setCustomId("giveaway-create")
      .setTitle("Creation d'un giveaway");

    const titleInput = new TextInputBuilder()
      .setCustomId("title-input")
      .setLabel("Quel est le titre du giveaway ?")
      .setStyle(TextInputStyle.Short)
      .setValue("")
      .setMaxLength(256)
      .setRequired(true);

    const descInput = new TextInputBuilder()
      .setCustomId("desc-input")
      .setLabel("Quel est la description du giveaway ?")
      .setStyle(TextInputStyle.Paragraph)
      .setValue("")
      .setRequired(true);

    const timeInput = new TextInputBuilder()
      .setCustomId("time-input")
      .setLabel("Durée du giveaway (ex: 1d, 1h, 1m)")
      .setStyle(TextInputStyle.Short)
      .setValue("")
      .setRequired(true);

    const firstActionRow =
      new ActionRowBuilder<TextInputBuilder>().addComponents(titleInput);

    const secondActionRow =
      new ActionRowBuilder<TextInputBuilder>().addComponents(descInput);

    const thirdActionRow =
      new ActionRowBuilder<TextInputBuilder>().addComponents(timeInput);

    modal.addComponents(firstActionRow, secondActionRow, thirdActionRow);

    return modal;
  }
}
