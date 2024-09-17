import { getAllGiveaways } from "database/utils/GiveawayUtils";
import { updateTimerGiveaway } from "modules/GiveawayModule";
import { CustomClient } from "../structures/CustomClient";
import { BaseJobs } from "../structures/BaseJobs";
import { Logger } from "../services/Logger";

export class GiveawayJob extends BaseJobs {
  constructor(client: CustomClient) {
    super(client, {
      name: "GiveawayJob",
      description: "Update giveaway",
      log: false,
      schedule: "*/5 * * * * *",
    });
  }

  async execute(client: CustomClient) {
    const giveaways = await getAllGiveaways();
    const promises = giveaways.map(async (giveaway) => {
      const guild = client.guilds.cache.get(giveaway.guildId);

      if (!guild) return;

      await updateTimerGiveaway(guild, giveaway);
    });

    await Promise.all(promises);
  }
}
