import { CustomGuild } from "database/models/GuildsModel";
import { Message } from "discord.js";
import { Logger } from "services/Logger";
import { CustomClient } from "structures/CustomClient";
import { getOrFetchMemberById } from "utils/MessageUtils";

const SPAM_LIMIT = 5; // Nombre de messages max avant de déclencher le système anti-spam
const SPAM_INTERVAL = 5000; // Intervalle de temps (5 secondes) pour compter les messages
const SPAM_ACTION_TIMEOUT = 60000; // Temps avant de réinitialiser l'action de suppression (1 minute)

export async function antiSpamModule(
  client: CustomClient,
  message: Message,
  guild: CustomGuild,
): Promise<boolean> {
  let finalBool = false;
  const member = await getOrFetchMemberById(message.guild!, message.author.id);

  if (member) {
    if (
      member.roles.cache.some((role) => guild.bypass_roles.includes(role.id))
    ) {
      return finalBool;
    }
  }

  const userId = message.author.id;
  const now = Date.now();
  const userData = client.messageCache.get(userId) || {
    count: 0,
    lastMessageTimestamp: now,
  };

  if (now - userData.lastMessageTimestamp < SPAM_INTERVAL) {
    userData.count += 1;

    // Si l'utilisateur a dépassé la limite de messages
    if (userData.count >= SPAM_LIMIT) {
      handleSpam(message, userData.count);

      if (userData.count >= 10) {
        try {
          await member?.disableCommunicationUntil(now + 60000);
        } catch (error) {
          Logger.error(
            "Erreur lors de la gestion du spam (Probablement un manque de permission) :",
            error,
          );
        }
      }
      finalBool = true;
    }
  } else {
    // Réinitialise si l'intervalle de spam est passé
    userData.count = 1;
  }

  userData.lastMessageTimestamp = now;
  client.messageCache.set(userId, userData);

  setTimeout(() => client.messageCache.delete(userId), SPAM_ACTION_TIMEOUT);
  return finalBool;
}

async function handleSpam(message: Message, count: number) {
  try {
    // Supprime le message
    message.delete();

    // Optionnel : Envoie un message privé à l'utilisateur
    if (count === 5) {
      message.author.send(
        "Vous avez été détecté comme spammeur. Veuillez ralentir votre envoi de messages.",
      );
    }
  } catch (error) {
    Logger.error("Erreur lors de la gestion du spam :", error);
  }
}
