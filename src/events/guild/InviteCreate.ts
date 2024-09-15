import { Events, Guild, Invite } from "discord.js";
import { createGuild } from "database/utils/GuildsUtils";
import { createGuildInvite } from "database/utils/InviteUtils";
import { CustomClient } from "../../structures/CustomClient";
import { BaseEvent } from "../../structures/BaseEvent";

export class InviteCreate extends BaseEvent {
  constructor(client: CustomClient) {
    super(client, {
      name: Events.InviteCreate,
      description: "InviteCreate Event",
      once: false,
    });
  }

  async execute(invite: Invite) {
    if (!invite.guild) return;

    await createGuildInvite(invite.guild.id, invite);
  }
}
