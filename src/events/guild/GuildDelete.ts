import { Events, Guild } from "discord.js";
import { deleteGuild } from "database/utils/GuildsUtils";
import { CustomClient } from "../../structures/CustomClient";
import { BaseEvent } from "../../structures/BaseEvent";

export class GuildDelete extends BaseEvent {
  constructor(client: CustomClient) {
    super(client, {
      name: Events.GuildDelete,
      description: "GuildDelete Event",
      once: false,
    });
  }

  async execute(guild: Guild) {
    await deleteGuild(this.client, guild);
  }
}
