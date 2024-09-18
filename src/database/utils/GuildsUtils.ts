import { Guild } from "discord.js";
import { GuildModel, CustomGuild } from "database/models/GuildsModel";
import { Logger } from "services/Logger";
import { CustomClient } from "structures/CustomClient";
import NodeCache from "node-cache";
import Logs from "../../lang/logs.json";

const guildCache = new NodeCache({ stdTTL: 3600, checkperiod: 600 });

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

  const cachedGuild = guildCache.get<CustomGuild>(guild.id);

  if (cachedGuild) {
    guildCache.del(guild.id); // Supprime la guilde du cache
  }

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

export async function setWelcomeChannel(guild: Guild, channelId: string) {
  const client = guild.client as CustomClient;

  try {
    // Mise à jour directe du welcome_channel_id pour la guilde donnée
    await GuildModel.updateOne(
      { _id: guild.id }, // Filtre : on sélectionne la guilde par son _id
      { $set: { welcome_channel_id: channelId } }, // Mise à jour du welcome_channel_id
    );

    const cachedGuild = guildCache.get<CustomGuild>(guild.id);

    if (cachedGuild) {
      // Si la guilde est dans le cache, on met à jour uniquement le welcome_channel_id
      cachedGuild.welcome_channel_id = channelId;
      guildCache.set(guild.id, cachedGuild); // Met à jour le cache
    }

    Logger.info(client.lang.info.welcomeChannelUpdate, guild.id);
  } catch (error) {
    Logger.error(client.lang.error.welcomeChannelUpdate, guild.id, error);
  }
}

export async function setLevelUpChannel(guild: Guild, channelId: string) {
  const client = guild.client as CustomClient;

  try {
    // Mise à jour directe du welcome_channel_id pour la guilde donnée
    await GuildModel.updateOne(
      { _id: guild.id }, // Filtre : on sélectionne la guilde par son _id
      { $set: { levelup_channel_id: channelId } }, // Mise à jour du welcome_channel_id
    );

    const cachedGuild = guildCache.get<CustomGuild>(guild.id);

    if (cachedGuild) {
      // Si la guilde est dans le cache, on met à jour uniquement le levelUp_channel_id
      cachedGuild.levelup_channel_id = channelId;
      guildCache.set(guild.id, cachedGuild); // Met à jour le cache
    }

    Logger.info(client.lang.info.levelUpChannelUpdate, guild.id);
  } catch (error) {
    Logger.error(client.lang.error.levelUpChannelUpdate, guild.id, error);
  }
}

export async function setSuggestionChannel(guild: Guild, channelId: string) {
  const client = guild.client as CustomClient;

  try {
    // Mise à jour directe du welcome_channel_id pour la guilde donnée
    await GuildModel.updateOne(
      { _id: guild.id }, // Filtre : on sélectionne la guilde par son _id
      { $set: { suggestion_channel_id: channelId } }, // Mise à jour du welcome_channel_id
    );

    const cachedGuild = guildCache.get<CustomGuild>(guild.id);

    if (cachedGuild) {
      // Si la guilde est dans le cache, on met à jour uniquement le welcome_channel_id
      cachedGuild.suggestion_channel_id = channelId;
      guildCache.set(guild.id, cachedGuild); // Met à jour le cache
    }

    Logger.info(client.lang.info.suggestionChannelUpdate, guild.id);
  } catch (error) {
    Logger.error(client.lang.error.suggestionChannelUpdate, guild.id, error);
  }
}

export async function setAvisChannel(guild: Guild, channelId: string) {
  const client = guild.client as CustomClient;

  try {
    // Mise à jour directe du welcome_channel_id pour la guilde donnée
    await GuildModel.updateOne(
      { _id: guild.id }, // Filtre : on sélectionne la guilde par son _id
      { $set: { avis_channel_id: channelId } }, // Mise à jour du welcome_channel_id
    );

    const cachedGuild = guildCache.get<CustomGuild>(guild.id);

    if (cachedGuild) {
      // Si la guilde est dans le cache, on met à jour uniquement le welcome_channel_id
      cachedGuild.avis_channel_id = channelId;
      guildCache.set(guild.id, cachedGuild); // Met à jour le cache
    }

    Logger.info(client.lang.info.avisChannelUpdate, guild.id);
  } catch (error) {
    Logger.error(client.lang.error.avisChannelUpdate, guild.id, error);
  }
}

export async function setPrestataireMode(guild: Guild, state: boolean) {
  const client = guild.client as CustomClient;

  await GuildModel.updateOne(
    { _id: guild.id },
    { $set: { isPrestataireOn: state } },
  );

  const cachedGuild = guildCache.get<CustomGuild>(guild.id);

  if (cachedGuild) {
    cachedGuild.isPrestataireOn = state;
    guildCache.set(guild.id, cachedGuild);
  }
}

export async function setAntiLink(guild: Guild, state: boolean) {
  const client = guild.client as CustomClient;

  try {
    await GuildModel.updateOne(
      { _id: guild.id },
      { $set: { antilink: state } },
    );

    const cachedGuild = guildCache.get<CustomGuild>(guild.id);

    if (cachedGuild) {
      cachedGuild.antilink = state;
      guildCache.set(guild.id, cachedGuild);
    }

    Logger.info(client.lang.info.antiLinkUpdate, guild.id);
  } catch (error) {
    Logger.error(client.lang.error.antiLinkUpdate, guild.id, error);
  }
}

export async function setAntiSpam(guild: Guild, state: boolean) {
  const client = guild.client as CustomClient;

  try {
    await GuildModel.updateOne(
      { _id: guild.id },
      { $set: { antispam: state } },
    );

    const cachedGuild = guildCache.get<CustomGuild>(guild.id);

    if (cachedGuild) {
      cachedGuild.antispam = state;
      guildCache.set(guild.id, cachedGuild);
    }

    Logger.info(client.lang.info.antiSpamUpdate, guild.id);
  } catch (error) {
    Logger.error(client.lang.error.antiSpamUpdate, guild.id, error);
  }
}

export async function setAntiBadWord(guild: Guild, state: boolean) {
  const client = guild.client as CustomClient;

  try {
    await GuildModel.updateOne(
      { _id: guild.id },
      { $set: { antibadwords: state } },
    );

    const cachedGuild = guildCache.get<CustomGuild>(guild.id);

    if (cachedGuild) {
      cachedGuild.antibadwords = state;
      guildCache.set(guild.id, cachedGuild);
    }

    Logger.info(client.lang.info.antiBadWordUpdate, guild.id);
  } catch (error) {
    Logger.error(client.lang.error.antiBadWordUpdate, guild.id, error);
  }
}

export async function setAntiMassMention(guild: Guild, state: boolean) {
  const client = guild.client as CustomClient;

  try {
    await GuildModel.updateOne(
      { _id: guild.id },
      { $set: { antimassmentions: state } },
    );

    const cachedGuild = guildCache.get<CustomGuild>(guild.id);

    if (cachedGuild) {
      cachedGuild.antimassmentions = state;
      guildCache.set(guild.id, cachedGuild);
    }

    Logger.info(client.lang.info.antiMassMentionUpdate, guild.id);
  } catch (error) {
    Logger.error(client.lang.error.antiMassMentionUpdate, guild.id, error);
  }
}

export async function setBlackListChannel(guild: Guild, channelId: string) {
  const client = guild.client as CustomClient;

  try {
    // Mise à jour directe du welcome_channel_id pour la guilde donnée
    await GuildModel.updateOne(
      { _id: guild.id }, // Filtre : on sélectionne la guilde par son _id
      { $set: { blacklist_channel_id: channelId } }, // Mise à jour du blacklist_channel_id
    );

    const cachedGuild = guildCache.get<CustomGuild>(guild.id);

    if (cachedGuild) {
      // Si la guilde est dans le cache, on met à jour uniquement le welcome_channel_id
      cachedGuild.blacklist_channel_id = channelId;
      guildCache.set(guild.id, cachedGuild); // Met à jour le cache
    }

    Logger.info(client.lang.info.blackListChannelUpdate, guild.id);
  } catch (error) {
    Logger.error(client.lang.error.blackListChannelUpdate, guild.id, error);
  }
}

export async function setBlackListRole(guild: Guild, roleId: string) {
  const client = guild.client as CustomClient;

  try {
    // Mise à jour directe du welcome_channel_id pour la guilde donnée
    await GuildModel.updateOne(
      { _id: guild.id }, // Filtre : on sélectionne la guilde par son _id
      { $set: { blacklist_role_id: roleId } }, // Mise à jour du blacklist_channel_id
    );

    const cachedGuild = guildCache.get<CustomGuild>(guild.id);

    if (cachedGuild) {
      // Si la guilde est dans le cache, on met à jour uniquement le welcome_channel_id
      cachedGuild.blacklist_role_id = roleId;
      guildCache.set(guild.id, cachedGuild); // Met à jour le cache
    }

    Logger.info(client.lang.info.blackListRoleUpdate, guild.id);
  } catch (error) {
    Logger.error(client.lang.error.blackListRoleUpdate, guild.id, error);
  }
}
export async function getGuildSettings(guildId: string) {
  try {
    // Vérifie si les paramètres du serveur sont dans le cache
    const cachedSettings = guildCache.get<CustomGuild>(guildId);

    if (cachedSettings) {
      return cachedSettings;
    }

    // Récupère les paramètres depuis MongoDB
    const settings = await GuildModel.findOne({ _id: guildId });

    // Si settings est null, on lève une erreur car on s'attend à ce qu'il existe toujours
    if (!settings) {
      throw new Error(`Settings not found for guild: ${guildId}`);
    }

    // Stocke les paramètres dans le cache avec TTL
    guildCache.set(guildId, settings);

    return settings;
  } catch (error) {
    Logger.error(Logs.error.getGuildSettings, error);
    throw error;
  }
}

export async function upsertRoleForLevel(
  guildId: string,
  level: number,
  roleId: string,
) {
  try {
    const result = await GuildModel.updateOne(
      { _id: guildId, "role_per_level.level": level }, // Recherche de la guilde et du niveau
      {
        $set: { "role_per_level.$.role_id": roleId }, // Met à jour le role_id si le niveau existe déjà
      },
    );

    // Si le niveau n'existe pas, ajouter un nouveau document avec ce niveau
    if (result.modifiedCount === 0) {
      await GuildModel.updateOne(
        { _id: guildId }, // Recherche de la guilde
        {
          $addToSet: { role_per_level: { level, role_id: roleId } }, // Ajoute le nouveau niveau
        },
      );
      Logger.info(Logs.info.newLevelRole, guildId, level, roleId);
    } else {
      Logger.info(Logs.info.editLevelRole, guildId, level, roleId);
    }

    guildCache.del(guildId); // Supprime la guilde du cache
  } catch (error) {
    Logger.error(Logs.error.newOrEditRole, guildId, level, roleId, error);
  }
}

export async function addBypassRoleToGuild(
  guildId: string,
  roleId: string,
): Promise<void> {
  try {
    const newGuild = await GuildModel.findOneAndUpdate(
      { _id: guildId },
      { $addToSet: { bypass_roles: roleId } }, // Utilise $addToSet pour éviter les doublons
      { new: true },
    );

    guildCache.set(guildId, newGuild);
  } catch (error) {
    Logger.error(Logs.error.addBypassRoleToGuild, guildId, roleId, error);
    throw error;
  }
}

export async function removeBypassRoleToGuild(
  guildId: string,
  roleId: string,
): Promise<void> {
  try {
    // Sauvegarde dans la DB
    const newGuild = await GuildModel.findOneAndUpdate(
      { _id: guildId },
      { $pull: { bypass_roles: roleId } },
      { new: true },
    );

    guildCache.set(guildId, newGuild);
  } catch (error) {
    Logger.error(Logs.error.removeBypassRoleToGuild, guildId, roleId, error);
    throw error;
  }
}

export async function addBypassChannelToGuild(
  guildId: string,
  channelId: string,
): Promise<void> {
  try {
    const newGuild = await GuildModel.findOneAndUpdate(
      { _id: guildId },
      { $addToSet: { bypass_channels: channelId } }, // Utilise $addToSet pour éviter les doublons
      { new: true },
    );

    guildCache.set(guildId, newGuild);
  } catch (error) {
    Logger.error(Logs.error.addBypassChannelToGuild, guildId, channelId, error);
    throw error;
  }
}

export async function removeBypassChannelToGuild(
  guildId: string,
  channelId: string,
): Promise<void> {
  try {
    // Sauvegarde dans la DB
    const newGuild = await GuildModel.findOneAndUpdate(
      { _id: guildId },
      { $pull: { bypass_channels: channelId } },
      { new: true },
    );

    guildCache.set(guildId, newGuild);
  } catch (error) {
    Logger.error(
      Logs.error.removeBypassChannelToGuild,
      guildId,
      channelId,
      error,
    );
    throw error;
  }
}
