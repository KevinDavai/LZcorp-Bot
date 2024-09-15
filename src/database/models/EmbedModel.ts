import { EmbedAuthorData, EmbedFooterData } from "@discordjs/builders";
import { APIEmbed, APIEmbedField, EmbedAssetData } from "discord.js";
import { Schema, model } from "mongoose";

export interface CustomEmbed {
  _id: string;
  guildId: string;
  embedData: JSON;
}

const embedSchema = new Schema<CustomEmbed>({
  _id: { type: String, required: true },
  guildId: { type: String, required: true },
  embedData: { type: Object, required: true },
});

// Crée un index unique basé sur l'id et guildId
embedSchema.index({ _id: 1, guildId: 1 }, { unique: true });

export const EmbedModel = model<CustomEmbed>("Embeds", embedSchema);
