import { Embed, Guild } from "discord.js";
import { GuildModel } from "database/models/GuildsModel";
import { Logger } from "services/Logger";
import { CustomClient } from "structures/CustomClient";
import { CustomEmbed, EmbedModel } from "database/models/EmbedModel";

import { EmbedBuilder } from "@discordjs/builders";
import NodeCache from "node-cache";
import Logs from "../../lang/logs.json";

const embedCache = new NodeCache({ stdTTL: 1200, checkperiod: 600 });

export async function createEmbed(
  embedId: string,
  embed: EmbedBuilder,
  guild: Guild,
): Promise<void> {
  const newEmbed = new EmbedModel({
    _id: embedId,
    guildId: guild.id,
    embedData: embed.toJSON(),
  });
  await newEmbed.save();

  embedCache.del(guild.id);
}

export async function deleteEmbed(
  embedId: string,
  guild: Guild,
): Promise<void> {
  try {
    await EmbedModel.deleteOne({ _id: embedId, guildId: guild.id });

    embedCache.del(guild.id);
  } catch (error) {
    Logger.error(Logs.error.deleteEmbed, embedId, guild.id, error);
    throw error;
  }
}

/**
 * Retrieve a single embed by its ID and guild ID, using cache if available.
 * @param embedId - The ID of the embed.
 * @param guildId - The ID of the guild.
 * @returns The embed if found, otherwise null.
 */
export async function getEmbedById(
  embedId: string,
  guildId: string,
): Promise<CustomEmbed | null> {
  try {
    // Check the cache first
    const cachedEmbeds = embedCache.get<CustomEmbed[]>(guildId);

    if (cachedEmbeds) {
      const embed = cachedEmbeds.find((e) => e._id === embedId);
      if (embed) {
        return embed;
      }
    }

    // If not found in cache, fetch from database
    const embed = await EmbedModel.findOne({ _id: embedId, guildId });

    // Cache the result if it's found and not cached
    if (embed) {
      // Update cache with new embed
      const embeds = cachedEmbeds || [];
      embeds.push(embed);
      embedCache.set(guildId, embeds);
    }

    return embed;
  } catch (error) {
    Logger.error(Logs.error.getEmbedById, embedId, guildId, error);
    throw error;
  }
}

export async function isEmbedExist(
  embedId: string,
  guildId: string,
): Promise<boolean> {
  try {
    // Vérifie si l'embed est déjà dans le cache pour cette guild
    const cachedEmbeds = embedCache.get<CustomEmbed[]>(guildId);

    // Si le cache contient des embeds, vérifie si l'embed spécifique existe
    if (cachedEmbeds) {
      const existsInCache = cachedEmbeds.some((embed) => embed._id === embedId);
      if (existsInCache) {
        return true;
      }
    }

    // Si l'embed n'est pas dans le cache, vérifie dans la base de données
    const embed = await EmbedModel.findOne({ _id: embedId, guildId });

    return embed !== null;
  } catch (error) {
    Logger.error(Logs.error.embedExist, embedId, guildId, error);
    throw error;
  }
}

export async function getEmbedsByGuildId(guildId: string) {
  try {
    // Vérifie si les paramètres du serveur sont dans le cache
    const cachedEmbeds = embedCache.get<CustomEmbed[]>(guildId);

    if (cachedEmbeds) {
      return cachedEmbeds;
    }

    // Récupère les paramètres depuis MongoDB
    const embeds = await EmbedModel.find({ guildId });

    if (!embeds || embeds.length === 0) {
      return [];
    }

    // Stocke les paramètres dans le cache avec TTL
    embedCache.set(guildId, embeds);

    return embeds;
  } catch (error) {
    Logger.error(Logs.error.getGuildSettings, error);
    throw error;
  }
}
