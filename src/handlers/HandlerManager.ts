import { glob } from "glob";
import path from "path";
import {
  ClientEvents,
  Events,
  REST,
  RESTPutAPIApplicationCommandsJSONBody,
  Routes,
} from "discord.js";
import { BaseCommand } from "structures/BaseCommand";
import { CustomClient } from "../structures/CustomClient";
import { BaseEvent } from "../structures/BaseEvent";
import { Logger } from "../services/Logger";

export class HandlerManager {
  private readonly client: CustomClient;

  constructor(client: CustomClient) {
    this.client = client;
  }

  public async loadHandlers(): Promise<void> {
    await this.loadEvents();
    await this.loadCmd();
  }

  private async loadCmd(): Promise<void> {
    Logger.info(this.client.lang.info.loadingCommands);

    const cmdDir = path.resolve(__dirname, "../commands");

    const files = await glob(`${cmdDir}/**/*.{ts,js}`);

    await Promise.all(files.map((file) => this.loadCmdFile(file)));

    // const rest = new REST().setToken(process.env.DISCORD_TOKEN as string);

    // try {
    //   const data = (await rest.put(
    //     Routes.applicationCommands(process.env.DISCORD_CLIENT_ID),
    //     { body: this.client.commands.map((cmd) => cmd.data) },
    //   )) as RESTPutAPIApplicationCommandsJSONBody[];
    // } catch (error) {
    //   Logger.error(this.client.lang.error.loadCommandAPI, error);
    // }
  }

  private async loadCmdFile(file: string): Promise<void> {
    try {
      const filePath = file.replace(/\\/g, "/");

      const importedModule = await import(`@commands/../../${filePath}`);

      await Object.keys(importedModule).forEach((key) => {
        const ExportedClass = importedModule[key];

        if (ExportedClass.prototype instanceof BaseCommand) {
          const command: BaseCommand = new ExportedClass(this.client);

          this.client.commands.set(command.data.name, command);

          Logger.info(this.client.lang.info.loadedCmd, command.data.name);
        }
      });
    } catch (error) {
      Logger.error(this.client.lang.error.loadEventFile, file, error);
    }
  }

  private async loadEvents(): Promise<void> {
    Logger.info(this.client.lang.info.loadingEvents);

    const eventsDir = path.resolve(__dirname, "../events");

    const files = await glob(`${eventsDir}/**/*.{ts,js}`);

    await Promise.all(files.map((file) => this.loadEventFile(file)));
  }

  private async loadEventFile(file: string): Promise<void> {
    try {
      const filePath = file.replace(/\\/g, "/");

      const importedModule = await import(`@events/../../${filePath}`);

      Object.keys(importedModule).forEach((key) => {
        const ExportedClass = importedModule[key];

        if (ExportedClass.prototype instanceof BaseEvent) {
          const event: BaseEvent = new ExportedClass(this.client);

          const execute = (...args: any) => event.execute(...args);
          const eventName: keyof ClientEvents =
            event.name as keyof ClientEvents;

          if (!Object.values(Events).includes(eventName as Events)) {
            throw new Error(`Invalid event name: ${eventName}`);
          }

          if (event.once) this.client.once(eventName, execute);
          else this.client.on(eventName, execute);

          Logger.info(this.client.lang.info.loadedEvent, event.name);
        }
      });
    } catch (error) {
      Logger.error(this.client.lang.error.loadEventFile, file, error);
    }
  }
}
