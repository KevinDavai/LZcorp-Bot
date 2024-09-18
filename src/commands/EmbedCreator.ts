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
  Embed,
  AutocompleteInteraction,
  APIEmbed,
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
import {
  sendErrorEmbedWithCountdown,
  sendValidEmbedWithCountdown,
} from "utils/MessageUtils";
import {
  createEmbed,
  deleteEmbed,
  getEmbedById,
  getEmbedsByGuildId,
  isEmbedExist,
} from "database/utils/EmbedUtils";

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

export class EmbedCreator extends BaseCommand {
  public constructor(client: CustomClient) {
    super(client, {
      data: new SlashCommandBuilder()
        .setName("embed")
        .setDescription("Create / delete / list embeds")
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addSubcommand((subcommand) =>
          subcommand
            .setName("create")
            .setDescription("Créer un embed personalisé")
            .addStringOption((option) =>
              option
                .setName("nom")
                .setDescription("Nom de l'embed")
                .setRequired(true),
            ),
        )
        .addSubcommand((subcommand) =>
          subcommand
            .setName("delete")
            .setDescription("Supprimer un embed déjà existant.")
            .addStringOption((option) =>
              option
                .setName("nom")
                .setDescription("Nom de l'embed")
                .setRequired(true)
                .setAutocomplete(true),
            ),
        )
        .addSubcommand((subcommand) =>
          subcommand
            .setName("post")
            .setDescription("Poster un embed existant dans le channel.")
            .addStringOption((option) =>
              option
                .setName("nom")
                .setDescription("Nom de l'embed")
                .setRequired(true)
                .setAutocomplete(true),
            ),
        )
        .addSubcommand((subcommand) =>
          subcommand
            .setName("list")
            .setDescription("Lister tout les embeds existant."),
        ),

      cooldown: 1000,
      subcommands: {
        create: {
          max: 1, // Max limit for /embed create
        },
        delete: {
          max: 0, // No limit for /embed delete
        },
        list: {
          max: 0, // No limit for /embed list
        },
      },
    });
  }

  public async autocomplete(
    interaction: AutocompleteInteraction,
  ): Promise<void> {
    const focusedOption = interaction.options.getFocused(true);
    let choices;

    if (focusedOption.name === "nom") {
      choices = await getEmbedsByGuildId(interaction.guild!.id);
    }

    // Filtre les choix en fonction de la valeur de l'option
    const filtered = choices!.filter(
      (choice) => choice._id.startsWith(focusedOption.value), // Utilise la propriété _id pour comparer
    );

    await interaction.respond(
      filtered.map((choice) => ({ name: choice._id, value: choice._id })),
    );
  }

  public async execute(
    interaction: ChatInputCommandInteraction,
  ): Promise<void> {
    const subcommands: Record<string, () => Promise<void>> = {
      create: async () => {
        this.createEmbed(interaction);
      },
      delete: async () => {
        this.deleteEmbed(interaction);
      },
      list: async () => {
        this.listEmbeds(interaction);
      },
      post: async () => {
        this.postEmbed(interaction);
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

  private async postEmbed(
    interaction: ChatInputCommandInteraction,
  ): Promise<void> {
    const { channel } = interaction;
    const embedName = interaction.options.getString("nom", true);

    if (!channel) {
      await sendErrorEmbedWithCountdown(interaction, [
        "Le channel n'est pas un channel text ou est introuvable.",
      ]);
      return;
    }

    const embed = await getEmbedById(embedName, interaction.guild!.id);

    if (embed === null) {
      await sendErrorEmbedWithCountdown(interaction, [
        `L'embed ${embedName} n'existe pas.`,
      ]);
      return;
    }

    await channel.send({
      embeds: [embed.embedData as APIEmbed],
    });

    await sendValidEmbedWithCountdown(interaction, [
      "L'embed a été posté avec succès.",
    ]);
  }

  private async deleteEmbed(interaction: ChatInputCommandInteraction) {
    const embedName = interaction.options.getString("nom", true);

    const embedExist = await isEmbedExist(embedName, interaction.guild!.id);

    if (!embedExist) {
      this.clearProfilCreator(interaction, this.client);
      sendErrorEmbedWithCountdown(interaction, [
        `L'embed ${embedName} n'existe pas.`,
      ]);
      return;
    }

    await deleteEmbed(embedName, interaction.guild!);

    await sendValidEmbedWithCountdown(interaction, [
      "L'embed a été supprimé avec succès.",
    ]);
  }

  private async listEmbeds(interaction: ChatInputCommandInteraction) {
    const embeds = await getEmbedsByGuildId(interaction.guild!.id);

    if (!embeds || embeds.length === 0) {
      await sendErrorEmbedWithCountdown(interaction, [
        "Aucun embed n'a été trouvé pour ce serveur.",
      ]);
      return;
    }

    const embed = new EmbedBuilder()
      .setTitle("Liste des embeds")
      .setDescription(embeds.map((e) => `**-** ${e._id}`).join("\n"));

    await interaction.reply({ embeds: [embed], ephemeral: true });
  }

  private async createEmbed(
    interaction: ChatInputCommandInteraction,
  ): Promise<void> {
    const embedName = interaction.options.getString("nom", true);

    const embedAlreadyExist = await isEmbedExist(
      embedName,
      interaction.guild!.id,
    );

    if (embedAlreadyExist) {
      this.clearProfilCreator(interaction, this.client);
      sendErrorEmbedWithCountdown(interaction, [
        `Le nom ${embedName} existe déjà, merci d'utiliser un autre nom pour votre embed.`,
      ]);
      return;
    }

    const embed = this.createDefaultEmbed();

    const row1 = this.createMenuRow();
    const row2 = this.createButtonRow(embed);

    await interaction.reply({
      embeds: [embed],
      components: [row1, row2],
      ephemeral: true,
    });

    this.handleComponentInteraction(interaction, embed, embedName);
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
    embed: EmbedBuilder,
  ): ActionRowBuilder<ButtonBuilder> {
    const cancelButton = new ButtonBuilder()
      .setCustomId("cancel")
      .setStyle(ButtonStyle.Danger)
      .setLabel("Annuler");
    const validButton = new ButtonBuilder()
      .setCustomId("valide")
      .setStyle(ButtonStyle.Success)
      .setLabel("Valider");

    return new ActionRowBuilder<ButtonBuilder>().addComponents(
      cancelButton,
      validButton,
    );
  }

  private async handleComponentInteraction(
    interaction: CommandInteraction,
    embed: EmbedBuilder,
    embedName: string,
  ): Promise<void> {
    const response = await interaction.fetchReply();
    const newEmbed: EmbedBuilder = embed;

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

        const modal = modalHandler.createModal(embed);
        await i.showModal(modal);

        await interaction.editReply({
          embeds: [embed],
          components: [this.createMenuRow(), this.createButtonRow(embed)],
        });

        this.updateEmbed(interaction, i, modalHandler, embed);

        this.handleComponentInteraction(interaction, embed, embedName);
      });

      buttonCollector.on("collect", async (i) => {
        if (!stringSelectCollector.ended) stringSelectCollector.stop();

        const selectedButtonId = i.customId;

        switch (selectedButtonId) {
          case "cancel":
            await this.cancel(i);
            break;
          case "valide":
            await this.validate(embedName, embed, i);
            break;
          default:
            break;
        }

        i.deferUpdate();

        await interaction.editReply({
          embeds: [newEmbed],
          components: [this.createMenuRow(), this.createButtonRow(newEmbed)],
        });

        if (selectedButtonId === "cancel") {
          interaction.deleteReply();
        } else if (selectedButtonId === "valide") {
          sendValidEmbedWithCountdown(
            interaction,
            [
              "L'embed a été sauvegardé avec succès.",
              "Utilise ``/postembed " + embedName + "`` pour poster l'embed",
            ],
            true,
          );
        } else {
          await interaction.editReply({
            embeds: [newEmbed],
            components: [this.createMenuRow(), this.createButtonRow(newEmbed)],
          });
          this.handleComponentInteraction(interaction, newEmbed, embedName);
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
    embed: EmbedBuilder,
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

          const { errors } = modalHandler.updateEmbed(embed, updates);

          await interaction.editReply({
            embeds: [embed],
            components: [this.createMenuRow(), this.createButtonRow(embed)],
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

  private cancel(
    interaction:
      | CommandInteraction
      | ButtonInteraction
      | ChatInputCommandInteraction,
  ): Promise<void> {
    this.clearProfilCreator(interaction, interaction.client as CustomClient);
    return Promise.resolve();
  }

  private async validate(
    embedName: string,
    embed: EmbedBuilder,
    interaction: ButtonInteraction,
  ): Promise<void> {
    await createEmbed(embedName, embed, interaction.guild!);
    await this.clearProfilCreator(interaction, this.client);
    return Promise.resolve();
  }

  private createDefaultEmbed(): EmbedBuilder {
    return new EmbedBuilder()
      .setTitle(`**Creation d'embed**`)
      .setDescription(
        "Bienvenue dans l'outil de creation d'embed simplifié, ceci est un embed par defaut, tu peux le modifier simplement a partir du menu de selection ci-dessous !",
      )
      .setURL("https://www.google.com")
      .setColor(0xffffff)
      .setFooter({
        text: "© Copyright LZCorp | NewsMC",
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
