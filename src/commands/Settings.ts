import {
  ChatInputCommandInteraction,
  PermissionFlagsBits,
  ChannelType,
  Colors,
  EmbedBuilder,
} from "discord.js";
import { CustomClient } from "structures/CustomClient";
import { BaseCommand } from "structures/BaseCommand";
import { SlashCommandBuilder } from "@discordjs/builders";

import {
  addBypassChannelToGuild,
  addBypassRoleToGuild,
  getGuildSettings,
  removeBypassChannelToGuild,
  removeBypassRoleToGuild,
  setAntiBadWord,
  setAntiLink,
  setAntiMassMention,
  setAntiSpam,
  setAutoroleWelcome,
  setAvisChannel,
  setBlackListChannel,
  setBlackListRole,
  setLevelUpChannel,
  setLogsChannel,
  setSuggestionChannel,
  setTicketCategory,
  setTicketCommandeCategory,
  setTicketLogChannel,
  setTicketStaffRole,
  setTranscriptChannel,
  setWelcomeChannel,
  upsertRoleForLevel,
} from "database/utils/GuildsUtils";
import {
  sendErrorEmbedWithCountdown,
  sendValidEmbedWithCountdown,
} from "utils/MessageUtils";
import { setupEmbedTicket } from "modules/TicketModule";

export class Settings extends BaseCommand {
  public constructor(client: CustomClient) {
    super(client, {
      data: new SlashCommandBuilder()
        .setName("settings")
        .setDescription("Modifier les paramètres du serveur")
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addSubcommand((subcommand) =>
          subcommand
            .setName("welcome")
            .setDescription("Changer le channel de bienvenue")
            .addChannelOption((option) =>
              option
                .setName("channel")
                .setDescription("Le channel")
                .addChannelTypes(ChannelType.GuildText)
                .setRequired(true),
            ),
        )
        .addSubcommand((subcommand) =>
          subcommand
            .setName("logs")
            .setDescription("Changer le channel de logs")
            .addChannelOption((option) =>
              option
                .setName("channel")
                .setDescription("Le channel")
                .addChannelTypes(ChannelType.GuildText)
                .setRequired(true),
            ),
        )
        .addSubcommand((subcommand) =>
          subcommand
            .setName("autorole_welcome")
            .setDescription("Changer le role à donner aux nouveaux membres")
            .addRoleOption((option) =>
              option
                .setName("role")
                .setDescription("Le role")
                .setRequired(true),
            ),
        )
        .addSubcommand((subcommand) =>
          subcommand
            .setName("suggestion")
            .setDescription("Changer le channel de suggestion")
            .addChannelOption((option) =>
              option
                .setName("channel")
                .setDescription("Le channel")
                .addChannelTypes(ChannelType.GuildText)
                .setRequired(true),
            ),
        )
        .addSubcommand((subcommand) =>
          subcommand
            .setName("avis")
            .setDescription("Changer le channel des avis")
            .addChannelOption((option) =>
              option
                .setName("channel")
                .setDescription("Le channel")
                .addChannelTypes(ChannelType.GuildText)
                .setRequired(true),
            ),
        )
        .addSubcommandGroup((subcommand) =>
          subcommand
            .setName("level")
            .setDescription("Modifier les paramètres du module level")
            .addSubcommand((sub) =>
              sub
                .setName("role")
                .setDescription(
                  "Définir un rôle à donner à un utilisateur lorsqu'il atteint un certain niveau",
                )
                .addIntegerOption((option) =>
                  option
                    .setName("level")
                    .setDescription("Le niveau")
                    .setRequired(true)
                    .setMaxValue(100)
                    .setMinValue(1),
                )
                .addRoleOption((option) =>
                  option
                    .setName("role")
                    .setDescription("Le rôle à donner")
                    .setRequired(true),
                ),
            )
            .addSubcommand((sub) =>
              sub
                .setName("channel")
                .setDescription(
                  "Changer le channel ou les messages de level up seront envoyés",
                )
                .addChannelOption((option) =>
                  option
                    .setName("channel")
                    .setDescription("Le channel")
                    .addChannelTypes(ChannelType.GuildText)
                    .setRequired(true),
                ),
            ),
        )
        .addSubcommandGroup((subcommand) =>
          subcommand
            .setName("ticket")
            .setDescription("Modifier les paramètres du module ticket")
            .addSubcommand((sub) =>
              sub
                .setName("category")
                .setDescription(
                  "Changer la catégorie où les tickets seront créés",
                )
                .addChannelOption((option) =>
                  option
                    .setName("category")
                    .addChannelTypes(ChannelType.GuildCategory)
                    .setDescription("La catégorie")
                    .setRequired(true),
                ),
            )
            .addSubcommand((sub) =>
              sub
                .setName("category_commande")
                .setDescription(
                  "Changer la catégorie où les tickets commande seront créés",
                )
                .addChannelOption((option) =>
                  option
                    .setName("category")
                    .addChannelTypes(ChannelType.GuildCategory)
                    .setDescription("La catégorie")
                    .setRequired(true),
                ),
            )
            .addSubcommand((sub) =>
              sub
                .setName("setup")
                .setDescription("Poster l'embed pour créer un ticket")
                .addStringOption((option) =>
                  option
                    .setName("type")
                    .setDescription("Type de ticket")
                    .addChoices(
                      { value: "newsmc", name: "NewsMC" },
                      { value: "lzcorp_support", name: "LZCorp Support" },
                      { value: "lzcorp_commande", name: "LZCorp Commande" },
                    )
                    .setRequired(true),
                ),
            )
            .addSubcommand((sub) =>
              sub
                .setName("staff_role")
                .setDescription("Quel rôle peut voir les tickets ?")
                .addRoleOption((option) =>
                  option
                    .setName("role")
                    .setDescription("Le rôle")
                    .setRequired(true),
                ),
            )
            .addSubcommand((sub) =>
              sub
                .setName("logs_channel")
                .setDescription("Changer le channel de logs des tickets")
                .addChannelOption((option) =>
                  option
                    .setName("channel")
                    .setDescription("Le channel")
                    .addChannelTypes(ChannelType.GuildText)
                    .setRequired(true),
                ),
            )
            .addSubcommand((sub) =>
              sub
                .setName("transcript_channel")
                .setDescription("Changer le channel de transcript des tickets")
                .addChannelOption((option) =>
                  option
                    .setName("channel")
                    .setDescription("Le channel")
                    .addChannelTypes(ChannelType.GuildText)
                    .setRequired(true),
                ),
            ),
        )
        .addSubcommandGroup((subcommand) =>
          subcommand
            .setName("blacklist")
            .setDescription("Les channels ou rôles blacklist")
            .addSubcommand((sub) =>
              sub
                .setName("channel")
                .setDescription("Le channel blacklist")
                .addChannelOption((option) =>
                  option
                    .setName("channel")
                    .setDescription("Le channel")
                    .addChannelTypes(
                      ChannelType.GuildText,
                      ChannelType.GuildAnnouncement,
                    )
                    .setRequired(true),
                ),
            )
            .addSubcommand((sub) =>
              sub
                .setName("role")
                .setDescription("Le role blacklist")
                .addRoleOption((option) =>
                  option
                    .setName("role")
                    .setDescription("Le role")
                    .setRequired(true),
                ),
            ),
        )
        .addSubcommand((subcommand) =>
          subcommand
            .setName("antilink")
            .setDescription("Activer/désactiver le module antilink")
            .addBooleanOption((option) =>
              option
                .setName("state")
                .setDescription("Activer ou désactiver le module")
                .setRequired(true),
            ),
        )

        .addSubcommand((subcommand) =>
          subcommand
            .setName("antispam")
            .setDescription("Activer/désactiver le module antispam")
            .addBooleanOption((option) =>
              option
                .setName("state")
                .setDescription("Activer ou désactiver le module")
                .setRequired(true),
            ),
        )
        .addSubcommand((subcommand) =>
          subcommand
            .setName("antibadword")
            .setDescription("Activer/désactiver le module antibadword")
            .addBooleanOption((option) =>
              option
                .setName("state")
                .setDescription("Activer ou désactiver le module")
                .setRequired(true),
            ),
        )
        .addSubcommand((subcommand) =>
          subcommand
            .setName("antimassmention")
            .setDescription("Activer/désactiver le module antimassmention")
            .addBooleanOption((option) =>
              option
                .setName("state")
                .setDescription("Activer ou désactiver le module")
                .setRequired(true),
            ),
        )
        .addSubcommandGroup((subcommand) =>
          subcommand
            .setName("bypassrole")
            .setDescription("Les rôles bypass")
            .addSubcommand((sub) =>
              sub
                .setName("add")
                .setDescription("Ajouter un rôle bypass")
                .addRoleOption((option) =>
                  option
                    .setName("role")
                    .setDescription("Le rôle")
                    .setRequired(true),
                ),
            )
            .addSubcommand((sub) =>
              sub
                .setName("remove")
                .setDescription("Supprimer un rôle bypass")
                .addRoleOption((option) =>
                  option
                    .setName("role")
                    .setDescription("Le rôle")
                    .setRequired(true),
                ),
            ),
        )
        .addSubcommandGroup((subcommand) =>
          subcommand
            .setName("bypasschannel")
            .setDescription("Les channels / catégories à bypass")
            .addSubcommand((sub) =>
              sub
                .setName("add")
                .setDescription("Ajouter un channel/catégorie bypass")
                .addChannelOption((option) =>
                  option
                    .setName("channel")
                    .setDescription("Le channel/catégorie")
                    .addChannelTypes(
                      ChannelType.GuildText,
                      ChannelType.GuildCategory,
                    )
                    .setRequired(true),
                ),
            )
            .addSubcommand((sub) =>
              sub
                .setName("remove")
                .setDescription("Supprimer un channel/catégorie bypass")
                .addChannelOption((option) =>
                  option
                    .setName("channel")
                    .addChannelTypes(
                      ChannelType.GuildText,
                      ChannelType.GuildCategory,
                    )
                    .setDescription("Le channel/catégorie")
                    .setRequired(true),
                ),
            ),
        ),

      cooldown: 1000,
    });
  }

  public async execute(
    interaction: ChatInputCommandInteraction,
  ): Promise<void> {
    const subcommands: Record<string, () => Promise<void>> = {
      welcome: async () => {
        const channel = interaction.options.getChannel("channel");
        if (channel && channel.type === ChannelType.GuildText) {
          await setWelcomeChannel(interaction.guild!, channel.id);
          await sendValidEmbedWithCountdown(interaction, [
            `Le channel de bienvenue est désormais ${channel}`,
          ]);
        } else {
          await sendErrorEmbedWithCountdown(interaction, [
            "Le channel spécifié n'est pas un channel text ou est introuvable.",
          ]);
        }
      },
      logs: async () => {
        const channel = interaction.options.getChannel("channel");
        if (channel && channel.type === ChannelType.GuildText) {
          await setLogsChannel(interaction.guild!, channel.id);
          await sendValidEmbedWithCountdown(interaction, [
            `Le channel de logs est désormais ${channel}`,
          ]);
        } else {
          await sendErrorEmbedWithCountdown(interaction, [
            "Le channel spécifié n'est pas un channel text ou est introuvable.",
          ]);
        }
      },
      autorole_welcome: async () => {
        const role = interaction.options.getRole("role");
        if (role) {
          await setAutoroleWelcome(interaction.guild!, role.id);
          await sendValidEmbedWithCountdown(interaction, [
            `Le role à donner aux nouveaux membres est désormais ${role}`,
          ]);
        } else {
          await sendErrorEmbedWithCountdown(interaction, [
            "Le role spécifié est invalide.",
          ]);
        }
      },
      suggestion: async () => {
        const channel = interaction.options.getChannel("channel");
        if (channel && channel.type === ChannelType.GuildText) {
          await setSuggestionChannel(interaction.guild!, channel.id);
          await sendValidEmbedWithCountdown(interaction, [
            `Le channel de suggestion est désormais ${channel}`,
          ]);
        } else {
          await sendErrorEmbedWithCountdown(interaction, [
            "Le channel spécifié n'est pas un channel text ou est introuvable.",
          ]);
        }
      },
      avis: async () => {
        const channel = interaction.options.getChannel("channel");
        if (channel && channel.type === ChannelType.GuildText) {
          await setAvisChannel(interaction.guild!, channel.id);
          await sendValidEmbedWithCountdown(interaction, [
            `Le channel d'avis est désormais ${channel}`,
          ]);
        } else {
          await sendErrorEmbedWithCountdown(interaction, [
            "Le channel spécifié n'est pas un channel text ou est introuvable.",
          ]);
        }
      },

      antilink: async () => {
        const state = interaction.options.getBoolean("state");
        if (state) {
          await setAntiLink(interaction.guild!, true);
          await sendValidEmbedWithCountdown(interaction, [
            "Le module antilink est désormais activé",
          ]);
        } else {
          await setAntiLink(interaction.guild!, false);
          await sendValidEmbedWithCountdown(interaction, [
            "Le module antilink est désormais désactivé",
          ]);
        }
      },
      antispam: async () => {
        const state = interaction.options.getBoolean("state");
        if (state) {
          await setAntiSpam(interaction.guild!, true);
          await sendValidEmbedWithCountdown(interaction, [
            "Le module antispam est désormais activé",
          ]);
        } else {
          await setAntiSpam(interaction.guild!, false);
          await sendValidEmbedWithCountdown(interaction, [
            "Le module antispam est désormais désactivé",
          ]);
        }
      },
      antibadword: async () => {
        const state = interaction.options.getBoolean("state");
        if (state) {
          await setAntiBadWord(interaction.guild!, true);
          await sendValidEmbedWithCountdown(interaction, [
            "Le module antibadword est désormais activé",
          ]);
        } else {
          await setAntiBadWord(interaction.guild!, false);
          await sendValidEmbedWithCountdown(interaction, [
            "Le module antibadword est désormais désactivé",
          ]);
        }
      },
      antimassmention: async () => {
        const state = interaction.options.getBoolean("state");
        if (state) {
          await setAntiMassMention(interaction.guild!, true);
          await sendValidEmbedWithCountdown(interaction, [
            "Le module antimassmention est désormais activé",
          ]);
        } else {
          await setAntiMassMention(interaction.guild!, false);
          await sendValidEmbedWithCountdown(interaction, [
            "Le module antimassmention est désormais désactivé",
          ]);
        }
      },
    };

    const subCommandGroups: Record<
      string,
      Record<string, () => Promise<void>>
    > = {
      blacklist: {
        channel: async () => {
          const channel = interaction.options.getChannel("channel");
          if (channel && channel.type === ChannelType.GuildText) {
            await setBlackListChannel(interaction.guild!, channel.id);
            await sendValidEmbedWithCountdown(interaction, [
              `Le channel blacklist est désormais ${channel}`,
            ]);
          } else {
            await sendErrorEmbedWithCountdown(interaction, [
              "Le channel spécifié n'est pas un channel text ou est introuvable.",
            ]);
          }
        },
        role: async () => {
          const role = interaction.options.getRole("role");
          if (role) {
            await setBlackListRole(interaction.guild!, role.id);
            await sendValidEmbedWithCountdown(interaction, [
              `Le role ${role} sera donné aux utilisateurs blacklistés`,
            ]);
          } else {
            await sendErrorEmbedWithCountdown(interaction, [
              "Le role spécifié est invalide.",
            ]);
          }
        },
      },
      bypassrole: {
        add: async () => {
          const role = interaction.options.getRole("role", true);
          try {
            const guildDb = await getGuildSettings(interaction.guild!.id);
            if (guildDb.bypass_roles.find((r) => role.id === r)) {
              await sendErrorEmbedWithCountdown(interaction, [
                "Le rôle est déjà dans la liste des rôles bypass",
              ]);
              return;
            }

            await addBypassRoleToGuild(interaction.guild!.id, role.id);
            await sendValidEmbedWithCountdown(interaction, [
              "Le rôle a été ajouté à la liste des rôles bypass",
            ]);
          } catch (error) {
            await sendErrorEmbedWithCountdown(interaction, [
              "Une erreur est survenue lors de l'ajout du rôle à la liste des rôles bypass",
            ]);
          }
        },
        remove: async () => {
          const role = interaction.options.getRole("role", true);
          try {
            const guildDb = await getGuildSettings(interaction.guild!.id);
            if (!guildDb.bypass_roles.find((r) => role.id === r)) {
              await sendErrorEmbedWithCountdown(interaction, [
                "Le rôle n'est pas dans la liste des rôles bypass",
              ]);
              return;
            }

            await removeBypassRoleToGuild(interaction.guild!.id, role.id);
            await sendValidEmbedWithCountdown(interaction, [
              "Le rôle a été supprimé de la liste des rôles bypass",
            ]);
          } catch (error) {
            await sendErrorEmbedWithCountdown(interaction, [
              "Une erreur est survenue lors de la suppresion du rôle de la liste des rôles bypass",
            ]);
          }
        },
      },
      bypasschannel: {
        add: async () => {
          const channel = interaction.options.getChannel("channel", true);
          try {
            const guildDb = await getGuildSettings(interaction.guild!.id);
            if (guildDb.bypass_channels.find((c) => channel.id === c)) {
              await sendErrorEmbedWithCountdown(interaction, [
                "Le channel/catégorie est déjà dans la liste des channels bypass",
              ]);
              return;
            }

            await addBypassChannelToGuild(interaction.guild!.id, channel.id);
            await sendValidEmbedWithCountdown(interaction, [
              "Le channel/categorie a été ajouté à la liste des channels bypass",
            ]);
          } catch (error) {
            await sendErrorEmbedWithCountdown(interaction, [
              "Une erreur est survenue lors de l'ajout du channel/categorie à la liste des channel bypass",
            ]);
          }
        },
        remove: async () => {
          const channel = interaction.options.getChannel("channel", true);
          try {
            const guildDb = await getGuildSettings(interaction.guild!.id);
            if (!guildDb.bypass_channels.find((c) => channel.id === c)) {
              await sendErrorEmbedWithCountdown(interaction, [
                "Le channel/catégorie n'est pas dans la liste des channels bypass",
              ]);
              return;
            }

            await removeBypassChannelToGuild(interaction.guild!.id, channel.id);
            await sendValidEmbedWithCountdown(interaction, [
              "Le channel/catégorie a été supprimé de la liste des channels bypass",
            ]);
          } catch (error) {
            await sendErrorEmbedWithCountdown(interaction, [
              "Une erreur est survenue lors de la suppresion du channel/catégorie de la liste des channels bypass",
            ]);
          }
        },
      },
      level: {
        role: async () => {
          const level = interaction.options.getInteger("level");
          const role = interaction.options.getRole("role");
          if (level && role) {
            await upsertRoleForLevel(interaction.guild!.id, level, role.id);
            await sendValidEmbedWithCountdown(interaction, [
              `Le rôle ${role} sera donné aux utilisateurs atteignant le niveau ${level}`,
            ]);
          } else {
            await sendErrorEmbedWithCountdown(interaction, [
              "Le niveau ou le rôle spécifié est invalide.",
            ]);
          }
        },
        channel: async () => {
          const channel = interaction.options.getChannel("channel");
          if (channel && channel.type === ChannelType.GuildText) {
            await setLevelUpChannel(interaction.guild!, channel.id);
            await sendValidEmbedWithCountdown(interaction, [
              `Le channel de level up est désormais ${channel}`,
            ]);
          } else {
            await sendErrorEmbedWithCountdown(interaction, [
              "Le channel spécifié n'est pas un channel text ou est introuvable.",
            ]);
          }
        },
      },
      ticket: {
        category: async () => {
          const category = interaction.options.getChannel("category", true);
          if (category && category.type === ChannelType.GuildCategory) {
            await setTicketCategory(interaction.guild!, category.id);
            await sendValidEmbedWithCountdown(interaction, [
              `La catégorie des tickets est désormais ${category}`,
            ]);
          } else {
            await sendErrorEmbedWithCountdown(interaction, [
              "La catégorie spécifiée n'est pas une catégorie ou est introuvable.",
            ]);
          }
        },
        category_commande: async () => {
          const category = interaction.options.getChannel("category", true);
          if (category && category.type === ChannelType.GuildCategory) {
            await setTicketCommandeCategory(interaction.guild!, category.id);
            await sendValidEmbedWithCountdown(interaction, [
              `La catégorie des tickets commande est désormais ${category}`,
            ]);
          } else {
            await sendErrorEmbedWithCountdown(interaction, [
              "La catégorie spécifiée n'est pas une catégorie ou est introuvable.",
            ]);
          }
        },
        setup: async () => {
          const type = interaction.options.getString("type", true);

          try {
            await setupEmbedTicket(interaction, type);
          } catch (error) {
            await sendErrorEmbedWithCountdown(interaction, [
              "Une erreur est survenue lors de la création de l'embed pour le ticket",
            ]);
          }
        },
        staff_role: async () => {
          const role = interaction.options.getRole("role", true);
          if (role) {
            await setTicketStaffRole(interaction.guild!, role.id);
            await sendValidEmbedWithCountdown(interaction, [
              `Les personnes ayant le rôle ${role} pourront voir les tickets.`,
            ]);
          } else {
            await sendErrorEmbedWithCountdown(interaction, [
              "Le role spécifié est invalide.",
            ]);
          }
        },
        logs_channel: async () => {
          const channel = interaction.options.getChannel("channel", true);
          if (channel && channel.type === ChannelType.GuildText) {
            await setTicketLogChannel(interaction.guild!, channel.id);
            await sendValidEmbedWithCountdown(interaction, [
              `Le channel de logs des tickets est désormais ${channel}`,
            ]);
          } else {
            await sendErrorEmbedWithCountdown(interaction, [
              "Le channel spécifié n'est pas un channel text ou est introuvable.",
            ]);
          }
        },
        transcript_channel: async () => {
          const channel = interaction.options.getChannel("channel", true);
          if (channel && channel.type === ChannelType.GuildText) {
            await setTranscriptChannel(interaction.guild!, channel.id);
            await sendValidEmbedWithCountdown(interaction, [
              `Le channel de transcript des tickets est désormais ${channel}`,
            ]);
          } else {
            await sendErrorEmbedWithCountdown(interaction, [
              "Le channel spécifié n'est pas un channel text ou est introuvable.",
            ]);
          }
        },
      },
    };

    const subcommand = interaction.options.getSubcommand();
    const subCommandGroup = interaction.options.getSubcommandGroup();

    if (subCommandGroup && subCommandGroups[subCommandGroup]?.[subcommand]) {
      await subCommandGroups[subCommandGroup][subcommand]();
    } else if (subcommands[subcommand]) {
      await subcommands[subcommand]();
    } else {
      await sendErrorEmbedWithCountdown(interaction, [
        "Sous commande inconnue",
      ]);
    }
  }
}
