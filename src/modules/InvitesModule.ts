import { InviteModel } from "database/models/InviteModel";
import {
  addUserToInvite,
  deleteUserFromInvite,
  getGuildInvites,
} from "database/utils/InviteUtils";
import { GuildMember } from "discord.js";

export async function inviteModule(member: GuildMember) {
  const newInvite = await member.guild.invites.fetch();
  const oldInvites = await getGuildInvites(member.guild.id);

  const usedInvite = newInvite.find((i) => {
    const oldInvite = oldInvites.find((oi) => oi.code === i.code);
    if (oldInvite && i.uses !== null) {
      return oldInvite.uses < i.uses;
    }
    return false; // Add a return statement here
  });

  if (usedInvite) {
    await deleteUserFromInvite(member.user.id);

    await addUserToInvite(usedInvite, member.user.id, member.guild.id);
  }
}
