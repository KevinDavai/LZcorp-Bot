import { Events } from "discord.js";

export type EventOptions = {
  name: Events;
  description: string;
  once: boolean;
};
