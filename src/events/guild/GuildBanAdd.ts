import { Events, GuildBan, GuildMember, Message, User } from "discord.js";
import { getGuildSettings } from "database/utils/GuildsUtils";
import { createNewSuggestion } from "modules/suggestionModule";
import { addXP, createUser, getUserById } from "database/utils/UserUtils";
import { antiLinkModule } from "modules/AntiLinkModule";
import { antiSpamModule } from "modules/AntiSpamModule";
import { antiBadWordsModule } from "modules/AntiBadWordModule";
import { sendLog } from "utils/MessageUtils";
import {
  guildBanAddLogs,
  guildBanRemoveLogs,
  updateUserLogs,
} from "modules/LogsModule";
import { CustomClient } from "../../structures/CustomClient";
import { BaseEvent } from "../../structures/BaseEvent";

export class GuildBanAdd extends BaseEvent {
  constructor(client: CustomClient) {
    super(client, {
      name: Events.GuildBanAdd,
      description: "GuildBanAdd  Event",
      once: false,
    });
  }

  async execute(guildBan: GuildBan) {
    guildBanAddLogs(this.client, guildBan);
  }
}
