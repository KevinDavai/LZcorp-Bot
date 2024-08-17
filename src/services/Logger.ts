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
  static info(message: string, ...params: any[]): void {
    const formattedMessage = Logger.formatMessage(message, params);
    logger.info(formattedMessage);
  }

  static warn(message: string, ...params: any[]): void {
    const formattedMessage = Logger.formatMessage(message, params);
    logger.warn(formattedMessage);
  }

  static error(message: string, ...params: any[]): void {
    const errorParam = params.pop();
    const formattedMessage = Logger.formatMessage(message, params);

    if (errorParam instanceof Error || errorParam instanceof DiscordAPIError) {
      const errorDetails = Logger.formatErrorDetails(errorParam);
      logger.error({ ...errorDetails, message: formattedMessage });
    } else {
      logger.error({ message: formattedMessage, error: errorParam });
    }
  }

  private static formatMessage(message: string, params: any[]): string {
    return params.reduce((msg, param, index) => {
      const placeholder = `{${index}}`;
      return msg.replace(placeholder, param);
    }, message);
  }

  private static formatErrorDetails(error: Error | DiscordAPIError) {
    if (error instanceof DiscordAPIError) {
      return {
        errorMessage: error.message,
        code: error.code,
        statusCode: error.status,
        method: error.method,
        url: error.url,
        stack: error.stack,
      };
    }

    return {
      errorMessage: error.message,
      stack: error.stack,
    };
  }
}
