import { EmbedAuthorData, EmbedFooterData } from "@discordjs/builders";
import { APIEmbed, APIEmbedField, EmbedAssetData } from "discord.js";
import { Schema, model } from "mongoose";

interface Embed {
  _id: string;
  profilOwnerId: string;
  embedData: JSON;
}

const embedSchema = new Schema<Embed>({
  _id: { type: String },
  profilOwnerId: { type: String, required: true },
  embedData: { type: Object, required: true },
});

export const EmbedModel = model<Embed>("Embeds", embedSchema);
