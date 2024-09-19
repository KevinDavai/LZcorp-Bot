import {
  ChatInputCommandInteraction,
  EmbedBuilder,
  ButtonBuilder,
  ButtonStyle,
  CommandInteraction,
  Interaction,
  ComponentType,
} from "discord.js";
import { CustomClient } from "structures/CustomClient";
import { BaseCommand } from "structures/BaseCommand";
import { ActionRowBuilder, SlashCommandBuilder } from "@discordjs/builders";

import {
  getOrFetchChannelById,
  sendErrorEmbedWithCountdown,
  sendValidEmbedWithCountdown,
} from "utils/MessageUtils";
import {
  getAllProfilUserName,
  getProfilEmbeds,
} from "database/utils/ProfilModel";
import { Logger } from "services/Logger";
import { getGuildSettings } from "database/utils/GuildsUtils";

export class Prestataire extends BaseCommand {
  public constructor(client: CustomClient) {
    super(client, {
      data: new SlashCommandBuilder()
        .setName("prestataire")
        .setDescription("Afficher / lister les prestataires.")
        .addSubcommand((subcommand) =>
          subcommand
            .setName("show")
            .setDescription("Afficher le profil d'un prestataire.")
            .addUserOption((option) =>
              option
                .setName("prestataire")
                .setDescription("Nom du prestataire.")
                .setRequired(true),
            ),
        ),
      // .addSubcommand((subcommand) =>
      //   subcommand.setName("list").setDescription("Lister les prestataires."),
      // ),
    });
    this.guildIdOnly = "916487743004114974";
  }

  public async execute(
    interaction: ChatInputCommandInteraction,
  ): Promise<void> {
    const subcommands: Record<string, () => Promise<void>> = {
      show: async () => {
        await this.showPrestataire(interaction);
      },
      list: async () => {
        await this.listPrestataire(interaction);
      },
    };

    const guildSettings = await getGuildSettings(interaction.guildId!);

    const subcommand = interaction.options.getSubcommand();
    if (subcommands[subcommand]) {
      await subcommands[subcommand]();
    } else {
      await sendErrorEmbedWithCountdown(interaction, [
        "Sous commande inconnue.",
      ]);
    }
  }

  private async showPrestataire(
    interaction: ChatInputCommandInteraction,
  ): Promise<void> {
    const user = interaction.options.getUser("prestataire", true);

    const embeds = await getProfilEmbeds(user.id, interaction.guildId!);

    if (!embeds) {
      await sendErrorEmbedWithCountdown(interaction, [
        "Le prestataire n'existe pas.",
      ]);
      return;
    }

    const currentPage = 0;

    const newEmbed = new EmbedBuilder(embeds[currentPage].data);

    await interaction.reply({
      embeds: [newEmbed],
      components: [this.createButtonRow(currentPage, embeds)],
    });

    this.handleComponentInteraction(interaction, embeds, currentPage);
  }

  private async listPrestataire(
    interaction: ChatInputCommandInteraction,
  ): Promise<void> {
    // Tableau d'user id des prestataires
    const prestataires = await getAllProfilUserName(interaction.guildId!);

    if (prestataires.length === 0) {
      await interaction.reply({
        content: "Aucun prestataire disponible dans ce serveur.",
        ephemeral: true,
      });
      return;
    }

    const embed = new EmbedBuilder()
      .setTitle("📝 | Prestataires disponibles")
      .setDescription("Voici la liste des prestataires disponibles :")
      .setColor("#87CEFA") // Couleur verte
      .setFooter({
        text: "© Copyright LZCorp | NewsMC",
        iconURL: interaction.client.user.displayAvatarURL(),
      });

    // Ajout des prestataires dans l'embed sous forme de champ
    prestataires.forEach((username, index) => {
      embed.addFields({
        name: `Prestataire ${index + 1}`,
        value: "<@" + username + ">",
        inline: true,
      });
    });

    // Envoi de l'embed
    await interaction.reply({ embeds: [embed] });
  }

  private createButtonRow(
    currentPage: number,
    embeds: EmbedBuilder[],
  ): ActionRowBuilder<ButtonBuilder> {
    const prevButton = new ButtonBuilder()
      .setCustomId("prev-page")
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(currentPage === 0 || embeds.length === 1)
      .setEmoji("⬅️");

    const nextButton = new ButtonBuilder()
      .setCustomId("next-page")
      .setStyle(ButtonStyle.Secondary)
      .setEmoji("➡️")
      .setDisabled(currentPage >= embeds.length - 1 || embeds.length === 1);

    return new ActionRowBuilder<ButtonBuilder>().addComponents(
      prevButton,
      nextButton,
    );
  }

  private async handleComponentInteraction(
    interaction: CommandInteraction,
    embeds: EmbedBuilder[],
    currentPage: number,
  ): Promise<void> {
    const response = await interaction.fetchReply();
    let newPage: number = currentPage;
    const newEmbed: EmbedBuilder[] = embeds;

    const collectorFilter = (i: Interaction) =>
      i.user.id === interaction.user.id;

    try {
      const buttonCollector = response.createMessageComponentCollector({
        componentType: ComponentType.Button,
        filter: collectorFilter,
        time: 60_000,
        max: 1,
      });

      buttonCollector.on("collect", async (i) => {
        const selectedButtonId = i.customId;

        switch (selectedButtonId) {
          case "prev-page":
            newPage = await this.previousPage(newPage);
            break;
          case "next-page":
            newPage = await this.nextPage(newPage, newEmbed);
            break;
          default:
            break;
        }

        await i.deferUpdate();
        await interaction.editReply({
          embeds: [newEmbed[newPage].data],
          components: [this.createButtonRow(newPage, newEmbed)],
        });
        this.handleComponentInteraction(interaction, newEmbed, newPage);
      });

      buttonCollector.on("end", async (collected, reason) => {
        if (reason === "time") {
          await interaction.deleteReply();
        }
      });
    } catch (error) {
      Logger.error(
        "Error handling component interaction while attempting to show a profil",
        error,
      );
    }
  }

  private async previousPage(currentPage: number): Promise<number> {
    let newCurrentPage = currentPage;
    if (currentPage > 0) {
      newCurrentPage -= 1;
    }
    return newCurrentPage;
  }

  private async nextPage(
    currentPage: number,
    embeds: EmbedBuilder[],
  ): Promise<number> {
    let newCurrentPage = currentPage;
    if (currentPage < embeds.length - 1) {
      newCurrentPage += 1;
    }
    return newCurrentPage;
  }
}
