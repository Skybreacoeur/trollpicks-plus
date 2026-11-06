# TrollPicks+

Randomizer League of Legends façon table de casino. Site : https://skybreacoeur.github.io/trollpicks-plus/

## Solo
Champion, lane et type de build tirés à la roue, puis un build complet et cohérent : objets dans l'ordre d'achat, objets selon la game, runes, sorts, ordre des compétences et taux de troll. La lane peut être verrouillée. Chaque ticket se partage par lien (`#p=`), en texte ou en image PNG prête pour Discord. Historique et réglages (classes, builds, bans, vitesse).

- Builds du moment : pour les 50 champions les plus joués, quand la roue tombe sur leur build habituel, les 3 premiers objets, les bottes et la rune viennent d'OP.GG (patch 16.22, constante `CHAMP_META`, à mettre à jour quand la méta change).
- Taux de troll : la lane et le build tirés sont comparés au profil réel du champion (constante `PROFILES`).
- Données : Data Dragon (API publique de Riot), mises à jour à chaque visite. Listes d'objets par build dans `BUILDS` ; un objet retiré par Riot est remplacé automatiquement (`FALLBACK`, test : `?retirer=3089,3031`).

## En ligne
Une salle à code (4 caractères ou lien d'invitation), rejointe depuis chaque PC.
- Troll picks en direct : un pick par joueur, lanes verrouillables, un joker par joueur.
- Partie truquée : rôles secrets de 3 à 10 joueurs, un Tricheur par équipe (Pantin, Pile ou Face, Flambeur, High Roller, Bluffeur, Âme liée, Honnête joueur), événements pour tous (désactivables), vote depuis chaque PC, révélation et points. Inspirée du concept Among Legends de Solary, avec des rôles et visuels propres au site.

Technique : Supabase Realtime (diffusion et présence, sans base de données). L'hôte fait foi et diffuse l'état de la salle ; les rôles sont chiffrés pour chaque joueur (ECDH P-256 + AES-GCM) ; si l'hôte part, le joueur arrivé le plus tôt reprend la main. `index.html` ne contient que la clé publique (publishable) du projet.

Pendant la game : son d'alerte, notifications Windows (à activer), chrono dans un worker pour ne pas être ralenti quand LoL est au premier plan.

## Départ automatique (facultatif)
`outils/trollpicks-start.mjs` (Node.js 18+) lit l'horloge de la partie sur l'API locale du jeu (`https://127.0.0.1:2999/liveclientdata/gamestats`, certificat auto-signé accepté pour cette seule adresse) et envoie `gameTime` toutes les 10 secondes, puis `game-end`. L'hôte recale le chrono ; le bouton « La game commence » reste en secours.
- Permanent (sans argument) : tourne en fond avec une clé propre au PC (`%LOCALAPPDATA%\TrollPicks`, journal `trollpicks-start.log`, une seule copie à la fois) et envoie sur `tp-pc-<CLÉ>`. La clé se colle une fois dans la salle (« Clé de ton PC »), le site relaie à la salle. Démarrage avec Windows : `TrollPicks-Start.vbs` dans le dossier Démarrage. Désinstaller : supprimer ce fichier et arrêter le processus indiqué dans `trollpicks-start.pid`.
- Ponctuel : `node trollpicks-start.mjs CODE`.
- Options : `--simuler=95` (test sans LoL), `--cle` (affiche la clé).

## Cartes de rôle
Dessinées dans Figma (« TrollPicks+ — Cartes de la Partie truquée », https://www.figma.com/design/bAYhpiQMBsy9th4fyrYIjC, composant « Carte de rôle »). Les illustrations sont exportées en SVG dans `cartes/`, le reste de la carte est en HTML (`roleCardHTML`).

---
TrollPicks+ n'est pas approuvé par Riot Games et ne reflète pas les opinions de Riot Games ou de toute personne officiellement impliquée dans la production ou la gestion de League of Legends. League of Legends et Riot Games sont des marques de Riot Games, Inc.
