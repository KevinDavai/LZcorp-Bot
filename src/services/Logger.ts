import { DiscordAPIError } from "discord.js";
import pino from "pino";
import Config from "../configs/config.json";

const logger = pino(
  {
    formatters: {
      level: (label) => ({ level: label }),
    },
  },
  Config.logging.pretty
    ? pino.transport({
        target: "pino-pretty",
        options: Config.logging.options,
      })
    : undefined,
);

export class Logger {
  static info(message: string, obj?: any): void {
    logger.info(obj ? { message, obj } : message);
  }

  static warn(message: string, obj?: any): void {
    logger.warn(obj ? { message, obj } : message);
  }

  public static error(message: string, obj?: any): void {
    if (!obj) {
      logger.error(message);
      return;
    }

    if (typeof obj === "string") {
      logger.child({ message: obj }).error(message);
    } else if (obj instanceof DiscordAPIError) {
      logger
        .child({
          message: obj.message,
          code: obj.code,
          statusCode: obj.status,
          method: obj.method,
          url: obj.url,
          stack: obj.stack,
        })
        .error(message);
    } else {
      logger.error(obj, message);
    }
  }
}
