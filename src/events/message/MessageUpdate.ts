import { Events, GuildMember, Message, User } from "discord.js";
import { getGuildSettings } from "database/utils/GuildsUtils";
import { createNewSuggestion } from "modules/suggestionModule";
import { addXP, createUser, getUserById } from "database/utils/UserUtils";
import { antiLinkModule } from "modules/AntiLinkModule";
import { antiSpamModule } from "modules/AntiSpamModule";
import { antiBadWordsModule } from "modules/AntiBadWordModule";
import { sendLog } from "utils/MessageUtils";
import {
  updateMemberLogs,
  updateMessageLogs,
  updateUserLogs,
} from "modules/LogsModule";
import { CustomClient } from "../../structures/CustomClient";
import { BaseEvent } from "../../structures/BaseEvent";
import { Logger } from "../../services/Logger";

export class MessageUpdate extends BaseEvent {
  constructor(client: CustomClient) {
    super(client, {
      name: Events.MessageUpdate,
      description: "MessageUpdate Event",
      once: false,
    });
  }

  async execute(oldMessage: Message, newMessage: Message) {
    updateMessageLogs(this.client, oldMessage, newMessage);
  }
}
