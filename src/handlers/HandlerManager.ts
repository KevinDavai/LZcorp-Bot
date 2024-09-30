// eslint-disable-next-line eslint-comments/disable-enable-pair
/* eslint-disable no-await-in-loop */
// eslint-disable-next-line eslint-comments/disable-enable-pair
/* eslint-disable no-restricted-syntax */
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
import { BaseButton } from "structures/BaseButton";
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
    await this.loadBtn();
  }

  private async loadBtn(): Promise<void> {
    Logger.info(this.client.lang.info.loadingButtons);

    const btnDir = path.resolve(__dirname, "../buttons");

    const files = await glob(`${btnDir}/**/*.{ts,js}`);

    await Promise.all(files.map((file) => this.loadBtnFile(file)));
  }

  private async loadCmd(): Promise<void> {
    Logger.info(this.client.lang.info.loadingCommands);

    const cmdDir = path.resolve(__dirname, "../commands");

    const files = await glob(`${cmdDir}/**/*.{ts,js}`);

    await Promise.all(files.map((file) => this.loadCmdFile(file)));

    const rest = new REST().setToken(process.env.DISCORD_TOKEN as string);

    try {
      // Filtrer les commandes : Globales vs Guildes spécifiques
      const globalCommands = this.client.commands.filter(
        (cmd) => !cmd.guildIdOnly,
      );
      const guildSpecificCommands = this.client.commands.filter(
        (cmd) => cmd.guildIdOnly,
      );

      // Enregistrement des commandes globales
      if (globalCommands.size > 0) {
        await rest.put(
          Routes.applicationCommands(process.env.DISCORD_CLIENT_ID),
          { body: globalCommands.map((cmd) => cmd.data) },
        );
        Logger.info(`Global commands registered successfully.`);
      }

      // Enregistrement des commandes spécifiques à une guilde
      for (const command of guildSpecificCommands) {
        const commandGuildId = command[0].split("_")[1];
        await rest.post(
          Routes.applicationGuildCommands(
            process.env.DISCORD_CLIENT_ID,
            commandGuildId,
          ),
          { body: command[1].data }, // Une commande à la fois par guilde
        );
        Logger.info(
          `Command registered for guild ${commandGuildId}, command: ${command[1].data.name}`,
        );
      }
    } catch (error) {
      Logger.error(this.client.lang.error.loadCommandAPI, error);
    }
  }

  private async loadCmdFile(file: string): Promise<void> {
    try {
      const filePath = file.replace(/\\/g, "/");

      const eventsDir = path.resolve(__dirname, "../../");

      const normalizedPath = eventsDir.split(path.sep).join("/");

      const finalPath = normalizedPath.replace("/home/container/", "");

      const importedModule = await import(`file://${finalPath}/${filePath}`);

      await Object.keys(importedModule).forEach((key) => {
        const ExportedClass = importedModule[key];

        if (ExportedClass.prototype instanceof BaseCommand) {
          const command: BaseCommand = new ExportedClass(this.client);

          // Générer une clé unique pour chaque commande
          const commandKey = command.guildIdOnly
            ? `${command.data.name}_${command.guildIdOnly}` // Clé unique pour les commandes spécifiques à une guild
            : command.data.name; // Clé pour les commandes globales

          // Ajouter la commande dans la collection avec la clé unique
          this.client.commands.set(commandKey, command);

          Logger.info(this.client.lang.info.loadedCmd, command.data.name);
        }
      });
    } catch (error) {
      Logger.error(this.client.lang.error.loadEventFile, file, error);
    }
  }

  private async loadBtnFile(file: string): Promise<void> {
    try {
      const filePath = file.replace(/\\/g, "/");
      const eventsDir = path.resolve(__dirname, "../../");

      const normalizedPath = eventsDir.split(path.sep).join("/");

      const finalPath = normalizedPath.replace("/home/container/", "");

      const importedModule = await import(`file://${finalPath}/${filePath}`);

      await Object.keys(importedModule).forEach((key) => {
        const ExportedClass = importedModule[key];

        if (ExportedClass.prototype instanceof BaseButton) {
          const button: BaseButton = new ExportedClass(this.client);

          // Ajouter la commande dans la collection avec la clé unique
          this.client.buttons.set(button.id, button);

          Logger.info(this.client.lang.info.loadedBtn, button.id);
        }
      });
    } catch (error) {
      Logger.error(this.client.lang.error.loadBtnFile, file, error);
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

      const eventsDir = path.resolve(__dirname, "../../");

      const normalizedPath = eventsDir.split(path.sep).join("/");

      const finalPath = normalizedPath.replace("/home/container/", "");

      const importedModule = await import(`file://${finalPath}/${filePath}`);

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
