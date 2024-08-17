import {
  ApplicationCommand,
  Client,
  ClientOptions,
  Collection,
  GatewayIntentBits,
  Partials,
} from "discord.js";
import dotenv from "dotenv";
import { connect, connection } from "mongoose";
import { Logger } from "../services/Logger";
import Logs from "../lang/logs.json";
import { HandlerManager } from "../handlers/HandlerManager";
import Config from "../configs/config.json";
import { JobService } from "../services/JobService";

export class CustomClient extends Client {
  private readonly _handlerManager: HandlerManager;

  private readonly _lang: typeof Logs;

  private readonly _jobService: JobService;

  public constructor() {
    super({
      partials: [Partials.Message, Partials.Channel, Partials.Reaction],
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
      ],
    });

    dotenv.config();

    this._handlerManager = new HandlerManager(this);
    this._jobService = new JobService(this);
    this._lang = Logs;
  }

  public async start(): Promise<void> {
    Logger.info(Logs.info.startingClient);

    Logger.info(this._lang.info.mongodbTryConnect);
    await connect(process.env.MONGODB_URI)
      .then(() => {
        Logger.info(this._lang.info.mongodbConnected);
      })
      .catch((err) => {
        Logger.error(this._lang.error.mongodbConnection, err);
        process.exit(1); // Stop the program if there's an error
      });

    await this._handlerManager.loadHandlers();
    await this._jobService.loadJobs();

    this.login(process.env.DISCORD_TOKEN)
      .then(() => Logger.info(this._lang.info.clientLogin))
      .catch((err) => {
        Logger.error(this._lang.error.clientLogin, err);
        process.exit(1); // Stop the program if there's an error
      });
  }

  public get lang() {
    return this._lang;
  }

  public get jobService() {
    return this._jobService;
  }
}
