import { Events, Guild, Invite } from "discord.js";
import { createGuild } from "database/utils/GuildsUtils";
import {
  createGuildInvite,
  deleteGuildInvite,
} from "database/utils/InviteUtils";
import { CustomClient } from "../../structures/CustomClient";
import { BaseEvent } from "../../structures/BaseEvent";

export class InviteDelete extends BaseEvent {
  constructor(client: CustomClient) {
    super(client, {
      name: Events.InviteDelete,
      description: "InviteDelete Event",
      once: false,
    });
  }

  async execute(invite: Invite) {
    if (!invite.guild) return;

    await deleteGuildInvite(invite.guild.id, invite.code);
  }
}
