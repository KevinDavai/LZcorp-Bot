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
  getOrFetchMemberById,
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
        )
        .addSubcommand((subcommand) =>
          subcommand.setName("list").setDescription("Lister les prestataires."),
        ),
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
    const rolesPriority = [
      "953056804215095346", // Communication
      "953056807188836422", // Trailer/Monteur vidéo
      "953056811001462885", // Graphisme
      "953057826652180490", // Dessinateurs
      "1137408301492093009", // Pixel Art
      "953059691699773530", // Rédacteur
      "953264702652305499", // Développement Java
      "953264709707116574", // Développement Web
      "958110292670312570", // Développement Bot
      "974776075596988436", // Sys Admin
      "978217560623435776", // Configurateur
      "958113912820232252", // Constructeurs
      "963199682534854656", // Modélisation
      "964134348880244766", // Game Designer
      "1153331052711006361", // Vérificateur
    ];

    const prestataires = await getAllProfilUserName(interaction.guildId!);

    if (prestataires.length === 0) {
      await interaction.reply({
        content: "Aucun prestataire disponible dans ce serveur.",
        ephemeral: true,
      });
      return;
    }

    const usersPerPage = 10; // Nombre d'utilisateurs à afficher par page
    const pages: EmbedBuilder[] = [];
    const roleGroups: { [roleId: string]: string[] } = {};

    // eslint-disable-next-line no-restricted-syntax
    for (const userId of prestataires) {
      // eslint-disable-next-line no-await-in-loop
      const member = await interaction.guild!.members.fetch(userId);
      let roleFound = false;

      for (let i = 0; i < rolesPriority.length; i += 1) {
        const roleId = rolesPriority[i];
        if (member.roles.cache.has(roleId)) {
          if (!roleGroups[roleId]) {
            roleGroups[roleId] = [];
          }
          roleGroups[roleId].push(`<@${member.user.id}>`);
          roleFound = true;
          break;
        }
      }

      if (!roleFound) {
        if (!roleGroups.noRole) {
          roleGroups.noRole = [];
        }
        roleGroups.noRole.push(`<@${member.user.id}>`);
      }
    }

    const roleEntries = Object.entries(roleGroups);
    let currentEmbed = new EmbedBuilder()
      .setTitle("📝 | Prestataires disponibles")
      .setColor("#87CEFA")
      .setFooter({
        text: "© Copyright LZCorp | NewsMC",
        iconURL: interaction.client.user.displayAvatarURL(),
      });

    let userCount = 0;

    roleEntries.forEach(([roleId, users]) => {
      // eslint-disable-next-line no-restricted-syntax
      for (const user of users) {
        if (userCount >= usersPerPage) {
          pages.push(currentEmbed);
          currentEmbed = new EmbedBuilder()
            .setTitle("📝 | Prestataires disponibles")
            .setColor("#87CEFA")
            .setFooter({
              text: "© Copyright LZCorp | NewsMC",
              iconURL: interaction.client.user.displayAvatarURL(),
            });
          userCount = 0; // Réinitialiser le compteur d'utilisateurs
        }

        currentEmbed.addFields({
          name: " ",
          value: `${user} | <@&${roleId}>`,
          inline: false,
        });
        userCount += 1;
      }
    });

    if (currentEmbed.data.fields && currentEmbed.data.fields.length > 0) {
      pages.push(currentEmbed);
    }

    const getButtons = (pageIndex: number) =>
      new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setCustomId("previous")
          .setLabel("Précédent")
          .setStyle(ButtonStyle.Primary)
          .setDisabled(pageIndex === 0),
        new ButtonBuilder()
          .setCustomId("next")
          .setLabel("Suivant")
          .setStyle(ButtonStyle.Primary)
          .setDisabled(pageIndex === pages.length - 1),
      );

    let currentPage = 0;
    const message = await interaction.reply({
      embeds: [pages[currentPage]],
      components: [getButtons(currentPage)],
      fetchReply: true,
    });

    const collector = message.createMessageComponentCollector({
      componentType: ComponentType.Button,
      time: 60000,
      filter: (i) => i.user.id === interaction.user.id,
    });

    collector.on("collect", async (i) => {
      if (i.customId === "previous") {
        currentPage -= 1;
      } else if (i.customId === "next") {
        currentPage += 1;
      }

      await i.update({
        embeds: [pages[currentPage]],
        components: [getButtons(currentPage)],
      });
    });

    collector.on("end", () => {
      message.edit({
        components: [],
      });
    });
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
