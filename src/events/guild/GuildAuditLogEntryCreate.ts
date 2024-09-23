import {
  ApplicationCommand,
  AutoModerationRule,
  BaseChannel,
  ChannelType,
  EmbedBuilder,
  Emoji,
  Events,
  Guild,
  GuildAuditLogsEntry,
  GuildOnboardingPrompt,
  GuildScheduledEvent,
  Integration,
  Invite,
  Message,
  Role,
  StageInstance,
  Sticker,
  ThreadChannel,
  User,
  Webhook,
} from "discord.js";
import { createGuild, getGuildSettings } from "database/utils/GuildsUtils";
import { getOrFetchChannelById } from "utils/MessageUtils";
import { Logger } from "services/Logger";
import { CustomClient } from "../../structures/CustomClient";
import { BaseEvent } from "../../structures/BaseEvent";

export class GuildAuditLogEntryCreate extends BaseEvent {
  constructor(client: CustomClient) {
    super(client, {
      name: Events.GuildAuditLogEntryCreate,
      description: "GuildAuditLogEntryCreate Event",
      once: false,
    });
  }

  async execute(auditLogEntry: GuildAuditLogsEntry, guild: Guild) {
    const { client } = this;

    try {
      const guildSettings = await getGuildSettings(guild.id);

      if (!guildSettings.logs_channel_id) return;

      const logsChannel = await getOrFetchChannelById(
        guild,
        guildSettings.logs_channel_id,
      );

      if (!logsChannel || logsChannel.type !== ChannelType.GuildText) return;

      const actionType = auditLogEntry.action; // Type d'action
      const { executor } = auditLogEntry; // Utilisateur qui a exécuté l'action
      const reason = auditLogEntry.reason || "Aucune raison fournie"; // Raison de l'entrée
      const { target } = auditLogEntry; // L'entité concernée

      let targetDetails = "Inconnu";

      // Déterminer le type de target
      if (target) {
        if (target instanceof User) {
          targetDetails = `Utilisateur: ${target.tag} (ID: ${target.id})`;
        } else if (target instanceof Role) {
          targetDetails = `Rôle: ${target.name} (ID: ${target.id})`;
        } else if (target instanceof BaseChannel) {
          targetDetails = `Canal: ${target.name} (ID: ${target.id})`;
        } else if (target instanceof Invite) {
          targetDetails = `Invitation: ${target.code}`;
        } else if (target instanceof Webhook) {
          targetDetails = `Webhook: ${target.name}`;
        } else if (target instanceof Emoji) {
          targetDetails = `Émoji: ${target.name}`;
        } else if (target instanceof Message) {
          targetDetails = `Message: ${target.content}`;
        } else if (target instanceof Integration) {
          targetDetails = `Intégration: ${target.name}`;
        } else if (target instanceof StageInstance) {
          targetDetails = `Instance de scène: ${target.id}`;
        } else if (target instanceof Sticker) {
          targetDetails = `Autocollant: ${target.name}`;
        } else if (target instanceof GuildScheduledEvent) {
          targetDetails = `Événement planifié: ${target.name}`;
        } else if (target instanceof ThreadChannel) {
          targetDetails = `Fil: ${target.name}`;
        } else if (target instanceof ApplicationCommand) {
          targetDetails = `Commande d'application: ${target.name}`;
        } else if (target instanceof AutoModerationRule) {
          targetDetails = `Règle d'auto-modération: ${target.name}`;
        } else if (target instanceof GuildOnboardingPrompt) {
          targetDetails = `Invite d'intégration: ${target.id}`;
        } else {
          targetDetails = `Objet avec ID: ${target.id}`;
        }
      }

      const embed = new EmbedBuilder()
        .setTitle("Nouveau Log d'Audit")
        .addFields([
          { name: "Action", value: actionType.toString(), inline: true },
          {
            name: "Exécuté par",
            value: executor ? executor.tag : "Inconnu",
            inline: true,
          },
          { name: "Cible", value: targetDetails, inline: true },
          { name: "Raison", value: reason, inline: false },
          { name: "ID de l'entrée", value: auditLogEntry.id, inline: false },
          {
            name: "Type de cible",
            value: auditLogEntry.targetType,
            inline: false,
          },
          {
            name: "Créé à",
            value: auditLogEntry.createdAt.toISOString(),
            inline: false,
          },
        ])
        .setTimestamp()
        .setFooter({
          text: "© Copyright LZCorp | NewsMC",
          iconURL: client.user!.displayAvatarURL(),
        })
        .setColor("#87CEFA");

      await logsChannel.send({ embeds: [embed] });
    } catch (error) {
      Logger.error(
        "Erreur lors de l’exécution de la journalisation d’audit:",
        error,
      );
    }
  }
}
