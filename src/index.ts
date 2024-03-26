import { CustomClient } from "./structures/CustomClient";
import { Logger } from "./services/Logger";
import Logs from "./lang/logs.json";

async function start() {
  const customClient = new CustomClient();

  await customClient.start();
}

start().catch((err) => Logger.error(Logs.error.unspecified, err));
