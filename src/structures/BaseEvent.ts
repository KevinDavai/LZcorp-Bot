import { Events } from "discord.js";
import { EventOptions } from "../@types/EventOptions";
import { CustomClient } from "./CustomClient";

export abstract class BaseEvent {
  client: CustomClient;

  name: Events;

  description: string;

  once: boolean;

  constructor(client: CustomClient, options: EventOptions) {
    this.client = client;
    this.name = options.name;
    this.description = options.description;
    this.once = options.once;
  }

  abstract execute(...args: any): void;
}
