import { CustomGuild } from "database/models/GuildsModel";
import { getOrFetchMemberById, getOrFetchRoleById } from "utils/MessageUtils";
import { Logger } from "services/Logger";
import { ChannelType, Message } from "discord.js";
import logs from "../lang/logs.json";

const linkRegex =
  /(?:https?:\/\/|www\.)[^\s/$.?#].[^\s]*\b|discord\.gg\/[^\s]+/gi;

export async function antiLinkModule(
  message: Message,
  guild: CustomGuild,
): Promise<boolean> {
  // This function will be used to prevent users from sending links in the chat.
  // It will be used in the message event.
  // If the message contains a link, the bot will delete the message and send a warning to the user.
  // The warning will be sent in the form of a direct message.
  const member = await getOrFetchMemberById(message.guild!, message.author.id);

  if (member) {
    if (
      member.roles.cache.some((role) => guild.bypass_roles.includes(role.id))
    ) {
      return false;
    }
  }

  if (guild.bypass_channels.includes(message.channel.id)) return false;
  if (message.channel.type === ChannelType.GuildText) {
    if (
      message.channel.parentId &&
      guild.bypass_channels.includes(message.channel.parentId)
    )
      return false;
  }

  if (linkRegex.test(message.content.toLowerCase())) {
    try {
      message.delete();

      message.author.send(
        "Vous ne pouvez pas partager de liens ici. Votre message a été supprimé.",
      );

      return true;
    } catch (error) {
      Logger.error(logs.error.handleAntiLink, error);
    }
  }

  return false;
}
