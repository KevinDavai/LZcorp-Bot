import {
  ButtonStyle,
  ChatInputCommandInteraction,
  CommandInteraction,
  ComponentType,
  EmbedBuilder,
  Events,
  Interaction,
  PermissionFlagsBits,
  User,
  ButtonBuilder,
  ButtonInteraction,
} from "discord.js";
import { CustomClient } from "structures/CustomClient";
import { BaseCommand } from "structures/BaseCommand";
import { Logger } from "services/Logger";
import {
  ActionRowBuilder,
  SlashCommandBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
} from "@discordjs/builders";

import { BaseModal } from "structures/BaseModal";
import { TitreModal } from "modals/EmbedTitleModal";
import { DescriptionModal } from "modals/EmbedDescriptionModal";
import { AuthorModal } from "modals/EmbedAuthorModal";
import { ColorModal } from "modals/EmbedColorModal";
import { TimestampModal } from "modals/EmbedTimestampModal";
import { ThumbnailModal } from "modals/EmbedThumbnailModal";
import { FooterModal } from "modals/EmbedFooterModal";
import { ImageModal } from "modals/EmbedImageModal";
import { AddFieldModal } from "modals/EmbedAddFieldModal";
import { RemoveFieldModal } from "modals/EmbedRemoveFieldModal";
import { sendErrorEmbedWithCountdown } from "utils/MessageUtils";

const modalMapping: Record<string, BaseModal> = {
  title: new TitreModal(),
  description: new DescriptionModal(),
  author: new AuthorModal(),
  color: new ColorModal(),
  timestamp: new TimestampModal(),
  thumbnail: new ThumbnailModal(),
  footer: new FooterModal(),
  image: new ImageModal(),
  addField: new AddFieldModal(),
  removeField: new RemoveFieldModal(),
};

export class ProfilCreator extends BaseCommand {
  public constructor(client: CustomClient) {
    super(client, {
      data: new SlashCommandBuilder()
        .setName("profilcreator")
        .setDescription("Create a new profil")
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addUserOption((option) =>
          option
            .setName("utilisateur")
            .setDescription("L'utilisateur pour lequel créer un profil")
            .setRequired(true),
        ),
      cooldown: 1000,
    });
  }

  public async execute(
    interaction: ChatInputCommandInteraction,
  ): Promise<void> {
    const embed: EmbedBuilder[] = [];

    const currentPage: number = 0;

    const user = interaction.options.getUser("utilisateur", true);
    embed[currentPage] = this.createDefaultEmbed(user, interaction);

    const row1 = this.createMenuRow();
    const row2 = this.createButtonRow(currentPage, embed);

    await interaction.reply({
      embeds: [embed[currentPage]],
      components: [row1, row2],
      ephemeral: true,
    });

    this.handleComponentInteraction(interaction, embed, currentPage);
  }

  private createMenuRow(): ActionRowBuilder<StringSelectMenuBuilder> {
    const menuOptions = [
      {
        label: "Titre",
        description: "Modifier le titre de l'embed.",
        value: "title",
        emoji: "📝",
      },
      {
        label: "Description",
        description: "Modifier la description de l'embed.",
        value: "description",
        emoji: "📝",
      },
      {
        label: "Auteur",
        description: "Modifier l'auteur de l'embed.",
        value: "author",
        emoji: "📝",
      },
      {
        label: "Couleur",
        description: "Modifier la couleur de l'embed.",
        value: "color",
        emoji: "📝",
      },
      {
        label: "Timestamp",
        description: "Modifier la date de l'embed.",
        value: "timestamp",
        emoji: "📝",
      },
      {
        label: "Thumbnail",
        description: "Modifier le thumbnail de l'embed.",
        value: "thumbnail",
        emoji: "📝",
      },
      {
        label: "Footer",
        description: "Modifier le footer de l'embed.",
        value: "footer",
        emoji: "📝",
      },
      {
        label: "Image",
        description: "Modifier l'image de l'embed.",
        value: "image",
        emoji: "📝",
      },
      {
        label: "Ajouter un field",
        description: "Ajouter un field a l'embed.",
        value: "addField",
        emoji: "➕",
      },
      {
        label: "Supprimer un field",
        description: "Supprimer un field a l'embed.",
        value: "removeField",
        emoji: "➖",
      },
    ];

    const select = new StringSelectMenuBuilder()
      .setCustomId("embed-editor")
      .setPlaceholder("Modification de l'embed")
      .addOptions(
        menuOptions.map((option) =>
          new StringSelectMenuOptionBuilder()
            .setLabel(option.label)
            .setDescription(option.description)
            .setEmoji({ name: option.emoji })
            .setValue(option.value),
        ),
      );

    return new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
      select,
    );
  }

  private createButtonRow(
    currentPage: number,
    embeds: EmbedBuilder[],
  ): ActionRowBuilder<ButtonBuilder> {
    const addButton = new ButtonBuilder()
      .setCustomId("add-page")
      .setLabel("Ajouter une page")
      .setStyle(ButtonStyle.Primary)
      .setEmoji("⏹️");

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

    const cancelButton = new ButtonBuilder()
      .setCustomId("cancel")
      .setStyle(ButtonStyle.Danger)
      .setLabel("Annuler");

    return new ActionRowBuilder<ButtonBuilder>().addComponents(
      addButton,
      prevButton,
      nextButton,
      cancelButton,
    );
  }

  private async handleComponentInteraction(
    interaction: CommandInteraction,
    embeds: EmbedBuilder[],
    currentPage: number,
  ): Promise<void> {
    const response = await interaction.fetchReply();
    let newPage: number = currentPage;
    let newEmbed: EmbedBuilder[] = embeds;

    const collectorFilter = (i: Interaction) =>
      i.user.id === interaction.user.id;

    try {
      const stringSelectCollector = response.createMessageComponentCollector({
        componentType: ComponentType.StringSelect,
        filter: collectorFilter,
        time: 600_000,
        max: 1,
      });

      const buttonCollector = response.createMessageComponentCollector({
        componentType: ComponentType.Button,
        filter: collectorFilter,
        time: 600_000,
        max: 1,
      });

      stringSelectCollector.on("collect", async (i) => {
        if (!buttonCollector.ended) buttonCollector.stop();

        const selectedOption = i.values[0];
        const modalHandler = modalMapping[selectedOption];

        const modal = modalHandler.createModal(embeds[currentPage]);
        await i.showModal(modal);

        await interaction.editReply({
          embeds: [embeds[currentPage]],
          components: [
            this.createMenuRow(),
            this.createButtonRow(currentPage, embeds),
          ],
        });

        this.updateEmbed(interaction, i, modalHandler, embeds, currentPage);

        this.handleComponentInteraction(interaction, embeds, currentPage);
      });

      buttonCollector.on("collect", async (i) => {
        if (!stringSelectCollector.ended) stringSelectCollector.stop();

        const selectedButtonId = i.customId;

        switch (selectedButtonId) {
          case "add-page": {
            const [newCurrentPage, newEmbeds] = await this.addPage(embeds);

            newPage = newCurrentPage;
            newEmbed = newEmbeds;

            break;
          }
          case "prev-page":
            newPage = await this.previousPage(newPage);
            break;
          case "next-page":
            newPage = await this.nextPage(newPage, newEmbed);
            break;
          case "cancel":
            await this.cancel(i);
            break;
          default:
            break;
        }

        i.deferUpdate();

        await interaction.editReply({
          embeds: [newEmbed[newPage]],
          components: [
            this.createMenuRow(),
            this.createButtonRow(newPage, newEmbed),
          ],
        });

        if (selectedButtonId === "cancel") {
          interaction.deleteReply();
        } else {
          await interaction.editReply({
            embeds: [newEmbed[newPage]],
            components: [
              this.createMenuRow(),
              this.createButtonRow(newPage, newEmbed),
            ],
          });
          this.handleComponentInteraction(interaction, newEmbed, newPage);
        }
      });

      buttonCollector.on("end", async (collected, reason) => {
        if (reason === "time") {
          this.clearProfilCreator(interaction, this.client);
        }
      });

      stringSelectCollector.on("end", async (collected, reason) => {
        if (reason === "time") {
          this.clearProfilCreator(interaction, this.client);
        }
      });
    } catch (error) {
      Logger.error(
        "Error handling component interaction while attempting to create a profil",
        error,
      );
    }
  }

  private async updateEmbed(
    interaction: CommandInteraction,
    confirmation: Interaction,
    modalHandler: BaseModal,
    embeds: EmbedBuilder[],
    currentPage: number,
  ): Promise<void> {
    confirmation.client.once(
      Events.InteractionCreate,
      async (ii: Interaction) => {
        if (!ii.isModalSubmit()) return;
        if (ii.customId !== modalHandler.customId) return;

        try {
          const updates: Record<string, string> = {};

          ii.fields.fields.forEach((field) => {
            updates[field.customId] = field.value.trim();
          });

          const { errors } = modalHandler.updateEmbed(
            embeds[currentPage],
            updates,
          );

          await interaction.editReply({
            embeds: [embeds[currentPage]],
            components: [
              this.createMenuRow(),
              this.createButtonRow(currentPage, embeds),
            ],
          });

          if (errors && errors.length > 0) {
            await sendErrorEmbedWithCountdown(ii, errors);
          } else {
            await ii.deferUpdate();
          }
        } catch (error) {
          Logger.error("Error updating embed", error);
        }
      },
    );
  }

  private async addPage(
    embeds: EmbedBuilder[],
  ): Promise<[number, EmbedBuilder[]]> {
    const newEmbed = this.createDefaultEmbed();
    embeds.push(newEmbed);
    const newCurrentPage = embeds.length - 1;

    return [newCurrentPage, embeds];
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

  private cancel(
    interaction:
      | CommandInteraction
      | ButtonInteraction
      | ChatInputCommandInteraction,
  ): Promise<void> {
    this.clearProfilCreator(interaction, interaction.client as CustomClient);
    return Promise.resolve();
  }

  private createDefaultEmbed(
    user?: User,
    interaction?: ChatInputCommandInteraction,
  ): EmbedBuilder {
    if (!user || !interaction) {
      return new EmbedBuilder()
        .setTitle(`⭐⭐⭐ **Community-Manager**`)
        .setDescription(
          "Je dessine depuis toujours c'est ma plus grande passion dans la vie, de manière générale j'ai 4 ans d'expérience en graphisme. Je travaille sur Minecraft depuis 2023, en grande partie avec le serveur Atlantis.",
        )
        .setURL("https://www.google.com")
        .setAuthor({
          name: "Page 2",
        })
        .addFields(
          {
            name: "Document contractuel",
            value: "• ``Cahier des charges`` \n• ``Devis`` \n• ``Factures``",
            inline: true,
          },

          {
            name: "Réseaux sociaux",
            value:
              "• [Instagram](https://www.instagram.com/)\n• [Twitter](https://twitter.com/)\n• [Portfolio](https://www.lzcorp.fr/)",
            inline: true,
          },
        )
        .setColor(0xffffff)
        .setFooter({
          text: "© LZCorp",
        })
        .setTimestamp(Date.now());
    }

    return new EmbedBuilder()
      .setTitle(`⭐⭐⭐ **Community-Manager**`)
      .setDescription(
        "Je dessine depuis toujours c'est ma plus grande passion dans la vie, de manière générale j'ai 4 ans d'expérience en graphisme. Je travaille sur Minecraft depuis 2023, en grande partie avec le serveur Atlantis.",
      )
      .setURL("https://www.google.com")
      .setAuthor({
        name: `Profil de ${user?.username ?? "Page 2"}`,
        iconURL: user?.displayAvatarURL() ?? "",
      })
      .setThumbnail(user?.displayAvatarURL() ?? "")
      .addFields(
        {
          name: "Document contractuel",
          value: "• ``Cahier des charges`` \n• ``Devis`` \n• ``Factures``",
          inline: true,
        },

        {
          name: "Réseaux sociaux",
          value:
            "• [Instagram](https://www.instagram.com/)\n• [Twitter](https://twitter.com/)\n• [Portfolio](https://www.lzcorp.fr/)",
          inline: true,
        },
      )
      .setColor(0xffffff)
      .setFooter({
        text: "© LZCorp",
        iconURL: interaction?.client.user.displayAvatarURL() ?? "",
      })
      .setTimestamp(Date.now());
  }

  private clearProfilCreator(
    interaction:
      | CommandInteraction
      | ButtonInteraction
      | ChatInputCommandInteraction,
    client: CustomClient,
  ): void {
    client.ongoingCommands.delete(interaction.user.id);
  }
}
