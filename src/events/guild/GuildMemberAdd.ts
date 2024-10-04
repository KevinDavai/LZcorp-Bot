import { Events, Guild, GuildMember } from "discord.js";
import { createGuild, getGuildSettings } from "database/utils/GuildsUtils";
import { giveAutorole, sendWelcomeEmbed } from "modules/welcomeModule";
import { CustomInvite, InviteModel } from "database/models/InviteModel";
import { getGuildInvites } from "database/utils/InviteUtils";
import { inviteModule } from "modules/InvitesModule";
import { guildMemberJoinLogs } from "modules/LogsModule";
import { getOrFetchRoleById } from "utils/MessageUtils";
import { getUserById } from "database/utils/UserUtils";
import { CustomClient } from "../../structures/CustomClient";
import { BaseEvent } from "../../structures/BaseEvent";

export class GuildMemberAdd extends BaseEvent {
  constructor(client: CustomClient) {
    super(client, {
      name: Events.GuildMemberAdd,
      description: "GuildMemberAdd Event",
      once: false,
    });
  }

  async execute(member: GuildMember) {
    const guildSettings = await getGuildSettings(member.guild.id);

    const user = await getUserById(member.user.id, member.guild.id);
    if (user && user.isBlackListed === true) {
      const blacklistRole = await getOrFetchRoleById(
        member.guild!,
        guildSettings.blacklist_role_id!,
      );

      if (!blacklistRole) return;

      member.roles.add(blacklistRole);
    }

    guildMemberJoinLogs(this.client, member);

    await inviteModule(member);

    if (guildSettings.welcome_channel_id) {
      await sendWelcomeEmbed(member, guildSettings.welcome_channel_id);
    }

    if (guildSettings.welcome_autorole_id) {
      await giveAutorole(member, guildSettings.welcome_autorole_id);
    }
  }
}
