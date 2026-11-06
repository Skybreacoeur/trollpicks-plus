#!/usr/bin/env node
/*
  TrollPicks+ : départ automatique de la Partie truquée.

  À lancer sur UN seul PC qui joue la partie, avec le code de la salle :
      node trollpicks-start.mjs ABCD

  Toutes les secondes, le script lit l'horloge de la partie via l'API locale du jeu
  (https://127.0.0.1:2999/liveclientdata/gamestats, disponible seulement pendant une partie)
  et envoie le vrai 0:00 à la salle TrollPicks+ (canal Supabase tp-room-ABCD, clé publique).
  Le site recale alors le chrono, les ordres du Pantin, la pièce de Pile ou Face,
  les missions et les événements pour tous.

  Aucun compte, aucun Riot ID, rien d'autre n'est envoyé : seulement le temps de jeu.
  Pour tester sans lancer LoL :  node trollpicks-start.mjs ABCD --simuler=95
  (fait comme si une partie était à 1:35).
  Nécessite Node.js 18 ou plus récent. Ctrl+C pour arrêter.
*/
import https from "node:https";

const SB_URL = "https://htixherrflbcyqikrwnn.supabase.co";
const SB_KEY = "sb_publishable_LKbQM48TJjDut7tUfQWMHg_2wbiKrCf";   // clé publique, la même que le site
const RESEND_MS = 10_000;   // renvoi régulier : l'hôte qui recharge sa page ou distribue en retard se recale

const args = process.argv.slice(2);
const code = (args.find(a => !a.startsWith("--")) || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
const simArg = args.find(a => a.startsWith("--simuler="));
const simStart = simArg ? Date.now() - Number(simArg.split("=")[1]) * 1000 : null;

if (code.length !== 4) {
  console.error("Usage : node trollpicks-start.mjs CODE   (le code à 4 caractères de la salle TrollPicks+)");
  process.exit(1);
}
const topic = `tp-room-${code}`;
const fmt = s => `${Math.floor(s / 60)}:${String(Math.floor(s) % 60).padStart(2, "0")}`;

/* Le jeu sert son API locale avec un certificat auto-signé :
   la vérification n'est désactivée QUE pour cette requête vers 127.0.0.1. */
const localAgent = new https.Agent({ rejectUnauthorized: false });
function readGameTime() {
  if (simStart) return Promise.resolve((Date.now() - simStart) / 1000);
  return new Promise(resolve => {
    const req = https.get({ host: "127.0.0.1", port: 2999, path: "/liveclientdata/gamestats", agent: localAgent, timeout: 800 }, res => {
      let body = "";
      res.on("data", chunk => body += chunk);
      res.on("end", () => {
        try { const t = JSON.parse(body).gameTime; resolve(typeof t === "number" && t >= 0 ? t : null); }
        catch { resolve(null); }   // pas encore en jeu (écran de chargement)
      });
    });
    req.on("error", () => resolve(null));   // pas de partie en cours
    req.on("timeout", () => { req.destroy(); resolve(null); });
  });
}

async function broadcast(event, payload) {
  const res = await fetch(`${SB_URL}/realtime/v1/api/broadcast`, {
    method: "POST",
    headers: { apikey: SB_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({ messages: [{ topic, event, payload }] })
  });
  if (!res.ok) throw new Error(`Supabase a répondu ${res.status} ${await res.text()}`);
}

let inGame = false, lastSent = 0, busy = false;
console.log(`TrollPicks+ : salle ${code}. En attente d'une partie de LoL… (Ctrl+C pour arrêter)`);
if (simStart) console.log("Mode simulation : aucune partie réelle n'est lue.");

setInterval(async () => {
  if (busy) return;
  busy = true;
  try {
    const t = await readGameTime();
    if (t == null) {
      if (inGame) {
        inGame = false;
        console.log("Partie terminée.");
        await broadcast("game-end", {}).catch(e => console.error("Envoi impossible :", e.message));
      }
      return;
    }
    const now = Date.now();
    if (!inGame || now - lastSent >= RESEND_MS) {
      // gameTime permet à l'hôte de recaler sans dépendre de l'heure de ce PC ; startedAt est donné à titre indicatif
      await broadcast("game-start", { startedAt: Math.round(now - t * 1000), gameTime: t, sentAt: now });
      lastSent = now;
      if (!inGame) console.log(`Partie détectée (horloge à ${fmt(t)}) : chrono envoyé à la salle ${code}.`);
      inGame = true;
    }
  } catch (e) {
    console.error("Envoi impossible :", e.message);
  } finally {
    busy = false;
  }
}, 1000);
