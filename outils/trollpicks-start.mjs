#!/usr/bin/env node
/*
  TrollPicks+ : départ automatique de la Partie truquée.

  Deux façons de l'utiliser :

  1. Permanent (recommandé) : sans code de salle, le script tourne en fond (au démarrage de Windows)
       node trollpicks-start.mjs
     Il utilise une clé propre à ce PC (créée au premier lancement, affichée avec --cle).
     Colle cette clé une fois dans TrollPicks+ (onglet En ligne) : quand tu es dans une salle,
     le site relaie le départ de chaque partie à la salle.

  2. Ponctuel : avec le code de la salle, il envoie directement à cette salle
       node trollpicks-start.mjs ABCD

  Le script lit l'horloge de la partie via l'API locale du jeu
  (https://127.0.0.1:2999/liveclientdata/gamestats, disponible seulement pendant une partie)
  et envoie gameTime (canal Supabase, clé publique). Aucun compte ni Riot ID n'est envoyé.

  Options : --cle (affiche la clé de ce PC), --simuler=95 (teste sans LoL, partie à 1:35).
  Nécessite Node.js 18 ou plus récent. Ctrl+C pour arrêter.
*/
import https from "node:https";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";

const SB_URL = "https://htixherrflbcyqikrwnn.supabase.co";
const SB_KEY = "sb_publishable_LKbQM48TJjDut7tUfQWMHg_2wbiKrCf";   // clé publique, la même que le site
const RESEND_MS = 10_000;   // renvoi régulier : un hôte qui recharge sa page ou distribue en retard se recale
const KEY_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

const args = process.argv.slice(2);
const code = (args.find(a => !a.startsWith("--")) || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
const simArg = args.find(a => a.startsWith("--simuler="));
const simStart = simArg ? Date.now() - Number(simArg.split("=")[1]) * 1000 : null;

/* ---------- dossier de travail : clé du PC et journal ---------- */
const DIR = path.join(process.env.LOCALAPPDATA || path.join(os.homedir(), ".config"), "TrollPicks");
fs.mkdirSync(DIR, { recursive: true });
const CONFIG = path.join(DIR, "config.json"), LOG = path.join(DIR, "trollpicks-start.log");
function pcKey() {
  try { const k = JSON.parse(fs.readFileSync(CONFIG, "utf8")).key; if (/^[A-Z2-9]{4}-[A-Z2-9]{4}$/.test(k)) return k; } catch {}
  const raw = Array.from({ length: 8 }, () => KEY_CHARS[Math.floor(Math.random() * KEY_CHARS.length)]).join("");
  const k = `${raw.slice(0, 4)}-${raw.slice(4)}`;
  fs.writeFileSync(CONFIG, JSON.stringify({ key: k }, null, 2));
  return k;
}
function log(msg) {
  const line = `[${new Date().toLocaleString("fr-FR")}] ${msg}`;
  console.log(line);
  try {
    if (fs.existsSync(LOG) && fs.statSync(LOG).size > 200_000) fs.writeFileSync(LOG, "");   // journal limité
    fs.appendFileSync(LOG, line + "\n");
  } catch {}
}

if (args.includes("--cle")) { console.log(`Clé de ce PC : ${pcKey()}`); process.exit(0); }
if (code && code.length !== 4) { console.error("Le code d'une salle fait 4 caractères. Sans code, le script passe en mode permanent."); process.exit(1); }

/* Mode permanent : une seule copie à la fois (démarrage de Windows + lancement à la main, par exemple). */
if (!code && !simStart) {
  const LOCK = path.join(DIR, "trollpicks-start.pid");
  try {
    const pid = Number(fs.readFileSync(LOCK, "utf8"));
    if (pid && pid !== process.pid) { process.kill(pid, 0); console.log(`Déjà lancé (processus ${pid}).`); process.exit(0); }
  } catch {}   // pas de verrou, ou ancien processus terminé
  fs.writeFileSync(LOCK, String(process.pid));
  const unlock = () => { try { if (fs.readFileSync(LOCK, "utf8") === String(process.pid)) fs.unlinkSync(LOCK); } catch {} };
  process.on("exit", unlock);
  for (const sig of ["SIGINT", "SIGTERM"]) process.on(sig, () => process.exit(0));
}

const key = code ? null : pcKey();
const topic = code ? `tp-room-${code}` : `tp-pc-${key}`;
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

let inGame = false, lastSent = 0;
log(code ? `Salle ${code} : en attente d'une partie de LoL.` : `Mode permanent, clé de ce PC : ${key}. En attente d'une partie de LoL.`);
if (simStart) log("Mode simulation : aucune partie réelle n'est lue.");

/* Une lecture par seconde pendant une partie, toutes les 2 secondes sinon (une requête locale, quasi gratuite). */
async function loop() {
  try {
    const t = await readGameTime();
    if (t == null) {
      if (inGame) {
        inGame = false;
        log("Partie terminée.");
        await broadcast("game-end", {}).catch(e => log("Envoi impossible : " + e.message));
      }
    } else {
      const now = Date.now();
      if (!inGame || now - lastSent >= RESEND_MS) {
        // gameTime permet à l'hôte de recaler sans dépendre de l'heure de ce PC ; startedAt est indicatif
        await broadcast("game-start", { startedAt: Math.round(now - t * 1000), gameTime: t, sentAt: now });
        lastSent = now;
        if (!inGame) log(`Partie détectée (horloge à ${fmt(t)}) : départ envoyé.`);
        inGame = true;
      }
    }
  } catch (e) {
    log("Envoi impossible : " + e.message);
  }
  setTimeout(loop, inGame ? 1000 : 2000);
}
loop();
