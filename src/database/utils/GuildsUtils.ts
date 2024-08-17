import { Guild } from "discord.js";
import { GuildModel } from "database/models/GuildsModel";
import { Logger } from "services/Logger";
import { CustomClient } from "structures/CustomClient";

export async function createGuild(
  client: CustomClient,
  guild: Guild,
): Promise<void> {
  const newGuild = new GuildModel({
    _id: guild.id,
    name: guild.name,
    owner_id: guild.ownerId,
  });
  await newGuild.save();
  Logger.info(client.lang.info.newGuild, guild.name, guild.id);
}

export async function deleteGuild(
  client: CustomClient,
  guild: Guild,
): Promise<void> {
  await GuildModel.deleteOne({ _id: guild.id });
  Logger.info(client.lang.info.deleteGuild, guild.name, guild.id);
}

export async function checkNewGuilds(client: CustomClient): Promise<void> {
  const guilds = client.guilds.cache;

  // Check for new guilds and add them to the database
  guilds.each(async (guild) => {
    const existingGuild = await GuildModel.findOne({ _id: guild.id });
    if (!existingGuild) {
      const newGuild = new GuildModel({
        _id: guild.id,
        name: guild.name,
        owner_id: guild.ownerId,
      });
      await newGuild.save();
      Logger.info(client.lang.info.newGuild, guild.name, guild.id);
    }
  });

  // Check for guilds in the database that have left
  const dbGuilds = await GuildModel.find({});
  dbGuilds.forEach(async (dbGuild) => {
    if (!guilds.has(dbGuild._id)) {
      await GuildModel.deleteOne({ _id: dbGuild._id });
      Logger.info(client.lang.info.deleteGuild, dbGuild.name, dbGuild._id);
    }
  });
}
