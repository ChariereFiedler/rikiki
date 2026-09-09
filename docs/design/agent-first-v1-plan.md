# rikiki v1.0 — le deck qu'un agent écrit, vérifie et livre

Document de suivi du programme V1. Il porte le contrat, les lots, les décisions,
les critères d'acceptation, les résultats de vérification et le reste à faire.
Il remplace `v1-rc-plan.md` comme plan actif : ce dernier reste la trace de
l'audit du 2026-09-07, dont les constats sont réconciliés lot par lot ici.

Ouvert le 2026-09-08. Ce document a été révisé pour préparer `rikiki-deck@1.0.0`.

---

## 1. Contrat V1

### La promesse

> Transformez un brief en une présentation soignée avec votre agent de code.
> Gardez le HTML, présentez et partagez librement.

Public prioritaire : les personnes qui utilisent un agent de code pour préparer
une présentation technique, produit, de formation ou de synthèse de données.

### Le parcours à rendre fiable

Brief → plan → compositions → HTML → rendu → diagnostic → correction →
présentation et livraison.

### Les principes

1. Le HTML reste le format source, lisible et modifiable par un humain.
2. Une présentation ne dépend pas de l'agent qui l'a écrite.
3. Les commandes et les instructions fonctionnent depuis une installation du
   paquet, sans clone du dépôt.
4. La qualité éditoriale et visuelle compte autant que la validité technique.
5. Le diagnostic objectif complète l'inspection des captures, il ne la remplace
   pas.
6. Le rendu autonome et l'export PDF sont des livrables de première classe.
7. L'intégration dans une page et les carrousels restent des usages secondaires.

### Hors périmètre V1

Éditeur WYSIWYG, SaaS, orchestrateur propriétaire, génération de contenu par une
API de modèle intégrée, nouveau format de présentation obligatoire. Un serveur
MCP n'est pas nécessaire pour commencer.

### Définition de terminé

Depuis le paquet installé et ses seules instructions, une personne accompagnée
d'un agent peut : transformer un brief en plan cohérent · produire les slides
sans dépendre des sources internes · rendre et inspecter chaque slide ·
localiser puis corriger un défaut technique · faire une modification ciblée ·
présenter avec les notes · partager un HTML autonome · produire un PDF lisible.

---

## 2. État historique — remplacé par la recette finale

Cette section conserve l'audit initial pour la traçabilité. Ses défauts ne décrivent
plus l'arbre actuel ; la recette courante se trouve dans la section 8.

### Ce qui tient

| Vérification | Résultat |
|---|---|
| `npx vitest run` | 604 tests, 32 fichiers, verts |
| `npm run typecheck` | aucune erreur |
| `npx playwright test` | 415 passés, 19 ignorés, 2 min 30, Chromium + Firefox + WebKit |
| `npm pack` | 189 fichiers, tarball produit |
| Installation du tarball hors dépôt, chemin contenant une espace | réussie |
| Peer `lit` | résolu automatiquement à l'installation, à conserver comme peer requis |
| `rikiki skills` sans argument | installe les trois skills dans `.claude/skills/` |

### Les défauts confirmés

Chacun est mesuré depuis l'installation du tarball dans un dossier extérieur au
dépôt, nommé `consumer test` (avec une espace, volontairement).

**D-A1 · le premier geste du parcours public échoue sur une installation
fraîche.** `rikiki init` et `rikiki init --standalone` sortent en erreur tant
que `rolldown` n'est pas installé. Le message est juste et nomme le remède, mais
il est suivi d'une trace de pile de six lignes qui pointe l'intérieur du paquet.
Il n'existe aujourd'hui aucun `init` qui produise un deck sans le bundler,
alors que le gabarit interne est déjà du HTML source valide.

**D-A2 · le README publié et les skills distribués renvoient à des fichiers
absents du paquet.** `starter.html` est cité comme point de départ dans le
README npm et dans deux skills sur trois ; il n'est pas dans `files` et n'existe
donc pas après `npm install`. Même constat pour `bundle.mjs`, `npm run deck`,
`examples/rikiki-tour/`, `examples/sample`, et les instructions `src/` +
`npm run build` qui s'adressent à un contributeur, pas à un consommateur.

**D-A4 · le site publie tout le paquet, node_modules compris.**
`site/public/rikiki` est un lien symbolique vers `rikiki/` en entier. Le
`site/dist` construit pèse **400 Mo** et contient `site/dist/rikiki/node_modules`,
les sources TypeScript et les fixtures. Aucune vérification n'interdit ce
contenu.

**D-G1 · les artefacts suivis dérivent des sources.** Un `npm run build` sur un
arbre propre modifie neuf fichiers de `rikiki/dist/` suivis par git et en crée
un dixième, `dist/molecules/deck-point.d.ts`, jamais commité. Le `dist/` du
dépôt ne correspond donc pas à `src/`.

### Les constats de l'audit précédent à ne pas ressusciter

Réfutés le 2026-09-07 et reconfirmés : le budget MANIFESTO de 25 Ko, la
prétendue redondance de `peerDependencies.lit` (les déclarations publiées
importent le specifier nu `lit`), la prétendue contradiction ROADMAP/FAQ sur le
PDF.

---

## 3. Lots et dépendances

L'ordre suit le risque levé, pas le confort. Un lot n'est clos que par ses
critères d'acceptation vérifiés, jamais par « le code est écrit ».

| Lot | Objet | Dépend de |
|---|---|---|
| **A** | Fiabiliser le paquet et la distribution | — |
| **B** | Publier les commandes de rendu et de diagnostic | A1, A3 |
| **C** | Concevoir le workflow agent portable | A2, B |
| **D** | Évaluer le résultat sur cinq briefs neufs | B, C |
| **E** | Réécrire la documentation et les README | A, B, C, D |
| **F** | Refaire le site vitrine | A4, B, D |
| **G** | Recette et préparation de release | tous |

Gel des composants pendant tout le programme : aucun nouvel élément `deck-*`
sauf défaut démontré empêchant un cas d'usage V1.

### Lot A — paquet et distribution

- **A1** · éprouver le paquet réel : contenu publié, résolution des assets,
  dépendances optionnelles, messages d'erreur, chemin avec espace, absence de
  dépendance aux sources du dépôt.
- **A2** · corriger les instructions non distribuables ; choisir un parcours
  public fondé sur la CLI et aligner tous les exemples.
- **A3** · clarifier les trois modes : source HTML avec assets locaux servie en
  HTTP · fichier autonome ouvrable hors ligne · usage CDN nécessitant le réseau.
  Traiter le cas de l'agent qui ajoute un composant après un bundle curé.
- **A4** · remplacer la publication globale du site par une liste explicite
  d'assets, avec une vérification du résultat construit.
- **A5** · version Node du dépôt, fallback nginx, types MIME et vraies 404,
  notices des dépendances tierces, métadonnées du paquet site.

**Acceptation** : depuis le tarball installé, une personne crée, modifie,
assemble et exporte le deck documenté. Le site construit ne contient que les
fichiers autorisés.

### Lot B — rendu et diagnostic

- **B1** · infrastructure navigateur commune, partagée avec l'export PDF :
  chargement paresseux de Playwright, serveur local sur port libre, résolution
  du deck et de ses assets, collecte des erreurs, délais bornés, fermeture
  garantie, confinement des chemins servis.
- **B2** · `rikiki render` : une capture par slide, galerie HTML, manifeste
  reliant index, identifiant, titre et fichier ; sélection par identifiant ou
  numéro ; dimensions explicites ; états révélés traités et nommés ; noms de
  fichiers sûrs.
- **B3** · `rikiki check` : rapport JSON versionné, diagnostics localisables
  jusque dans le Shadow DOM, gravités, codes de sortie 0/1/2, stdout réservé au
  JSON en mode `--json`.
- **B4** · tests positifs et négatifs, dont le fonctionnement depuis le tarball
  installé.

**Acceptation** : un agent produit les captures, comprend où est le défaut,
corrige le deck et relance le contrôle sans lire les tests internes.

### Lot C — workflow agent

- **C1** guide portable et progressif · **C2** contrat éditorial ·
  **C3** huit à dix recettes de composition avec HTML vérifié ·
  **C4** politique de correction ordonnée · **C5** skills et portabilité.

**Acceptation** : une session d'agent sans connaissance du dépôt trouve tout ce
qu'il lui faut dans le paquet installé.

### Lot D — évaluation sur briefs neufs

Cinq briefs versionnés : architecture technique · proposition produit · bilan
chiffré · formation avec notes et étapes · contraintes de thème et de durée.
Tracer l'agent utilisé, les instructions, les interventions humaines et les
résultats.

**Acceptation** : des preuves documentées de ce qui marche et des limites, pas
un score global. Une exécution manuelle préparée n'est jamais présentée comme
une évaluation autonome.

### Lot E — documentation et README

README racine orienté produit · README npm autonome après installation ·
documentation du site organisée par tâche · séparation explicite consommateur
et contributeur · chiffres générés ou vérifiés depuis les sources.

**Acceptation** : toutes les commandes du parcours principal sont exécutées
depuis une installation vierge.

### Lot F — site vitrine

Hero, brief et résultat, itération, compositions, vérification, livraison,
compatibilité et limites, documentation. Pas de taille en promesse principale,
pas de garantie sur le futur, pas de résultat d'évaluation non démontré, pas
d'autoplay par défaut.

**Acceptation** : un visiteur comprend le produit, voit un résultat crédible et
trouve comment créer son premier deck.

### Lot G — recette et release

Tests, typecheck, lint, E2E complète, build reproductible sans dérive des
artefacts suivis, installation du tarball dans un dossier vierge, rendu,
diagnostic, bundle et PDF depuis cette installation, recette du site construit,
contrôle des fichiers publiés, vérification des exemples et des liens.

Ne pas relever un budget ni retirer une assertion pour faire passer la recette.

---

## 4. Décisions

Une décision est datée, motivée, et ne se rejoue pas sans fait nouveau.

**2026-09-08 · Le parcours public de départ est une source HTML, pas un
bundle.** `rikiki init` doit produire un deck modifiable dont les assets
résolvent vers le paquet installé, sans exiger `rolldown`. Le fichier autonome
devient une étape de livraison, pas d'entrée. *Motif :* le bundler pèse environ
55 Mo de bindings natifs et son absence rendait le premier geste impossible sur
une installation fraîche.

**2026-09-08 · `lit` reste un peer requis.** Dix-huit déclarations publiées de
`dist/` importent le specifier nu. *Motif :* constat déjà réfuté le 2026-09-07,
inscrit ici pour qu'il ne revienne pas.

**2026-09-08 · Le site publie une liste explicite d'assets, jamais le paquet.**
`site/public/rikiki` n'est plus un lien symbolique vers `rikiki/` : un script de
mise en scène y copie sept entrées nommées, et un contrôle refuse le build si
`dist/` contient un `node_modules`, une source TypeScript, un répertoire de
développement, un manifeste de build ou dépasse 60 Mo. *Motif :* le site
construit pesait 400 Mo et publiait les sources et les fixtures.

**2026-09-08 · L'assembleur multi-fichiers entre dans le paquet.** Arbitrage de
l'utilisateur : la fonctionnalité est utile, donc elle est publiée plutôt que
retirée de la référence. `build/vite-deck.mjs` devient `rikiki assemble`, avec
des défauts alignés sur ce que `init` écrit, une sortie stdout, une option
`lang`, et un avertissement quand un href configuré ne s'inlinera pas.
*Motif :* la référence enseignait depuis un an une commande qu'aucune
installation ne pouvait exécuter.

**2026-09-08 · Le markdown reste du code de l'auteur.** Pas de sanitisation, pas
de dépendance ajoutée ; le modèle est documenté et gelé par un test.
*Motif :* arbitrage du 2026-09-07, inchangé.

---

## 5. Résultats de vérification

Chaque ligne dit la commande, la date, le résultat. Une case vide veut dire non
exécuté, jamais supposé vert.

| Date | Commande | Résultat |
|---|---|---|
| 2026-09-08 | `npx vitest run` (rikiki) | 604 tests verts |
| 2026-09-08 | `npm run typecheck` (rikiki) | aucune erreur |
| 2026-09-08 | `npx playwright test` (rikiki) | 415 passés, 19 ignorés |
| 2026-09-08 | `npm pack` + installation hors dépôt | 189 fichiers, installation réussie |
| 2026-09-08 | `npx rikiki init` depuis le tarball | **échec**, rolldown absent (D-A1) |
| 2026-09-08 | `npx rikiki skills` depuis le tarball | trois skills installés |
| 2026-09-08 | `du -sh site/dist` | **400 Mo**, node_modules inclus (D-A4) |
| 2026-09-08 | `npm run build` sur arbre propre | **dérive** de dix fichiers `dist/` (D-G1) |
| 2026-09-08 | `npx rikiki init` après correction, depuis le tarball | deck de 1 Ko + runtime de 1,4 Mo, sans rolldown |
| 2026-09-08 | rendu du deck source servi en HTTP (Chromium) | 3 slides, aucune erreur console ni requête échouée |
| 2026-09-08 | `npx vitest run` après le lot A | 613 tests verts, 33 fichiers |
| 2026-09-08 | `npm run lint` (rikiki) | aucune erreur |
| 2026-09-08 | `npx playwright test --grep @smoke` | 66 passés, trois navigateurs |
| 2026-09-08 | `npm run build` (site) | **14,3 Mo** publiés, contrôle du contenu vert |
| 2026-09-08 | `npm run lint` (site) | liens et types verts |
| 2026-09-08 | `npx vitest run` après A2 et l'assembleur | 631 tests verts, 35 fichiers |
| 2026-09-08 | parcours complet depuis le tarball, dossier `full run` | init, assemble, bundle, export enchaînés |
| 2026-09-08 | rendu du deck assemblé et du bundle (Chromium) | 3 slides chacun, aucune erreur |
| 2026-09-08 | `npx rikiki export` depuis l'installation | PDF de 3 pages, 51 Ko |
| 2026-09-08 | recette des 22 invocations depuis le tarball | tous les codes de sortie conformes |
| 2026-09-08 | rendu des 9 artefacts produits (Chromium) | aucune erreur, mermaid dessiné dans les deux modes |
| 2026-09-08 | `npx vitest run` après la couverture CLI | 660 tests verts, 36 fichiers |
| 2026-09-08 | `npx vitest run` après le lot B | 680 tests verts, 37 fichiers |
| 2026-09-08 | `npx playwright test` après le lot B | 463 passés, 19 ignorés, 3 min 6 |
| 2026-09-08 | recette de render et check depuis le tarball | 8 invocations, codes 0, 1 et 2 conformes |
| 2026-09-08 | `npx vitest run` après le lot C | 681 tests verts |
| 2026-09-08 | `npx playwright test` après le lot C | 511 passés, 19 ignorés, 3 min 6 |
| 2026-09-08 | les 11 blocs HTML du guide, mesurés par `check` | aucun diagnostic |
| 2026-09-08 | commandes du guide depuis le tarball | init, check, render, render --steps, export à 0 |
| 2026-09-08 | `check` sur les six decks du dépôt | aucun défaut après corrections |
| 2026-09-08 | `npx vitest run` après le lot D | 681 tests verts |
| 2026-09-08 | `npx playwright test` après le lot D | 520 passés, 19 ignorés, 3 min 54 |
| 2026-09-08 | `check` sur les six decks après les deux nouveaux diagnostics | aucun défaut, après trois corrections |
| 2026-09-08 | `npx playwright test` final | 529 passés, 19 ignorés, 3 min 42 |
| 2026-09-09 | `npx playwright test` après le skill et deck-step | 529 passés, 19 ignorés, 4 min 54 |
| 2026-09-09 | `npm test` après le passage en 1.0.0 | 681 tests verts, 37 fichiers |
| 2026-09-09 | `npm pack --dry-run` | 193 fichiers, aucun test interne publié |
| 2026-09-09 | `site` avec Node 24 | lint et build verts, 14,4 Mo publiés |
| 2026-09-09 | `npx playwright test` après le passage en 1.0.0 | 538 passés, 19 ignorés, 4 min 12 |

---

## 6. Fait

**A1 · le paquet réel est éprouvé.** Tarball construit, installé hors dépôt dans
un chemin contenant une espace, commandes exécutées. Les quatre défauts de la
section 2 en sortent.

**A3 (partiel) · le mode source existe.** `rikiki init` écrit désormais un deck
HTML modifiable et copie le runtime dans `./rikiki/` à côté, sans toucher au
bundler. Les deux payloads lourds, mermaid et Shiki, ne sont copiés que si le
deck les demande ; lit et marked le sont toujours, parce que le runtime les
importe. `--standalone` conserve l'ancien comportement, `--force` garde le
premier deck d'un écrasement accidentel. L'inliner fait primer la racine du
paquet pour toute référence `rikiki/…`, sans quoi la copie locale, dépourvue de
`node_modules`, ne se bundle pas. Neuf tests couvrent le contrat, dont le
bundle du deck que `init` vient d'écrire.

**Une erreur attendue ne montre plus ses entrailles.** Un peer optionnel absent
imprime son remède seul, sans les six lignes de pile qui l'enterraient.
`ExpectedError` porte la distinction, un test l'exerce en bloquant la résolution
de `rolldown` par un hook de module.

**A4 · le site ne publie plus que ce qu'un navigateur demande.** De 400 Mo à
14,3 Mo, avec un contrôle qui échoue le build plutôt que de le constater après.

**A2 · les documents publiés ne parlent plus que de ce qui est livré.** Un test
parcourt chaque document du paquet et échoue sur toute citation d'un chemin non
publié, en distinguant le chemin (`src/`) du mot anglais (« decks ») et de
l'attribut HTML (`src="…"`). Six documents sur six étaient fautifs. Le README,
le fichier d'entrée pour agents, la référence de mille cinq cents lignes et les
trois skills distribués passent désormais par la CLI : `init`, `assemble`,
`bundle`, `export`, `skills`.

**Chaque commande est couverte et éprouvée.** Une matrice de surfaces a précédé
l'écriture : `bundle` et `export` étaient déjà couverts par les suites
Playwright, `init` et `assemble` par leurs propres fichiers, mais `skills`,
l'aide, les commandes inconnues et les refus d'entrée ne l'étaient pas du tout.
Vingt-cinq scénarios comblent ces trous. La recette manuelle a ensuite rejoué
vingt-deux invocations depuis le tarball et vérifié le rendu des neuf fichiers
produits.

**Deux défauts trouvés par cette couverture, et corrigés.** Une configuration
`.js` était illisible dans un projet CommonJS, ce que `npm init -y` écrit par
défaut : la commande crachait une trace d'analyse syntaxique. Elle accepte
maintenant les deux dialectes et nomme le remède quand ils ne concordent pas.
Et `--no-fonts` laissait douze règles `@font-face` avec `src: none`, du CSS
invalide que le navigateur jette : la règle entière part avec sa source.

**L'assembleur est publié et fini.** Dix tests couvrent l'inlining verbatim du
HTML, le découpage markdown sur `---`, les défauts de chemins, l'avertissement
d'inlining, le nom de sortie dérivé du titre, la sortie stdout, l'échappement du
titre et les quatre refus (config absente, argument manquant, partiel absent,
`slides` vide).

### Lot B · les yeux et la règle

**B1 · une seule infrastructure navigateur.** `browser.mjs` porte le chargement
paresseux de Playwright, le serveur local sur port libre, la racine servie la
plus étroite qui contienne le deck, la collecte des erreurs et des ressources
manquantes, l'attente de stabilisation, et la fermeture garantie du navigateur
et du serveur même après échec. L'export PDF a été ramené dessus : il ne fait
plus que demander le PDF. Le confinement des chemins servis est corrigé — le
préfixe `/srv/deck` acceptait `/srv/deck-secrets` — et vingt tests le tiennent,
traversées simples, échappées et à travers un vrai répertoire comprises.

**B2 · `rikiki render`.** Une image par slide, une galerie sans dépendance, et
un manifeste versionné qui relie index, identifiant, titre et fichier. Sélection
par numéro ou par identifiant, l'ordre suivant le deck et non les arguments ;
une sélection vide nomme les slides disponibles. Dimensions explicites, refus
d'une taille qui n'en est pas une. Les noms de fichiers sont dérivés de
l'identifiant et toujours inoffensifs, `../../etc/passwd` compris, tandis que le
manifeste garde l'identifiant tel quel. `--steps` capture chaque état révélé ;
sans lui la commande dit qu'elle a photographié l'état d'ouverture.

**L'attente ne dort jamais.** La première version capturait une ligne en plein
fondu. L'attente porte sur les animations elles-mêmes, via l'API Web Animations,
et la borne de temps ne sert qu'aux animations sans fin.

**B3 · `rikiki check`.** Rapport JSON versionné : dix codes stables, une gravité,
la slide et son identifiant, un chemin qui traverse le Shadow DOM, la mesure qui
justifie, une suggestion. Codes de sortie 0, 1 et 2, ce dernier distinguant
« je n'ai pas pu regarder » de « le deck a des défauts ». En mode JSON, stdout
ne porte que le rapport, même quand le deck est cassé. Le rapport nomme aussi ce
qui n'a pas été vérifié, parce que le silence se lirait comme un quitus.

**Ce que le diagnostic refuse de faire** : traiter le vide comme un défaut, et
prétendre juger l'accessibilité sur quatre mesures.

**Trois faux positifs corrigés avant livraison** : les balises `style` comptées
comme du texte, le texte des diagrammes mesuré sans son facteur d'échelle SVG,
et la cascade d'éléments inconnus quand le runtime n'a jamais tourné. Un défaut
réel est sorti de là : le gabarit de `init` écrivait `<deck-*>` dans sa prose,
que l'analyseur transformait en élément fantôme. Le gabarit échoue désormais à
son propre diagnostic si cela revient.

### Lot C · le workflow agent

**C1, C2 et C4 · un guide portable, distribué avec le paquet.**
`docs/llms/rikiki-workflow.md` porte les sept étapes, le contrat éditorial en
huit lignes à consigner avant d'écrire, la règle de ne jamais inventer un
chiffre ni une source, et la politique de correction ordonnée : couper la
répétition, raccourcir, déplacer dans les notes, scinder, changer de
composition, ajuster la typographie en dernier. Le guide dit aussi de modifier
étroitement, en gardant les identifiants stables.

**C3 · neuf recettes de composition.** Affirmation et preuve, comparaison,
chiffre et interprétation, processus, code expliqué, architecture, évolution
dans le temps, décision et compromis, conclusion. Chacune donne l'intention, la
quantité qui tient, le rôle des notes, le cas de scission et une variante.

**Les exemples sont vérifiés, pas relus.** Un test assemble chaque bloc HTML du
guide en deck réel et le mesure avec `rikiki check`, la commande même que le
guide recommande. Onze blocs, zéro diagnostic. Un composant renommé casse le
test avant que la documentation ne mente.

### Revue du parcours de rédaction par agents

Le parcours initial demandait encore à un agent unique de remplir le brief,
d'écrire le HTML et de déclarer le résultat bon. Cela mélangeait trois
responsabilités qui ne disposent pas des mêmes preuves : choisir l'argument,
produire le fichier et le critiquer. `check` pouvait confirmer que le runtime
était sain alors que le récit restait faible, qu'un chiffre manquait de source
ou qu'une slide était jolie mais vide.

Le guide impose désormais des handoffs explicites : le planificateur produit un
contrat éditorial, un registre des faits et un plan ligne par slide ; le rédacteur
produit le HTML à partir de ces artefacts ; deux critiques séparées relisent le
contenu puis les pixels ; l'intégrateur applique les constats et relance les
deux passes après une modification structurelle. Chaque constat porte un id de
slide et une sévérité (`blocker`, `fix`, `choice`). Le registre interdit qu'un
agent comble un trou avec une invention, et le plan interdit qu'un sujet ou un
nom de composant tienne lieu de preuve.

Cette séparation reste opérable avec un seul agent : il sauvegarde chaque
artefact avant de passer au rôle suivant et ne s'autorise pas à approuver le
texte qu'il vient d'écrire. Elle transforme une consigne générale en preuves
inspectables, sans prétendre qu'un diagnostic mécanique juge l'argument ou le
goût visuel.

**Un défaut de composant est sorti de là.** La recette « architecture »
débordait de 57 pixels : `deck-mermaid` plafonnait son SVG à 60 % de la hauteur
de slide, ce qui ignore le rembourrage de son propre hôte. Le plafond porte
désormais sur la boîte réelle. C'est le premier cas où le gel des composants
cède, et il cède sur un défaut démontré, comme prévu.

### Lot D · cinq briefs, et une première exécution

**Les cinq briefs sont versionnés** dans `docs/design/briefs/` : architecture
technique, proposition commerciale, bilan chiffré, formation avec notes et
étapes, contraintes de thème et de durée avec cas multilingue. Chacun liste les
faits autorisés et rien d'autre ; un chiffre absent de la liste dans le deck
produit fait échouer le brief. Le premier porte une demande de modification
ciblée, le deuxième un contenu long à ne pas tronquer.

**Le protocole dit ce qu'on consigne** : l'agent, ses instructions mot pour mot,
chaque intervention humaine, la sortie de `check` avant et après. Une exécution
conduite à la main se consigne comme telle et ne se présente jamais comme
autonome.

**Une exécution du brief 5 est consignée**, avec sa limite écrite en tête : elle
a été menée dans la session de développement, par l'agent qui venait d'écrire le
guide. Elle éprouve le parcours, elle ne mesure pas ce qu'obtiendrait un agent
extérieur. Cette mesure reste à faire.

**Elle a trouvé un défaut que rien ne voyait.** Le deck écrivait
`<deck-metric label="…">` alors que le libellé vient du contenu : l'attribut
était ignoré en silence, `check` était vert, et seule l'image montrait un
nombre sans rien à côté. D'où un nouveau diagnostic, `UNKNOWN_ATTRIBUTE`, qui
compare les attributs posés à ce que l'élément observe **et** à ce sur quoi sa
feuille de style sélectionne — un attribut peut n'agir qu'en CSS, ce que la
première version ignorait au prix de trois faux positifs sur les decks du dépôt.

**Il a immédiatement rapporté quatre défauts réels** : trois recettes du guide
utilisant des attributs inexistants, et un exemple du dépôt promettant une
flèche bidirectionnelle que le composant ne dessine pas.

### Le deck de présentation, écrit et corrigé à la vue

Un deck présentant rikiki a été écrit dans le bac à sable en suivant le guide,
avec les chiffres relevés depuis le dépôt et non estimés. Le diagnostic n'a
jamais menti, mais il n'a pas tout vu du premier coup.

**Ce que la mesure a trouvé** : la couverture coupée de 95 puis 7 pixels, un
runtime de diagramme absent du dossier, et une slide entièrement vide dont
personne ne parlait.

**Ce que l'œil a trouvé, et la mesure pas** : du contenu massé en haut de slide,
une liste d'étapes en police à chasse fixe sans raison, des numéros illisibles,
un écart clé-valeur trop grand, et des composants mal choisis là où les extras
`deck-flow`, `deck-graph`, `deck-kpi-grid` et `deck-checklist` font mieux. La
distribution verticale se règle avec `spread`, côté auteur, pas côté composant.

**Deux diagnostics en sont sortis** : `CONTENT_NOT_RENDERED` pour le contenu
qu'aucun slot ne prend, et l'extension de la mesure de taille au texte que
`deck-code` reconstruit dans son arbre d'ombre.

**Et un défaut de l'exemple phare** : la ligne d'accroche du tour rikiki était
écrite `slot="sub"` sur un composant qui n'offre qu'un slot par défaut. Elle
n'était rendue nulle part, probablement depuis longtemps.

**`deck-step` a été refondu** : la police à chasse fixe est partie, le numéro
porte la séquence à taille lisible en accent plutôt que dans une pastille de
seize pixels, les cartes blanches à ombre ont laissé place à un filet, et la
note suit le libellé au lieu d'être poussée au bord opposé.

**Restent connus et non traités** : `deck-metric` étire l'écart entre le
libellé et la valeur, comme `deck-step` le faisait ; la référence documente
`arrow` sur `deck-edge`, que le composant n'implémente pas.

### Les référentiels de conception, et ce qu'ils changent

Recherche menée le 2026-09-09 à la demande de l'utilisateur.

**Retenus, avec assise expérimentale.** L'assertion-evidence d'Alley et Garner
(compréhension et rappel supérieurs, significatif ; réplication 2025 sur 110
étudiants avec en plus moins d'idées fausses et une charge cognitive perçue
moindre). Les principes multimédias de Mayer, dont l'assertion-evidence est
l'application aux slides : redondance et cohérence mordent directement. Les
sept signaux mesurables d'Inui et coauteurs (2025), corrélés à 0,83 au jugement
humain, où la densité de texte et l'équilibre spatial dominent. Le débit de
parole, 130 à 160 mots par minute en rythme normal, 100 à 120 en prise de parole
technique.

**Écarté.** Le barème AWSM : ses auteurs publient le classement des critères
mais ni les pondérations ni les seuils, et écrivent qu'il reste à valider.

**Gardé sans prétention de preuve.** La sparkline de Duarte, comme cadre de
composition au niveau du plan.

**Ce qui en découle** : le contrôle de durée dans `check`, la synthèse de
composition graphique en sept décisions dans le skill, et la justification
mesurée de l'assertion-evidence dans le guide plutôt que son affirmation.

## 7. Reste à faire avant publication

**Release metadata** · paquet en `1.0.0`, notes de release complètes, `dist/`
reconstruit et tag correspondant.

**Site** · validation avec Node `>=22.12.0`, contenu publié contrôlé et vraies
réponses 404 du serveur statique.

**Tarball** · contenu de `npm pack` vérifié, commandes testées depuis un dossier
extérieur et tests internes exclus du paquet final.

**Documentation** · versions, tailles, runtimes vendus et liens LLM alignés sur
une source unique, puis copie publique du site régénérée.

**Recette** · code de sortie Playwright nul et rapport machine lisible archivé
avant le tag.

**Post-1.0** · découper `deck-root.ts`, réévaluer les gros modules et décider si
les workspaces npm apportent une valeur suffisante.

## 8. Recette v1.0

À exécuter depuis un arbre propre :

```sh
cd rikiki && npm ci && npm run typecheck && npm run lint && npm test
npm pack --dry-run
cd ../site && npm ci && npm run lint && npm run build
```

La recette externe installe le tarball dans un dossier temporaire, exécute les
six commandes CLI documentées, ouvre un bundle hors ligne, exporte un PDF et
vérifie les réponses HTTP du site, y compris une 404. Le tag `v1.0.0` n'est
créé qu'après un code de sortie nul de cette recette et de Playwright.

### Constats mineurs traités

- **Corrigé le 2026-09-08 :** `deck-cover` étiquetait « Présenté par » et
  « Durée » en français quelle que soit la langue déclarée, alors que tout le
  reste du moteur écrit en anglais. Les étiquettes suivent désormais le `lang`
  du document, et les attributs par étiquette priment toujours. Trois tests
  tiennent les trois cas.
