import { glob } from "glob";
import path from "path";
import { Base, ClientEvents } from "discord.js";
import { CustomClient } from "../structures/CustomClient";
import { BaseEvent } from "../structures/BaseEvent";
import { Logger } from "../services/Logger";

export class HandlerManager {
  private readonly client: CustomClient;

  constructor(client: CustomClient) {
    this.client = client;
  }

  public loadHandlers(): void {
    this.loadEvents().catch((err) => Logger.error("", err));
  }

  private async loadEvents(): Promise<void> {
    const absolutePath = path.resolve(__dirname, "../.."); // Chemin absolu jusqu'au répertoire parent du répertoire du script en cours

    const files = (await glob("src/events/**/*.ts")).map(
      (filePath) =>
        `file:///${absolutePath.replace(/\\/g, "/")}/${filePath.replace(/\\/g, "/")}`,
    );

    await Promise.all(
      files.map(async (file: string) => {
        const importedModule = await import(file);

        // Parcourir chaque clé du module importé
        Object.keys(importedModule).forEach((key) => {
          // Récupérer la classe exportée correspondant à la clé actuelle
          const ExportedClass = importedModule[key];

          // Vérifier si la classe est une sous-classe de BaseEvent
          if (ExportedClass.prototype instanceof BaseEvent) {
            // Créer une instance de la classe avec le client actuel
            const event: BaseEvent = new ExportedClass(this.client);

            if (!event.name) {
              delete require.cache[require.resolve(file)];
              Logger.error(`${file.split("/").pop()} doesn't have a name`);
              return;
            }

            const execute = (...args: any) => event.execute(...args);

            const eventName: keyof ClientEvents =
              event.name as keyof ClientEvents;

            if (event.once) this.client.once(eventName, execute);
            else this.client.on(eventName, execute);
          }
        });
      }),
    );
  }
}
