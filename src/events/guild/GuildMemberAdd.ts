import { Events, Guild, GuildMember } from "discord.js";
import { createGuild, getGuildSettings } from "database/utils/GuildsUtils";
import { giveAutorole, sendWelcomeEmbed } from "modules/welcomeModule";
import { CustomInvite, InviteModel } from "database/models/InviteModel";
import { getGuildInvites } from "database/utils/InviteUtils";
import { inviteModule } from "modules/InvitesModule";
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

    await inviteModule(member);

    if (guildSettings.welcome_channel_id) {
      await sendWelcomeEmbed(member, guildSettings.welcome_channel_id);
    }

    if (guildSettings.welcome_autorole_id) {
      await giveAutorole(member, guildSettings.welcome_autorole_id);
    }
  }
}
