import { Schema, model } from "mongoose";

// Interface pour le sous-schéma de rôle par niveau
interface RolePerLevel {
  level: number;
  role_id: string;
}

// Interface pour le schéma de guilde
export interface CustomGuild {
  _id: string;
  name: string;
  owner_id: string;
  suggestion_channel_id?: string;
  welcome_channel_id?: string;
  role_per_level?: RolePerLevel[];
  levelup_channel_id?: string;
  blacklist_channel_id?: string;
  blacklist_role_id?: string;
}

// Sous-schéma pour les rôles par niveau
const rolePerLevelSchema = new Schema<RolePerLevel>({
  level: { type: Number, required: true },
  role_id: { type: String, required: true },
});

// Schéma principal pour les guildes
const guildSchema = new Schema<CustomGuild>({
  _id: { type: String },
  name: { type: String, required: true },
  owner_id: { type: String, required: true },
  suggestion_channel_id: { type: String },
  welcome_channel_id: { type: String },
  role_per_level: [rolePerLevelSchema], // Utilisation du sous-schéma
  levelup_channel_id: { type: String },
  blacklist_channel_id: { type: String },
  blacklist_role_id: { type: String },
});

// Indexation et validation
guildSchema.index({ "role_per_level.level": 1, _id: 1 }, { unique: true });

export const GuildModel = model<CustomGuild>("Guild", guildSchema);
