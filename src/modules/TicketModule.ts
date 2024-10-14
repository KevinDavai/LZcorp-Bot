import {
  ActionRowBuilder,
  SelectMenuBuilder,
  StringSelectMenuBuilder,
} from "@discordjs/builders";
import { getGuildSettings } from "database/utils/GuildsUtils";
import {
  CategoryChannel,
  ChannelType,
  ChatInputCommandInteraction,
  EmbedBuilder,
  GuildChannelCreateOptions,
  GuildMember,
  OverwriteResolvable,
  PermissionFlagsBits,
  StringSelectMenuInteraction,
  StringSelectMenuOptionBuilder,
  TextChannel,
} from "discord.js";
import {
  getOrFetchCategoryById,
  getOrFetchChannelById,
  sendErrorEmbedWithCountdown,
  sendValidEmbedWithCountdown,
} from "utils/MessageUtils";
import * as discordTranscripts from "discord-html-transcripts";

export async function createTicket(
  interaction: StringSelectMenuInteraction,
): Promise<void> {
  const guildSettings = await getGuildSettings(interaction.guild!.id);

  const ticketId = interaction.customId;

  if (ticketId === "ticket_newsmc") {
    createBasicTicket(interaction);
  } else if (ticketId === "ticket_lzcorp_support") {
    createBasicTicket(interaction);
  } else if (ticketId === "ticket_lzcorp_commande") {
    await createTicketLZCorpCommande(interaction);
  }
}

async function createBasicTicket(interaction: StringSelectMenuInteraction) {
  const ticketType = interaction.values[0];
  const guildSettings = await getGuildSettings(interaction.guild!.id);
  const member = interaction.member as GuildMember;

  if (!guildSettings.ticket_category_id) {
    await sendErrorEmbedWithCountdown(interaction, [
      "La catégorie des ticket est introuvable, merci de contacter un administrateur.",
    ]);
    return;
  }

  const ticketCategory = (await getOrFetchCategoryById(
    interaction.guild!,
    guildSettings.ticket_category_id,
  )) as CategoryChannel;

  if (!ticketCategory) {
    await sendErrorEmbedWithCountdown(interaction, [
      "La catégorie des tickets est introuvable, merci de contacter un administrateur.",
    ]);
    return;
  }

  // Vérifier combien de tickets sont ouverts pour cet utilisateur
  const userTickets = ticketCategory.children.cache.filter(
    (channel) =>
      channel.type === ChannelType.GuildText &&
      channel.topic &&
      channel.topic.includes(member.id),
  );

  if (userTickets.size >= 2) {
    await sendErrorEmbedWithCountdown(interaction, [
      "Vous avez déjà 2 tickets ouverts. Merci de fermer un ticket avant d'en ouvrir un nouveau.",
    ]);
    return;
  }

  const permissionOverwrites: OverwriteResolvable[] = [
    {
      id: member.id,
      allow: [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.SendMessages,
      ],
    },
    {
      id: interaction.guild!.id,
      deny: [PermissionFlagsBits.ViewChannel],
    },
  ];

  // Ajouter dynamiquement les permissions pour un rôle spécifique, si défini
  if (guildSettings.ticket_role_id) {
    permissionOverwrites.push({
      id: guildSettings.ticket_role_id,
      allow: [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.SendMessages,
      ],
    });
  }

  const channelOptions: GuildChannelCreateOptions = {
    name: `${ticketType}-${member.user.username}`,
    type: ChannelType.GuildText,
    topic: `Ticket de ${member.user.username} | ${member.user.id}`,
    parent: guildSettings.ticket_category_id,
    permissionOverwrites,
  };

  const ticketChannel =
    await interaction.guild?.channels.create(channelOptions);

  if (!ticketChannel) {
    await sendErrorEmbedWithCountdown(interaction, [
      "Une erreur est survenue lors de la création du ticket.",
    ]);
    return;
  }

  await postEmbedInTicket(ticketChannel, member, ticketType);

  await sendValidEmbedWithCountdown(interaction, [
    "Votre ticket de commande a été créé avec succès.",
  ]);
}

async function createTicketLZCorpCommande(
  interaction: StringSelectMenuInteraction,
) {
  const ticketType = interaction.values[0];
  const guildSettings = await getGuildSettings(interaction.guild!.id);
  const member = interaction.member as GuildMember;

  if (!guildSettings.ticket_commande_category_id) {
    await sendErrorEmbedWithCountdown(interaction, [
      "La catégorie des ticket commande est introuvable, merci de contacter un administrateur.",
    ]);
    return;
  }

  const ticketCategory = (await getOrFetchCategoryById(
    interaction.guild!,
    guildSettings.ticket_commande_category_id,
  )) as CategoryChannel;

  if (!ticketCategory) {
    await sendErrorEmbedWithCountdown(interaction, [
      "La catégorie des tickets commande est introuvable, merci de contacter un administrateur.",
    ]);
    return;
  }

  // Vérifier combien de tickets sont ouverts pour cet utilisateur
  const userTickets = ticketCategory.children.cache.filter(
    (channel) =>
      channel.type === ChannelType.GuildText &&
      channel.topic &&
      channel.topic.includes(member.id),
  );

  if (userTickets.size >= 3) {
    await sendErrorEmbedWithCountdown(interaction, [
      "Vous avez déjà 3 tickets ouverts. Merci de fermer un ticket avant d'en ouvrir un nouveau.",
    ]);
    return;
  }

  const permissionOverwrites: OverwriteResolvable[] = [
    {
      id: member.id,
      allow: [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.SendMessages,
      ],
    },
    {
      id: interaction.guild!.id,
      deny: [PermissionFlagsBits.ViewChannel],
    },
  ];

  // Ajouter dynamiquement les permissions pour un rôle spécifique, si défini
  if (guildSettings.ticket_role_id) {
    permissionOverwrites.push({
      id: guildSettings.ticket_role_id,
      allow: [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.SendMessages,
      ],
    });
  }

  const channelOptions: GuildChannelCreateOptions = {
    name: `${ticketType}-${member.user.username}`,
    type: ChannelType.GuildText,
    topic: `Ticket de commande de ${member.user.username} | ${member.user.id}`,
    parent: guildSettings.ticket_commande_category_id,
    permissionOverwrites,
  };

  const ticketChannel =
    await interaction.guild?.channels.create(channelOptions);

  if (!ticketChannel) {
    await sendErrorEmbedWithCountdown(interaction, [
      "Une erreur est survenue lors de la création du ticket.",
    ]);
    return;
  }

  await postEmbedInTicket(ticketChannel, member, ticketType);

  await sendValidEmbedWithCountdown(interaction, [
    "Votre ticket de commande a été créé avec succès.",
  ]);
}

async function postEmbedInTicket(
  ticketChannel: TextChannel,
  member: GuildMember,
  ticketType: string,
) {
  const select = new StringSelectMenuBuilder()
    .setCustomId("gestion_ticket")
    .setPlaceholder("Actions possibles")
    .addOptions(
      new StringSelectMenuOptionBuilder()
        .setLabel("Fermer le ticket")
        .setValue("close_ticket")
        .setEmoji("🔒"),
    );

  const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
    select,
  );

  await ticketChannel.send({
    content: `<@${member.id}>`,
    embeds: [
      new EmbedBuilder()
        .setTitle(`🛒 | Ticket ${ticketType}`)
        .setDescription(
          `Bonjour ${member.user.username}, votre ticket a été créé avec succès.`,
        )
        .setFooter({
          text: `© Copyright ${process.env.SERVER_NAME}`,
          iconURL: ticketChannel.client.user.displayAvatarURL(),
        })
        .setColor("#87CEFA"),
    ],
    components: [row],
  });
}

export async function closeTicket(
  interaction: StringSelectMenuInteraction | ChatInputCommandInteraction,
  reason?: string,
): Promise<void> {
  const ticketChannel = interaction.channel as TextChannel;

  const guildSettings = await getGuildSettings(interaction.guild!.id);

  if (!ticketChannel) {
    throw new Error("Le salon n'existe pas ou est introuvable.");
  }

  if (guildSettings.ticket_log_channel_id) {
    const logChannel = await getOrFetchChannelById(
      interaction.guild!,
      guildSettings.ticket_log_channel_id,
    );

    let transcriptAttachment;
    let transcriptMessage;

    if (logChannel && logChannel.isTextBased()) {
      if (guildSettings.ticket_transcript_channel_id) {
        const transcriptChannel = await getOrFetchChannelById(
          interaction.guild!,
          guildSettings.ticket_transcript_channel_id,
        );

        if (transcriptChannel && transcriptChannel.isTextBased()) {
          transcriptAttachment = await discordTranscripts.createTranscript(
            ticketChannel,
            {
              filename: "transcript.html", // Only valid with returnType is 'attachment'. Name of attachment.
              footerText: "Exported {number} message{s}", // Change text at footer, don't forget to put {number} to show how much messages got exported, and {s} for plural
              poweredBy: false, // Whether to include the "Powered by discord-html-transcripts" footer
            },
          );
          transcriptMessage = await transcriptChannel.send({
            files: [transcriptAttachment],
          });
        }
      }

      const topic = ticketChannel.topic || ""; // Assure que le topic existe
      const userId = topic.split("|").pop()?.trim();

      // Vérification de l'ID utilisateur
      if (!userId || !/^\d+$/.test(userId)) {
        throw new Error("ID d'utilisateur invalide trouvé dans le topic.");
      }

      // Extraction du type de ticket à partir du nom du canal
      const channelName = ticketChannel.name || ""; // Assure que le nom du canal existe
      let ticketType = "Inconnu"; // Valeur par défaut

      // Vérification si le nom du canal contient un tiret
      if (channelName.includes("-")) {
        [ticketType] = channelName.split("-"); // Utilise la destructuration de tableau pour récupérer la partie avant le tiret
      }

      // Mise en majuscule de la première lettre
      const formattedTicketType =
        ticketType.charAt(0).toUpperCase() + ticketType.slice(1);

      const formatDate = (date: Date) => {
        const day = String(date.getDate()).padStart(2, "0"); // Jour
        const month = String(date.getMonth() + 1).padStart(2, "0"); // Mois (0-11 donc on ajoute 1)
        const year = String(date.getFullYear()).slice(-2); // Année (derniers 2 chiffres)
        const hours = String(date.getHours()).padStart(2, "0"); // Heures
        const minutes = String(date.getMinutes()).padStart(2, "0"); // Minutes
        const seconds = String(date.getSeconds()).padStart(2, "0"); // Secondes

        return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
      };

      // Créer les champs de l'embed
      const embedFields = [
        { name: "Ticket de", value: `<@${userId}>`, inline: true },
        { name: " ", value: " ", inline: true }, // Ligne vide
        {
          name: "Fermé par",
          value: `<@${interaction.member!.user.id}>`,
          inline: true,
        },
        {
          name: "Type de ticket",
          value: `\`${formattedTicketType}\``,
          inline: true,
        },
        { name: " ", value: " ", inline: true }, // Ligne vide
        {
          name: "Date d'ouverture",
          value: `\`${formatDate(ticketChannel.createdAt)}\``, // Formatée
          inline: true,
        },
        { name: " ", value: " ", inline: true }, // Ligne vide
        {
          name: "Date de fermeture",
          value: `\`${formatDate(new Date())}\``, // Utilise la date actuelle pour la fermeture
          inline: true,
        },
      ];

      if (reason) {
        // Push reason into the embedsfield at the third place:
        embedFields.splice(5, 0, {
          name: "Raison fermeture",
          value: `\`${reason}\``,
          inline: true,
        });
      } else {
        // Push reason into the embedsfield at the third place:
        embedFields.splice(5, 0, {
          name: " ",
          value: " ",
          inline: true,
        });
      }

      // Ajout du lien vers le transcript si disponible
      if (transcriptAttachment) {
        embedFields.push({
          name: "Transcript",
          value: `[Clique ici](${transcriptMessage?.attachments.first()?.url})`, // Assure-toi que l'URL est correctement récupérée
          inline: false,
        });
      }

      const logEmbed = new EmbedBuilder()
        .setTitle("📝 | Logs Ticket")
        .setDescription(
          "Un ticket vient d'être fermé. Vous pouvez retrouver toutes les informations ci-dessous.",
        )
        .addFields(embedFields)
        .setFooter({
          text: `© Copyright ${process.env.SERVER_NAME}`,
          iconURL: interaction.client.user.displayAvatarURL(),
        })
        .setTimestamp()
        .setColor("#87CEFA");

      // Envoie le logEmbed dans le canal de log
      await logChannel.send({ embeds: [logEmbed] });
    }
  }

  try {
    await ticketChannel.delete();
  } catch (error) {
    throw new Error(
      "Une erreur est survenue lors de la suppression du ticket.",
    );
  }
}

export async function setupEmbedTicket(
  interaction: ChatInputCommandInteraction,
  type: string,
): Promise<void> {
  const guildSettings = await getGuildSettings(interaction.guild!.id);

  if (
    !type.includes("newsmc") &&
    !type.includes("lzcorp_support") &&
    !type.includes("lzcorp_commande")
  ) {
    sendErrorEmbedWithCountdown(interaction, ["Type de ticket invalide."]);
    return;
  }

  if (!interaction.channel?.isTextBased()) {
    sendErrorEmbedWithCountdown(interaction, [
      "Ce salon n'est pas un salon textuel.",
    ]);
    return;
  }

  const ticketEmbed = new EmbedBuilder();
  const row = new ActionRowBuilder<SelectMenuBuilder>();

  if (type === "newsmc") {
    if (!guildSettings.ticket_category_id) {
      await sendErrorEmbedWithCountdown(interaction, [
        "La catégorie des tickets n'est pas configurée.",
        "Veuillez la configurer avant de continuer.",
        "Utilisez la commande `/settings ticket category` pour configurer la catégorie des tickets.",
      ]);
      return;
    }

    ticketEmbed
      .setTitle("📝 | Ouvrir un ticket")
      .setDescription(
        "Si vous avez des questions ou que vous souhaitez occuper un poste spécifique chez NewsMC, Veuillez ouvrir un ticket à l'aide du menu déroulant ci-dessous.",
      )
      .setFooter({
        text: `© Copyright ${process.env.SERVER_NAME}`,
        iconURL: interaction.client.user.displayAvatarURL(),
      })
      .setColor("#87CEFA");

    const select = new StringSelectMenuBuilder()
      .setCustomId("ticket_newsmc")
      .setPlaceholder("Sélectionnez un type de ticket")
      .addOptions(
        new StringSelectMenuOptionBuilder()
          .setLabel("Support")
          .setDescription("Pour toute question ou demande de renseignement.")
          .setValue("support")
          .setEmoji("❓"),
        new StringSelectMenuOptionBuilder()
          .setLabel("Blacklist")
          .setDescription(
            "Si vous souhaitez signaler et blacklister une personne malveillante",
          )
          .setValue("blacklist")
          .setEmoji("🔒"),
        new StringSelectMenuOptionBuilder()
          .setLabel("Demande de grade")
          .setDescription(
            "Pour les demandes qui ne concernent pas les services de prestation",
          )
          .setValue("grade")
          .setEmoji("🛠️"),
        new StringSelectMenuOptionBuilder()
          .setLabel("Rejoindre une équipe prestataire")
          .setDescription(
            "Si vous souhaitez obtenir un rôle dans un service de prestation",
          )
          .setValue("prestataire")
          .setEmoji("🎓"),
      );

    row.addComponents(select);
  }

  if (type === "lzcorp_commande") {
    if (!guildSettings.ticket_commande_category_id) {
      await sendErrorEmbedWithCountdown(interaction, [
        "La catégorie des tickets commandes n'est pas configurée.",
        "Veuillez la configurer avant de continuer.",
        "Utilisez la commande `/settings ticket category_commande` pour configurer la catégorie des tickets commande.",
      ]);
      return;
    }
    ticketEmbed
      .setTitle("🛒 | Ouvrir un ticket de commande")
      .setDescription(
        "Choissisez l'option souhaitée, en fonction de ce que vous recherchez, nous nous engageons à vous répondre le plus vite possible",
      )
      .setFooter({
        text: `© Copyright ${process.env.SERVER_NAME}`,
        iconURL: interaction.client.user.displayAvatarURL(),
      })
      .setColor("#87CEFA");

    const select = new StringSelectMenuBuilder()
      .setCustomId("ticket_lzcorp_commande")
      .setPlaceholder("Sélectionnez un type de ticket")
      .addOptions(
        new StringSelectMenuOptionBuilder()
          .setLabel("Communication")
          .setDescription("Service de communication")
          .setValue("communication")
          .setEmoji("📢"),
        new StringSelectMenuOptionBuilder()
          .setLabel("Commercial")
          .setDescription("Service de communication")
          .setValue("commercial")
          .setEmoji("💼"),
        new StringSelectMenuOptionBuilder()
          .setLabel("Rédaction")
          .setDescription("Service de communication")
          .setValue("redaction")
          .setEmoji("📝"),
        new StringSelectMenuOptionBuilder()
          .setLabel("Artistique")
          .setDescription("Service artistique")
          .setValue("artistique")
          .setEmoji("🎨"),
      );

    row.addComponents(select);
  }

  if (type === "lzcorp_support") {
    if (!guildSettings.ticket_category_id) {
      await sendErrorEmbedWithCountdown(interaction, [
        "La catégorie des tickets n'est pas configurée.",
        "Veuillez la configurer avant de continuer.",
        "Utilisez la commande `/settings ticket category` pour configurer la catégorie des tickets.",
      ]);
      return;
    }

    ticketEmbed
      .setTitle("📝 | Ouvrir un ticket")
      .setDescription(
        "Choissisez l'option souhaitée, en fonction de ce que vous recherchez, nous nous obligeons de vous répondre le plus vite possible",
      )
      .setFooter({
        text: `© Copyright ${process.env.SERVER_NAME}`,
        iconURL: interaction.client.user.displayAvatarURL(),
      })
      .setColor("#87CEFA");

    const select = new StringSelectMenuBuilder()
      .setCustomId("ticket_lzcorp_support")
      .setPlaceholder("Sélectionnez un type de ticket")
      .addOptions(
        new StringSelectMenuOptionBuilder()
          .setLabel("Support")
          .setDescription("Pour toute question ou demande de renseignement.")
          .setValue("support")
          .setEmoji("❓"),
        new StringSelectMenuOptionBuilder()
          .setLabel("Recrutement")
          .setDescription("Pour intégrer notre équipe freelance")
          .setValue("recrutement")
          .setEmoji("🎓"),
      );

    row.addComponents(select);
  }

  await interaction.channel.send({
    embeds: [ticketEmbed],
    components: [row],
  });
  await sendValidEmbedWithCountdown(interaction, [
    "L'embed pour créer des tickets a été envoyé.",
  ]);
}
