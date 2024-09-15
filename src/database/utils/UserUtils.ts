import { CustomUser, UserModel } from "database/models/UserModel";
import { Guild, EmbedBuilder } from "discord.js";
import NodeCache from "node-cache";
import { Logger } from "services/Logger";
import {
  getOrFetchChannelById,
  getOrFetchMemberById,
  getOrFetchRoleById,
} from "utils/MessageUtils";
import { CustomClient } from "structures/CustomClient";
import Logs from "../../lang/logs.json";
import { getGuildSettings } from "./GuildsUtils";

const userCache = new NodeCache({ stdTTL: 3600, checkperiod: 600 });

export async function createUser(
  userId: string,
  guildId: string,
): Promise<CustomUser> {
  const newUser = new UserModel({
    _id: userId,
    guildId,
    level: 0,
    xp: 0,
  });
  await newUser.save();

  const cacheKey = `${userId}-${guildId}`;
  userCache.set(cacheKey, newUser);

  return newUser;
}

export async function deleteUser(
  userId: string,
  guildId: string,
): Promise<void> {
  await UserModel.findOneAndDelete({ _id: userId, guildId });
  const cacheKey = `${userId}-${guildId}`;
  userCache.del(cacheKey);
}

export async function getUserById(userId: string, guildId: string) {
  try {
    const cacheKey = `${userId}-${guildId}`;

    const userCached = userCache.get<CustomUser>(cacheKey);

    if (userCached) {
      return userCached;
    }

    let user = await UserModel.findOne({ _id: userId, guildId });

    if (!user) {
      user = await UserModel.create({
        _id: userId,
        guildId,
      });
    }

    userCache.set(cacheKey, user);

    return user;
  } catch (error) {
    Logger.error(Logs.error.getUserById, userId, guildId, error);
    throw error;
  }
}

export async function setBlackListedStatus(
  userId: string,
  guildId: string,
  isBlackListed: boolean,
  raison?: string,
  messageId?: string,
): Promise<void> {
  try {
    // Update the user based on the blacklist status
    const updateData = isBlackListed
      ? {
          isBlackListed,
          blackListedReason: raison,
          blackListedMessageId: messageId,
        }
      : { isBlackListed, blackListedReason: null, blackListedMessageId: null };

    // Find the user and update their blacklist status
    const userDetail = await UserModel.findOneAndUpdate(
      { _id: userId, guildId },
      updateData,
      { new: true }, // Return the updated document
    );

    if (userDetail) {
      // Update the cache with the modified user details
      const cacheKey = `${userId}-${guildId}`;
      userCache.set(cacheKey, userDetail);
    }
  } catch (error) {
    Logger.error(Logs.error.setBlacklistedStatus, userId, guildId, error);
    throw error;
  }
}

// Function to add XP and handle leveling up
export async function addXP(
  userDetail: CustomUser,
  xpToAdd: number,
  guild: Guild,
) {
  const XP_TO_LEVEL_UP = (level: number) => Math.round(20 * level + 50);
  const XP_COOLDOWN = 30000; // Temps en millisecondes (ex: 60000ms = 1 minute)

  const customUser = userDetail;

  // Vérifier le cooldown
  const now = new Date().getTime();
  const lastXP = customUser.lastXP ? new Date(customUser.lastXP).getTime() : 0;

  if (now - lastXP < XP_COOLDOWN && userDetail._id !== "644117619514802177") {
    return; // Empêche l'ajout d'XP si l'utilisateur essaie de gagner XP trop rapidement
  }

  // Met à jour l'heure de dernier gain d'XP
  customUser.lastXP = new Date();

  // Met à jour l'XP et vérifie le niveau
  customUser.xp += xpToAdd;

  const xpRequired = XP_TO_LEVEL_UP(customUser.level);

  let levelUp = false;

  if (customUser.xp >= xpRequired) {
    // Le niveau augmente
    levelUp = true;
    customUser.level += 1;
    customUser.xp = 0; // Remise à zéro de l'XP après le niveau

    // Optionnellement, donner un rôle au membre
  }

  // Sauvegarde dans la DB
  await UserModel.findOneAndUpdate(
    { _id: customUser._id, guildId: customUser.guildId },
    { xp: customUser.xp, level: customUser.level, lastXP: customUser.lastXP }, // Inclure lastXP dans la mise à jour
  );

  // Optionnellement, mettre à jour le cache
  const cacheKey = `${customUser._id}-${customUser.guildId}`;
  userCache.set(cacheKey, customUser);

  if (levelUp) {
    await handleLevelUp(guild.client as CustomClient, guild, customUser);
  }
}

// Fonction pour envoyer un message de notification dans le canal de niveau
async function sendLevelUpNotification(
  client: CustomClient,
  channelId: string,
  userId: string,
  level: number,
) {
  const channel = await getOrFetchChannelById(client, channelId);

  if (channel && channel.isTextBased()) {
    const levelUpEmbed = new EmbedBuilder()
      .setTitle("🔔 | Notification - LevelUp !")
      .setDescription(
        `Félicitations à <@${userId}> qui vient de passer au niveau ${level} !`,
      )
      .setColor("#87CEFA");

    await channel.send({ embeds: [levelUpEmbed] });
  } else {
    Logger.error(Logs.error.channelLevelUpNotFound, channelId);
  }
}

// Fonction pour attribuer le rôle au membre
async function assignRoleToMember(
  guild: Guild,
  userId: string,
  level: number,
  roleId: string,
) {
  const role = await getOrFetchRoleById(guild, roleId);
  const member = await getOrFetchMemberById(guild, userId);

  if (member && role) {
    try {
      await member.roles.add(role);
    } catch (error) {
      Logger.error(Logs.error.levelRoleAdd, userId, guild.id, level, error);
    }
  }
}

// Fonction principale pour gérer les niveaux et les rôles
export async function handleLevelUp(
  client: CustomClient,
  guild: Guild,
  customUser: CustomUser,
) {
  const guildSettings = await getGuildSettings(customUser.guildId);

  // Envoyer une notification si le canal est configuré
  if (guildSettings.levelup_channel_id) {
    await sendLevelUpNotification(
      client,
      guildSettings.levelup_channel_id,
      customUser._id,
      customUser.level,
    );
  }

  // Assigner le rôle correspondant au niveau
  if (guildSettings.role_per_level) {
    const roleConfig = guildSettings.role_per_level.find(
      (r) => r.level === customUser.level,
    );

    if (roleConfig) {
      await assignRoleToMember(
        guild,
        customUser._id,
        customUser.level,
        roleConfig.role_id,
      );
    }
  }
}
