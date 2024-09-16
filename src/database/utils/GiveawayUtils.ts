import { GiveawayModel } from "database/models/GiveawayModel";
import { ModalSubmitInteraction } from "discord.js";

export async function createNewGiveaway(
  messageId: string,
  startDate: Date,
  endDate: Date,
  channelId: string,
  guildId: string,
): Promise<void> {
  const newGiveaway = new GiveawayModel({
    messageId,
    startDate,
    endDate,
    channelId,
    guildId,
    participants: [],
    winner: null,
  });
  await newGiveaway.save();
}
