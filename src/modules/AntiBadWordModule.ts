// eslint-disable-next-line eslint-comments/disable-enable-pair
/* eslint-disable no-restricted-syntax */
// eslint-disable-next-line eslint-comments/disable-enable-pair
/* eslint-disable no-await-in-loop */
import { CustomGuild } from "database/models/GuildsModel";
import { Message } from "discord.js";
import { Logger } from "services/Logger";
import { getOrFetchMemberById } from "utils/MessageUtils";

// Liste des mots interdits
export const badWordsList = [
  // Mots vulgaires en français
  "putain",
  "pute",
  "merde",
  "connard",
  "connasse",
  "con",
  "salope",
  "enculé",
  "enculer",
  "batard",
  "bâtard",
  "fils de pute",
  "bouffon",
  "ntm",
  "nique ta mère",
  "nique ta race",
  "niquer",
  "nique",
  "fdp",
  "tg",
  "ta gueule",
  "branleur",
  "branleuse",
  "pédé",
  "tapette",
  "gouine",
  "pouffiasse",
  "trouduc",
  "trou du cul",
  "sac à merde",
  "pisseuse",
  "pissou",
  "chiotte",
  "sale con",
  "grosse merde",
  "mange merde",
  "bite",
  "couille",
  "cul",
  "petasse",
  "porc",
  "pute",
  "gros lard",
  "clochard",
  "raclure",
  "fils de chien",
  "salaud",
  "ordure",
  "enculé de ta mère",
  "foutre",
  "crevard",
  "mangeur de foin",
  "culé",
  "chiennasse",
  "va te faire foutre",
  "nique toi",
  "barrez-vous",
  "fais chier",
  "chiant",
  "chiante",
  "déchet",
  "chieur",
  "merdeux",
  "connard fini",
  "gueux",
  "sous-merde",
  "putréfié",
  "chacal",
  "rapace",
  "pourriture",
  "bâtard de merde",

  // Formes alternatives courantes en français
  "put1",
  "pu.te",
  "pu1te",
  "connrd",
  "conn***",
  "ntc",
  "niquer sa mère",
  "niq ta mère",
  "nqtm",
  "enflure",
  "s***pe",
  "br@nleur",
  "c0nnard",
  "s@lope",
  "poufi@sse",
  "sal0p3",
  "f1ls de p***",
  "n1que",
  "niq@",
  "enculé de ta r@ce",
  "ba$tard",
  "f!ls de chien",
  "t@ gu3ule",
  "enf0iré",
  "br4nleur",
  "t@pette",

  // Mots vulgaires en anglais
  "fuck",
  "shit",
  "bitch",
  "whore",
  "slut",
  "cunt",
  "asshole",
  "dick",
  "motherfucker",
  "fucker",
  "nigga",
  "nigger",
  "bastard",
  "dumbass",
  "retard",
  "faggot",
  "douche",
  "jackass",
  "jerk",
  "prick",

  // Formes alternatives en anglais
  "fck",
  "f*ck",
  "sh1t",
  "sh!t",
  "biatch",
  "btch",
  "wh0re",
  "c*nt",
  "a**hole",
  "d1ck",
  "d!ck",
  "mthrfkr",
  "mf",
  "fkr",
  "slut",
  "ret4rd",
  "n1gga",
  "n!gger",
  "nigg4",
  "b@stard",
  "f@ggot",
  "f@g",

  // Termes racistes ou discriminatoires
  "nazi",
  "hitler",
  "kike",
  "beaner",
  "wetback",
  "spic",
  "chink",
  "gook",
  "cracker",
  "honky",

  // Formes adoucies
  "frick",
  "dang",
  "heck",
  "buttface",
  "jerkwad",
  "bullshit",
  "baloney",
  "horseshit",
  "piss",
];

// Fonction pour normaliser les chaînes de caractères
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD") // Décompose les accents
    .replace(/[\u0300-\u036f]/g, "") // Supprime les accents
    .replace(/(.)\1+/g, "$1") // Réduit les répétitions de lettres (e.g. puuuute -> pute)
    .replace(/[@]/g, "a") // Substitue @ par a
    .replace(/[!1]/g, "i") // Substitue ! ou 1 par i
    .replace(/[€3]/g, "e") // Substitue € ou 3 par e
    .replace(/[$5]/g, "s") // Substitue $ ou 5 par s
    .replace(/[0o]/g, "o") // Substitue 0 ou o par o
    .replace(/[^a-zA-Z ]/g, ""); // Supprime les caractères non alphabétiques
}

// Fonction pour vérifier les bad words
export async function antiBadWordsModule(
  message: Message,
  guild: CustomGuild,
): Promise<boolean> {
  const member = await getOrFetchMemberById(message.guild!, message.author.id);

  if (member) {
    if (
      member.roles.cache.some((role) => guild.bypass_roles.includes(role.id))
    ) {
      return false;
    }
  }

  const normalizedMessage = normalizeText(message.content);

  // Vérifie si le message contient un mot de la liste des bad words
  for (const badWord of badWordsList) {
    const normalizedBadWord = normalizeText(badWord);
    const badWordRegex = new RegExp(`\\b${normalizedBadWord}\\b`, "i");
    if (badWordRegex.test(normalizedMessage)) {
      try {
        await message.delete();
        await message.author.send(
          "Votre message contenait un langage inapproprié et a été supprimé.",
        );
        return true; // Bad word détecté
      } catch (error) {
        Logger.error("Erreur lors de la gestion des bad words :", error);
      }
    }
  }

  return false; // Aucun bad word détecté
}
