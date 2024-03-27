import { Events } from "discord.js";
import { BaseEvent } from "../structures/BaseEvent";
import { CustomClient } from "../structures/CustomClient";
import { BaseJobs } from "../structures/BaseJobs";
import { Logger } from "../services/Logger";

export class SpawnPokemon extends BaseJobs {
  constructor(client: CustomClient) {
    super(client, {
      name: "SpawnPokemon",
      description: "Try to spawn a pokemon every 10 minutes",
      log: true,
      schedule: "*/5 * * * * *",
    });
  }

  execute() {
    Logger.info("Do something here!");
  }
}
