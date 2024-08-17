import { Schema, model } from "mongoose";

interface Guild {
  _id: string;
  name: string;
  owner_id: string;
}

const guildSchema = new Schema<Guild>({
  _id: { type: String },
  name: { type: String, required: true },
  owner_id: { type: String, required: true },
});

export const GuildModel = model<Guild>("Guild", guildSchema);
