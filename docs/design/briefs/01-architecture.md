# Brief 1 · Présenter une architecture technique

**Pour un agent.** Fais-en une présentation rikiki. Rends-la, contrôle-la,
corrige ce qui est signalé, et livre le fichier autonome plus le PDF.

## La demande

Nous migrons le stockage des fichiers clients depuis un disque partagé vers un
stockage objet. Je dois présenter l'architecture cible à l'équipe plateforme
lundi. Ils connaissent le système actuel, pas le nouveau.

## Contraintes

- Audience : cinq ingénieurs plateforme, à l'aise techniquement
- Durée : 15 minutes, questions comprises
- Contexte : projeté en salle, puis relu seul par ceux qui manquent
- Langue : français
- Thème : rikiki

## Faits autorisés

Ce sont les seuls chiffres et noms utilisables.

- Le disque partagé actuel héberge 4,2 To répartis sur 1,8 million de fichiers.
- Le pic de lecture observé est de 120 requêtes par seconde, le 14 mars 2026.
- La cible est un stockage objet compatible S3, auto-hébergé, avec réplication
  sur deux sites.
- Trois services écrivent aujourd'hui sur le disque : `ingest`, `report`, `archive`.
- La bascule est prévue en deux phases : double écriture pendant six semaines,
  puis lecture depuis le stockage objet.
- Le budget accepté couvre 6 To utiles.
- Aucune mesure de latence n'a encore été faite sur la cible.

## Résultat attendu

Un deck qui laisse l'équipe capable de dire, sans notes, ce qui change pour leur
service et ce qui reste identique. La question ouverte de la latence doit être
visible, pas cachée.

## La modification ciblée

Une fois le deck livré, on demandera : « ajoute une slide sur le plan de retour
arrière, juste avant la conclusion, et ne touche à rien d'autre ». Les autres
slides doivent rester identiques, octet pour octet.
