import {
  APIEmbed,
  APIEmbedField,
  EmbedAssetData,
  EmbedBuilder,
} from "discord.js";
import { Schema, model } from "mongoose";

export interface CustomProfil {
  userId: string;
  guildId: string;
  embeds: EmbedBuilder[];
}

const embedDataSchema = new Schema({
  data: { type: Object, required: true },
});

const profilSchema = new Schema<CustomProfil>({
  userId: { type: String, required: true },
  guildId: { type: String, required: true },
  embeds: { type: [embedDataSchema], required: true },
});

// Crée un index unique basé sur l'userId et guildId
profilSchema.index({ userId: 1, guildId: 1 }, { unique: true });

export const ProfilModel = model<CustomProfil>("Profils", profilSchema);
