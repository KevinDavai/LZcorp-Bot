import { CustomEmbed } from "database/models/EmbedModel";
import { CustomProfil, ProfilModel } from "database/models/ProfilModel";
import { EmbedBuilder } from "discord.js";
import NodeCache from "node-cache";
import { Logger } from "services/Logger";

const profilCache = new NodeCache({ stdTTL: 1200, checkperiod: 600 });

export async function insertNewProfil(
  userId: string,
  guildId: string,
  embeds: EmbedBuilder[],
): Promise<void> {
  const cachekey = `${userId}-${guildId}`;

  try {
    // Utilisation de l'upsert pour mettre à jour ou insérer si le profil n'existe pas
    const updatedProfil = await ProfilModel.findOneAndUpdate(
      { userId, guildId }, // Filtre pour trouver le profil
      { $set: { embeds } }, // Met à jour les embeds
      { new: true, upsert: true }, // "new" renvoie le document mis à jour et "upsert" insère s'il n'existe pas
    );

    // Met à jour le cache après l'insertion/mise à jour
    profilCache.set(cachekey, updatedProfil);
  } catch (error) {
    Logger.error(
      "Erreur lors de l'insertion ou la mise à jour du profil :",
      error,
    );
  }
}

export async function deleteProfil(
  userId: string,
  guildId: string,
): Promise<void> {
  try {
    await ProfilModel.deleteOne({ userId, guildId });

    const cachekey = `${userId}-${guildId}`;
    profilCache.del(cachekey);
  } catch (error) {
    Logger.error("Erreur lors de la suppression du profil :", error);
    throw error;
  }
}

export async function getProfilEmbeds(
  userId: string,
  guildId: string,
): Promise<EmbedBuilder[] | null> {
  const cachekey = `${userId}-${guildId}`;
  const cachedProfil = profilCache.get<CustomProfil>(cachekey);

  if (cachedProfil) {
    return cachedProfil.embeds;
  }

  try {
    const profil = await ProfilModel.findOne({ userId, guildId });

    if (profil) {
      profilCache.set(cachekey, profil);
      return profil.embeds;
    }

    return null;
  } catch (error) {
    Logger.error("Erreur lors de la récupération du profil :", error);
    throw error;
  }
}

export async function getAllProfilUserName(guildId: string): Promise<string[]> {
  try {
    // Récupère tous les profils pour une guilde donnée depuis la base de données
    const profiles = await ProfilModel.find<CustomProfil>({ guildId });

    if (!profiles || profiles.length === 0) {
      return [];
    }

    const userIds: string[] = [];

    profiles.forEach((profile) => {
      const { userId } = profile;
      userIds.push(userId);
    });

    return userIds;
  } catch (error) {
    Logger.error("Erreur lors de la récupération des profils:", error);
    throw error;
  }
}

export async function generateProfiles() {
  const profiles: CustomProfil[] = [];

  for (let i = 0; i < 23; i += 1) {
    const embed = new EmbedBuilder()
      .setTitle("⭐⭐⭐ **Community-Manager**")
      .setDescription(
        "Je dessine depuis toujours c'est ma plus grande passion dans la vie, de manière générale j'ai 4 ans d'expérience en graphisme. Je travaille sur Minecraft depuis 2023, en grande partie avec le serveur Atlantis.",
      )
      .setURL("https://www.google.com")
      .setAuthor({
        name: `Profil de user_${i}`,
        iconURL: `https://cdn.discordapp.com/avatars/user_id_${i}/avatar_hash.webp`,
      })
      .setThumbnail(
        `https://cdn.discordapp.com/avatars/user_id_${i}/avatar_hash.webp`,
      )
      .addFields(
        {
          name: "Document contractuel",
          value: "• ``Cahier des charges`` \n• ``Devis`` \n• ``Factures``",
          inline: true,
        },
        {
          name: "Réseaux sociaux",
          value:
            "• [Instagram](https://www.instagram.com/)\n• [Twitter](https://twitter.com/)\n• [Portfolio](https://www.lzcorp.fr/)",
          inline: true,
        },
      )
      .setColor(16777215)
      .setFooter({
        text: "© Copyright LZCorp | NewsMC",
        iconURL: "https://cdn.discordapp.com/embed/avatars/0.png",
      })
      .setTimestamp(new Date());

    const profile: CustomProfil = {
      userId: `334287301192450048`, // Génère un userId unique
      guildId: "916487743004114974",
      embeds: [embed], // Ajoute l'embed au profil
    };

    profiles.push(profile);
  }

  // Insère les profils générés dans la base de données
  try {
    await ProfilModel.insertMany(profiles);
    console.log("100 profils générés avec succès.");
  } catch (error) {
    console.error("Erreur lors de la génération des profils :", error);
  }
}
