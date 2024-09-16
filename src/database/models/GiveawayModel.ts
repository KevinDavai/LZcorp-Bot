import { EmbedAuthorData, EmbedFooterData } from "@discordjs/builders";
import { APIEmbed, APIEmbedField, EmbedAssetData } from "discord.js";
import { Schema, model } from "mongoose";

export interface CustomGiveaway {
  messageId: string;
  startDate: Date;
  endDate: Date;
  channelId: string;
  guildId: string;
  participants: string[];
  winner: string | null;
}

const giveawaySchema = new Schema<CustomGiveaway>({
  messageId: { type: String, required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  channelId: { type: String, required: true },
  guildId: { type: String, required: true },
  participants: { type: [String], default: [] },
  winner: { type: String, default: null },
});

export const GiveawayModel = model<CustomGiveaway>("Giveaways", giveawaySchema);
