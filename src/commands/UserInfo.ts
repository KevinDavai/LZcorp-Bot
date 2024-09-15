import {
  ChatInputCommandInteraction,
  Colors,
  EmbedBuilder,
  PermissionFlagsBits,
  User,
} from "discord.js";
import { CustomClient } from "structures/CustomClient";
import { BaseCommand } from "structures/BaseCommand";
import { SlashCommandBuilder } from "@discordjs/builders";

import {
  getOrFetchChannelById,
  getOrFetchMemberById,
  getOrFetchMessageById,
  getOrFetchRoleById,
  sendErrorEmbedWithCountdown,
  sendValidEmbedWithCountdown,
} from "utils/MessageUtils";
import { getGuildSettings } from "database/utils/GuildsUtils";
import { getUserById, setBlackListedStatus } from "database/utils/UserUtils";

export class UserInfo extends BaseCommand {
  public constructor(client: CustomClient) {
    super(client, {
      data: new SlashCommandBuilder()
        .setName("userinfo")
        .setDescription("Afficher les informations d'un utilisateur.")
        .addUserOption((option) =>
          option.setName("pseudo").setDescription("Nom de l'utilisateur."),
        ),
    });
  }

  public async execute(
    interaction: ChatInputCommandInteraction,
  ): Promise<void> {
    const user = interaction.options.getUser("pseudo") || interaction.user;

    if (!user) {
      await sendErrorEmbedWithCountdown(interaction, [
        "L'utilisateur n'existe pas ou est introuvable.",
      ]);
      return;
    }

    const member = await getOrFetchMemberById(interaction.guild!, user.id);

    if (!member) {
      await sendErrorEmbedWithCountdown(interaction, [
        "L'utilisateur n'est pas sur le serveur.",
      ]);
      return;
    }

    const roles =
      member.roles.cache
        .filter((role) => role.name !== "@everyone") // Filtrer le rôle @everyone
        .sort((a, b) => b.position - a.position) // Trier du plus haut au plus bas
        .map((role) => `<@&${role.id}>`) // Convertir en mention de rôle
        .join(", ") || "Aucun rôle"; // Joindre les rôles ou afficher "Aucun rôle"

    // Fonction pour calculer la différence en jours
    const calculateDaysDifference = (date: Date) => {
      const today = new Date();
      const timeDiff = Math.abs(today.getTime() - date.getTime());
      return Math.floor(timeDiff / (1000 * 3600 * 24)); // Diviser par le nombre de millisecondes en un jour
    };

    // Calcul des jours pour chaque événement
    const daysSinceAccountCreation = calculateDaysDifference(user.createdAt);
    const daysSinceJoinedServer = member.joinedAt
      ? calculateDaysDifference(member.joinedAt)
      : null;

    const options: Intl.DateTimeFormatOptions = {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    };

    const dateCreationCompte = new Intl.DateTimeFormat("fr-FR", options).format(
      user.createdAt,
    );
    const dateArriveeServeur = member.joinedAt
      ? new Intl.DateTimeFormat("fr-FR", options).format(member.joinedAt)
      : "Inconnu";

    const userInfoEmbed = new EmbedBuilder()
      .setTitle(`💡 | Informations de ${user.displayName}`)
      .setDescription(
        `Vous voyez actuellement certaines informations de <@${user.id}>.`,
      )
      .setFooter({
        text: "© Copyright LZCorp",
        iconURL: member.client.user.displayAvatarURL(),
      })
      .addFields([
        {
          name: " ",
          value: " ",
        },
        {
          name: "Basique",
          value: `Username: \`\`${user.tag}\`\`\nID: \`\`${user.id}\`\``,
        },
        {
          name: " ",
          value: " ",
        },
        {
          name: "Évenements",
          value: `Création du compte: \`\`${dateCreationCompte}\`\` **|** \`\`(il y a ${daysSinceAccountCreation} jours)\`\`\nArrivé sur le serveur: \`\`${dateArriveeServeur}\`\` ${daysSinceJoinedServer !== null ? `**|** \`\`(il y a ${daysSinceJoinedServer} jours)\`\`` : ""}`,
        },
        {
          name: " ",
          value: " ",
        },

        {
          name: "Serveur",
          value: `Roles: ${roles}`,
          inline: true,
        },
        {
          name: " ",
          value: " ",
          inline: true,
        },
        {
          name: "Boost depuis",
          value: `${member.premiumSince ? new Intl.DateTimeFormat("fr-FR", options).format(member.premiumSince) : "Aucun boost"}`,
          inline: true,
        },
        {
          name: " ",
          value: " ",
        },
      ])
      .setColor("#87CEFA")
      .setThumbnail(user.displayAvatarURL());

    await interaction.reply({ embeds: [userInfoEmbed] });
  }
}
