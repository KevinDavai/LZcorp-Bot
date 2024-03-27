import { Client, ClientOptions, GatewayIntentBits, Partials } from "discord.js";
import dotenv from "dotenv";
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

    await this._handlerManager.loadHandlers();
    await this._jobService.loadJobs();

    this.login(process.env.DISCORD_TOKEN)
      .then(() => Logger.info(Logs.info.clientLogin))
      .catch((err) => Logger.error(Logs.error.clientLogin, err));
  }

  public get lang() {
    return this._lang;
  }

  public get jobService() {
    return this._jobService;
  }
}
