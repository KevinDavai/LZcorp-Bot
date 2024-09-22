import { PermissionsBitField } from "discord.js";

export type ButtonOptions = {
  id: string;
  permission?: PermissionsBitField;
  roles?: string[];
};
