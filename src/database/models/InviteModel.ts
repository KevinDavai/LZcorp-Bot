import { Schema, model } from "mongoose";

export interface CustomInvite {
  code: string;
  guildId: string;
  inviterId: string;
  uses: number;
  invitedUsers: string[];
  isDeleted: boolean;
}

const inviteSchema = new Schema<CustomInvite>({
  code: { type: String, required: true }, // Code d'invitation (non unique)
  guildId: { type: String, required: true }, // ID de la guilde à laquelle l'invitation appartient
  inviterId: { type: String, required: true }, // ID de l'utilisateur qui a créé l'invitation
  uses: { type: Number, default: 0 }, // Nombre d'utilisations de l'invitation
  invitedUsers: [{ type: String }], // Liste des IDs des utilisateurs invités
  isDeleted: { type: Boolean, default: false }, // Si l'invitation a été supprimée
});

export const InviteModel = model<CustomInvite>("Invites", inviteSchema);
