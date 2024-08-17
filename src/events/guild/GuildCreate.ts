import { Events, Guild } from "discord.js";
import { createGuild } from "database/utils/GuildsUtils";
import { CustomClient } from "../../structures/CustomClient";
import { BaseEvent } from "../../structures/BaseEvent";

export class GuildCreate extends BaseEvent {
  constructor(client: CustomClient) {
    super(client, {
      name: Events.GuildCreate,
      description: "GuildCreate Event",
      once: false,
    });
  }

  async execute(guild: Guild) {
    await createGuild(this.client, guild);
  }
}
