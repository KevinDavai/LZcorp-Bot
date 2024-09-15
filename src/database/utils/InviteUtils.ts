import { CustomInvite, InviteModel } from "database/models/InviteModel";
import { Guild, Invite } from "discord.js";
import { CustomClient } from "structures/CustomClient";

export async function createGuildInvite(guildId: string, invite: Invite) {
  const newInvite = new InviteModel({
    code: invite.code,
    guildId,
    inviterId: invite.inviter ? invite.inviter.id : null,
    uses: invite.uses,
    invitedUsers: [],
    isDeleted: false,
  });

  await newInvite.save();
  return newInvite;
}

export async function checkNewInvite(client: CustomClient): Promise<void> {
  const guilds = client.guilds.cache;

  guilds.each(async (guild) => {
    // Récupère toutes les invitations de la guilde
    const invites = await guild.invites.fetch();

    // Vérifie et ajoute les nouvelles invitations dans la base de données
    await Promise.all(
      invites.map(async (invite) => {
        const existingInvite = await InviteModel.findOne({
          code: invite.code,
        });

        if (!existingInvite) {
          const newInvite = new InviteModel({
            code: invite.code,
            guildId: guild.id,
            inviterId: invite.inviter?.id || "", // Peut être null donc fallback sur chaîne vide
            uses: invite.uses,
            invitedUsers: [], // À définir selon ta logique pour traquer les utilisateurs invités
            isDeleted: false,
          });
          await newInvite.save();
        }
      }),
    );

    // Récupérer les invitations dans la base de données pour cette guilde
    const dbInvites = await getGuildInvites(guild.id);

    // Vérifier les invitations supprimées
    await Promise.all(
      dbInvites.map(async (dbInvite) => {
        const inviteExists = invites.some(
          (invite) => invite.code === dbInvite.code,
        );

        // Si l'invitation n'existe plus sur Discord mais est dans la DB, la marquer comme supprimée
        if (!inviteExists && !dbInvite.isDeleted) {
          // Créer une nouvelle instance avec les modifications
          await InviteModel.findOneAndUpdate(
            { code: dbInvite.code, isDeleted: false },
            { $set: { isDeleted: true } },
          );
        }
      }),
    );
  });
}

export async function deleteGuildInvite(guildId: string, inviteCode: string) {
  await InviteModel.findOneAndUpdate(
    { guildId, code: inviteCode },
    { isDeleted: true },
  );
}

export async function getTop10Invites(guild: Guild) {
  const invites = await InviteModel.aggregate([
    {
      $match: { guildId: guild.id }, // On filtre par guildId et on s'assure que l'invitation n'est pas supprimée
    },
    {
      $group: {
        _id: "$inviterId", // Grouper par inviterId
        totalInvitedUsers: { $sum: { $size: "$invitedUsers" } }, // Somme des utilisateurs invités (taille du tableau invitedUsers)
        totalInvitations: { $sum: "$uses" }, // Somme des invitations réussies
      },
    },
    {
      $sort: { totalInvitedUsers: -1 }, // Trier par le nombre total d'invités en ordre décroissant
    },
    {
      $limit: 10, // Limite aux 10 premiers
    },
    {
      $project: {
        inviterId: "$_id", // Renommer _id en inviterId
        totalInvitedUsers: 1, // Inclure le total des utilisateurs invités
        totalInvitations: 1, // Somme des invitations réussies
        totalFailedInvites: {
          $subtract: ["$totalInvitations", "$totalInvitedUsers"],
        }, // Calculer les invitations échouées
        _id: 0, // Exclure le champ _id
      },
    },
  ]);

  return invites;
}
export async function deleteUserFromInvite(userId: string) {
  await InviteModel.findOneAndUpdate(
    { invitedUsers: userId }, // Query to find the document where invitedUsers contains userId
    { $pull: { invitedUsers: userId } }, // Update to remove userId from invitedUsers array
  );
}

export async function addUserToInvite(
  usedInvite: Invite,
  userInvitedId: string,
  guildId: string,
) {
  await InviteModel.findOneAndUpdate(
    { code: usedInvite.code, guildId, isDeleted: false },
    { $inc: { uses: 1 }, $push: { invitedUsers: userInvitedId } },
    { upsert: true, new: true },
  );
}

export async function getGuildInvites(guildId: string) {
  const invites = await InviteModel.find<CustomInvite>({ guildId });
  return invites;
}

export async function getAllInviteByUser(userId: string) {
  const invites = await InviteModel.find<CustomInvite>({
    inviterId: userId,
  });
  return invites;
}

export async function GENERATEINVITE() {
  const testData = [];

  const guildId = "916487743004114974";

  for (let i = 0; i < 100; i += 1) {
    const inviterId = `user_${Math.floor(Math.random() * 10) + 1}`;
    const uses = Math.floor(Math.random() * 100);
    const invitedUsers = Array.from(
      { length: uses },
      (_, idx) => `user_invited_${i}_${idx}`,
    );

    testData.push({
      code: `invite_${i}`,
      guildId,
      inviterId,
      uses,
      invitedUsers,
      isDeleted: true,
    });
  }

  // Insert generated data into the database
  await InviteModel.insertMany(testData);

  console.log("100 invite documents generated successfully!");
}
