import { Events, GuildMember, Message, User } from "discord.js";
import { getGuildSettings } from "database/utils/GuildsUtils";
import { createNewSuggestion } from "modules/suggestionModule";
import { addXP, createUser, getUserById } from "database/utils/UserUtils";
import { antiLinkModule } from "modules/AntiLinkModule";
import { antiSpamModule } from "modules/AntiSpamModule";
import { antiBadWordsModule } from "modules/AntiBadWordModule";
import { sendLog } from "utils/MessageUtils";
import {
  deleteMessageLogs,
  updateMemberLogs,
  updateMessageLogs,
  updateUserLogs,
} from "modules/LogsModule";
import { CustomClient } from "../../structures/CustomClient";
import { BaseEvent } from "../../structures/BaseEvent";
import { Logger } from "../../services/Logger";

export class MessageDelete extends BaseEvent {
  constructor(client: CustomClient) {
    super(client, {
      name: Events.MessageDelete,
      description: "MessageDelete Event",
      once: false,
    });
  }

  async execute(message: Message) {
    const guildSettings = await getGuildSettings(message.guild!.id);

    if (guildSettings.suggestion_channel_id) {
      if (message.channel.id === guildSettings.suggestion_channel_id) {
        return;
      }
    }
    deleteMessageLogs(this.client, message);
  }
}
