import { Events, Message } from "discord.js";
import { getGuildSettings } from "database/utils/GuildsUtils";
import { createNewSuggestion } from "modules/suggestionModule";
import { addXP, createUser, getUserById } from "database/utils/UserUtils";
import { CustomClient } from "../../structures/CustomClient";
import { BaseEvent } from "../../structures/BaseEvent";
import { Logger } from "../../services/Logger";

export class MessageCreate extends BaseEvent {
  constructor(client: CustomClient) {
    super(client, {
      name: Events.MessageCreate,
      description: "MessageCreate Event",
      once: false,
    });
  }

  async execute(message: Message) {
    if (message.author.bot) return;
    if (!message.guild) return;

    const guildSettings = await getGuildSettings(message.guild.id);

    if (guildSettings.suggestion_channel_id) {
      if (message.channel.id === guildSettings.suggestion_channel_id) {
        await createNewSuggestion(message, guildSettings.suggestion_channel_id);
      }
    }

    const userDetail = await getUserById(message.author.id, message.guild.id);

    addXP(userDetail, 10, message.guild);
  }
}
