import { EventOptions } from "../@types/EventOptions";
import { CustomClient } from "./CustomClient";
import type { JobOptions } from "../@types/JobOptions"; // Import the missing JobOptions type

export abstract class BaseJobs {
  client: CustomClient;

  name: string;

  log: boolean;

  description: string;

  schedule: string;

  constructor(client: CustomClient, options: JobOptions) {
    this.client = client;
    this.name = options.name;
    this.description = options.description;
    this.log = options.log;
    this.schedule = options.schedule;
  }

  abstract execute(...args: any): void;
}
