import { Events } from "discord.js";
import { checkNewGuilds } from "database/utils/GuildsUtils";
import { checkNewInvite } from "database/utils/InviteUtils";
import { loadGiveaways } from "modules/GiveawayModule";
import { generateProfiles } from "database/utils/ProfilModel";
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
    await checkNewGuilds(this.client);
    await checkNewInvite(this.client);
    await loadGiveaways(this.client);

    await this.client.jobService.startJobs();
  }
}
