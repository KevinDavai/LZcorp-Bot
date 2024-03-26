import { Events, Message } from "discord.js";
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

  execute(message: Message) {
    this.client.channels.cache.last();
    Logger.info(`msg: ${message}`);
  }
}
