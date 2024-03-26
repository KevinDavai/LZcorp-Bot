import { Client, ClientOptions, GatewayIntentBits, Partials } from "discord.js";
import dotenv from "dotenv";
import { Logger } from "../services/Logger";
import Logs from "../lang/logs.json";
import { HandlerManager } from "../handlers/HandlerManager";
import Config from "../configs/config.json";

export class CustomClient extends Client {
  private readonly handlerManager: HandlerManager;

  public constructor() {
    super({
      partials: [Partials.Message, Partials.Channel, Partials.Reaction],
      intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages],
    });

    dotenv.config();

    this.handlerManager = new HandlerManager(this);
  }

  public async start(): Promise<void> {
    this.handlerManager.loadHandlers();

    this.login(process.env.DISCORD_TOKEN).catch((err) =>
      Logger.error(Logs.error.clientLogin, err),
    );
  }
}
