# TrollPicks+

Randomizer League of Legends façon table de casino : champion, lane, type de build, puis un build complet et cohérent (objets dans l'ordre d'achat, objets selon la game, runes, sorts, ordre des compétences). Mode équipe de 2 à 5 joueurs avec rôles verrouillables, historique et réglages. En solo, on peut aussi verrouiller sa lane.

La Partie truquée : un mode à rôles secrets pour jouer une vraie game entre potes (3 à 10 joueurs, un Tricheur par équipe, vote et points à la fin), inspiré du concept Among Legends de Solary avec des rôles et des visuels propres au site. Chaque joueur reçoit un lien secret (#r=) qui affiche sa carte, les ordres du Pantin et les tirages de Pile ou Face, sans serveur.

Site : https://skybreacoeur.github.io/trollpicks-plus/

Partage : chaque ticket (ou équipe) peut être envoyé par lien, le tirage complet est rangé dans l'adresse (`#p=` ou `#t=`), ou en image PNG prête pour Discord.

Builds du moment : pour les 50 champions les plus joués, quand la roue tombe sur leur build habituel, les 3 premiers objets, les bottes et la rune viennent d'OP.GG (patch 16.22, constante `CHAMP_META`, à mettre à jour quand la méta change). Le taux de troll compare la lane et le build tirés au profil réel du champion (constante `PROFILES` : lanes, builds méta et builds jouables).

Les données (champions, objets, runes, sorts) viennent de Data Dragon, l'API publique de Riot, et se mettent à jour à chaque visite. Les listes d'objets par type de build sont dans `index.html` (constante `BUILDS`). Si Riot retire un objet, il est remplacé automatiquement par un objet du patch qui a les mêmes statistiques (constante `FALLBACK`). Pour tester : ajouter `?retirer=3089,3031` à l'adresse.

TrollPicks+ n'est pas approuvé par Riot Games et ne reflète pas les opinions de Riot Games ou de toute personne officiellement impliquée dans la production ou la gestion de League of Legends. League of Legends et Riot Games sont des marques de Riot Games, Inc.
