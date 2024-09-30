import { EmbedBuilder, GuildMember } from "discord.js";
import { Logger } from "services/Logger";
import { getOrFetchChannelById, getOrFetchRoleById } from "utils/MessageUtils";
import { CustomClient } from "structures/CustomClient";
import Logs from "../lang/logs.json";

export async function giveAutorole(
  member: GuildMember,
  roleId: string,
): Promise<void> {
  try {
    // Récupère le rôle
    const role = await getOrFetchRoleById(member.guild, roleId);

    // Si le rôle n'est pas trouvé, on lève une erreur
    if (!role) {
      throw new Error(`Role with ID ${roleId} not found`);
    }

    // Ajoute le rôle au membre
    await member.roles.add(role);
  } catch (error) {
    Logger.error(Logs.error.giveAutorole, member.displayName, error);
  }
}

export async function sendWelcomeEmbed(
  member: GuildMember,
  welcomeChannelId: string,
): Promise<void> {
  const welcomeEmbed = new EmbedBuilder();

  try {
    if (member.guild.id === "715272187669512234") {
      welcomeEmbed
        .setTitle(`» Bienvenue __${member.displayName}__ sur LZCorp !`)
        .setDescription(
          `➜ Commence dès maintenant et rend toi sur <#760745745195728946>
          ➜ Pour avoir accès au support <#929743910027272322>
          ➜ Pour pouvoir passer commande <#929752200085930064>
          ➜ Pour avoir nos prix <#1192845767539441825>`,
        )
        .setFooter({
          text: "© Copyright | LZCorp",
          iconURL: member.client.user.displayAvatarURL(),
        })
        .setColor("#87CEFA");
    } else if (member.guild.id === "1259894025050128545") {
      welcomeEmbed
        .setTitle(
          `» Bienvenue __${member.displayName}__ sur NewsMC - Communautaire !`,
        )
        .setDescription(
          `Ici, vous trouverez tout ce qui touche à Minecraft !
        
        ➜ Pour demander de l'aide > <#931915415184085003>
        ➜ Si vous cherchez un service en particulier > <#1153846455535140884>
        ➜ Pour voir notre règlement > <#931913719557025843>`,
        )
        .setFooter({
          text: "© Copyright | NewsMC",
          iconURL: member.client.user.displayAvatarURL(),
        })
        .setColor("#87CEFA");
    } else {
      welcomeEmbed
        .setTitle(
          `» Bienvenue __${member.displayName}__ sur NewsMC - Communautaire !`,
        )
        .setDescription(
          `Ici, vous trouverez tout ce qui touche à Minecraft !
          
          ➜ Pour demander de l'aide > <#931915415184085003>
          ➜ Si vous cherchez un service en particulier > <#1153846455535140884>
          ➜ Pour voir notre règlement > <#931913719557025843>`,
        )
        .setFooter({
          text: "© Copyright | NewsMC",
          iconURL: member.client.user.displayAvatarURL(),
        })
        .setColor("#87CEFA");
    }

    // Essaye de récupérer le canal de bienvenue
    const welcomeChannel = await getOrFetchChannelById(
      member.client as CustomClient,
      welcomeChannelId,
    );

    // Si le canal n'est pas trouvé, on lève une erreur
    if (!welcomeChannel || !welcomeChannel.isTextBased()) {
      throw new Error(
        `Channel with ID ${welcomeChannelId} not found not found or channel is not a text channel`,
      );
    }

    // Si tout est bon, envoie l'embed
    await welcomeChannel.send({ embeds: [welcomeEmbed] });
  } catch (error) {
    Logger.error(Logs.error.welcomeEmbedSend, member.displayName, error);
    throw error;
  }
}
