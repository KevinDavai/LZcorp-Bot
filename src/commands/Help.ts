import {
  ChatInputCommandInteraction,
  CommandInteraction,
  ComponentType,
  EmbedBuilder,
  Interaction,
  PermissionFlagsBits,
} from "discord.js";
import { CustomClient } from "structures/CustomClient";
import { BaseCommand } from "structures/BaseCommand";
import ms from "ms";
import {
  ActionRowBuilder,
  SlashCommandBuilder,
  StringSelectMenuBuilder,
} from "@discordjs/builders";
import {
  getOrFetchMemberById,
  sendErrorEmbedWithCountdown,
  sendValidEmbedWithCountdown,
} from "utils/MessageUtils";
import { Logger } from "services/Logger";

export class Help extends BaseCommand {
  public constructor(client: CustomClient) {
    super(client, {
      data: new SlashCommandBuilder()
        .setName("help")
        .setDescription("Afficher la liste des commandes.")
        .addStringOption((option) =>
          option
            .setName("commande")
            .setDescription("Le nom de la commande pour plus de détails"),
        ),
    });
  }

  public async execute(
    interaction: ChatInputCommandInteraction,
  ): Promise<void> {
    const commandName = interaction.options.getString("commande");

    if (commandName) {
      // Rechercher la commande spécifique
      const command = this.client.commands.get(commandName);

      if (!command) {
        await sendErrorEmbedWithCountdown(interaction, [
          `La commande \`${commandName}\` n'existe pas.`,
        ]);
        return;
      }

      const data = command.data as SlashCommandBuilder;
      const embed = new EmbedBuilder()
        .setTitle(`Détails de la commande /${data.name}`)
        .setDescription(data.description)
        .setColor("#87CEFA")
        .setFooter({
          text: "© Copyright LZCorp | NewsMC",
          iconURL: interaction.client.user.displayAvatarURL(),
        });

      // Ajouter les subcommands ou les options à l'embed
      if (data.options.length > 0) {
        embed.addFields(
          data.options.map((option) => ({
            name: `/${data.name} ${(option as any).name}`,
            value: `${(option as any).description}\n`,
          })),
        );
      } else {
        embed.setDescription(`La commande /${data.name} n'a pas d'options.`);
      }

      // Répondre avec les détails de la commande
      interaction.reply({ embeds: [embed], ephemeral: true });
      return;
    }

    const SelectMenuBuilder = new StringSelectMenuBuilder()
      .setCustomId("help_select_menu")
      .setPlaceholder("Sélectionner une catégorie")
      .addOptions([
        {
          label: "Commandes basiques",
          value: "basic",
        },
        {
          label: "Commandes Modérations",
          value: "moderation",
        },
        {
          label: "Commandes Administration",
          value: "admin",
        },
        {
          label: "Commandes Techniciens",
          value: "config",
        },
      ]);

    const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
      SelectMenuBuilder,
    );

    const embed = this.createEmbed(interaction, "basic");

    // Envoyer l'embed en réponse à l'interaction
    await interaction.reply({
      embeds: [embed],
      components: [row],
      ephemeral: true,
    });

    this.handleComponentInteraction(interaction, embed);
  }

  private async handleComponentInteraction(
    interaction: CommandInteraction,
    embed: EmbedBuilder,
  ): Promise<void> {
    const response = await interaction.fetchReply();

    const collectorFilter = (i: Interaction) =>
      i.user.id === interaction.user.id;

    try {
      const stringSelectCollector = response.createMessageComponentCollector({
        componentType: ComponentType.StringSelect,
        filter: collectorFilter,
        time: 60_000,
        max: 1,
      });

      stringSelectCollector.on("collect", async (i) => {
        const selectedOption = i.values[0];

        const newEmbed = this.createEmbed(i, selectedOption);

        await interaction.editReply({
          embeds: [newEmbed],
        });

        i.deferUpdate();

        this.handleComponentInteraction(interaction, newEmbed);
      });
    } catch (error) {
      Logger.error(
        "Error handling component interaction while attempting to create a profil",
        error,
      );
    }
  }

  private createEmbed(
    interaction: Interaction,
    selectedOption: string,
  ): EmbedBuilder {
    // Filtrer les commandes globales
    const allCommands = this.client.commands
      .filter((command) => !command.guildIdOnly) // Exclure les commandes avec un guildIdOnly
      .map((command) => {
        const data = command.data as SlashCommandBuilder;
        return {
          name: data.name,
          description: data.description,
        };
      });

    // Filtrer les commandes spécifiques à la guilde actuelle
    const guildCommands = this.client.commands
      .filter((command) => command.guildIdOnly === interaction.guildId)
      .map((command) => {
        const data = command.data as SlashCommandBuilder;
        return {
          name: data.name,
          description: data.description,
        };
      });

    const allCommandesMerge = allCommands.concat(guildCommands);

    const moderatorCmd = ["warn", "kick", "ban", "unban", "mute", "unmute"];
    const settingsCmd = ["autorole-setup", "settings"];
    const basicCmd = [
      "avis",
      "profil",
      "classement",
      "help",
      "prestataire",
      "invites",
      "userinfo",
    ];
    const adminCmd = ["giveaway", "blacklist", "embed"];

    // Construire l'embed pour afficher les commandes
    const embed = new EmbedBuilder()
      .setTitle("Liste des commandes")
      .setDescription("Voici la liste des commandes disponibles :")
      .setColor("#87CEFA")
      .setFooter({
        text: "© Copyright LZCorp | NewsMC",
        iconURL: interaction.client.user.displayAvatarURL(),
      });

    switch (selectedOption) {
      case "basic":
        embed.addFields({
          name: "Commandes basiques",
          value: allCommandesMerge
            .filter((cmd) => basicCmd.includes(cmd.name))
            .map((cmd) => `\`/${cmd.name}\` - ${cmd.description}`)
            .join("\n"),
        });
        break;
      case "moderation":
        embed.addFields({
          name: "Commandes de modération",
          value: allCommandesMerge
            .filter((cmd) => moderatorCmd.includes(cmd.name))
            .map((cmd) => `\`/${cmd.name}\` - ${cmd.description}`)
            .join("\n"),
        });
        break;
      case "admin":
        embed.addFields({
          name: "Commandes d'administration",
          value: allCommandesMerge
            .filter((cmd) => adminCmd.includes(cmd.name))
            .map((cmd) => `\`/${cmd.name}\` - ${cmd.description}`)
            .join("\n"),
        });
        break;
      case "config":
        embed.addFields({
          name: "Commandes de configuration",
          value: allCommandesMerge
            .filter((cmd) => settingsCmd.includes(cmd.name))
            .map((cmd) => `\`/${cmd.name}\` - ${cmd.description}`)
            .join("\n"),
        });
        break;
      default:
        break;
    }
    return embed;
  }
}
