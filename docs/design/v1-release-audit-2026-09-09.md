# Audit de préparation v1.0 · 2026-09-09

Base : `3b81ef7`, arbre propre au début. Audit statique du code, de la CI, des documents et du site construit. Les correctifs et la recette finale sont consignés dans la mise à jour ci-dessous. Aucun contrôle du déploiement distant ni du registre npm n'est possible depuis le dépôt.

Verdict : préparation avancée, mais pas encore de preuve suffisante pour déclarer la release prête. Les tests du moteur ne démontrent ni le parcours public installé ni la qualité éditoriale promise. Ce document complète le plan actif et remplace le verdict trop large de la préparation précédente.

## Plan priorisé

| ID | Priorité | Défaut et preuve | Correction et acceptation | Estimation |
|---|---|---|---|---|
| R1 | P1 | `rikiki/llms.txt` emploie `docs/llms/...` et `README.md`. Servi à `/llms.txt`, il pointe vers des fichiers absents ; servi à `/rikiki/llms.txt`, le README reste absent. `site/scripts/stage-assets.mjs` ne publie pas ce README. | Générer une entrée web avec les bonnes URL, garder les chemins locaux pour npm. Parcourir les liens du site construit et vérifier leur destination, depuis les deux entrées LLM. | 0,5 j |
| R2 | P1 | `site/src/pages/docs/getting-started.astro` propose npm puis un HTML chargeant `rikiki/dist/index.js`. Un simple `npm install rikiki-deck` installe sous `node_modules/rikiki-deck`, et la copie proposée conserve le nom `rikiki-deck`. Le chemin requis n'est pas créé par ce parcours. | Utiliser `rikiki init` comme parcours principal, préciser le répertoire servi et l'URL exacte. Exécuter littéralement le quickstart dans un dossier vierge ; vérifier trois slides et zéro requête manquante. | 0,5 j |
| R3 | P1 | `rikiki/scripts/packaging.test.mjs` exécute la CLI dans le dépôt avec ses dépendances de développement. La CI ne construit ni n'installe un tarball pour la recette. Les commandes `render/check` depuis le paquet final ne sont donc pas protégées automatiquement. | Ajouter une recette isolée du véritable tarball, chemin contenant des espaces, sans dépendance au clone : init, assemble, skills, check, render, bundle et export. Vérifier peers absents/présents, JSON et codes de sortie, PDF et bundle hors ligne. Rendre cette recette obligatoire avant publish. | 1–2 j |
| R4 | P1 | `rikiki/build-vendor.mjs` supprime les commentaires légaux (`legalComments: none`) ; seuls les LICENSE du projet sont suivis. `npm audit --omit=dev` ignore les bibliothèques empaquetées depuis devDependencies, notamment Mermaid et Shiki. Le précédent « zéro vulnérabilité » ne couvre pas tous les octets distribués. | Inventorier les dépendances réellement incorporées, versions, notices et licences ; produire les notices tierces avec le paquet/site/bundle. Auditer ce graphe et documenter séparément les dépendances de build et celles livrées. Vérifier le tarball final. | 1 j |
| R5 | P1 pour la promesse agent | Le plan actif, section « Lot D », ne consigne qu'une exécution du brief 5 et précise que l'évaluation par un agent extérieur reste à faire. La préparation précédente a supprimé ce reste à faire sans apporter les quatre évaluations manquantes. | Exécuter les cinq briefs à partir du paquet et des instructions distribuées. Conserver plans, sources, captures, rapports, notes et livrables ; relever interventions manuelles, erreurs, qualité éditoriale et révisions. Réconcilier explicitement la portée v1 avec ces résultats. | 2–3 j |
| R6 | P2 avant déploiement | `.gitlab-ci.yml` a maintenant `try_files ... =404`, mais smoke-test ne vérifie aucune 404 ni MIME. Le build du site n'est pas dans les needs du publish npm. | Tester l'image nginx construite avant déploiement : routes 200, fichier/route inexistants 404, JS/mjs CSS avec les MIME attendus. Exiger le build du site sur les tags si site et paquet constituent une seule release. | 0,5–1 j |
| R7 | P2 | Le changelog web attribue des tailles actuelles à la section 0.1.0, avec une phrase ambiguë sur les dépendances incluses dans index.js. Hero annonce 29 composants documentés, d'autres surfaces 35 composants cœur. Le manifeste cite encore deck-timer.js et deck-pdf.js comme modules. | Distinguer 35 éléments cœur, entrées du catalogue et extras ; dériver les chiffres depuis les manifests existants. Conserver les notes historiques, déplacer les mesures actuelles dans une section datée. Remplacer les modules fictifs et expliciter cœur vs chargement initial. | 0,5 j |
| R8 | P2 | `site/scripts/lint-links.mjs` interdit deux chaînes mais ne vérifie pas l'existence des liens et ignore les symlinks. Son succès ne démontre pas la validité des URL documentées. | Ajouter un contrôle du HTML/Markdown construit, chemins et ancres internes, incluant les points d'entrée LLM. Nommer précisément le contrôle existant de références interdites. | 0,5 j |
| R9 | P2 | La section « reste à faire » du plan actif mélange tâches faites et non vérifiées ; oss-readiness annonce la passe terminée. Le rapport local Playwright n'est pas un rapport détaillé archivé, contrairement à la CI qui configure déjà JSON. | Tenir une matrice unique ouvert/fait/vérifié/différé avec commit et preuve ; restaurer les évaluations manquantes. Archiver la recette finale JSON, le hash du tarball et les résultats du pipeline de tag. | 0,5 j |
| R10 | P3 | `rikiki/e2e/zzprobe.spec.ts` n'a aucune assertion, utilise un délai fixe et imprime des mesures ; il compte comme trois tests réussis. | Retirer la sonde de la suite ou en faire une vraie assertion de comportement. Expliquer les 19 skips et les exclusions par navigateur dans la recette. | 0,25 j |
| R11 | P3 | Le site déclare désormais Node >=22.12, mais CONTRIBUTING ne décrit pas son installation/validation ; aucune sélection locale de Node n'accompagne le changement. Le manifeste garantit encore un fonctionnement futur non vérifiable. | Documenter Node 24 pour contribuer et le parcours site ; exprimer la promesse d'archivage comme un contrat vérifié hors ligne. | 0,25 j |

## Ordre et dépendances

1. R1, R2 et R8 ensemble : parcours public et liens. R4 peut avancer en parallèle.
2. R3 : recette installée, à utiliser ensuite pour R5.
3. R6 : recette du serveur réellement déployé ; R7, R9, R10, R11 : cohérence de livraison.
4. R5 : validation de la promesse agent sur les cinq briefs, puis corrections ciblées.
5. Recette finale sur le même commit : build reproductible et détection de fichiers générés non suivis, unitaires, types, lint, navigateurs avec rapport JSON, tarball installé, site construit et nginx. Archiver les preuves avant tag/publication.

Ordre de grandeur : 7–10 jours-personne, avec parallélisation possible ; estimation, pas engagement calendaire. Aucun tag ni publication lancé par cet audit.

## Mise à jour finale · 2026-09-09

| ID | État | Preuve locale |
|---|---|---|
| R1, R2 | corrigé | `stage-assets.mjs`, `llms.txt` web réécrit, quickstart npm et validation du site construit |
| R3 | corrigé | `rikiki/scripts/release-smoke.mjs`, tarball installé dans un chemin contenant des espaces ; init, assemble, skills, check, render, bundle, export PDF et offline passés |
| R4 | corrigé avec limite documentée | inventaire hashé de 125 paquets, notices tierces et `verifyInventory` ; Mermaid reste explicitement décrit comme bundle amont opaque |
| R5 | partiellement traité | un harness de vérification est présent dans `docs/design/briefs/resultats/v1-validation/`, mais les cinq exécutions éditoriales complètes ne sont pas prouvées dans cet arbre |
| R6 | corrigé | image nginx locale construite et smoke HTTP passé : routes 200, routes inexistantes 404, MIME JS/CSS contrôlés ; job CI avec artefacts |
| R7, R8, R9, R10, R11 | corrigé | documentation, liens construits, rapport JSON Playwright, suppression de la sonde sans assertion et contrat Node documentés |

Recette locale du correctif : 681 tests unitaires, 536 tests navigateur passés et 18 ignorés, lint et typecheck package, build package, smoke du tarball installé, lint et build Astro avec contrôle des liens, image nginx et contrôle HTTP. Le test print des notes est désormais bloquant.

R5 reste le seul écart de fond : la validation agent des cinq briefs demande des livrables éditoriaux observables et ne peut pas être remplacée par la seule présence du harness.

## Ce qui ne doit pas redevenir un faux défaut

- La version du paquet est bien 1.0.0 et les versions documentaires couvertes par le manifest ont été bumpées.
- Les trois tests internes ont été exclus du tarball lors de la préparation précédente.
- Le fallback SPA est corrigé dans le Dockerfile généré ; c'est sa vérification qui manque.
- Le point d'entrée LLM web est un symlink : le problème est la résolution des liens, pas une copie textuelle divergente.
- Playwright finit bien avec un code 0 : l'attente finale provenait d'un test encore actif.
- `deck-edge` implémente maintenant `arrow` dans deck-graph.ts ; l'affirmation contraire du plan est obsolète.
- Un refactoring des gros modules et l'adoption de workspaces ne constituent pas, seuls, des bloqueurs v1.0. Les planifier après la stabilisation des contrats publics.
