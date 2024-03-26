import { Events } from "discord.js";
import { CustomClient } from "../../structures/CustomClient";
import { BaseEvent } from "../../structures/BaseEvent";
import { Logger } from "../../services/Logger";

class Ready extends BaseEvent {
  constructor(client: CustomClient) {
    super(client, {
      name: Events.ClientReady,
      description: "Ready Event",
      once: true,
    });
  }

  execute() {
    this.client.channels.cache.last();
    Logger.info("readyyyy");
  }
}

export { Ready };
