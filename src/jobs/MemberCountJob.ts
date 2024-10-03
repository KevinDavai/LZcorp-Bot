import { getGuildSettings } from "database/utils/GuildsUtils";
import { BaseJobs } from "structures/BaseJobs";
import { CustomClient } from "structures/CustomClient";
import { getOrFetchChannelById } from "utils/MessageUtils";

export class MemberCountJob extends BaseJobs {
  constructor(client: CustomClient) {
    super(client, {
      name: "MemberCount",
      description: "Update member COUNT",
      log: false,
      schedule: "*/30 * * * * *",
    });
  }

  async execute(client: CustomClient) {
    client.guilds.cache.forEach(async (guild) => {
      const guildSettings = await getGuildSettings(guild.id);
      const memberCountChannelId = guildSettings.member_count_channel_id;

      if (!memberCountChannelId) return;

      const memberCountChannel = await getOrFetchChannelById(
        guild,
        memberCountChannelId,
      );

      if (!memberCountChannel || !memberCountChannel.isVoiceBased()) return;

      const { memberCount } = guild;
      const formattedCount = memberCount.toLocaleString("fr-FR");

      memberCountChannel.setName(`👥 Membres: ${formattedCount}`);
    });
  }
}
