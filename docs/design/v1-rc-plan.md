# Plan de travail — release candidate rikiki v1.0

Base : 9 audits contradictoires sur `main` (6cc0edf). Les findings **REFUTED** (budget MANIFESTO 25 KB, `peerDependencies.lit` redondant, contradiction ROADMAP/FAQ) sont exclus et ne doivent pas être ressuscités : ne pas retirer `peerDependencies.lit` (18 `.d.ts` de `dist/` importent le specifier nu `lit`), ne pas redéfinir le budget core.

Chiffres re-mesurés dans cet environnement pour ancrer les lots : `gzip -9 dist/index.js` = **21 082 o**, `vendor/lit.js` = **6 786 o**, `vendor/marked.js` = **10 738 o** → **38 606 o** de chargement initial réel. `npx vitest run` = 61 tests / 6 fichiers. `e2e/smoke.spec.ts` liste 12 decks dont `decks/tests/bento.html` mais **ni** `/examples/sample/index.html` **ni** `/examples/stress/index.html`. `examples/bento/` est **untracked**.

---

## 1. Séquence recommandée (ordre = risque levé / effort)

| # | Lot | Piste | Effort | Risque levé |
|---|-----|-------|--------|-------------|
| 1 | `fix(security): escape mermaid error sinks and harden securityLevel` | v1.0 | S | XSS zéro-interaction + XSS au clic |
| 2 | `fix(bento): route status tones to text-grade tokens` | BENTO | S | 2 P1 WCAG bloquants, déjà livrés dans les exemples |
| 3 | `fix(csv): stop dropping a quoted empty field and normalise the matrix` | BENTO | S | perte de donnée sur entrée CSV valide |
| 4 | `test(size): pin every published size figure to a measured budget` | v1.0 | S | cause racine du P0 « ~14 KB » |
| 5 | `docs: correct every published size, count and CDN claim` | v1.0 | M | 1 P0 + 5 P1 de promesse publique |
| 6 | `test(bento): contract net for every documented bento knob` | BENTO | M | objectif v1.0 « chaque promesse prouvée » |
| 7 | `fix(bundle): make a bundled deck actually self-contained` | v1.0 | L | 1 P0 + 3 P1, promesse de tête |
| 8 | `ci: gate the publish tag on the same checks as main` | v1.0 | S | le tag qui publie ne prouve rien |
| 9 | `fix(bento): implicit rows, attribute removal, csv reactivity` | BENTO | S | piège d'ergonomie + incohérences de contrat |
| 10 | `fix(embed): stop capturing host keys, wheel and hash` | v1.0 | M | 2 P1 + molette (raté du 1er passage) |
| 11 | `fix(themes): scope the reset to the deck subtree` | v1.0 | M | P1, promesse README:200 fausse |
| 12 | `docs: state the print/PDF reality` (ou implémenter) | v1.0 | S ou L | P1, arbitrage produit |
| 13 | `feat(a11y): ARIA baseline for the engine` | v1.0 | M | plancher qualité v1.0 |
| 14 | `fix(fit): refit on light-DOM mutation` | BENTO | M | promesse phare « shrink to fit » |
| 15 | `chore(pkg): engines, exports map, packaging test` | v1.0 | S | contrat de manifeste |
| 16 | `docs(bento): freeze and document the public surface` | BENTO | M | gel d'API |

Les lots 1–8 constituent le **chemin minimal RC** (voir §6).

---

## 2. PISTE A — BENTO (priorité utilisateur)

### Lot B1 · `fix(bento): route status tones to text-grade tokens`
**Ratio le plus élevé de la piste.** A11Y-BENTO-01 (P1, bloquant), A11Y-BENTO-02 (P1, bloquant), A11Y-BENTO-03 (P2), + `deck-stat` (raté du 1er passage, livré sous le seuil dans les deux exemples).

- **Fichiers** : `rikiki/src/atoms/deck-punch.ts` (table `TONES`, l. 24-31), `rikiki/src/molecules/deck-stat.ts` (l. 22-30), `rikiki/themes/rikiki.css` (ajouter `--rik-status-success__text`, `--rik-status-warn__text`, … sur le modèle de `--rik-status-info__text` l. 118 ; corriger le commentaire faux l. 137 « mango-500 on paper is 3.2:1 »), `rikiki/themes/siliceum.css`, `site/src/pages/docs/theming.astro` (l. 200-207).
- **Tests AVANT correctif** : nouveau `rikiki/src/runtime/contrast.test.ts` (vitest, environment node, réutilise `src/runtime/color.ts`) qui, pour chaque paire (token de tone × surface `--rik-surface-page` / `--rik-surface-raised--strong` / `night-900`) des **deux** thèmes, calcule le ratio et échoue sous 3:1 (grand texte) / 4.5:1 (corps). Le test doit être **rouge** sur `accent` = 2.98, `ok` = 2.15, `siliceum accent--strong` = 3.72 avant le correctif.
- **Vérification** : `npx vitest run src/runtime/contrast.test.ts && npx playwright test bento`
- **Effort** : S (tokens + routage), M si l'on inclut la refonte du vocabulaire (→ décision produit D3, à ne pas faire ici).

### Lot B2 · `fix(csv): stop dropping a quoted empty field and normalise the matrix`
Perte de donnée sur une entrée **valide** — le seul vrai bug de correction du lot bento. `parse-csv.ts:53` filtre `r.length === 1 && r[0] === ''`, ce qui supprime aussi une ligne `""` explicitement quotée : `parseCsv('name\n""\nbob')` → `[["name"],["bob"]]`. S'y ajoutent : `\r` seul jamais terminateur (`parse-csv.ts:46`), délimiteur multi-caractères ignoré (`parse-csv.ts:42`), matrice irrégulière rendue en table structurellement fausse (`deck-csv.ts:128`, 3 `<th>` / 2 `<td>`).

- **Fichiers** : `rikiki/src/shared/parse-csv.ts`, `rikiki/src/molecules/deck-csv.ts` (normalisation de largeur dans `parse()`).
- **Tests AVANT** : `src/shared/parse-csv.test.ts` — `keeps a quoted empty field as its own row`, `treats a lone \r as a row terminator`, `truncates a multi-character delimiter to its first char`, `pads rows shorter than the header`. Puis un e2e `a ragged csv keeps every row aligned with its header` (chaque `tr` a autant de `td` que le `thead` a de `th`).
- **Vérification** : `npx vitest run src/shared/parse-csv.test.ts && npx playwright test bento`
- **Effort** : S.

### Lot B3 · `test(bento): contract net for every documented bento knob`
BENTO-API-09 (P1, bloquant), COV-01 `deck-fit` zéro test (P1, bloquant), COV-04, COV-11, COV-09. **Aucun changement de production** : ce lot fige l'état actuel, il doit donc passer au vert immédiatement sauf là où il révèle un défaut déjà listé ailleurs.

- **Fichiers** : `rikiki/decks/tests/bento.html` (slide « toutes variantes » : une cellule par combinaison `flat` / `plain` / `tone=danger` / `justify=between` / `col`+`row` explicites, un `deck-csv no-header`, un `deck-fit max="4"` dans une cellule étroite), `rikiki/e2e/bento.spec.ts`.
- **Tests AVANT** : c'est le lot de tests lui-même. Contenu minimal :
  - `deck-fit shrinks slotted content to its cell` : font-size retenue strictement inférieure à celle du même contenu dans une cellule 2× plus large (preuve que le fit **mesure**).
  - Remplacer le `waitForFit` tautologique (`bento.spec.ts:21-26` attend exactement ce que les `expect` l. 57-58 / 95-96 / 113-114 réaffirment) par une attente d'état non équivalente (style inline `font-size` non vide et stable sur deux frames), puis asserter : (a) pas de débordement, (b) font-size fittée ≠ font-size sans `fit` — mesuré 53.93 px vs 39.67 px, les deux dans la borne actuelle `[rootPx-1, 9*rootPx+1]` qui ne discrimine donc rien, (c) monotonie (contenu 2× plus long ⇒ font strictement plus petite).
  - **Géométrie** des spans, pas seulement la valeur CSS : `hero.clientWidth ≈ 2 × pisteW + gap`. Preuve d'aveuglement actuelle : en supprimant `--_cols`, `#hero` passe de 1134 à 1715 px et le template de 3×555 px à 2×846 px, `gridColumn` restant `span 2` → le test reste vert.
  - Un test par knob documenté : défauts sans attribut (`cols=2`, `gap=3`), chaque `tone`, `plain`, `flat`, `no-header` présent/absent, `delimiter`, `align`/`justify` sur bento **et** cell, `eyebrow`, `rows`.
  - Overview : `bento thumbnails keep their fitted text and parsed csv` (touche `o` — reproduit vert aujourd'hui : punch refitté à 53.93 px, csv cloné 3 `th` / 5 `tr`).
- **Vérification** : `npx playwright test bento`
- **Effort** : M (≈ 15 tests + fixture).

### Lot B4 · `fix(bento): implicit rows, attribute removal and csv reactivity`
BENTO-01 (P2, bloquant), BENTO-10 / BENTO-API-05 (P2/P3), BENTO-05 / COV-08 (P3).

- **Fichiers** : `rikiki/src/layouts/deck-bento.ts` (ajouter `grid-auto-rows: minmax(0, 1fr)` dans `.grid`, l. 42-52 — `grep -rn 'grid-auto-rows' src/` = 0 occurrence aujourd'hui ; symétriser `set/removeProperty` l. 67-71), `rikiki/src/molecules/deck-cell.ts` (l. 135-136), `rikiki/src/layouts/deck-grid.ts` (l. 44-53, même code dupliqué), `rikiki/src/molecules/deck-csv.ts` (`willUpdate(changed) { if (changed.has('delimiter')) this.parse(); }`).
- **Tests AVANT** : e2e `a bento without rows shares height across implicit rows` (`cols="2"` + 4 cellules, hauteurs cellule 1 et 3 égales à 1 px près — mesuré 492 px vs 35 px aujourd'hui) ; `removing an attribute restores the default` (`removeAttribute('align')` puis `updateComplete` → `alignItems` revient à la valeur par défaut ; aujourd'hui `STALE-ALIGN {align:'center'}`) ; `changing delimiter re-parses` (3 `th` → 1 `th`).
- **Vérification** : `npx playwright test bento`
- **Effort** : S. Attention : le commentaire d'en-tête `deck-bento.ts:11-13` (« cells share the available space ») promet le comportement corrigé, la référence `docs/llms/rikiki-reference.md:236` décrit l'actuel — aligner les deux.

### Lot B5 · `fix(fit): refit when the light DOM changes`
Le trou le plus sérieux de la promesse phare, raté par le 1er passage. `fit-controller.ts:61-77` n'observe que la boîte de l'hôte plus un refit unique sur `document.fonts.ready` ; une mutation du light DOM ne déclenche rien. Mesuré : `<deck-fit>` à 304.56 px, contenu ×80, +600 ms → toujours 304.56 px, débordement 146 437 px. Idem `<deck-punch fit>` : 217.862 px avant et après.

- **Fichiers** : `rikiki/src/shared/fit-controller.ts` (MutationObserver `childList/characterData/subtree`, déconnecté dans `hostDisconnected` à côté du `ResizeObserver`), éventuellement `deck-fit.ts` / `deck-punch.ts` / `deck-csv.ts`.
- **Tests AVANT** : e2e `the fit re-measures when slotted content changes` (injecter du texte, attendre stabilité, asserter overflow ≤ 1 px et font-size strictement décroissante). Complémentaire : `src/shared/fit-controller.dom.test.ts` — nécessite un environnement DOM vitest (→ **décision produit D6**, ajout de dépendance `jsdom`/`happy-dom` : ni l'un ni l'autre n'est dans `devDependencies`).
- **Vérification** : `npx playwright test bento`
- **Effort** : M. Sous-cas non vérifiable ici : `deck-mermaid` qui rend après chargement CDN (pas de réseau) — confidence low, à re-tester après correctif.

### Lot B6 · `docs(bento): freeze and document the public bento surface`
BENTO-API-10 (P3), BENTO-API-11 (P3), A11Y-BENTO-06/07/09 (P3), + la règle implicite jamais écrite.

- **Fichiers** : `rikiki/docs/llms/rikiki-reference.md`, `rikiki/llms.txt`, `site/public/llms.txt`, `site/src/pages/docs/components.astro`, `rikiki/src/molecules/deck-cell.ts` (ajouter `::slotted(h2)` à côté du `::slotted(h3)` unique), `rikiki/themes/rikiki.css:322` + `siliceum.css` (ajouter `deck-bento > h1` à la liste des titres de slide — aujourd'hui le `slot="title"` de `deck-bento` sort en `h1` UA 2em, alors que `deck-feature`, `deck-split` et `deck-feature-cards` sont stylés).
- **Contenu obligatoire** : (1) **le style suit l'ATTRIBUT, jamais la propriété JS** — convention de toute la librairie, vérifiée sur `deck-card.ts:68-74` (`card.center = true` inerte depuis longtemps), qui absorbe d'un coup BENTO-API-02, -03 et -14 ; (2) sémantique de présence des booléens (`fit="false"` vaut `true`, converter Lit par défaut) ; (3) **les axes** de `align`/`justify` — `deck-cell` est un flex colonne (`align-items` = horizontal), `deck-bento` une grid (`align-items` = vertical) ; (4) parts exposés (`deck-bento::part(grid)`, `deck-csv::part(table)`) et tokens `--deck-cell-*` / `--deck-csv-*` / `--deck-punch-*` / `--deck-bento-gap`, absents des 11 occurrences `--deck-` de la référence ; (5) `col`/`row` en syntaxe de lignes réordonnent l'affichage mais pas l'ordre de lecture ; (6) `tone` est décoratif, il ne remplace pas un libellé.
- **Tests AVANT** : un test node (`scripts/api-surface.test.mjs`) qui extrait les `@customElement` **et** les `customElements.define` manuels de `src/**/*.ts` avec leurs `@property({attribute})`, et échoue si un attribut enregistré manque dans `docs/llms/rikiki-reference.md` ou l'inverse. Il attrapera au passage `deck-kicker` (défini à la main `src/atoms/deck-kicker.ts:27`, absent de toute doc) et les 6 éléments manquants de `components.astro` (`deck-bento`, `deck-cell`, `deck-csv`, `deck-fit`, `deck-root`, `deck-tier-arrow`).
- **Vérification** : `npx vitest run scripts/api-surface.test.mjs`
- **Effort** : M.

### Lot B7 · `fix(bento): validate out-of-range track and span values` — **gelé sur décision D2**
BENTO-API-13 (P2), BENTO-02/03/04 (P3), COV-05/06 (P3), + `col`/`row` sans borne (raté du 1er passage : `<deck-cell col="99">` produit 99 pistes de 0 px et une cellule de 1658 px).

Dégradations mesurées, toutes silencieuses : `cols="0"` → première colonne à 0 px, contenu invisible ; `gap="7"` ou `gap="banana"` → `--_gap` posé brut, `var()` invalide, `gap: normal` = 0, cellules collées ; `cols="13"` → `grid-template-columns: none` ; `span="4x1"` sur `cols=3` → 4ᵉ piste implicite à 0 px et les 3 pistes déclarées perdent 8,5 px chacune.

- **Blocage** : `src/shared/grid-tracks.test.ts:16-20` **verrouille** le pass-through (`expect(expandTracks('0')).toBe('0')`, `'13'`, `'2 cols'`). Ajouter la validation fera échouer un test existant : il faut d'abord décider si ce test encode la spec ou une régression (**D2**).
- **Fichiers** : `rikiki/src/shared/grid-tracks.ts`, `rikiki/src/shared/grid-tracks.test.ts`, `rikiki/src/molecules/deck-cell.ts`.
- **Tests AVANT** : réécrire `grid-tracks.test.ts` selon la décision (`parseSpan rejects '0' / 'abc' / '-1' / '2.5'`, `expandGap falls back for out-of-range values`), + e2e `an out-of-range cols keeps the documented default`.
- **Effort** : M.

### Lot B8 · `chore(examples): ship the bento showcase` — **gelé sur décision D1**
`examples/bento/` (23 slides, 15 `deck-bento`, 49 `deck-cell`, 2 `deck-csv`, 2 `deck-fit`, 0 erreur) est **untracked** : une v1.0 coupée depuis git ne le livre pas. Et il contient déjà une erreur due à l'inversion d'axe : `examples/bento/source.html:103` `<deck-cell align="end" justify="center">` étiquetée « bottom-aligned » est en réalité alignée **à droite** et centrée verticalement (mesuré leftGap=100.8, rightGap=29.3, topGap=bottomGap=118.6).

- **Séquencement** : décider D1 → corriger la slide → régénérer `index.html` via `node rikiki/bundle.mjs` → committer les deux → ajouter `/examples/bento/index.html` et `/examples/bento/source.html` au tableau `DECKS` de `e2e/smoke.spec.ts`.
- **Vérification** : `npx playwright test --grep @smoke`
- **Effort** : S (une fois D1 tranchée).

---

## 3. PISTE B — programme v1.0 général

### Lot V1 · `fix(security): escape mermaid error sinks and harden securityLevel` — **LOT 1 GLOBAL**
Meilleur ratio absolu : trois corrections d'une à deux lignes ferment deux XSS.

- **SEC-02 (P1, XSS zéro-interaction)** : le chemin `UnknownDiagramError` reproduit la source **entière et intacte** dans son message (`No diagram type detected matching given configuration for text: <payload>`), qui part dans `this._svg` (`deck-mermaid.ts:120`) puis dans `.innerHTML` (`deck-mermaid.ts:125`). Le JS s'exécute. Second point d'injection, hors du shadow root : `src/runtime/deck-overview.ts:376` `snap.innerHTML = src?.renderedSvg ?? ''`, alimenté par le getter `deck-mermaid.ts:86` — **assainir `_svg` à la source**, pas seulement au rendu.
- **SEC-03 (P2)** : `securityLevel: 'loose'` (`deck-mermaid.ts:48`) conserve `xlink:href="javascript:…"` sur le `<a>` SVG d'un nœud `click X href "…"` ; un vrai clic l'exécute. Causalité établie : même source, même bundle, seul `securityLevel` change → `strict` supprime le href.
- **Presenter (raté du 1er passage, confidence medium sur l'exploitabilité, certitude sur le défaut)** : `deck-presenter.ts:639` `popup.document.write(PRESENTER_HTML(state))` interpole `JSON.stringify(initial.inlineStyles)` (l. 375-378) **à l'intérieur** du `<script>` ouvert l. 338. `JSON.stringify` n'échappe pas `</script>`. `inlineStyles` est la concaténation de tous les `<style>` du deck (l. 193). Idem `themeHref` interpolé sans échappement dans un attribut l. 222. Aujourd'hui `dist/index.js` et `dist/standalone.js` ne contiennent aucun `</script>` — sain par chance, pas par construction.
- **Fichiers** : `rikiki/src/molecules/deck-mermaid.ts`, `rikiki/src/runtime/deck-overview.ts`, `rikiki/src/runtime/deck-presenter.ts`.
- **Tests AVANT** : nouveau `rikiki/e2e/security.spec.ts` — `an unrecognised mermaid source never executes script` (`window.__pwned` reste `undefined`), `a mermaid error message renders as text in the overview snapshot`, `a mermaid click href="javascript:" is stripped`, `an inline style containing </script> does not break the presenter document`. Aujourd'hui `grep -rli 'sanitiz\|xss' rikiki/src rikiki/e2e` = vide : rien n'empêchera la régression après correctif.
- **Vérification** : `npx playwright test security && npx playwright test --grep @smoke`
- **Effort** : S (correctifs) + S (spec). **SEC-01 (`deck-md` `.innerHTML` de la sortie Marked) n'est PAS dans ce lot** : c'est une décision produit (D4).

### Lot V2 · `test(size): pin every published size figure to a measured budget`
Cause racine de toute la dimension doc, jamais nommée : **aucun test n'assert un chiffre de taille**, nulle part (`grep -rln 'gzip\|21082\|11.3\|14 KB' rikiki/src rikiki/scripts rikiki/e2e` = 0 fichier). Résultat : 19 occurrences de « ~14 KB » ont dérivé sur 6 versions sans qu'aucun test rougisse. Le dépôt possède déjà le mécanisme exact qu'il faut : `scripts/version-surfaces.mjs`, « single source of truth for every place a rikiki release version appears », consommé par `bump-version.mjs` et `version.test.mjs` (15 tests).

- **Fichiers** : `rikiki/scripts/version-surfaces.mjs` (ajouter un manifeste `SIZE_SURFACES`), nouveau `rikiki/scripts/size.test.mjs`.
- **Contenu** : mesurer `gzip -9` sur `dist/index.js`, `dist/vendor/lit.js`, `dist/vendor/marked.js`, `dist/deck-presenter.js`, `dist/deck-overview.js`, `dist/deck-help.js`, `dist/click-stages.js` ; comparer aux chaînes présentes dans `site/src/**`, `README.md`, `MANIFESTO.md`, `rikiki/llms.txt`, `site/public/llms.txt`, `rikiki/docs/llms/rikiki-reference.md` ; échouer si un chiffre publié s'écarte de plus de 5 % de la mesure. Écrire **d'abord** le test avec les valeurs mesurées : il doit être rouge sur `14 KB` (réel 21 082), `11.3 KB` (`contributing.astro:82`), `~2.9 KB` presenter (réel 5 612 o sur le blob committé), `~0.8 KB` click-stages (réel 2 692 o), `~5 KB` Lit (réel 6 786 o).
- **Vérification** : `npm run build && npx vitest run scripts/size.test.mjs`
- **Effort** : S.

### Lot V3 · `docs: correct every published size, count and CDN claim`
DOC-01 (**P0**, bloquant), DOC-02, DOC-03, DOC-04, DOC-05, DOC-06, DOC-07, DOC-09, DOC-10, DOC-11. Rendu vert par le lot V2 + le test d'API du lot B6.

- **Fichiers** : `site/src/components/Hero.astro:15`, `site/src/components/Comparison.astro:15` (le « ~14 KB » y est mis en regard de « reveal.js ~80 KB » — conséquence concurrentielle directe), `site/src/components/PluginShelf.astro` (les 5 valeurs `kb` + le total l. 8 qui double-compte `deck-notes`, déjà dans le core), `site/src/pages/docs/plugins.astro` (tableau + lignes manquantes `deck-overview` 4 783 o et `deck-help` 1 470 o), `site/src/pages/docs/contributing.astro:82-90`, `README.md:7` et `:142` et `:95`, `MANIFESTO.md:13`, `:23`, `:27`, `:35`, `site/src/pages/index.astro:70,77`, `site/src/pages/docs/components.astro:184,355,359,403,408`, `site/src/pages/docs/getting-started.astro:88`, `site/src/pages/docs/cheatsheet.astro:65`, `site/src/pages/docs/recipes.astro:47`, `rikiki/llms.txt`, `site/public/llms.txt`, `CHANGELOG.md:7`, `ROADMAP.md`.
- **Corrections factuelles** : (a) « ~14 KB gzip » → deux nombres distincts, « 21 KB gzip (framework) · 38 KB gzip chargement initial, Lit et marked inclus » ; (b) décompte de composants = **34** (pas 23/26/30/25 ni 33 : `deck-kicker` est défini à la main sans décorateur, `src/atoms/deck-kicker.ts:27`) ; (c) « from CDN » pour marked / mermaid / shiki → « vendorisé dans `dist/vendor/` » — `dist/` ne contient plus **aucune** URL jsdelivr ; aligner `site/public/llms.txt:101` (« + Shiki CDN ») sur `plugins.astro:250` (« offline, no CDN ») ; (d) `README.md:7` / `MANIFESTO.md:13,27` / `index.astro:70` : « open index.html, no dev server » est faux sous `file://` (blocage CORS des ES Modules, mesuré : `customElements.get('deck-root') === false`) — reformuler en rattachant la promesse au seul mode qui la tient, la sortie bundlée ; (e) `CHANGELOG.md` `[Unreleased]` vide alors que `v0.6.0..main` contient `f04b428 feat(bento)` et 4 nouveaux custom elements ; (f) `ROADMAP.md:126` : « Formal plugin system » et « Built-in bundler » sont listés en anti-features alors que `use()` et `bundle.mjs` + `build/vite-deck.mjs` existent ; `ROADMAP.md:101` vise GitHub Actions alors que le dépôt porte `.gitlab-ci.yml` ; (g) unifier les deux `llms.txt` divergents (52 vs 122 lignes, « ~12 KB » vs « ~14 KB », un seul porte le stamp de version) ; (h) documenter le poids d'installation : `npm pack --dry-run` = 3,0 MB packé / 13,5 MB déballé / 121 fichiers, dont 12,6 MB de `dist/vendor/{shiki,mermaid}` ; (i) résidus vérifiés hors finding refuté : `MANIFESTO.md:35` cite `deck-timer.js` et `deck-pdf.js`, aucun des deux n'existe dans `dist/`.
- **Tests AVANT** : lots V2 et B6 (ce sont eux les tests de régression). Ajouter à `scripts/version.test.mjs` une assertion d'égalité entre `rikiki/llms.txt` et `site/public/llms.txt`.
- **Piège à ne pas répéter** : `site/src/pages/docs/changelog.astro:178-183` (« 11.3 KB », « Lit externalized to jsdelivr », « 23 composants ») est l'**entrée historique 0.1.0** — le dernier `<h2>` du fichier est l. 138. Ne pas la corriger : un changelog conserve ses anciennes valeurs.
- **Vérification** : `npx vitest run && cd site && npm run lint`
- **Effort** : M.

### Lot V4 · `fix(bundle): make a bundled deck actually self-contained`
BUNDLE-01 (**P0**, bloquant), BUNDLE-02, BUNDLE-03, BUNDLE-06, BUNDLE-09 (tous P1 bloquants), BUNDLE-04, BUNDLE-05, BUNDLE-07, BUNDLE-08 + 4 fuites ratées par le 1er passage. Lot le plus lourd ; découpable en 3 commits.

**V4a · `test(bundle): assert one single network request per bundled deck`** — écrire **en premier**, doit être rouge.
- Nouveau `rikiki/e2e/bundle.spec.ts` : pour chaque deck de `decks/tests/` et chaque combinaison de `rikiki init`, bundler vers un répertoire temporaire **vide**, ouvrir la page (Playwright supporte `page.goto('file://…')`, contrairement au navigateur MCP utilisé par les auditeurs) et asserter `requests.length === 1` + 0 erreur console. Cas obligatoires : mermaid, shiki, un `<style>` contenant `@import url()` et `url(pic.png)`, un `@import "sub.css"` en forme chaîne, un `<link rel=icon>` et un `<link rel=preload as=font>`, une image en markdown `![alt](pic.png)` dans un `<deck-md>`, un `<link rel=stylesheet href=local.css>` non quoté, un `srcset`.
- Point positif à ne pas perdre, à figer comme test de non-régression : `rikiki init --standalone` ouvert en `file://` fait déjà **1 seule requête**, 0 message console, `deck-root` défini, 3 slides rendues.

**V4b · `fix(bundle): fail the build when an external reference remains`**
- `bin/rikiki.mjs:69-78` : remplacer `warnExternal` (qui ne teste que des URL absolues d'une liste de domaines partielle — 0 hit sur un bundle qui 404 réellement, et laisse passer `https://example.com/y.js`) par un scanner de références runtime : attributs `src|href|poster|srcset|data-src` non-`data:`, `@import`, `url(...)` non-`data:`, littéraux `new URL(<relatif>, import.meta.url)` et `import('<relatif>')` restants dans les scripts inline. **Exploiter la valeur de retour** : aujourd'hui `bin/rikiki.mjs:118` et `:141` l'ignorent, donc `EXIT=0` même quand le WARNING s'affiche — aucun pipeline ne peut bloquer. Brancher le même module dans `bundle.mjs`, qui n'importe jamais `warnExternal` alors que son en-tête l. 10 affirme « zero external references out ».

**V4c · `fix(bundle): inline every local reference the regexes miss`**
- `bin/lib/inline.mjs` : traiter le contenu des `<style>` (jamais traité aujourd'hui — un `<style>@import url('./extra.css')</style>` ressort verbatim et est fetché ; **c'est le cas le plus probable de tous**, tout auteur ajoute un `<style>` d'overrides) ; reconnaître `@import "sub.css"` en forme chaîne (la regex l. 104 exige `url(...)`) ; traiter les `<link>` non-stylesheet (`icon`, `preload as=font`) ; inliner les images référencées depuis le markdown de `<deck-md>` (la passe l. 161 cherche `src="…"`, or l'image s'écrit `![alt](pic.png)` et n'est transformée qu'au runtime) ; élargir les regex aux attributs non quotés ; gérer `srcset` (l. 161 ne liste que `src|brand-src|poster|data-src`, et le navigateur préfère `srcset` au `src` déjà inliné) ; journaliser chaque ressource externe supprimée en silence (l. 182).
- **Mermaid / shiki** : `deck-mermaid.ts:29` `new URL('./vendor/mermaid.min.js', import.meta.url)` et `plugins/shiki.ts:54` survivent au bundling et 404 hors ligne — mermaid échoue en silence (shadowRoot `<div class="canvas"></div>` vide), shiki dégrade vers le highlighter regex. Faire côté `bundle` ce que fait déjà `bin/lib/starter.mjs:23-32` côté `init` : quand `scanComponents` détecte `deck-mermaid`, inliner `dist/vendor/mermaid.min.js` en `<script>` classique avant le bundle ; pour shiki, pré-définir `globalThis.__rikikiShiki` (chemin déjà prévu par `shiki.ts:54`). **Il n'existe aujourd'hui aucun contournement CLI** : `rikiki bundle` n'accepte ni `--with-mermaid` ni `--with-shiki` (`ERR_PARSE_ARGS_UNKNOWN_OPTION`).
- **BUNDLE-08** : `rikiki init --with-shiki` inline 12,4 MB (vs 151 Ko) pour un bénéfice **strictement nul** — `<deck-code>` n'est pas dans le bundle du tout, `scanComponents` (`inline.mjs:75-78`) ne retient que les tags présents dans le markup et le starter n'en contient aucun. Réordonner les `<script>` ne corrigerait rien : soit inclure `deck-code` quand le flag est posé, soit retirer le flag.
- **BUNDLE-06** : `themes/rikiki.css:15` est un `@import` Google Fonts, supprimé sans compensation par `inline.mjs:104-107` → bundle avec **0 `@font-face`** (contre 12 pour siliceum, dont les woff2 sont locaux) ; le deck reste lisible (fallback `system-ui`) mais perd son identité visuelle, sur le chemin **par défaut**. Vendorer les woff2 d'Unbounded/Inter/Space Mono dans `fonts/` et pointer sur un `rikiki-fonts.css` local (→ vérifier les licences, **décision D7**).
- **Vérification** : `npx playwright test bundle && node bin/rikiki.mjs bundle decks/tests/demo.html /tmp/out.html; echo "exit=$?"`
- **Effort** : L (S pour V4a, M pour V4b, L pour V4c).

### Lot V5 · `ci: gate the publish tag on the same checks as main`
PKG-03 (P2), + 3 trous ratés par le 1er passage. Effort minuscule, risque de release majeur.

- **Fichiers** : `.gitlab-ci.yml`, `rikiki/package.json`.
- **Correctifs** : (a) ajouter `- if: $CI_COMMIT_TAG =~ /^v\d+\.\d+\.\d+$/` aux `rules` de `lint` (l. 49-51), `package-check` (l. 70-72) et `e2e` (l. 101-103), et `needs: [package-check, e2e]` sur `publish-npm` — aujourd'hui `CI_COMMIT_BRANCH` est vide sur un pipeline de tag, donc **seul `publish-npm` tourne**, avec pour filet `prepublishOnly` = `npm run build && vitest run` (61 tests node purs, zéro test navigateur, zéro typecheck, zéro biome, zéro contrôle de dérive `dist/`) ; (b) asserter que le tag correspond au manifeste : `test "v$(node -p "require('./package.json').version")" = "$CI_COMMIT_TAG"` — sinon un tag `v1.0.0` sur un commit où `package.json` dit `1.0.1` publie silencieusement `1.0.1` ; (c) le job `smoke-test` est **vacuous** : `SPA_FALLBACK: 'true'` (l. 21) + `try_files $uri $uri/ /index.html` renvoient 200 sur n'importe quel chemin absent (vérifié : `/rikiki/dist/vendor/marked-NOPE.js` → 200 `text/html`) — asserter aussi le `content-type` et une taille minimale ; le `grep -q 'cdn.jsdelivr.net/npm/marked'` (l. 195) ne peut plus échouer ; (d) ajouter un `git diff --exit-code -- examples/` après régénération, sur le modèle exact du contrôle `dist/` (l. 93) — c'est l'absence de ce garde-fou qui a laissé `examples/sample/index.html` committé avec 2 URLs jsdelivr.
- **Tests AVANT** : `npx vitest run scripts/version.test.mjs` étendu d'une assertion « le tag courant, s'il existe, égale `package.json.version` ».
- **Vérification** : pipeline de MR + `git tag -a v1.0.0-rc.1` sur une branche jetable.
- **Effort** : S.

### Lot V6 · `fix(examples): regenerate the shipped single-file decks and cover them`
PKG-04 (P1, bloquant), COV-02 → requalifié, missed « `examples/sample` est versionné et absent du smoke » (P1).

- **État vérifié** : `git ls-files examples/` = `rikiki-tour/index.html`, `sample/{index,source}.html`, `stress/{generate.mjs,index,source}.html`. `smoke.spec.ts:7-20` ne liste que `rikiki-tour`, qui contient **0** `deck-bento`, `deck-cell`, `deck-csv`, `deck-fit`. `examples/sample/source.html` contient 2 `deck-bento` et 6 `deck-cell`. En production, `https://rikiki.tordu-jardin.fr/stress/` est **cassée** : blocage CSP de l'import jsdelivr de marked, `customElements.get('deck-root') === false`, 267 éléments `deck-*` non upgradés en texte brut. `/sample/` porte les mêmes deux URLs. Note : `examples/sample/index.html` est **modifié dans le working tree** (0 occurrence jsdelivr) — la régénération semble déjà faite localement mais non committée.
- **Fichiers** : `examples/sample/index.html`, `examples/stress/index.html`, `rikiki/e2e/smoke.spec.ts`.
- **Tests AVANT** : ajouter `/examples/sample/index.html` et `/examples/stress/index.html` au tableau `DECKS` (le smoke assert déjà upgrade, slide active, 0 erreur JS, 0 requête locale en échec → il partira rouge sur `stress`). Ajouter une assertion `no shipped example references a CDN` (`grep` sur `examples/**` = 0 `cdn.jsdelivr`).
- **Vérification** : `node rikiki/bundle.mjs examples/stress/source.html examples/stress/index.html && npx playwright test --grep @smoke`
- **Effort** : S.

### Lot V7 · `fix(site): stop fetching pinned vendors from jsdelivr at build time`
PKG-01 (P1, bloquant), PKG-02 (P2, bloquant), PKG-09 (P2).

- `scripts/post-build-inline-lit.mjs` L58-108 télécharge inconditionnellement `marked@12` et `mermaid@10` depuis jsdelivr **à chaque build de production** et écrase les artefacts vendorisés épinglés. Prouvé en production : le fichier servi fait 35 188 o = la taille du bundle jsdelivr, pas les 34 586 o de `rikiki/dist/vendor/marked.js`. Dérive de version démontrée : jsdelivr résout `mermaid@10` → 10.9.8 alors que `package.json` épingle `^10.9.6` (3 337 857 o CDN vs 3 337 508 o vendorisés). `res.ok` faux → `process.exit(1)` : jsdelivr indisponible = build de déploiement rouge.
- Les deux blocs `replaceAll` d'URL CDN sont morts (`standalone.js`, copié sur `index.js` L43, ne contient aucune occurrence de `cdn.jsdelivr`) : `patched === bundleSrc`, deux `console.warn` à chaque build, sans exit code.
- La copie `standalone.js` → `index.js` (L43) repose sur une prémisse CSP périmée (`index.js` importe `./vendor/lit.js`, chemin relatif same-origin autorisé par `script-src 'self'`) : la prod sert 173 449 o au lieu de 88 522 o, et **aucun deck de test, aucun spec e2e, aucune page du site ne charge `standalone.js`** — l'artefact réellement servi n'est testé nulle part.
- **Fichiers** : `scripts/post-build-inline-lit.mjs` (suppression), `.gitlab-ci.yml` (assertion positive de remplacement), `site/public/rikiki` (restreindre le symlink — il expose aujourd'hui `/rikiki/package.json` 2 444 o, `/rikiki/src/index.ts` 2 951 o, `/rikiki/e2e/smoke.spec.ts`, `/rikiki/node_modules/lit/package.json`, plus les fichiers de debug non versionnés `-dbg-deck.html`, `-e2e-deck.html`).
- **Tests AVANT** : test node `no file under rikiki/dist references an http(s) URL` + assertion CI positive (`content-type: application/javascript` et taille attendue sur `/rikiki/dist/index.js` et `/rikiki/dist/vendor/marked.js`).
- **Vérification** : `cd site && npm run build && grep -rn 'jsdelivr' dist/rikiki/dist/ | head`
- **Effort** : M.

### Lot V8 · `fix(embed): stop capturing host keys, wheel and hash`
EMBED A3 (P1, bloquant), A4 (P2, bloquant), A5 (P3) + molette et asymétrie des échappatoires (P1, ratés).

- **Molette (le pire vecteur, absent des 15 findings initiaux)** : `deck-root.ts:354` pose un listener `wheel {passive:false}`, l. 760 `preventDefault()`. Mesuré sur `embedded.html` : molette au centre du deck → `scrollY 0 → 0` et `current 0 → 1` ; molette sur le texte hôte, même page → `scrollY 0 → 120`. Le lecteur d'un article est **bloqué** dès que le curseur traverse le deck.
- **Asymétrie** : `mouse-nav="none"` existe (`deck-root.ts:236`, l. 816-821) et corrige réellement la molette (vérifié : `scrollY = 360`, `current` reste 0), mais il n'existe **aucun** équivalent clavier (`grep 'no-keys|key-nav|keyNav'` = rien) ; avec `mouse-nav=none` la barre d'espace fait toujours avancer et écrit toujours `#2`. Zéro configuration ne permet à un deck embarqué d'être un bon citoyen clavier. `mouse-nav` est d'ailleurs documenté (`README.md:173`) comme « keyboard-only deck (pre-0.3 behavior) », jamais comme remède d'embarquement.
- **Hash** : `_writeHash` (l. 882-890) fait un `history.replaceState` inconditionnel. Mesuré : `#host-title` → un `ArrowRight` → `#2`. L'ancre du lecteur est effacée, le « copier le lien » renvoie une URL fausse, et l'entrée d'historique est écrasée.
- **Correctif** : ne prendre les touches et la molette globales que pour un deck pleine page (`this.parentElement === document.body`, condition déjà utilisée par `_injectGlobals`) ; sinon écouter sur `this` avec `tabindex="0"` et n'agir qu'au focus/survol. Publier `--deck-canvas-w/h` sur l'hôte (`deck-root.ts:411-421` écrit sur `documentElement` sans discriminant) et ne les remonter sur `documentElement` que pleine page. Multi-deck : soit documenter « un seul `deck-root` par document » comme limite v1.0 assumée (aucune doc ne promet le multi-deck), soit corriger.
- **Tests AVANT** : étendre `rikiki/e2e/embed.spec.ts` (qui n'assert aujourd'hui que `htmlOverflow != 'hidden'` et `rootFont == 16`, l. 12-18 — précisément les deux seuls mécanismes correctement gatés, donc 4 tests verts sur une page où tout le reste est cassé) : Espace sur `body` → `defaultPrevented === false` et `deck.current === 0` ; molette sur le deck → `scrollY` a bougé ; `location.hash` inchangé après navigation ; `--deck-canvas-w` absent de `documentElement` ; nouveau fixture `decks/tests/embedded-two.html` (aucun deck à deux `deck-root` n'existe aujourd'hui).
- **Vérification** : `npx playwright test embed`
- **Effort** : M.

### Lot V9 · `fix(themes): scope the reset to the deck subtree`
EMBED A1 (P1, bloquant), A2 (P3).

- `themes/rikiki.css:278-287` et `siliceum.css:238-247` appliquent un reset `*`, un reset de marges sur `body/h1..h4/p/ul/ol/li`, un fond sur `html, body`, une police et une couleur sur `body`, un `::selection` global, et 34 lignes de classes génériques non préfixées (`.accent`, `.sub`, `.lead`, `.display`, `.card-text`, `table.dense`) — alors que le commentaire du fichier prétend « Light-DOM helpers (apply to slotted children of deck-* hosts) ». Mesuré : le `<h1>` de la page hôte perd ses marges et hérite d'Inter, `body` prend `#faf8f5`. `README.md:200-201` et `docs/llms/rikiki-reference.md:153-155` promettent « never touches the host page's scroll or typography ».
- **Correctif** : scoper sous `deck-root, deck-root *` (ou `@scope (deck-root)` — déjà utilisé dans le moteur, `deck-root.ts:384`), et ne garder `html, body { background }` que derrière la même garde que le moteur, `html:has(> body > deck-root)`. A2 disparaît mécaniquement.
- **Tests AVANT** : dans `e2e/embed.spec.ts`, `getComputedStyle(hostH1).marginTop !== '0px'` et `body.fontFamily` inchangée. Mesurer aussi avec `themes/siliceum.css` (jamais mesuré, sélecteurs identiques ligne à ligne).
- **Vérification** : `npx playwright test embed`
- **Effort** : M (risque de régression visuelle sur tous les decks — à passer sous `--grep @smoke` complet).

### Lot V10 · `docs: state the print/PDF reality` — **gelé sur décision D5**
PDF-01 (P1, bloquant), PDF-02 (P2, bloquant), PDF-04 (P2).

- **Deux** promesses publiques, pas une : `site/src/components/Faq.astro:12-13` **et** `site/src/components/Limits.astro:34` (« Print to PDF from the browser instead », présenté comme LA solution de repli officielle dans la section « You need PowerPoint export »). Corriger seulement la FAQ laisserait la seconde en place.
- **Réalité mesurée** : `grep '@media print'` sur tout le dépôt = 1 hit, `ROADMAP.md:75`. `page.pdf()` sur un deck de 10 slides → **1 page**, avec le chrome de navigation, et **rognée horizontalement** (le `R` de RIKIKI et le `P` de PRESENTE PAR sont hors page — rastérisé, ce n'est pas un artefact `pdftotext`). Le mode overview n'est **pas** un contournement (testé : toujours 1 page, plus le chrome de l'overview). Il n'existe aujourd'hui aucun chemin, même manuel, vers un PDF multi-pages.
- **Cause racine double** : `shared-styles.ts:11-22` (`:host{display:none}`) **et** `deck-root.ts:566-572` (`html:has(> body > deck-root){overflow:hidden;height:100%}` + idem sur `body`). Un correctif qui n'ajouterait qu'un `@media print{:host{display:flex}}` produirait toujours une page. S'y ajoute le `transform: scale(--deck-scale)` du `#stage`, calculé pour le viewport écran et jamais recalculé pour la boîte d'impression.
- **Chemin S (recommandé pour la RC)** : corriger le wording des deux surfaces. **Chemin L** : implémenter `@media print` + `?export` + branche print du scaling, avec `e2e/print.spec.ts` comptant les pages du PDF.
- **Vérification** : `npx playwright test print` (chemin L) ou `cd site && npm run lint` (chemin S).
- **Effort** : S ou L.

### Lot V11 · `feat(a11y): ARIA baseline for the engine`
EMBED B1 (P1, bloquant), B3 (P2, bloquant), B4 (P2, bloquant), B2/B5/B6/B8/B9 (P3), + « zéro tab stop en configuration d'embarquement recommandée » (P1, raté) et « la recherche de l'overview est inutilisable au clavier » (P2, raté).

- **État** : `grep -rn "aria-|role=|tabindex" src/` = **zéro ligne**. Les cellules de l'overview sont des `<div>` avec un unique listener `click` (`deck-overview.ts:583-598`, aucun `keydown` dans tout le fichier) ; `deck-root.ts:901-908` retourne tôt sur toute touche autre que `Esc/o/O/Enter` en mode overview → l'affordance « type to filter » annoncée par le placeholder du champ (`deck-overview.ts:479-482`, sans `aria-label` ni `<label>`) **ne peut jamais être déclenchée sans souris**. En configuration `no-hint no-arrows` — celle que `docs/llms/rikiki-reference.md:147` recommande explicitement pour l'embarquement — 6 `Tab` consécutifs donnent `["BODY"×6]` : le deck est simultanément invisible et inatteignable au clavier **et** vole les touches globales.
- **Correctif** : `role="region"` + `aria-roledescription="slide deck"` sur le stage ; `aria-label` sur les `.nav-btn` (dont le nom accessible est aujourd'hui « ‹ » / « › ») ; `role="progressbar"` + `aria-valuenow` sur `#progress` ; `aria-live="polite" aria-atomic="true"` sur `#counter` ; `.ov-cell` en `<button type="button" aria-label="Slide N — titre">` + focus initial + navigation aux flèches ; `aria-label` sur `.ov-search` ; `role="dialog" aria-modal` sur l'overlay d'aide (`deck-help.ts:80-101`) ; une règle `:focus-visible` partagée (`grep ':focus' src/` = 1 seule règle, `deck-overview.ts:63`) ; propriété `alt` sur `deck-photo` (`deck-photo.ts:129`, image en `background-image`).
- **Précédent interne utile** : `site/src/components/LiveReload.astro:55-56` expose déjà `<button type="button" aria-label="Previous slide">‹</button>` sur des boutons visuellement identiques à ceux de `deck-root.ts:1282-1288` qui n'en ont aucun. Le pattern est connu, appliqué dans la vitrine, absent du paquet.
- **Deux non-problèmes à ne pas chasser** (vérifiés) : les slides inactives sont en `display:none`, donc hors de l'arbre d'accessibilité — pas de « lecture des 11 slides d'un coup » ; `prefers-reduced-motion` **est** honoré (`--rik-motion-slow` → 0 ms), implémenté dans `click-stages.ts:275` et `deck-transition.ts:82`.
- **Tests AVANT** : `rikiki/e2e/a11y.spec.ts` — Tab atteint chaque contrôle du hint et chaque vignette de l'overview ; `Enter` sur une vignette change de slide ; la région live contient le nouveau numéro après navigation ; le champ de recherche est atteignable et filtre. Un scan `@axe-core/playwright` sur deck simple / embarqué / overview / aide → **ajout de dépendance, décision D6**.
- **Vérification** : `npx playwright test a11y`
- **Effort** : M.

### Lot V12 · `chore(pkg): engines, exports map holes and a packaging test`
PKG-05 (P2), PKG-08 (P2), PKG-07 (P3), PKG-10 (P3).

- `rikiki/package.json` n'a **aucun** champ `engines` alors que `rolldown` — unique dépendance de production, atteinte au runtime du CLI publié (`bin/lib/inline.mjs:11` import statique, l. 50 appel) — déclare `{"node": "^20.19.0 || >=22.12.0"}`. Ajouter `"engines": { "node": ">=20.19.0" }`.
- Trous de la carte `exports`, reproduits avec `import.meta.resolve` : `rikiki-deck/themes/siliceum-fonts.css` → `ERR_PACKAGE_PATH_NOT_EXPORTED` alors que le fichier est livré ; `rikiki-deck/package.json` → idem (casse les résolveurs de version et certains plugins de bundler) ; `rikiki-deck/fonts/` → idem, alors que `themes/siliceum-fonts.css` référence `src: url(../fonts/….woff2)`. Ajouter `"./package.json"`, `"./fonts/*"`, `"./themes/*"`.
- Épingler la majeure dans `site/src/pages/docs/getting-started.astro:29-30` (`rikiki-deck@1`), générée par `scripts/version-surfaces.mjs`.
- **Tests AVANT** : `rikiki/scripts/packaging.test.mjs` — pour chaque clé de `exports`, résoudre la cible et échouer si elle manque ; comparer la sortie de `npm pack --dry-run --json` à une liste attendue ; asserter la liste des dépendances de production (`rolldown` seul).
- **Vérification** : `npx vitest run scripts/packaging.test.mjs`
- **Effort** : S.

### Lot V13 · `test(cli): cover bin/ end to end`
`bin/` est publié (`bin` + `files`) et **n'est couvert par aucun test** : `vitest.config.ts` limite l'include à `scripts/**/*.test.mjs` et `src/**/*.test.ts`, et aucun spec Playwright ne charge un deck produit par `init`/`bundle` (`grep -rln 'bin/' e2e/` = vide). Les trois sous-commandes (`init --standalone`, `bundle`, `skills`) sont des promesses publiques documentées dans l'aide du CLI, et la sortie de `bundle` est précisément l'artefact qui a raté une génération dans `examples/`.

- **Recouvrement** : largement absorbé par le lot V4a. Ce lot n'ajoute que `skills` et `init` sans `--standalone`.
- **Effort** : S. À fusionner dans V4a si le budget est serré.

---

## 4. Décisions produit — arbitrage humain requis

Je ne prends aucune de ces décisions. Chacune bloque un lot nommé.

| # | Décision | Enjeu | Bloque |
|---|----------|-------|--------|
| **D1** | **Livrer `examples/bento/` en v1.0 ?** (23 slides, seule vitrine complète de l'API bento, aujourd'hui untracked) | Le committer, c'est figer une vitrine ; ne pas le committer, c'est sortir la feature phare de v1.0 sans démo. La slide `source.html:103` étiquetée « bottom-aligned » est fausse et doit être corrigée avant. | B8 |
| **D2** | **`expandTracks`/`parseSpan` : valider ou passer-plat ?** | `grid-tracks.test.ts:16-20` verrouille explicitement le pass-through (`expandTracks('0') === '0'`, `'13'`, `'2 cols'`). Valider = changer un comportement observable et casser un test existant. Décider si ce test encode la spec ou une régression. | B7 |
| **D3** | **Unifier le vocabulaire de statut avant le gel ?** | 4 surfaces concurrentes : `deck-cell tone` (info/warn/ok/danger), `deck-punch tone` (+muted/accent, plus un `default` fantôme annoncé `deck-punch.ts:2` et absent du type), `deck-card color` (yellow/orange/green/red), `deck-stat tone` (orange/green/yellow/purple/lime/red/cyan). Idem `fit`/`fit-min` vs `min`/`max` sur `deck-fit`. Unifier = rupture de contrat sur des composants publiés ; ne pas unifier = geler 4 vocabulaires pour toujours. **Aucun mécanisme de dépréciation n'existe dans le projet.** | B1 (portée), B6 |
| **D4** | **`deck-md` : sanitiser ou assumer ?** | XSS exécutable prouvée (`deck-md.ts:116` puis `:129`, marked v12 laisse passer le HTML brut). Option (a) documenter formellement « le markdown est du code de l'auteur » + un test qui **gèle** ce comportement ; option (b) attribut opt-in `sanitize` branché sur DOMPurify → **ajout de dépendance**. `SECURITY.md` énonce déjà le modèle « deck content = HTML que vous publiez », mais il est à la racine du dépôt et **absent de `package.json` files** : un consommateur npm ne le reçoit jamais. | V1 (périmètre) |
| **D5** | **Export PDF : retirer la promesse ou l'implémenter ?** | Deux promesses publiques (`Faq.astro:12-13`, `Limits.astro:34`), zéro implémentation, aucun contournement. Retirer = renoncer publiquement à une capacité annoncée. Implémenter = L. | V10 |
| **D6** | **Ajouter des dépendances de test ?** | `jsdom`/`happy-dom` (aucun test DOM n'est possible aujourd'hui : `vitest.config.ts` impose `environment: 'node'`, ni l'un ni l'autre en `devDependencies` — bloque toute couverture unitaire de `FitController`, dont les l. 51-100 ne sont testées par rien), `@axe-core/playwright`, `@vitest/coverage-v8`. Trois ajouts, tous devDeps. | B5, V11, couverture |
| **D7** | **Vendorer les polices du thème `rikiki` ?** | Unbounded / Inter / Space Mono en woff2 locaux, comme siliceum. Vérifier les licences de redistribution et accepter le poids dans le paquet (déjà 13,5 MB déballé). Alternative minimale : avertir explicitement à chaque `@import` supprimé. | V4c |
| **D8** | **Multi-`deck-root` : limite documentée ou corrigée ?** | Aucune doc ne promet le multi-deck. Documenter « un seul par document » est un S ; corriger (vars sur l'hôte, keydown scopé, canal presenter dérivé de l'id) est un M. | V8 |
| **D9** | **Support navigateur : Firefox et WebKit sont-ils dans le contrat v1.0 ?** | `playwright.config.ts:19` ne déclare que `chromium`. `@scope` (`deck-root.ts:384`), `:has()` et les container queries (`cqw` dans 10 fichiers `src/`) n'ont jamais été exécutés ailleurs. Les auditeurs n'ont **pas pu** installer Firefox (révision 1522 requise, 1509 en cache) ni WebKit. Ajouter les projets = élargir le contrat sans savoir ce qui casse. | risque résiduel R1 |
| **D10** | **`deck-csv.reparse()` : API supportée ou retrait ?** | Non documentée, aucun appelant sur `main`. Le cadrage « résidu de la branche éditeur » est **faux** : `deck-md.ts:96` porte exactement la même méthode et est antérieur. C'est un pattern de la librairie, et le seul contournement de la non-réactivité de `delimiter`. Décider avant le gel. | B4, B6 |
| **D11** | **Exporter les classes et types bento depuis `src/index.ts` ?** | `index.ts` n'exporte que `DeckPlugin`, `DeckContext`, `DeckCodeHighlighter`, `setDeckCodeHighlighter`. `"./dist/*": "./dist/*"` est un subpath **déclaré**, donc public assumé. Soit re-exporter explicitement, soit fermer `./dist/*`. | B6 |

---

## 5. À prouver d'abord par un test de régression

Aucun finding du dossier n'est resté **PLAUSIBLE** — tous sont CONFIRMED ou REFUTED. Restent les affirmations à **confidence low ou medium** que l'environnement n'a pas permis de trancher. Elles doivent recevoir un test **avant** tout correctif, faute de quoi elles vont en risques résiduels.

| Item | Statut | Test à écrire avant de conclure |
|------|--------|----------------------------------|
| `deck-fit` hors d'une boîte dimensionnée (`:host{height:100%}` ne borne rien) — mesuré 1521 px de haut dans un canvas de 1080 px avec `overflow` rapporté à 0 | low : l'injection en faisait un grid item, pas l'usage documenté | e2e : un `<deck-fit>` placé directement dans un `deck-feature`, asserter que le fit converge ou qu'il signale |
| Sortie de `<script>` dans la fenêtre presenter via `inlineStyles` | medium (défaut d'échappement certain, exploitabilité non reproduite — nécessite un popup réel) | e2e presenter avec un `<style>` contenant `/*</script>*/`, asserter que le popup rend bien 2 panneaux |
| `deck-mermaid` rendu après chargement du CDN → le fit ne recalcule pas | low (pas de réseau dans l'environnement d'audit) | à couvrir par le test de mutation du lot B5 |
| `npx rikiki` casse sur Node 18 / 20.10 | inférence non testée (un seul Node disponible) | matrice CI à 2 versions Node sur le job `package-check` |
| Fuite de callbacks `document.fonts.ready.then` de `FitController` sur des cycles connect/disconnect répétés | non mesuré (le garde `if (this.ro)` rend l'appel inoffensif) | test unitaire DOM (dépend de D6) |
| Précédence du `font-size` inline de `FitController` face à une surcharge auteur `--deck-punch-size` / `font-size` | non exécuté ; l'inline gagne par construction | e2e avant de documenter `--deck-punch-size` comme knob supporté |
| Clipping silencieux de `deck-cell` (`overflow:hidden` + `container-type:size`) sur une cellule dense | non démontré (le flex-shrink a compressé sans dépassement) | e2e avec un contenu à taille absolue |
| `expandTracks` face à une valeur contenant `;` (`cols="red; background:url(x)"`) | non vérifié dans le navigateur ; surface à faible risque (l'auteur contrôle son HTML) | test unitaire + e2e, à joindre au lot B7 |

---

## 6. Verdict

### NO-GO en l'état.

Cinq faits, chacun suffisant à lui seul :

1. **Deux XSS confirmées et exécutées.** `deck-mermaid` via `UnknownDiagramError` est **zéro-interaction** : il suffit qu'un `<deck-mermaid>` contienne du contenu qui ne commence pas par un mot-clé de diagramme connu, et le payload se ré-exécute dans un second arbre DOM via `deck-overview.ts:376`. `deck-md` est le second sink. Correctif d'une ligne pour le premier ; aucun test de non-régression sécurité n'existe (`grep -rli 'sanitiz\|xss' src/ e2e/` = vide).
2. **Le chiffre marketing central est faux** dans 19 occurrences sur 12 fichiers, falsifiable par le lecteur en une commande, et mis en regard d'un concurrent dans `Comparison.astro:15`.
3. **La promesse de tête du bundler est fausse** : un deck mermaid bundlé 404 en `file://` et rend un shadowRoot vide, sans message pour le lecteur, sans code de sortie non nul, et **sans aucun contournement CLI** (`rikiki bundle` n'a ni `--with-mermaid` ni `--with-shiki`).
4. **Le tag qui publie ne prouve rien** : sur un pipeline de tag, `CI_COMMIT_BRANCH` est vide, donc seul `publish-npm` s'exécute, avec pour filet 61 tests node purs — zéro test navigateur, zéro typecheck, zéro biome, zéro contrôle de dérive `dist/`. Et rien ne vérifie que le tag correspond à `package.json.version`.
5. **L'objectif annoncé n'est pas atteint sur la feature phare** : `e2e/bento.spec.ts` couvre 3 comportements, dont 2 par des assertions tautologiques (le `waitForFunction` affirme exactement ce que l'`expect` vérifie) et 1 (le csv) qui reste **intégralement vert avec un `FitController` mort**. `deck-fit`, composant public documenté, a zéro test à tous les niveaux.

### Plus petit chemin vers la RC

Huit lots, dont cinq sont S. Estimation : **3 à 4 jours** de travail focalisé.

1. **V1** (S) — échapper les sinks mermaid, `securityLevel: 'strict'`, échapper le `document.write` du presenter, + `e2e/security.spec.ts`.
2. **B1** (S) — router les tones vers des tokens texte, + test de contraste vitest sur les deux thèmes.
3. **B2** (S) — champ vide quoté, `\r` seul, délimiteur 1 caractère, normalisation de la matrice.
4. **V2** (S) — manifeste SIZE dans `version-surfaces.mjs` + `size.test.mjs`.
5. **V5** (S) — `rules` du tag, `needs`, assertion tag == version, `git diff --exit-code -- examples/`.
6. **V6** (S) — régénérer `sample`/`stress`, les ajouter au smoke.
7. **V3** (M) — corriger les chiffres, décomptes, claims CDN, `file://`, CHANGELOG, ROADMAP, les deux `llms.txt`. Rendu automatiquement vérifiable par V2.
8. **V4a + V4b** (S + M) — `e2e/bundle.spec.ts` « une seule requête », scanner de références runtime, **code de sortie non nul**. Puis, selon D4/D5, soit V4c complet (L) soit un avertissement CLI explicite « mermaid/shiki ne sont pas inlinés par `bundle` » assumé comme limite documentée v1.0.

**Décisions à trancher avant de lancer ce chemin** : D4 (périmètre de V1), D5 (V3 corrige-t-il ou supprime-t-il la promesse PDF), D1 (V6 inclut-il `examples/bento`).

**Différables après la RC, sans bloquer le tag** : B3 (filet de contrat bento — indispensable au discours « chaque promesse prouvée », mais aucun défaut présent), B4, B5, B6, B7, V8 à V13. **À documenter explicitement comme limites v1.0 assumées si elles ne sont pas traitées** : l'isolation embarquée (V8/V9 — la promesse `README.md:200` doit alors être retirée du même geste que les autres corrections de V3), le plancher d'accessibilité (V11 — aucune doc ne promet l'accessibilité aujourd'hui, ce qui rend l'aveu tenable), et le multi-`deck-root`.