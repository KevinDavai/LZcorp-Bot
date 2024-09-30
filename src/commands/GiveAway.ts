import {
  ActionRow,
  ButtonStyle,
  ChatInputCommandInteraction,
  EmbedBuilder,
  ModalSubmitInteraction,
  TextInputStyle,
  ButtonBuilder,
  PermissionFlagsBits,
} from "discord.js";
import { CustomClient } from "structures/CustomClient";
import { BaseCommand } from "structures/BaseCommand";
import {
  ActionRowBuilder,
  ModalBuilder,
  SlashCommandBuilder,
  TextInputBuilder,
} from "@discordjs/builders";

import {
  sendErrorEmbedWithCountdown,
  sendValidEmbedWithCountdown,
} from "utils/MessageUtils";
import { scheduleJob } from "node-schedule";
import { createNewGiveaway, getGiveaway } from "database/utils/GiveawayUtils";
import { BaseJobs } from "structures/BaseJobs";
import {
  endGiveaway,
  formatTime,
  rerollGiveaway,
} from "modules/GiveawayModule";

export class Giveaway extends BaseCommand {
  public constructor(client: CustomClient) {
    super(client, {
      data: new SlashCommandBuilder()
        .setName("giveaway")
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
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
                .setName("giveaway_id")
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
                .setName("giveaway_id")
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
        await this.createGiveawayCmd(interaction);
      },
      end: async () => {
        await this.endGiveawayCmd(interaction);
      },
      reroll: async () => {
        await this.rerollGiveawayCmd(interaction);
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

  private async createGiveawayCmd(
    interaction: ChatInputCommandInteraction,
  ): Promise<void> {
    const modal = this.createModal();
    await interaction.showModal(modal);

    interaction
      .awaitModalSubmit({ time: 60_000 })
      .then((i) => this.submitGiveaway(i, interaction));
  }

  private async endGiveawayCmd(
    interaction: ChatInputCommandInteraction,
  ): Promise<void> {
    const messageId = interaction.options.getString("giveaway_id", true);

    const giveaway = await getGiveaway(messageId, interaction.guildId!);

    if (!giveaway) {
      await sendErrorEmbedWithCountdown(interaction, ["Giveaway non trouvé."]);
      return;
    }

    if (giveaway.isEnded) {
      await sendErrorEmbedWithCountdown(interaction, [
        "Le giveaway est déjà terminé.",
      ]);
      return;
    }

    await endGiveaway(this.client, messageId, interaction.guild!.id);

    await sendValidEmbedWithCountdown(interaction, [
      "Giveaway terminé avec succès !",
    ]);
  }

  private async rerollGiveawayCmd(
    interaction: ChatInputCommandInteraction,
  ): Promise<void> {
    const giveawayId = interaction.options.getString("giveaway_id", true);

    const giveaway = await getGiveaway(giveawayId, interaction.guildId!);

    if (!giveaway) {
      await sendErrorEmbedWithCountdown(interaction, ["Giveaway non trouvé."]);
      return;
    }

    if (!giveaway.isEnded) {
      await sendErrorEmbedWithCountdown(interaction, [
        "Le giveaway n'est pas terminé.",
      ]);
      return;
    }

    const winners = await rerollGiveaway(
      this.client,
      giveawayId,
      interaction.guild!.id,
    );

    const winnersText =
      winners.length > 0
        ? winners.map((winner) => `<@${winner}>`).join(", ")
        : "Aucun gagnant";

    await interaction.channel!.send({
      content: `🎉 | Le tirage a été **relancé** ! Les nouveaux gagnants sont : ${winnersText}.\n**Merci de créer un ticket pour récupérer vos gains.**`,
    });

    await sendValidEmbedWithCountdown(interaction, [
      "Tirage du giveaway relancé avec succès !",
    ]);
  }

  public async submitGiveaway(
    modalInteraction: ModalSubmitInteraction,
    initialInteraction: ChatInputCommandInteraction,
  ) {
    const { channel } = initialInteraction;
    const title = modalInteraction.fields.getTextInputValue("title-input");
    const nbWinnerString =
      modalInteraction.fields.getTextInputValue("nb-winner-input");
    const time = modalInteraction.fields.getTextInputValue("time-input");

    const [isValidTimer, timeInMs] = this.parseTime(time);
    const [isValidNumber, nbWinner] = this.validateNumber(nbWinnerString);
    if (!isValidTimer || !timeInMs) {
      await sendErrorEmbedWithCountdown(modalInteraction, [
        "Le temps n'est pas valide. Utilisez un format comme 1d, 1h, ou 1m.",
      ]);
      return;
    }

    if (!isValidNumber || nbWinner === 0) {
      await sendErrorEmbedWithCountdown(modalInteraction, [
        "Le nombre de gagnants n'est pas valide. Utilisez un nombre entier supérieur à 0.",
      ]);
    }

    await modalInteraction.deferUpdate();

    const endDate = new Date(Date.now() + timeInMs);
    const formatedTime = formatTime(timeInMs);

    const embed = new EmbedBuilder()
      .setTitle(title)
      .setDescription(
        `Cliquez sur le bouton pour participer 🎉 !\n\nOrganisé par : <@${modalInteraction.user.id}>\nNombre de participants : 0\nNombre de gagnants : ${nbWinner}\n\nTirage dans : \`\`${formatedTime}\`\``,
      )
      .setFooter({ text: `Giveaways` })
      .setColor("#87CEFA")
      .setTimestamp();

    await channel!.send({ embeds: [embed] }).then(async (msg) => {
      await createNewGiveaway(
        msg.id,
        new Date(),
        endDate,
        msg.channel.id,
        modalInteraction.guildId!,
        nbWinner,
      );

      const btn = new ButtonBuilder()
        .setCustomId("giveaway-" + msg.id)
        .setLabel("| Participer")
        .setEmoji("🎉")
        .setStyle(ButtonStyle.Primary);

      const newGiveawayJob: BaseJobs = {
        client: this.client,
        name: `giveaway-${msg.id}`,
        description: `Giveaway ${title}`,
        schedule: endDate,
        log: true,
        execute: async () => {
          endGiveaway(this.client, msg.id, modalInteraction.guildId!);
        },
      };

      const row = new ActionRowBuilder<ButtonBuilder>().addComponents(btn);

      await this.client.jobService.addJob(newGiveawayJob, true);

      await msg.edit({ embeds: [embed], components: [row] });
    });
  }

  private validateNumber(value: string): [boolean, number] {
    const number = parseFloat(value);

    if (!Number.isNaN(number) && Number.isFinite(number) && number > 0) {
      return [true, number]; // Si c'est un nombre valide, retourne true et le nombre
    }

    return [false, 0]; // Si ce n'est pas un nombre valide, retourne false et null
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

    const nbWinnerInput = new TextInputBuilder()
      .setCustomId("nb-winner-input")
      .setLabel("Nombre de gagnants ? (1 par défaut)")
      .setStyle(TextInputStyle.Short)
      .setValue("1")
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
      new ActionRowBuilder<TextInputBuilder>().addComponents(nbWinnerInput);

    const thirdActionRow =
      new ActionRowBuilder<TextInputBuilder>().addComponents(timeInput);

    modal.addComponents(firstActionRow, secondActionRow, thirdActionRow);

    return modal;
  }
}
