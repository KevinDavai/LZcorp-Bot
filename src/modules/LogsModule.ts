import { getGuildSettings } from "database/utils/GuildsUtils";
import {
  AuditLogEvent,
  ChannelType,
  GuildBan,
  GuildMember,
  Message,
  User,
} from "discord.js";
import { CustomClient } from "structures/CustomClient";
import { sendLog } from "utils/MessageUtils";

async function isLogsEnabled(guildId: string) {
  const guildSettings = await getGuildSettings(guildId);

  return guildSettings.logs_channel_id !== null;
}

function sleep(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function kickCheck(member: GuildMember) {
  const fetchedLogs = await member.guild.fetchAuditLogs({
    limit: 1,
    type: AuditLogEvent.MemberKick,
  });
  // Since we only have 1 audit log entry in this collection, we can simply grab the first one
  const kickLog = fetchedLogs.entries.first();

  // Let's perform a sanity check here and make sure we got *something*
  if (!kickLog) return {};

  // We now grab the user object of the person who kicked our member
  // Let us also grab the target of this action to double check things
  const { executor, target } = kickLog;

  if (kickLog.createdAt < member.joinedAt!) {
    return {};
  }

  // And now we can update our output with a bit more information
  // We will also run a check to make sure the log we got was for the same kicked member
  if (target!.id === member.id) {
    const Info = {
      user: target!.username,
      id: target!.id,
      kickedby: executor!.username,
      reason: kickLog.reason,
    };
    return Info;
  }
  return {};
}

export function deleteMessageLogs(client: CustomClient, message: Message) {
  if (!message || message.partial) return;
  if (typeof message.author === "undefined") return;
  if (!message.guild) return;
  if (message.author && message.author.bot === true) return;

  if (!isLogsEnabled(message.guild.id)) return;

  // validate if it's from a guild
  const guildid = message.guildId || false;
  if (!guildid) return;

  if (message.author && message.author.bot === true) return;

  const guild = client.guilds.cache.find((val) => val.id === guildid);
  const channelid = message.channelId || false;
  if (!channelid) return;

  if (message.channel && message.channel.type !== ChannelType.GuildText) return;
  const embed = {
    description: `
**Autheur : ** <@${message.author.id}> - *${message.author.tag}*
**Date : ** ${message.createdAt}
**Channel : ** <#${message.channel.id}> - *${message.channel.name}*

**Deleted Message : **
\`\`${message.content.replace(/`/g, "'")}\`\`

**Attachment URL : **
${message.attachments.map((x) => x.proxyURL)}

`,
    image: {
      url: message.attachments.map((x) => x.proxyURL)[0],
    },
    color: 16711680,
    timestamp: new Date(),
    footer: {
      text: `
            Supprimé: `,
    },
    author: {
      name: `
            Message supprimé `,
    },
  };
  if (message && message.member && typeof message.member.guild === "object") {
    sendLog(client, message.member.guild, embed as any);
  } else {
    console.error(`
            Module: $ {
                description.name
            } | messageDelete - ERROR - member guild id couldn 't be retrieved`);
    console.error("author", message.author);
    console.error("member", message.member);
    console.error("content", message.content);
  }
}

export function updateMessageLogs(
  client: CustomClient,
  oldMessage: Message,
  newMessage: Message,
) {
  if (oldMessage.guild && !isLogsEnabled(oldMessage.guild.id)) return;

  if (oldMessage.author.bot) return;
  if (oldMessage.channel.type !== ChannelType.GuildText) return;
  if (newMessage.channel.type !== ChannelType.GuildText) return;

  if (oldMessage.content === newMessage.content) return;

  const embed = {
    description: `
**Autheur : ** <@${newMessage.member!.user.id}> - *${newMessage.member!.user.tag}*
**Date : ** ${newMessage.createdAt}
**Channel : ** <#${newMessage.channel.id}> - *${newMessage.channel.name}*

**Message original : **
\`\`${oldMessage.content.replace(/`/g, "'")}\`\`
**Message modifié : **\`\`${newMessage.content.replace(/`/g, "'")}\`\`
`,
    color: 16737792,
    timestamp: new Date(),
    footer: {
      text: "Edition : ",
    },
    author: {
      name: "Message Edité",
    },
  };
  sendLog(client, newMessage.member!.guild, embed as any);
}

export function guildMemberJoinLogs(client: CustomClient, member: GuildMember) {
  if (!isLogsEnabled(member.guild.id)) return;

  const embed = {
    description: `<@${member.user.id}> - *${member.user.id}*\nUtilisateur crée le: ${new Date(member.user.createdTimestamp).toDateString()}`,
    url: member.user.displayAvatarURL(),
    color: 65280,
    timestamp: new Date(),
    footer: {
      text: `${member.nickname || member.user.username}`,
    },
    thumbnail: {
      url: member.user.displayAvatarURL(),
    },
    author: {
      name: `Utilisateur rejoint : ${member.user.tag}`,
    },
  };
  sendLog(client, member.guild, embed as any);
}
export async function guildMemberLeft(
  client: CustomClient,
  member: GuildMember,
) {
  if (!isLogsEnabled(member.guild.id)) return;

  await sleep(5000);
  const embed: any = await kickCheck(member).then((MEMBER_KICK_INFO: any) => {
    if (Object.keys(MEMBER_KICK_INFO).length !== 0) {
      // User was kicked
      return {
        description: `<@${member.user.id}> - *${member.user.id}*`,
        url: member.user.displayAvatarURL(),
        color: 16748544,
        timestamp: new Date(),
        footer: {
          text: `${member.nickname || member.user.username}`,
        },
        thumbnail: {
          url: member.user.displayAvatarURL(),
        },
        author: {
          name: `Utilisateur Kick : ${member.user.tag}`,
        },
        fields: [
          {
            name: "Nickname",
            value: `**${member.nickname || member.user.username}**`,
            inline: false,
          },
          {
            name: "Kick par",
            value: `${MEMBER_KICK_INFO.kickedby}`,
            inline: false,
          },
          {
            name: "Raison",
            value: `${MEMBER_KICK_INFO.reason}`,
            inline: false,
          },
        ],
      };
    }
    return {
      description: `<@${member.user.id}> - *${member.user.id}*`,
      url: member.user.displayAvatarURL(),
      color: 16711680,
      timestamp: new Date(),
      footer: {
        text: `${member.nickname || member.user.username}`,
      },
      thumbnail: {
        url: member.user.displayAvatarURL(),
      },
      author: {
        name: `Utilisateur leave : ${member.user.tag}`,
      },
      fields: [
        {
          name: "Nickname",
          value: `**${member.nickname || member.user.username}**`,
          inline: true,
        },
      ],
    };
  });

  sendLog(client, member.guild, embed as any);
}

export function guildBanAddLogs(client: CustomClient, guildBan: GuildBan) {
  if (!isLogsEnabled(guildBan.guild.id)) return;

  const banuser = guildBan.user;

  const embed = {
    description: `<@${banuser.id}> - *${banuser.id}*`,
    url: banuser.displayAvatarURL(),
    color: 16711901,
    timestamp: new Date(),
    footer: {
      text: `${banuser.username}`,
    },
    thumbnail: {
      url: banuser.displayAvatarURL(),
    },
    author: {
      name: `Utilisateur Banni : ${banuser.tag}`,
    },
  };
  sendLog(client, guildBan.guild, embed as any);
}

export function guildBanRemoveLogs(client: CustomClient, guildBan: GuildBan) {
  if (!isLogsEnabled(guildBan.guild.id)) return;

  const banuser = guildBan.user;
  const embed = {
    description: `<@${banuser.id}> - *${banuser.id}*`,
    url: banuser.displayAvatarURL(),
    color: 16776960,
    timestamp: new Date(),
    footer: {
      text: `${banuser.username}`,
    },
    thumbnail: {
      url: banuser.displayAvatarURL(),
    },
    author: {
      name: `Utilisateur débanni : ${banuser.tag}`,
    },
  };
  sendLog(client, guildBan.guild, embed as any);
}

export function updateMemberLogs(
  client: CustomClient,
  oldMember: GuildMember,
  newMember: GuildMember,
) {
  if (!isLogsEnabled(oldMember.guild.id)) return;

  if (oldMember.nickname !== newMember.nickname) {
    const embed = {
      description: `<@${newMember.user.id}> - *${newMember.user.id}*`,
      url: newMember.user.displayAvatarURL(),
      color: 29372,
      timestamp: new Date(),
      footer: {
        text: `${newMember.nickname || newMember.user.username}`,
      },
      thumbnail: {
        url: newMember.user.displayAvatarURL(),
      },
      author: {
        name: `Modification de nickname: ${newMember.user.tag}`,
      },
      fields: [
        {
          name: "Ancien Nickname",
          value: `**${oldMember.nickname || oldMember.user.username}**`,
          inline: true,
        },
        {
          name: "Nouveau Nickname",
          value: `**${newMember.nickname || newMember.user.username}**`,
          inline: true,
        },
      ],
    };
    // console.log(embed)
    sendLog(client, newMember.guild, embed as any);
  }

  const oldMemberRoles = oldMember.roles.cache;
  const newMemberRoles = newMember.roles.cache;

  const rolechanged = newMemberRoles.difference(oldMemberRoles);

  if (rolechanged.size !== 0) {
    // const oldRoles = oldMemberRoles.filter(x => !options.excludedroles.includes(x)).filter(x => !newMemberRoles.cache.includes(x))
    // const newRoles = newMemberRoles.filter(x => !options.excludedroles.includes(x)).filter(x => !oldMemberRoles.cache.includes(x))

    let roleadded = "";
    let roleremoved = "";

    rolechanged.forEach((key) => {
      if (newMemberRoles.has(key.id)) {
        roleadded += `<@&${key.id}>`;
      } else {
        roleremoved += `<@&${key.id}>`;
      }
    });

    const embed = {
      description: `<@${newMember.user.id}> - *${newMember.user.id}*`,
      url: newMember.user.displayAvatarURL(),
      color: 29372,
      timestamp: new Date(),
      footer: {
        text: `${newMember.nickname || newMember.user.username}`,
      },
      thumbnail: {
        url: newMember.user.displayAvatarURL(),
      },
      author: {
        name: `Modification de Roles: ${newMember.user.tag}`,
      },
      fields: [
        {
          name: "Roles retirés:",
          value: `**${roleremoved} **`,
          inline: true,
        },
        {
          name: "Roles ajoutés: ",
          value: `**${roleadded} **`,
          inline: true,
        },
      ],
    };
    sendLog(client, newMember.guild, embed as any);
  }
}

export function updateUserLogs(
  client: CustomClient,
  oldUser: User,
  newUser: User,
) {
  // Log quand le user change de username (et possiblement discriminator)
  let usernameChangedMsg: any = null;
  let discriminatorChangedMsg: any = null;
  let avatarChangedMsg: any = null;

  // search the member from all guilds, since the userUpdate event doesn't provide guild information as it is a global event.
  client.guilds.cache.forEach((guild) => {
    guild.members.cache.forEach((member) => {
      if (newUser.id === member.id) {
        if (!isLogsEnabled(guild.id)) return;
        // let member = bot.guilds.get(guildid).members.get(member.id)
        console.log(oldUser.displayName, newUser.displayName);
        // USERNAME CHANGED V14
        if (oldUser.displayName !== newUser.displayName) {
          usernameChangedMsg = {
            description: `<@${newUser.id}> - *${newUser.id}*`,
            url: newUser.displayAvatarURL(),
            color: 29372,
            timestamp: new Date(),
            footer: {
              text: `${member.nickname || member.user.displayName}`,
            },
            thumbnail: {
              url: newUser.displayAvatarURL(),
            },
            author: {
              name: `Modification de pseudo: ${newUser.tag}`,
            },
            fields: [
              {
                name: "Ancien Pseudo",
                value: `**${oldUser.displayName}**`,
                inline: true,
              },
              {
                name: "Nouveau Pseudo",
                value: `**${newUser.displayName}**`,
                inline: true,
              },
            ],
          };
        }

        // DISCRIMINATOR CHANGED V14
        if (oldUser.discriminator !== newUser.discriminator) {
          discriminatorChangedMsg = {
            description: `<@${newUser.id}> - *${newUser.id}*`,
            url: newUser.displayAvatarURL(),
            color: 29372,
            timestamp: new Date(),
            footer: {
              text: `${member.nickname || member.user.displayName}`,
            },
            thumbnail: {
              url: newUser.displayAvatarURL(),
            },
            author: {
              name: `Modification du discriminateur: ${newUser.tag}`,
            },
            fields: [
              {
                name: "Ancien Discriminateur",
                value: `**${oldUser.discriminator}**`,
                inline: true,
              },
              {
                name: "Nouveau Discriminateur",
                value: `**${newUser.discriminator}**`,
                inline: true,
              },
            ],
          };
        }

        // AVATAR CHANGED V14
        if (oldUser.avatar !== newUser.avatar) {
          avatarChangedMsg = {
            description: `<@${newUser.id}> - *${newUser.id}*`,
            url: newUser.displayAvatarURL(),
            color: 29372,
            timestamp: new Date(),
            footer: {
              text: `${member.nickname || member.user.displayName}`,
            },
            thumbnail: {
              url: newUser.displayAvatarURL(),
            },
            author: {
              name: `Modification d'avatar: ${newUser.tag}`,
            },
            image: {
              url: oldUser.displayAvatarURL(),
            },
            fields: [
              {
                name: "Ancien avatar",
                value: ":arrow_down:",
              },
            ],
          };
        }

        if (usernameChangedMsg) sendLog(client, guild, usernameChangedMsg);
        if (discriminatorChangedMsg)
          sendLog(client, guild, discriminatorChangedMsg);
        if (avatarChangedMsg) sendLog(client, guild, avatarChangedMsg);
      }
    });
  });
}
