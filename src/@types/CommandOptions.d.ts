export type CommandOptions = {
  data:
    | RESTPostAPIApplicationCommandsJSONBody
    | RESTPostAPIApplicationGuildCommandsJSONBody;
  cooldown?: number;
  max?: number;
};
