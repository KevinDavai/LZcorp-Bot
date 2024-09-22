import { Events, Guild, GuildMember } from "discord.js";
import { createGuild } from "database/utils/GuildsUtils";
import { Logger } from "services/Logger";
import { CustomClient } from "../../structures/CustomClient";
import { BaseEvent } from "../../structures/BaseEvent";

export class GuildMemberUpdate extends BaseEvent {
  constructor(client: CustomClient) {
    super(client, {
      name: Events.GuildMemberUpdate,
      description: "GuildMemberUpdate Event",
      once: false,
    });
  }

  async execute(oldMember: GuildMember, newMember: GuildMember) {
    await handleMemberUpdate(oldMember, newMember);
  }
}

async function handleMemberUpdate(
  oldMember: GuildMember,
  newMember: GuildMember,
): Promise<void> {
  // Vérifier si le boost a été annulé
  if (oldMember.premiumSince && !newMember.premiumSince) {
    // IDs des rôles à retirer
    const boosterRoles = [
      "1154899942075285635", // Baron du Dév
      "1154900013915308112", // Créateur de Rêves
      "1154900011038019704", // Maître Bâtisseur
      "1154900624073306252", // Rêveur Romantique
      "1154900622076825630", // Daron des canapés
      "1154900016838742036", // Amateur de Cocktails
      "1154900022199066655", // Sensei
      "1154900020114509884", // Modo Discord
    ];

    try {
      // Retirer les rôles de boost au membre
      boosterRoles.forEach(async (roleId) => {
        if (newMember.roles.cache.has(roleId)) {
          await newMember.roles.remove(roleId);
        }
      });

      Logger.info(
        `Les rôles de boost ont été retirés de ${newMember.user.tag}.`,
      );
    } catch (error) {
      Logger.error("Erreur lors du retrait des rôles de boost:", error);
    }
  }
}
