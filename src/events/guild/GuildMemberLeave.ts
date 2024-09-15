import { Events, Guild, GuildMember } from "discord.js";
import { createGuild, getGuildSettings } from "database/utils/GuildsUtils";
import { sendWelcomeEmbed } from "modules/welcomeModule";
import { InviteModel } from "database/models/InviteModel";
import {
  deleteUserFromInvite,
  getGuildInvites,
} from "database/utils/InviteUtils";
import { CustomClient } from "../../structures/CustomClient";
import { BaseEvent } from "../../structures/BaseEvent";

export class GuildMemberRemove extends BaseEvent {
  constructor(client: CustomClient) {
    super(client, {
      name: Events.GuildMemberRemove,
      description: "GuildMemberRemove Event",
      once: false,
    });
  }

  async execute(member: GuildMember) {
    await deleteUserFromInvite(member.user.id);
  }
}
