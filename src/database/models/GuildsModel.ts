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
  welcome_autorole_id?: string;
  logs_channel_id: string;
  role_per_level?: RolePerLevel[];
  levelup_channel_id?: string;
  blacklist_channel_id?: string;
  blacklist_role_id?: string;
  antilink: boolean;
  antispam: boolean;
  antibadwords: boolean;
  antimassmentions: boolean;
  bypass_roles: string[];
  bypass_channels: string[];
  avis_channel_id: string;
  ticket_category_id: string;
  ticket_commande_category_id: string;
  ticket_role_id: string;
  ticket_log_channel_id: string;
  ticket_transcript_channel_id: string;
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
  suggestion_channel_id: { type: String, default: null },
  welcome_channel_id: { type: String, default: null },
  welcome_autorole_id: { type: String, default: null },
  logs_channel_id: { type: String, default: null },
  role_per_level: [rolePerLevelSchema], // Utilisation du sous-schéma
  levelup_channel_id: { type: String, default: null },
  blacklist_channel_id: { type: String, default: null },
  blacklist_role_id: { type: String, default: null },
  antilink: { type: Boolean, default: false },
  antispam: { type: Boolean, default: false },
  antibadwords: { type: Boolean, default: false },
  antimassmentions: { type: Boolean, default: false },
  bypass_roles: { type: [String], default: [] },
  bypass_channels: { type: [String], default: [] },
  avis_channel_id: { type: String, default: null },
  ticket_category_id: { type: String, default: null },
  ticket_commande_category_id: { type: String, default: null },
  ticket_role_id: { type: String, default: null },
  ticket_log_channel_id: { type: String, default: null },
  ticket_transcript_channel_id: { type: String, default: null },
});

// Indexation et validation
guildSchema.index({ "role_per_level.level": 1, _id: 1 }, { unique: true });

export const GuildModel = model<CustomGuild>("Guild", guildSchema);
