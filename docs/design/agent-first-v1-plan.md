# rikiki v1.0 — le deck qu'un agent écrit, vérifie et livre

Document de suivi du programme V1. Il porte le contrat, les lots, les décisions,
les critères d'acceptation, les résultats de vérification et le reste à faire.
Il remplace `v1-rc-plan.md` comme plan actif : ce dernier reste la trace de
l'audit du 2026-09-07, dont les constats sont réconciliés lot par lot ici.

Ouvert le 2026-09-08. Paquet à cette date : `rikiki-deck@0.6.0`.

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

## 2. État revalidé le 2026-09-08

Mesuré sur le dépôt à `2330f1d`, arbre propre au départ.

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

## 7. Reste à faire

**A3 (reste)** · documenter les trois modes et traiter la curation : un agent
qui ajoute un composant après un bundle curé obtient aujourd'hui un élément
silencieusement inerte.

**A5** · version Node du dépôt, fallback nginx, types MIME et 404, notices des
dépendances tierces, métadonnées du paquet site.

**D-G1** · la dérive de `dist/` reste ouverte, à traiter dans le lot G avec un
contrôle mécanique plutôt qu'une consigne.

**Lots B à G** · non commencés.

### Constats mineurs relevés en passant

- `deck-cover` étiquette « Présenté par » et « Durée » en français par défaut,
  y compris dans un deck `lang="en"` ; les attributs `speaker-label` et
  `duration-label` permettent de corriger au cas par cas. À trancher dans le
  lot C, qui porte le cas multilingue.
