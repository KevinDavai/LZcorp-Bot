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
} from "discord.js";
import { Logger } from "services/Logger";
import { CustomClient } from "structures/CustomClient";
import Logs from "../lang/logs.json";

export async function sendErrorEmbedWithCountdown(
  interaction:
    | ModalSubmitInteraction
    | ChatInputCommandInteraction
    | CommandInteraction
    | ButtonInteraction,

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
    | ButtonInteraction,
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
        Logger.error(Logs.error.memberByIdNotFound, memberId);
      }
    } catch (error) {
      Logger.error(Logs.error.fetchMemberById, memberId, error);
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
      if (fetchedMessage) {
        message = fetchedMessage;
      } else {
        Logger.error(Logs.error.messageByIdNotFound, messageId);
      }
    } catch (error) {
      Logger.error(Logs.error.fetchMessageById, messageId, error);
    }
  }

  return message;
}
