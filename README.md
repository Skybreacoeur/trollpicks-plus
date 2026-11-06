# TrollPicks+

Randomizer League of Legends façon table de casino : champion, lane, type de build, puis un build complet et cohérent (objets dans l'ordre d'achat, objets selon la game, runes, sorts, ordre des compétences). Mode équipe de 2 à 5 joueurs avec rôles verrouillables, historique et réglages. En solo, on peut aussi verrouiller sa lane.

En ligne : on crée une salle (code de 4 caractères ou lien d'invitation) et chacun la rejoint depuis son téléphone. L'hôte lance soit des troll picks en direct (lanes verrouillables, un joker par joueur), soit la Partie truquée : rôles secrets de 3 à 10 joueurs, un Tricheur par équipe, ordres du Pantin, pièce de Pile ou Face, événements pour tous, vote sur chaque téléphone, révélation et points. Inspiré du concept Among Legends de Solary, avec des rôles et visuels propres au site.

Technique du mode en ligne : Supabase Realtime (canaux de diffusion et présence, sans base de données). L'hôte fait foi et diffuse l'état de la salle ; les rôles sont chiffrés pour chaque joueur (ECDH P-256 + AES-GCM) ; si l'hôte part, le joueur arrivé le plus tôt reprend la main. La clé utilisée dans index.html est la clé publique (publishable) du projet. Une version sans connexion (liens secrets #r=) reste disponible.

Départ automatique (facultatif) : sur un seul PC qui joue, lancer pendant la partie `node outils/trollpicks-start.mjs CODE` (Node.js 18+). Le script lit l'horloge de la partie sur l'API locale du jeu (https://127.0.0.1:2999/liveclientdata/gamestats, certificat auto-signé accepté pour cette seule adresse) et envoie `game-start` { startedAt, gameTime } dans le canal de la salle toutes les 10 secondes, puis `game-end` à la fin. L'hôte recale le chrono à partir de gameTime ; le bouton « La game commence » reste en secours. Test sans LoL : `--simuler=95`.

Pensé pour PC : pendant la game, la page joue un son d'alerte et peut envoyer des notifications Windows (bouton « Activer les notifications »). Le chrono tourne dans un worker pour ne pas être ralenti quand LoL est au premier plan.

Cartes de rôle : dessinées dans Figma (fichier « TrollPicks+ — Cartes de la Partie truquée », https://www.figma.com/design/bAYhpiQMBsy9th4fyrYIjC, composant « Carte de rôle »). Les illustrations sont exportées en SVG dans cartes/ ; le reste de la carte est reconstruit en HTML (fonction roleCardHTML). Pour changer une illustration : la modifier dans Figma, réexporter le calque « Illustration » en SVG et remplacer le fichier dans cartes/.

Site : https://skybreacoeur.github.io/trollpicks-plus/

Partage : chaque ticket (ou équipe) peut être envoyé par lien, le tirage complet est rangé dans l'adresse (`#p=` ou `#t=`), ou en image PNG prête pour Discord.

Builds du moment : pour les 50 champions les plus joués, quand la roue tombe sur leur build habituel, les 3 premiers objets, les bottes et la rune viennent d'OP.GG (patch 16.22, constante `CHAMP_META`, à mettre à jour quand la méta change). Le taux de troll compare la lane et le build tirés au profil réel du champion (constante `PROFILES` : lanes, builds méta et builds jouables).

Les données (champions, objets, runes, sorts) viennent de Data Dragon, l'API publique de Riot, et se mettent à jour à chaque visite. Les listes d'objets par type de build sont dans `index.html` (constante `BUILDS`). Si Riot retire un objet, il est remplacé automatiquement par un objet du patch qui a les mêmes statistiques (constante `FALLBACK`). Pour tester : ajouter `?retirer=3089,3031` à l'adresse.

TrollPicks+ n'est pas approuvé par Riot Games et ne reflète pas les opinions de Riot Games ou de toute personne officiellement impliquée dans la production ou la gestion de League of Legends. League of Legends et Riot Games sont des marques de Riot Games, Inc.
