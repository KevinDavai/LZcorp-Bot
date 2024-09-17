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
  winners: string[] | null;
  nbWinners: number;
  isEnded: boolean;
}

const giveawaySchema = new Schema<CustomGiveaway>({
  messageId: { type: String, required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  channelId: { type: String, required: true },
  guildId: { type: String, required: true },
  participants: { type: [String], default: [] },
  winners: { type: [String], default: null },
  nbWinners: { type: Number, default: 1 },
  isEnded: { type: Boolean, default: false },
});

export const GiveawayModel = model<CustomGiveaway>("Giveaways", giveawaySchema);
