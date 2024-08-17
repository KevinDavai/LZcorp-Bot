import { Events } from "discord.js";
import { checkNewGuilds } from "database/utils/GuildsUtils";
import { CustomClient } from "../../structures/CustomClient";
import { BaseEvent } from "../../structures/BaseEvent";

export class Ready extends BaseEvent {
  constructor(client: CustomClient) {
    super(client, {
      name: Events.ClientReady,
      description: "Ready Event",
      once: true,
    });
  }

  async execute() {
    this.client.jobService.startJobs();
    await checkNewGuilds(this.client);
  }
}
