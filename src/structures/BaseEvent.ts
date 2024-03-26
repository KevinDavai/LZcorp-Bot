import { Events } from "discord.js";
import { EventOptions } from "../@types/EventOptions";
import { CustomClient } from "./CustomClient";

export class BaseEvent {
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

  // eslint-disable-next-line class-methods-use-this
  execute(...args: any): void {}
}
