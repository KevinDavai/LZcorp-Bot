import { CustomGiveaway, GiveawayModel } from "database/models/GiveawayModel";
import { ModalSubmitInteraction } from "discord.js";
import NodeCache from "node-cache";

const giveawayCache = new NodeCache({ stdTTL: 1200, checkperiod: 600 });

export async function createNewGiveaway(
  messageId: string,
  startDate: Date,
  endDate: Date,
  channelId: string,
  guildId: string,
  nbWinners: number,
): Promise<void> {
  const newGiveaway = new GiveawayModel({
    messageId,
    startDate,
    endDate,
    channelId,
    guildId,
    participants: [],
    winner: null,
    nbWinners,
  });
  await newGiveaway.save();

  const cacheKey = `${guildId}-${messageId}`;
  giveawayCache.set(cacheKey, newGiveaway);
}

export async function addParticipant(
  messageId: string,
  guildId: string,
  userId: string,
): Promise<CustomGiveaway | null> {
  const updatedGiveaway = await GiveawayModel.findOneAndUpdate<CustomGiveaway>(
    { messageId, guildId },
    { $push: { participants: userId } },
    { new: true },
  );

  const cacheKey = `${guildId}-${messageId}`;
  giveawayCache.set(cacheKey, updatedGiveaway);

  return updatedGiveaway;
}

export async function getGiveaway(messageId: string, guildId: string) {
  const cacheKey = `${guildId}-${messageId}`;
  const cachedGiveaway = giveawayCache.get<CustomGiveaway>(cacheKey);

  if (cachedGiveaway) {
    return cachedGiveaway;
  }

  const giveaway = await GiveawayModel.findOne({ messageId, guildId });

  if (giveaway) {
    giveawayCache.set(cacheKey, giveaway);
  }

  return giveaway;
}

export async function getAllGiveaways() {
  const now = new Date();
  const tenSecondsFromNow = new Date(now.getTime() + 10 * 1000); // 10 secondes à partir de maintenant par sécurité

  const giveaways = await GiveawayModel.find({
    isEnded: false,
    endDate: { $gt: tenSecondsFromNow },
  });

  return giveaways;
}

export async function isParticipant(
  messageId: string,
  guildId: string,
  userId: string,
): Promise<boolean> {
  const giveaway = await getGiveaway(messageId, guildId);

  return giveaway?.participants.includes(userId) || false;
}

export async function deleteGiveaway(messageId: string, guildId: string) {
  await GiveawayModel.findOneAndDelete({ messageId, guildId });
  const cacheKey = `${guildId}-${messageId}`;
  giveawayCache.del(cacheKey);
}

export async function setGiveawayWinners(
  messageId: string,
  guildId: string,
  winners: string[],
) {
  const cacheKey = `${guildId}-${messageId}`;

  // Update the giveaway in the database
  const updatedGiveaway = await GiveawayModel.findOneAndUpdate(
    { messageId, guildId },
    { $set: { winners }, isEnded: true },
    { new: true },
  );

  if (updatedGiveaway) {
    // Update the cache with the new giveaway data
    giveawayCache.set(cacheKey, updatedGiveaway);
  }
}
