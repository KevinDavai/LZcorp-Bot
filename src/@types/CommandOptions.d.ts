export type CommandOptions = {
  data:
    | RESTPostAPIApplicationCommandsJSONBody
    | RESTPostAPIApplicationGuildCommandsJSONBody;
  cooldown?: number;
  subcommands?: Record<
    string,
    {
      max?: number; // Max limit for this subcommand
    }
  >;
  guildIdOnly?: string;
};
