import { glob } from "glob";
import path from "path";
import { ClientEvents } from "discord.js";
import { pathToFileURL } from "url";
import { CustomClient } from "../structures/CustomClient";
import { BaseEvent } from "../structures/BaseEvent";
import { Logger } from "../services/Logger";

export class HandlerManager {
  private readonly client: CustomClient;

  constructor(client: CustomClient) {
    this.client = client;
  }

  public async loadHandlers(): Promise<void> {
    Logger.info(this.client.lang.info.loadingEvents);
    await this.loadEvents();
  }

  private async loadEvents(): Promise<void> {
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

          if (event.once) this.client.once(eventName, execute);
          else this.client.on(eventName, execute);

          Logger.info(
            this.client.lang.info.loadedEvent.replace("{event}", event.name),
          );
        }
      });
    } catch (error) {
      const errorMessage = this.client.lang.error.loadEventFile.replace(
        "{file}",
        file,
      );
      Logger.error(errorMessage, error);
    }
  }
}
