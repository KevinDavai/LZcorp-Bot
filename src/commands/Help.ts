import {
  ChatInputCommandInteraction,
  EmbedBuilder,
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

    // Construire l'embed pour afficher les commandes
    const embed = new EmbedBuilder()
      .setTitle("Liste des commandes")
      .setDescription("Voici la liste des commandes disponibles :")
      .setColor("#87CEFA")
      .setFooter({
        text: "© Copyright LZCorp | NewsMC",
        iconURL: interaction.client.user.displayAvatarURL(),
      });

    // Ajouter les commandes globales à l'embed
    if (allCommands.length > 0) {
      embed.addFields({
        name: "Commandes globales",
        value: allCommands
          .map((cmd) => `\`/${cmd.name}\` - ${cmd.description}`)
          .join("\n"),
      });
    }

    // Ajouter les commandes spécifiques à la guilde à l'embed
    if (guildCommands.length > 0) {
      embed.addFields({
        name: `Commandes spécifiques au serveur (${interaction.guild?.name})`,
        value: guildCommands
          .map((cmd) => `\`/${cmd.name}\` - ${cmd.description}`)
          .join("\n"),
      });
    }

    // Si aucune commande n'est trouvée, on affiche un message
    if (allCommands.length === 0 && guildCommands.length === 0) {
      embed.setDescription("Aucune commande disponible.");
    }

    // Envoyer l'embed en réponse à l'interaction
    await interaction.reply({ embeds: [embed], ephemeral: true });
  }
}
