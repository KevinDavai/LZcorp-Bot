import { CustomGiveaway } from "database/models/GiveawayModel";
import {
  deleteGiveaway,
  getAllGiveaways,
  getGiveaway,
  setGiveawayWinners,
} from "database/utils/GiveawayUtils";
import { Guild, TextChannel, EmbedBuilder } from "discord.js";
import { BaseJobs } from "structures/BaseJobs";
import { CustomClient } from "structures/CustomClient";
import {
  getOrFetchChannelById,
  getOrFetchMessageById,
} from "utils/MessageUtils";

export async function loadGiveaways(client: CustomClient) {
  const giveaways = await getAllGiveaways();
  const currentTime = new Date(); // Récupère la date actuelle

  giveaways.forEach(async (giveaway) => {
    if (giveaway.endDate <= currentTime) {
      // La date de fin est passée, finissez le giveaway immédiatement
      await endGiveaway(client, giveaway.messageId, giveaway.guildId);
    } else {
      // La date de fin est dans le futur, créez un job pour le giveaway
      const newGiveawayJob: BaseJobs = {
        client,
        name: `giveaway-${giveaway.messageId}`,
        description: `Giveaway ${giveaway.messageId}`,
        schedule: giveaway.endDate,
        log: false,
        execute: async () => {
          await endGiveaway(client, giveaway.messageId, giveaway.guildId);
        },
      };

      await client.jobService.addJob(newGiveawayJob, false);
    }
  });
}

export async function addParticipantGiveawayEmbed(
  guild: Guild,
  giveaway: CustomGiveaway,
): Promise<void> {
  const { messageId } = giveaway;

  const channel = await getOrFetchChannelById(guild, giveaway.channelId);

  if (!channel || !(channel instanceof TextChannel)) return; // On vérifie bien que c'est un salon textuel

  const message = await getOrFetchMessageById(channel, messageId);

  if (!message) return;

  const embed = message.embeds[0];
  const row = message.components[0];

  if (!embed) return;

  const participants = giveaway.participants || [];
  const description = embed.description || "";

  const newDescription = description.replace(
    /Nombre de participants : \d+/,
    `Nombre de participants : ${participants.length}`,
  );

  const newEmbed = new EmbedBuilder(embed.data).setDescription(newDescription);

  await message.edit({ embeds: [newEmbed], components: [row] });
}

export async function updateTimerGiveaway(
  guild: Guild,
  giveaway: CustomGiveaway,
) {
  const { messageId, endDate } = giveaway;

  const channel = await getOrFetchChannelById(guild, giveaway.channelId);

  if (!channel || !(channel instanceof TextChannel)) return;

  const message = await getOrFetchMessageById(channel, messageId);

  if (!message) return;

  const embed = message.embeds[0];
  const row = message.components[0];

  if (!embed) return;

  const timeLeft = endDate.getTime() - Date.now();
  const formattedTime = formatTime(timeLeft);

  const description = embed.description || "";

  const newDescription = description.replace(
    /Tirage dans : ``.*``/,
    `Tirage dans : \`\`${formattedTime}\`\``,
  );

  const newEmbed = new EmbedBuilder(embed.data).setDescription(newDescription);
  await message.edit({ embeds: [newEmbed] });
}

export function formatTime(ms: number): string {
  const seconds = Math.floor((ms / 1000) % 60);
  const minutes = Math.floor((ms / (1000 * 60)) % 60);
  const hours = Math.floor((ms / (1000 * 60 * 60)) % 24);
  const days = Math.floor(ms / (1000 * 60 * 60 * 24));

  let timeString = "";

  if (days > 0) {
    timeString += `${days} jour${days > 1 ? "s" : ""}`;
    if (hours > 0) {
      timeString += ` ${hours} heure${hours > 1 ? "s" : ""}`;
    }
  } else if (hours > 0) {
    timeString += `${hours} heure${hours > 1 ? "s" : ""}`;
    if (seconds > 0) {
      timeString += ` ${seconds} seconde${seconds > 1 ? "s" : ""}`;
    }
  } else if (minutes > 0) {
    timeString += `${minutes} minute${minutes > 1 ? "s" : ""}`;
    if (seconds > 0) {
      timeString += ` ${seconds} seconde${seconds > 1 ? "s" : ""}`;
    }
  } else {
    timeString += `${seconds} seconde${seconds > 1 ? "s" : ""}`;
  }

  return timeString.trim();
}

export async function endGiveaway(
  client: CustomClient,
  giveawayId: string,
  guildId: string,
) {
  try {
    const giveaway = await getGiveaway(giveawayId, guildId);

    if (!giveaway) throw new Error("Giveaway not found");

    const guild = client.guilds.cache.get(guildId);

    if (!guild) throw new Error("Guild not found");

    const channel = await getOrFetchChannelById(guild, giveaway.channelId);

    if (!channel || !(channel instanceof TextChannel))
      throw new Error("Channel not found");

    const message = await getOrFetchMessageById(channel, giveawayId);

    if (!message) throw new Error("Message not found");

    const numberOfWinners = giveaway.nbWinners;
    const { participants } = giveaway;

    const winners = pickRandomWinners(participants, numberOfWinners);

    const embed = message.embeds[0];

    const updateEmbed = new EmbedBuilder(embed.data);

    const description = embed.description || "";

    const winnersText =
      winners.length > 0
        ? winners.map((winner) => `<@${winner}>`).join(", ")
        : "Aucun gagnant";

    const newDescription = description.replace(
      /Tirage dans : ``.*``/,
      `Tirage terminé !\n**Gagnants** : ${winnersText}`,
    );

    const newEmbed = updateEmbed.setDescription(newDescription);

    message.edit({ embeds: [newEmbed], components: [] });

    await message.channel.send({
      content: `🎉 | Le giveaway est **terminé** ! Les gagnants sont : ${winnersText}.\n**Merci de créer un ticket pour récupérer vos gains.**`,
    });

    await setGiveawayWinners(giveawayId, guildId, winners);
  } catch (error) {
    await deleteGiveaway(giveawayId, guildId);
  }
}

export async function rerollGiveaway(
  client: CustomClient,
  giveawayId: string,
  guildId: string,
) {
  try {
    const giveaway = await getGiveaway(giveawayId, guildId);

    if (!giveaway) throw new Error("Giveaway not found");

    const guild = client.guilds.cache.get(guildId);

    if (!guild) throw new Error("Guild not found");

    const channel = await getOrFetchChannelById(guild, giveaway.channelId);

    if (!channel || !(channel instanceof TextChannel))
      throw new Error("Channel not found");

    const message = await getOrFetchMessageById(channel, giveawayId);

    if (!message) throw new Error("Message not found");

    const numberOfWinners = giveaway.nbWinners;
    const { participants } = giveaway;

    if (participants.length === 0) {
      throw new Error("No participants in the giveaway");
    }

    const winners = pickRandomWinners(participants, numberOfWinners);

    const embed = message.embeds[0];

    const updateEmbed = new EmbedBuilder(embed.data);

    const description = embed.description || "";

    const winnersText =
      winners.length > 0
        ? winners.map((winner) => `<@${winner}>`).join(", ")
        : "Aucun gagnant";

    const newDescription = description.replace(
      /(\*\*Gagnants\*\* : ).*?(\n|$)/,
      `$1 ${winnersText}\n`,
    );

    const newEmbed = updateEmbed.setDescription(newDescription);

    message.edit({ embeds: [newEmbed], components: [] });

    await setGiveawayWinners(giveawayId, guildId, winners);

    return winners;
  } catch (error) {
    await deleteGiveaway(giveawayId, guildId);
    return [];
  }
}

function pickRandomWinners(
  participants: string[],
  nbWinners: number,
): string[] {
  const shuffled = participants.sort(() => 0.5 - Math.random());
  return shuffled.slice(0, nbWinners);
}
