# Cinq briefs, et comment on les juge

Ces briefs servent à mesurer ce que rikiki permet, pas à faire une démonstration.
Chacun est écrit comme une demande réelle : des faits fournis, des contraintes,
et un résultat attendu. Aucun ne dit quels composants employer.

## Comment s'en servir

Donner un brief tel quel à un agent, depuis un dossier où `rikiki-deck` est
installé, sans lui donner accès à ce dépôt. Le guide de travail et la référence
qu'il trouvera dans `node_modules/rikiki-deck/docs/llms/` sont les seules
instructions auxquelles il a droit : c'est précisément ce qui est évalué.

## Les faits sont les seuls autorisés

Chaque brief liste les faits utilisables. **Un chiffre absent de cette liste ne
doit pas apparaître dans le deck.** Un deck qui invente une mesure échoue le
brief, même s'il est beau. C'est le critère le plus important des neuf.

## Ce qu'on regarde

| Critère | Question |
|---|---|
| Fidélité | le deck répond-il au brief, ou à côté ? |
| Exactitude | chaque chiffre vient-il des faits fournis ? |
| Récit | l'ordre des slides tient-il un raisonnement ? |
| Lisibilité | hiérarchie, densité, taille à distance de projection |
| Défauts techniques | ce que `rikiki check` rapporte, en erreurs et avertissements |
| PDF | l'export est-il lisible, une page par slide ? |
| Hors ligne | le fichier autonome s'ouvre-t-il sans réseau ? |
| Reprises | combien d'interventions humaines pour arriver au résultat ? |
| Modification ciblée | une demande sur une slide laisse-t-elle les autres intactes ? |

## Ce qu'on consigne

Pour chaque exécution, dans `resultats/<date>-<brief>.md` :

- l'agent employé et sa version ;
- les instructions données, mot pour mot ;
- **chaque intervention humaine**, y compris une relance ou un indice ;
- la sortie de `rikiki check` avant et après corrections ;
- ce qui a marché, ce qui a échoué, et ce qui reste à vérifier.

Une exécution conduite à la main, ou guidée pas à pas, se consigne comme telle.
**Elle ne se présente jamais comme une exécution autonome.** Un score global
sans ces détails ne prouve rien et n'a pas sa place ici.
