// eslint-disable-next-line eslint-comments/disable-enable-pair
/* eslint-disable no-param-reassign */
// utils/MessageUtils.ts
import {
  EmbedBuilder,
  ModalSubmitInteraction,
  ChatInputCommandInteraction,
  Channel,
  CommandInteraction,
  Guild,
  Role,
  GuildMember,
  ButtonInteraction,
  StringSelectMenuInteraction,
  GuildBasedChannel,
  ChannelType,
  PermissionsBitField,
  PermissionFlagsBits,
  APIEmbed,
} from "discord.js";
import { Logger } from "services/Logger";
import { CustomClient } from "structures/CustomClient";
import { get } from "mongoose";
import { getGuildSettings } from "database/utils/GuildsUtils";
import Logs from "../lang/logs.json";

export async function sendErrorEmbedWithCountdown(
  interaction:
    | ModalSubmitInteraction
    | ChatInputCommandInteraction
    | CommandInteraction
    | ButtonInteraction
    | StringSelectMenuInteraction,

  errors: string[],
): Promise<void> {
  const countdownDuration = 10000;
  let countdown = countdownDuration / 1000;

  const errorEmbed = new EmbedBuilder()
    .setDescription(
      "**Ce message sera supprimé dans** ``" + countdown + "`` **secondes**\n",
    )
    .setColor(0xff0000)
    .addFields({ name: "❌ **Erreurs**", value: `\n ${errors.join("\n")}` });

  await interaction.reply({ embeds: [errorEmbed], ephemeral: true });

  const interval = setInterval(async () => {
    countdown -= 1;
    if (countdown <= 0) {
      clearInterval(interval);
      await interaction.deleteReply();
    } else {
      await interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setDescription(
              "**Ce message sera supprimé dans** ``" +
                countdown +
                "`` **secondes**\n",
            )
            .setColor(0xff0000)
            .setFields(errorEmbed.data.fields ?? []),
        ],
      });
    }
  }, 1000);
}

export async function sendValidEmbedWithCountdown(
  interaction:
    | ModalSubmitInteraction
    | ChatInputCommandInteraction
    | CommandInteraction
    | ButtonInteraction
    | StringSelectMenuInteraction,
  messages: string[],
  edit?: boolean,
): Promise<void> {
  const countdownDuration = 10000;
  let countdown = countdownDuration / 1000;

  const validEmbed = new EmbedBuilder()
    .setDescription(
      "**Ce message sera supprimé dans** ``" + countdown + "`` **secondes**\n",
    )
    .setColor(0xff0000)
    .addFields({
      name: " **✅ Information**",
      value: `\n ${messages.join("\n")}`,
    });

  if (edit) {
    await interaction.editReply({ embeds: [validEmbed], components: [] });
  } else {
    await interaction.reply({ embeds: [validEmbed], ephemeral: true });
  }

  const interval = setInterval(async () => {
    countdown -= 1;
    if (countdown <= 0) {
      clearInterval(interval);
      await interaction.deleteReply();
    } else {
      await interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setDescription(
              "**Ce message sera supprimé dans** ``" +
                countdown +
                "`` **secondes**\n",
            )
            .setColor(0xff0000)
            .setFields(validEmbed.data.fields ?? []),
        ],
      });
    }
  }, 1000);
}

export async function getOrFetchChannelById(
  clientOrGuild: CustomClient | Guild, // Le paramètre peut être un `CustomClient` ou un `Guild`
  channelId: string,
): Promise<Channel | undefined> {
  let channel;

  if (clientOrGuild instanceof Guild) {
    // Si le premier paramètre est une instance de Guild
    channel = clientOrGuild.channels.cache.get(channelId);

    if (!channel) {
      try {
        const fetchedChannel = await clientOrGuild.channels.fetch(channelId);
        if (fetchedChannel) {
          channel = fetchedChannel;
        } else {
          Logger.error(Logs.error.channelByIdNotFound, channelId);
        }
      } catch (error) {
        Logger.error(Logs.error.fetchChannelById, channelId, error);
      }
    }
  } else if (clientOrGuild instanceof CustomClient) {
    // Si le premier paramètre est une instance de CustomClient
    channel = clientOrGuild.channels.cache.get(channelId);

    if (!channel) {
      try {
        const fetchedChannel = await clientOrGuild.channels.fetch(channelId);
        if (fetchedChannel) {
          channel = fetchedChannel;
        } else {
          Logger.error(Logs.error.channelByIdNotFound, channelId);
        }
      } catch (error) {
        Logger.error(Logs.error.fetchChannelById, channelId, error);
      }
    }
  }

  return channel;
}

export async function getOrFetchCategoryById(
  guild: Guild, // Le paramètre peut être un `CustomClient` ou un `Guild`
  categoryId: string,
): Promise<GuildBasedChannel | undefined> {
  // Si le premier paramètre est une instance de Guild
  let category = guild.channels.cache.get(categoryId);

  if (!category) {
    try {
      const fetchedCategory = await guild.channels.fetch(categoryId);
      if (fetchedCategory) {
        category = fetchedCategory;
      } else {
        Logger.error(Logs.error.channelByIdNotFound, categoryId);
      }
    } catch (error) {
      Logger.error(Logs.error.fetchChannelById, categoryId, error);
    }
  }

  return category;
}

export async function getOrFetchRoleById(
  guild: Guild,
  roleId: string,
): Promise<Role | undefined> {
  let role = guild.roles.cache.get(roleId);

  if (!role) {
    // Le role n'est pas dans le cache, on va donc le récupérer depuis l'API Discord
    try {
      const fetchedRole = await guild.roles.fetch(roleId);
      if (fetchedRole) {
        role = fetchedRole;
      } else {
        Logger.error(Logs.error.roleByIdNotFound, roleId);
      }
    } catch (error) {
      Logger.error(Logs.error.fetchRoleById, roleId, error);
    }
  }

  return role;
}

export async function getOrFetchMemberById(
  guild: Guild,
  memberId: string,
): Promise<GuildMember | undefined> {
  let member = guild.members.cache.get(memberId);

  if (!member) {
    // Le role n'est pas dans le cache, on va donc le récupérer depuis l'API Discord
    try {
      const fetchedMember = await guild.members.fetch(memberId);
      if (fetchedMember) {
        member = fetchedMember;
      } else {
        return undefined;
      }
    } catch (error) {
      return undefined;
    }
  }

  return member;
}

export async function getOrFetchMessageById(
  channel: Channel,
  messageId: string,
) {
  if (!channel.isTextBased()) {
    Logger.error(Logs.error.channelIsNotTextBased, channel.id);
    throw new Error(Logs.error.channelIsNotTextBased);
  }

  let message = channel.messages.cache.get(messageId);

  if (!message) {
    // Le message n'est pas dans le cache, on va donc le récupérer depuis l'API Discord
    try {
      const fetchedMessage = await channel.messages.fetch(messageId);
      if (fetchedMessage) message = fetchedMessage;
    } catch (error) {
      return undefined;
    }
  }

  return message;
}

export async function sendLog(
  client: CustomClient,
  guild: Guild,
  msg: string,
  isMessageLog = false,
  isLeaveLog = false,
) {
  let embed: EmbedBuilder | null = null;

  // if (debug) console.log(`Module: ${description.name} | send - computed options:`, options)

  const guildSettings = await getGuildSettings(guild.id);

  let channel;

  if (isMessageLog) {
    channel = await getOrFetchChannelById(
      guild,
      guildSettings.message_log_channel_id,
    );
  }

  if (isLeaveLog) {
    channel = await getOrFetchChannelById(
      guild,
      guildSettings.leave_log_channel_id,
    );
  }

  if (!channel) {
    channel = await getOrFetchChannelById(guild, guildSettings.logs_channel_id);
  }

  if (channel && channel.type === ChannelType.GuildText) {
    const bot = channel.guild.members.me;

    if (!bot) {
      Logger.error(
        `The Bot is not in the server "${guild.name}" (${guild.id})`,
      );
      return;
    }

    if (channel.permissionsFor(bot).has(PermissionFlagsBits.SendMessages)) {
      if (typeof msg === "object") {
        // Embed
        if (channel.permissionsFor(bot).has(PermissionFlagsBits.EmbedLinks)) {
          embed = msg;
          channel
            .send({
              embeds: [embed as APIEmbed],
            })
            .catch(console.error);
        } else {
          Logger.error(
            `The Bot doesn't have the permission EMBED_LINKS to the configured channel "${channel.name}" on server "${guild.name}" (${guild.id})`,
          );
        }
      } else {
        // Send the Message
        channel.send(msg).catch(console.error);
      }
    } else {
      Logger.error(
        `The Bot doesn't have the permission to send public message to the configured channel "${channel.name}" on server "${guild.name}" (${guild.id})`,
      );
    }
  }
}
