import { Events, Message } from "discord.js";
import { getGuildSettings } from "database/utils/GuildsUtils";
import { createNewSuggestion } from "modules/suggestionModule";
import { addXP, createUser, getUserById } from "database/utils/UserUtils";
import { antiLinkModule } from "modules/AntiLinkModule";
import { antiSpamModule } from "modules/AntiSpamModule";
import { antiBadWordsModule } from "modules/AntiBadWordModule";
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

    if (guildSettings.antispam) {
      const isSpam = await antiSpamModule(this.client, message, guildSettings);
      if (isSpam) return;
    }

    if (guildSettings.antibadwords) {
      const badWords = await antiBadWordsModule(message, guildSettings);
      if (badWords) return;
    }

    if (guildSettings.antilink) {
      const containLink = await antiLinkModule(message, guildSettings);
      if (containLink) return;
    }

    if (guildSettings.suggestion_channel_id) {
      if (message.channel.id === guildSettings.suggestion_channel_id) {
        await createNewSuggestion(message, guildSettings.suggestion_channel_id);
        return;
      }
    }

    if (!message.author.id) return;
    await addXP(message.author.id, 10, message.guild);
  }
}
