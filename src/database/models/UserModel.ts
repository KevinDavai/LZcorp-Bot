import { EmbedAuthorData, EmbedFooterData } from "@discordjs/builders";
import { APIEmbed, APIEmbedField, EmbedAssetData } from "discord.js";
import { Schema, model } from "mongoose";

export interface CustomUser {
  _id: string;
  guildId: string;
  level: number;
  xp: number;
  lastXP: Date | null;
  isBlackListed?: boolean;
  blackListedReason?: string;
  blackListedMessageId?: string;
}

const userSchema = new Schema<CustomUser>({
  _id: { type: String, required: true },
  guildId: { type: String, required: true },
  level: { type: Number, default: 0 },
  xp: { type: Number, default: 0 },
  lastXP: { type: Date, default: null },
  isBlackListed: { type: Boolean, default: false },
  blackListedMessageId: { type: String, default: null },
  blackListedReason: { type: String, default: null },
});

// Crée un index unique basé sur l'id et guildId
userSchema.index({ _id: 1, guildId: 1 }, { unique: true });

export const UserModel = model<CustomUser>("Users", userSchema);
