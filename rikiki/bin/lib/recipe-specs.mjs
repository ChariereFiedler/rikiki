// ════════════════════════════════════════════════════════════════
// RIKIKI · the recipes · twelve graphic models,
// each a skeleton told as a story, with the content it needs
//
// A recipe is one step above the free grammar and beside the intents: a skeleton
// of `deck-diagram` (a story played on entry, a composition) whose names are the
// parts of the model, whose `{{fields}}` are the facts of a brief, and whose beats
// are the sequence the model imposes. It is not compiled: the author fills it,
// `rikiki check --steps` checks it. Each skeleton comes from a diagram the
// acceptance decks already show working (decks/tests/deck-diagram-{story,marks,
// panels}.html), so filled with its example it passes the check.
//
// Pure data · `rikiki recipe` reads it (recipe.mjs), the tests fill every skeleton
// with its example and lay it out (scripts/recipes.test.mjs).
// ════════════════════════════════════════════════════════════════

/** The source of an example · what a public example says of its facts, the participle
 *  agreeing with a feminine noun (`invented('sonde', 'e')`). */
const invented = (what, agreement = '') => `Illustration · ${what} inventé${agreement} pour l'exemple`;

export const RECIPES = Object.freeze([
  {
    name: 'incident-band',
    model: 'M15',
    title: 'incident frise',
    talk: '42, 52',
    tempo: 'incident',
    shows: 'a system ran at its pace, broke at a dated time, and the void is as long as it lasted',
    cues: [
      'heures sans',
      'h sans',
      'jours sans',
      'sans un',
      'sans une',
      'sans aucun',
      'coupure',
      'tout est vert',
      'incident',
      'panne silencieuse',
      'personne n\'a vu',
      'hours without',
      'went silent',
      'outage',
    ],
    brief: [
      { key: 'claim', max: 36, says: 'the title, the sentence the room leaves with', example: 'Tout est vert, et 15 h sans facture' },
      { key: 'eyebrow', says: 'the chapter, then what the slide is', example: 'Ce que la CI ne voit pas · la facturation' },
      { key: 'still', says: 'what stays green while it breaks, with its figure', example: 'CI · 418 tests' },
      { key: 'stillNote', says: 'what that green says', example: 'tout passe' },
      { key: 'loss', type: 'number', says: 'the consequence, counted', example: 212 },
      { key: 'lossUnit', says: 'the unit of that count', example: 'factures' },
      { key: 'lossLabel', says: 'what the count is', example: 'en retard, estimées' },
      { key: 'flow', says: 'what the system delivers when it runs', example: 'factures' },
      { key: 'rhythm', says: 'its normal pace, with its unit', example: 'une toutes les 4 min' },
      { key: 'from', type: 'number', says: 'the start of the window shown, in hours on one scale', example: 6 },
      { key: 'to', type: 'number', says: 'its end, on the same scale', example: 32 },
      { key: 'cut', type: 'number', says: 'when it broke, on the same scale (from < cut)', example: 11.25 },
      { key: 'until', type: 'number', says: 'when it came back (cut < until ≤ to)', example: 26.5 },
      { key: 'cutTag', says: 'the break, dated, with its cause and its identifier', example: 'mar. 11:15 · migration 0042_tva' },
      { key: 'gap', says: 'how long it lasted, said as the void', example: '15 h sans facture' },
      { key: 'found', says: 'when it came back, and how', example: 'mer. 02:30 · migration annulée' },
      { key: 'foundNote', says: 'who saw it first', example: "l'astreinte a vu le compteur à 02:10" },
      { key: 'source', says: 'where the facts come from · say it when they are invented', example: invented('incident') + ' (dates, migration et volumes fictifs)' },
    ],
    sequence: [
      ['steady', 'the normal time runs at its pace, its regular events one by one; what stays green stands'],
      ['event', 'the dated cut: the band breaks at its time, the void grows as long as it lasted, the brace says how long'],
      ['effect', 'the loss counts up, in the colour of the incident'],
      ['proof', 'when and how it came back, under the band'],
    ],
    guarantees: [
      'DG_BAND_NO_CUT · from < cut < until ≤ to, or the band is a bar',
      'ILL_NO_STEADY_STATE · three seconds of normal time before the cut',
      'ILL_FINAL_INCOMPLETE · the void, the brace, the count and the status stay at rest',
    ],
    avoid: 'nothing stopped, it slowed or crossed a line (pulse-threshold) · you show why it broke (lanes-gate, or a model-incident composition)',
    neighbours: ['pulse-threshold', 'probe-stations'],
    pitfalls: [
      'a void under a tenth of the window is not seen · widen the window, never the void',
      'a count you estimated says so in its label and in deck-source',
      'an incident is short: no camera, no second panel · the remedy that follows takes the time',
    ],
    skeleton: `<deck-feature id="{{name}}" eyebrow="{{eyebrow}}">
  <h1 slot="title">{{claim}}</h1>
  <deck-diagram play="enter" layout="column" align="stretch" gap="airy">
    <dg-group layout="row" gap="airy">
      <dg-box name="still" icon="check" label="{{still}}" note="{{stillNote}}" paint="ok"></dg-box>
      <dg-counter name="loss" value="{{loss}}" unit="{{lossUnit}}" label="{{lossLabel}}" tone="danger" beat="effect"></dg-counter>
    </dg-group>
    <dg-band name="flow" label="{{flow}}" note="{{rhythm}}" from="{{from}}" to="{{to}}" cut="{{cut}}" until="{{until}}" tag="{{cutTag}}" brace="{{gap}}" steady="3s" beat="event"></dg-band>
    <dg-status for="flow" state="ok" label="{{found}}" note="{{foundNote}}" side="bottom" beat="proof"></dg-status>
  </deck-diagram>
  <deck-source>{{source}}</deck-source>
</deck-feature>`,
  },
  {
    name: 'lanes-gate',
    model: 'M22',
    title: 'lanes and a gate',
    talk: '56, 57',
    tempo: 'remedy',
    shows: 'traffic runs, one command is written, its one reader drops the gate, nothing reaches the target',
    cues: [
      'kill switch',
      'bouton stop',
      'coupe-circuit',
      'arret d\'urgence',
      'tester le stop',
      'le stop',
      'feature flag',
      'circuit breaker',
      'plus rien ne',
    ],
    brief: [
      { key: 'claim', max: 36, says: 'the title, the sentence the room leaves with', example: 'Le STOP des virements, testé en vrai' },
      { key: 'eyebrow', says: 'the chapter, then the remedy', example: 'Remède · coupe-circuit des paiements' },
      { key: 'test', says: 'who or what writes the command', example: 'exercice réel' },
      { key: 'testWhen', says: 'when, dated', example: 'jeu. 10:30' },
      { key: 'writes', says: 'the verb on the arrow to the command', example: 'écrit' },
      { key: 'flagOn', says: 'where the command lives, running', example: 'Redis · MARCHE' },
      { key: 'flagOff', says: 'the same, stopped', example: 'Redis · STOP' },
      { key: 'reads', says: 'the verb on the arrow to its reader', example: 'lu' },
      { key: 'reader', says: 'the one code that reads it, by its identifier', example: 'payouts_enabled()' },
      { key: 'readerNote', says: 'why it is the one', example: 'seul lecteur du STOP' },
      { key: 'laneA', says: 'the first flow the gate cuts', example: 'virements' },
      { key: 'laneANote', says: 'its pace or its route', example: 'SEPA · 1 par min' },
      { key: 'laneB', says: 'the second flow', example: 'remboursements' },
      { key: 'laneBNote', says: 'its pace or its route', example: 'file refunds' },
      { key: 'laneC', says: 'the third flow', example: 'relances' },
      { key: 'laneCNote', says: 'its pace or its route', example: 'cron toutes les 5 min' },
      { key: 'target', says: 'what the flows reach', example: 'banque · prod' },
      { key: 'proof', says: 'what the target proves, counted', example: '0 virement émis' },
      { key: 'cutAt', says: 'the instant the gate holds, to the second', example: '10:30:04' },
      { key: 'cutNote', says: 'what it means', example: 'plus rien ne sort' },
      { key: 'source', says: 'where the facts come from', example: invented('exercice') + ' (heures, files et banque fictives)' },
    ],
    sequence: [
      ['steady', 'the three flows run for three seconds, tokens one by one to the target'],
      ['event', 'the test writes the command: the token rides to it, the command turns (MARCHE → STOP)'],
      ['spread', 'its one reader reads it, and the gate drops across the lanes'],
      ['effect', 'the tokens queue against the gate, what lies past it pales, the instant is said'],
      ['proof', 'the target proves nothing reached it'],
    ],
    guarantees: [
      'DG_GATE_LANE_UNKNOWN · the gate stands over lanes that exist',
      'ILL_NO_STEADY_STATE · the lanes run before the command',
      'ILL_FINAL_INCOMPLETE · the gate stays closed, the command stays swapped, the proof stays',
    ],
    avoid: 'only one flow is cut and the others pass (one lane, a gate over it) · the incident where the stop failed (a model-incident composition: the mechanism beside the incident)',
    neighbours: ['switch-over', 'race-lock'],
    pitfalls: [
      'a gate on a step-free story drops on its beat: never write step',
      'the reader is one identifier, the one code that reads the command · two readers is two gates',
      'flow on a lane is the queue after the cut; steady is the traffic before it',
    ],
    skeleton: `<deck-feature id="{{name}}" eyebrow="{{eyebrow}}">
  <h1 slot="title">{{claim}}</h1>
  <deck-diagram play="enter" layout="column" align="start">
    <dg-group layout="row" gap="airy">
      <dg-box name="test" icon="flag" label="{{test}}" note="{{testWhen}}" paint="ok"></dg-box>
      <dg-box name="command" icon="database" label="{{flagOn}}" swap="{{flagOff}}" swap-icon="ban" paint="pale" tone="normal warn" beat="event" after="writes"></dg-box>
      <dg-box name="reader" icon="code" label="{{reader}}" note="{{readerNote}}" paint="ink"></dg-box>
      <dg-link name="writes" from="test" to="command" label="{{writes}}" flow="1" beat="event"></dg-link>
      <dg-link name="reads" from="command" to="reader" label="{{reads}}" flow="1" beat="spread"></dg-link>
    </dg-group>
    <dg-group layout="lanes" gap="tight">
      <dg-lane name="lane-a" icon="cloud" label="{{laneA}}" note="{{laneANote}}" steady="3s"></dg-lane>
      <dg-lane name="lane-b" icon="clock" label="{{laneB}}" note="{{laneBNote}}" steady="3s"></dg-lane>
      <dg-lane name="lane-c" icon="database" label="{{laneC}}" note="{{laneCNote}}" steady="3s"></dg-lane>
      <dg-gate name="gate" by="reader" state="open closed" beat="spread" after="reads"></dg-gate>
      <dg-box name="target" icon="target" label="{{target}}" paint="pale" proof="{{proof}}" beat="proof"></dg-box>
      <dg-text name="cut" for="gate" side="bottom" label="{{cutAt}}" note="{{cutNote}}" beat="effect"></dg-text>
    </dg-group>
  </deck-diagram>
  <deck-source>{{source}}</deck-source>
</deck-feature>`,
  },
  {
    name: 'probe-stations',
    model: 'M16',
    title: 'a probe from station to station',
    talk: '41, 43, 59',
    tempo: 'remedy',
    shows: 'a fake item travels the real chain on a clock, one run fails at a station, the alert beats the first client',
    cues: [
      'sonde',
      'faux lead',
      'faux client',
      'commande test',
      'commande temoin',
      'de bout en bout',
      'arrivent bien',
      'synthetic',
      'probe',
      'end to end',
      'end-to-end',
    ],
    brief: [
      { key: 'claim', max: 36, says: 'the title, the sentence the room leaves with', example: 'La commande de 14:30 se perd' },
      { key: 'eyebrow', says: 'the chapter, then the remedy', example: 'Remède · commande témoin' },
      { key: 'probe', says: 'the fake item sent through the real chain', example: 'commande témoin' },
      { key: 'probeEvery', says: 'its clock', example: 'toutes les 30 min' },
      { key: 'stationA', says: 'the first station, where it fails', example: 'paiement' },
      { key: 'stationB', says: 'the next station', example: 'préparation' },
      { key: 'inbox', says: 'where it must arrive', example: 'boîte de test' },
      { key: 'failAt', says: 'when the station fails, at the minute', example: '14:31' },
      { key: 'failNote', says: 'what fails, exactly', example: 'webhook expiré' },
      { key: 'waitAt', says: 'the run that does not arrive', example: '14:30' },
      { key: 'waitNote', says: 'what the inbox sees', example: 'rien reçu' },
      { key: 'runsLabel', says: 'the title of the log of runs', example: 'passages' },
      { key: 'runs', type: 'rows', says: 'the runs, before they are judged, one per row', example: ['14:00 · commande T-8812', '14:30 · commande T-8813'] },
      { key: 'runsAfter', type: 'rows', says: 'the same runs, judged ✓ or ✗', example: ['✓ 14:00 · reçue en 41 s', '✗ 14:30 · rien reçu'] },
      { key: 'alert', says: 'the alert and who it reaches', example: 'SMS à Sofia' },
      { key: 'alertNote', says: 'what the alert says', example: 'astreinte paiement' },
      { key: 'proof', says: 'the instant it was known, against the first client', example: '14:36 · avant le 1er client' },
      { key: 'source', says: 'where the facts come from', example: invented('sonde', 'e') + ' (heures, étapes et numéros fictifs)' },
    ],
    sequence: [
      ['steady', 'the probe rides the chain on its clock, run after run, to the inbox'],
      ['event', 'one station fails at its minute: its link is cut and its status turns ✗'],
      ['spread', 'the inbox waits, the log of runs judges them: ✓ the last, ✗ this one'],
      ['proof', 'the alert, dated, before the first client'],
    ],
    guarantees: [
      'DG_STATUS_NO_TARGET · each status stands beside a station of the chain',
      'DG_ROWS_MISMATCH · the runs and their judgement are one row each',
      'ILL_FINAL_INCOMPLETE · the cut link, the ✗ and the alert stay',
    ],
    avoid: 'nothing travels, a figure crosses a line (pulse-threshold) · the outage itself, told afterwards (incident-band)',
    neighbours: ['pulse-threshold', 'wiring'],
    pitfalls: [
      'the probe does not stop at each station: the stations are passed by the established flow, and the failing one is said by its status',
      'a status side="top" over a row keeps the row readable; two statuses on one station are one too many',
    ],
    skeleton: `<deck-feature id="{{name}}" eyebrow="{{eyebrow}}">
  <h1 slot="title">{{claim}}</h1>
  <deck-diagram play="enter" layout="column" gap="airy">
    <dg-group layout="row" gap="airy">
      <dg-box name="probe" icon="flag" label="{{probe}}" note="{{probeEvery}}" paint="gold"></dg-box>
      <dg-box name="station-a" icon="refresh" label="{{stationA}}" paint="pale"></dg-box>
      <dg-box name="station-b" icon="search" label="{{stationB}}" paint="pale"></dg-box>
      <dg-box name="inbox" icon="user" label="{{inbox}}" paint="ink"></dg-box>
      <dg-link from="probe" to="station-a" steady="3s"></dg-link>
      <dg-link name="broken" from="station-a" to="station-b" steady="3s" dim beat="event"></dg-link>
      <dg-link from="station-b" to="inbox" steady="3s"></dg-link>
    </dg-group>
    <dg-group layout="row" gap="airy">
      <dg-table name="runs" label="{{runsLabel}}" icon="clock" paint="pale" beat="spread" after="inbox-wait" rows="{{runs}}" swap="{{runsAfter}}"></dg-table>
      <dg-box name="alert" icon="alert" label="{{alert}}" note="{{alertNote}}" paint="bad" proof="{{proof}}" beat="proof"></dg-box>
    </dg-group>
    <dg-status for="station-a" state="ok fail" label="{{failAt}}" note="{{failNote}}" side="top" beat="event" with="broken"></dg-status>
    <dg-status name="inbox-wait" for="inbox" state="ok wait" label="{{waitAt}}" note="{{waitNote}}" side="top" beat="spread"></dg-status>
  </deck-diagram>
  <deck-source>{{source}}</deck-source>
</deck-feature>`,
  },
  {
    name: 'wiring',
    model: 'M17',
    title: 'wiring, a fan-in',
    talk: '44, 45, 68',
    tempo: 'remedy',
    shows: 'every item is wired to what runs it, the control finds the one with no wire, the wire is added and the report proves it ran',
    cues: [
      'jamais lance',
      'jamais execute',
      'jamais tourne',
      'sans job',
      'a tourne',
      'qui me prouve',
      'branche',
      'cable',
      'fan-in',
      'never ran',
      'wired',
    ],
    brief: [
      { key: 'claim', max: 36, says: 'the title, the sentence the room leaves with', example: 'Un test sans job, la CI le refuse' },
      { key: 'eyebrow', says: 'the chapter, then the remedy', example: "Remède · contrôle d'exécution des tests" },
      { key: 'itemsLabel', max: 16, says: 'what is wired, as a whole', example: 'tests du dépôt' },
      { key: 'items', type: 'rows', max: 20, says: 'the items, one per row, the unwired one among them', example: ['auth · 41', 'paiement · 28', 'purge-90j · 6', 'export · 12'] },
      { key: 'itemsJudged', type: 'rows', max: 22, says: 'the same rows, ✓ when wired, ✗ for the one that is not', example: ['✓ auth · 41', '✓ paiement · 28', '✗ purge-90j · 6', '✓ export · 12'] },
      { key: 'control', says: 'the control that reads the wiring', example: 'contrôle CI' },
      { key: 'controlNote', max: 20, says: 'its rule', example: '1 test → 1 job' },
      { key: 'rule', says: 'what the control does when a wire is missing', example: 'CI rouge · 1 test sans job' },
      { key: 'ruleNote', says: 'its consequence', example: 'merge bloqué' },
      { key: 'runnerA', max: 18, says: 'the first runner, wired from the start', example: 'à chaque push' },
      { key: 'runnerB', max: 18, says: 'the runner wired as the fix', example: 'nuit · 02:00' },
      { key: 'reportLabel', max: 18, says: 'the report of what ran', example: 'exécutions du jour' },
      { key: 'report', type: 'rows', max: 20, says: 'the report, row by row, before it is filled · as long as the items, the two tables balance', example: ['auth · 41', 'paiement · 28', 'purge-90j · 6', 'export · 12'] },
      { key: 'reportRan', type: 'rows', max: 24, says: 'the report filled: each row ran, where and when', example: ['✓ auth · push 09:12', '✓ paiement · push 09:12', '✓ purge-90j · nuit 02:00', '✓ export · push 09:12'] },
      { key: 'source', says: 'where the facts come from', example: invented('dépôt') + ' (fichiers, nombres de tests et horaires fictifs)' },
    ],
    sequence: [
      ['steady', 'the items run through the control to the first runner, wire after wire'],
      ['event', 'the control judges each item: one row turns ✗, its rule is said'],
      ['effect', 'the second runner comes in and its wire is traced'],
      ['proof', 'the report fills row by row: every item ran, the fixed one included'],
    ],
    guarantees: [
      'DG_ROWS_MISMATCH · each judged list has one row per item',
      'ILL_NO_STEADY_STATE · the wires carry for three seconds before the control judges',
      'ILL_FINAL_INCOMPLETE · the ✗, the rule and the filled report stay',
    ],
    avoid: 'the items reach one place that sees them all (a fan-in with no runner: layers of boxes) · one item travels a chain (probe-stations)',
    neighbours: ['probe-stations', 'filter-records'],
    pitfalls: [
      'the ✗ stays at rest: it is the finding, the report beside it is the fix',
      'four or five rows: a list longer than that is a crowd, and words past 90 are ILL_WORDY',
    ],
    skeleton: `<deck-feature id="{{name}}" eyebrow="{{eyebrow}}">
  <h1 slot="title">{{claim}}</h1>
  <deck-diagram play="enter" layout="layers" direction="right" gap="airy">
    <dg-table name="items" label="{{itemsLabel}}" icon="document" paint="pale" beat="event" rows="{{items}}" swap="{{itemsJudged}}"></dg-table>
    <dg-box name="control" icon="lock" label="{{control}}" note="{{controlNote}}" paint="gold"></dg-box>
    <dg-box name="runner-a" icon="refresh" label="{{runnerA}}" paint="ink"></dg-box>
    <dg-box name="runner-b" icon="clock" label="{{runnerB}}" paint="ink" beat="effect"></dg-box>
    <dg-table name="report" label="{{reportLabel}}" icon="check" paint="ok" beat="proof" rows="{{report}}" swap="{{reportRan}}"></dg-table>
    <dg-link from="items" to="control" steady="3s"></dg-link>
    <dg-link from="control" to="runner-a" steady="3s"></dg-link>
    <dg-link name="wire" from="control" to="runner-b" enter="draw" flow="1" beat="effect" after="runner-b"></dg-link>
    <dg-link from="runner-a" to="report"></dg-link>
    <dg-link from="runner-b" to="report"></dg-link>
    <dg-text name="rule" for="control" side="bottom" label="{{rule}}" note="{{ruleNote}}" beat="event" after="items"></dg-text>
  </deck-diagram>
  <deck-source>{{source}}</deck-source>
</deck-feature>`,
  },
  {
    name: 'switch-over',
    model: 'M21',
    title: 'a topology that switches over, and its time axis',
    talk: '53, 86',
    tempo: 'remedy',
    shows: 'traffic runs to the primary, it falls, the router turns to the standby, and the axis below says what was lost and how long it was cut',
    cues: [
      'bascule',
      'basculer',
      'blue/green',
      'blue green',
      'secours',
      'replique',
      'failover',
      'fail-over',
      'rpo',
      'rto',
      'switch over',
    ],
    brief: [
      { key: 'claim', max: 36, says: 'the title, the sentence the room leaves with', example: 'Paris tombe à 10:04, Francfort sert' },
      { key: 'eyebrow', says: 'the chapter, then the remedy', example: 'Remède · région de secours' },
      { key: 'clients', says: 'who sends the traffic', example: 'boutique' },
      { key: 'clientsRate', says: 'their traffic, with its unit', example: '860 req/min' },
      { key: 'clientsProof', says: 'what the standby proves at the end, for the clients', example: 'service repris à 10:11' },
      { key: 'router', says: 'what routes the traffic', example: 'DNS' },
      { key: 'routerAfter', says: 'the router once it has turned', example: 'DNS · Francfort' },
      { key: 'primary', says: 'the primary, by its identifier', example: 'api-par-1' },
      { key: 'primaryDown', says: 'the primary, fallen', example: 'api-par-1 · panne' },
      { key: 'standby', says: 'the standby, by its identifier', example: 'api-fra-1 · secours' },
      { key: 'standbyNote', says: 'how it is kept up to date', example: 'copie toutes les 5 min' },
      { key: 'down', type: 'number', says: 'how long after the last copy it fell, in one unit', example: 4 },
      { key: 'back', type: 'number', says: 'how long after the last copy it served again (down < back)', example: 11 },
      { key: 'lossLabel', max: 20, says: 'the loss (RPO), with its length', example: 'RPO · 4 min perdues' },
      { key: 'outageLabel', max: 20, says: 'the cut (RTO), with its length', example: 'RTO · 7 min coupées' },
      { key: 'copyAt', says: 'the last copy, dated', example: '10:00 · dernière copie' },
      { key: 'downAt', says: 'the fall, dated', example: '10:04 · panne' },
      { key: 'backAt', says: 'the return, dated', example: '10:11 · reprise' },
      { key: 'source', says: 'where the facts come from', example: invented('panne', 'e') + ' (régions, heures et débit fictifs)' },
    ],
    sequence: [
      ['steady', 'the traffic runs from the clients through the router to the primary; the last copy stands on the axis'],
      ['event', 'the primary falls, its cursor lands on the axis, the loss since the copy grows'],
      ['effect', 'the lever turns: the old route pales, the traffic follows the standby, the return lands'],
      ['proof', 'the cut grows on the axis and the standby proves the clients are served again'],
    ],
    guarantees: [
      'DG_PANEL_APART · the topology and the axis share the primary and the standby (entity)',
      'ILL_NO_STEADY_STATE · the traffic runs before the fall',
      'ILL_FINAL_INCOMPLETE · the turned router, the pale route, the loss and the cut stay',
    ],
    avoid: 'nothing falls, the switch is planned and costs nothing (a lever without the axis: layers alone) · several routes cut at once (lanes-gate)',
    neighbours: ['lanes-gate', 'version-lanes'],
    pitfalls: [
      'the axis is one unit from the last copy: down and back are lengths on it, not hours of the day',
      'the router swaps with the lever (with="to-standby"), never before it',
    ],
    skeleton: `<deck-feature id="{{name}}" eyebrow="{{eyebrow}}">
  <h1 slot="title">{{claim}}</h1>
  <deck-diagram play="enter" compose="body-axis" gap="tight">
    <dg-panel name="network" layout="layers" direction="right" gap="normal" paint="none">
      <dg-box name="clients" icon="team" label="{{clients}}" note="{{clientsRate}}" paint="pale"></dg-box>
      <dg-box name="router" icon="refresh" label="{{router}}" swap="{{routerAfter}}" paint="gold" beat="effect" with="to-standby"></dg-box>
      <dg-box name="primary" entity="primary" icon="database" label="{{primary}}" swap="{{primaryDown}}" paint="ink" tone="normal danger" beat="event"></dg-box>
      <dg-box name="standby" entity="standby" icon="database" label="{{standby}}" note="{{standbyNote}}" paint="pale" tone="normal ok" beat="effect" with="to-standby"></dg-box>
      <dg-link from="clients" to="router" steady="3s"></dg-link>
      <dg-link name="to-primary" from="router" to="primary" route="straight" steady="3s" dim beat="effect" with="to-standby"></dg-link>
      <dg-link name="to-standby" from="router" to="standby" route="straight" steady="2s" lever beat="effect"></dg-link>
      <dg-status name="served" for="standby" state="ok" label="{{clientsProof}}" side="bottom" beat="proof"></dg-status>
    </dg-panel>
    <dg-panel name="time" layout="axis" paint="none">
      <dg-bar name="loss" label="{{lossLabel}}" from="0" to="{{down}}" tone="danger" beat="spread"></dg-bar>
      <dg-bar name="outage" label="{{outageLabel}}" from="{{down}}" to="{{back}}" tone="warn" beat="proof" with="network.served"></dg-bar>
      <dg-cursor name="copy" label="{{copyAt}}" value="0" beat="steady"></dg-cursor>
      <dg-cursor name="fall" entity="primary" label="{{downAt}}" value="{{down}}" beat="event" with="network.primary"></dg-cursor>
      <dg-cursor name="return" entity="standby" label="{{backAt}}" value="{{back}}" beat="effect" with="network.to-standby"></dg-cursor>
    </dg-panel>
  </deck-diagram>
  <deck-source>{{source}}</deck-source>
</deck-feature>`,
  },
  {
    name: 'race-lock',
    model: 'M23',
    title: 'a race, one passes the lock',
    talk: '55, 61',
    tempo: 'remedy',
    shows: 'two actors run the same job, one takes the lock, the other does nothing, the target receives one',
    cues: [
      'en double',
      'deux fois',
      'doublon',
      'verrou',
      'idempoten',
      'concurren',
      'un seul rapport',
      'twice',
      'duplicate',
      'race',
      'lock',
    ],
    brief: [
      { key: 'claim', max: 36, says: 'the title, the sentence the room leaves with', example: 'Deux workers, un seul export' },
      { key: 'eyebrow', says: 'the chapter, then the remedy', example: "Remède · verrou et clé d'idempotence" },
      { key: 'old', max: 18, says: 'the first actor, by its identifier', example: 'worker-a' },
      { key: 'oldNote', max: 18, says: 'why it still runs', example: 'pas encore arrêté' },
      { key: 'oldAfter', max: 20, says: 'what it does once it lost the lock', example: 'worker-a · rien' },
      { key: 'new', max: 18, says: 'the second actor', example: 'worker-b' },
      { key: 'newNote', max: 18, says: 'when it came', example: 'déployé à 06:55' },
      { key: 'lockFree', max: 16, says: 'the lock, free', example: 'verrou libre' },
      { key: 'lockTaken', max: 16, says: 'the lock, taken, and by whom', example: 'pris par b' },
      { key: 'lockNote', says: 'where the lock lives', example: 'ligne en base' },
      { key: 'output', max: 16, says: 'what the job produces', example: 'export' },
      { key: 'outputKey', says: 'its key, the identifier that makes it one', example: 'org 17 · 2026-09' },
      { key: 'target', max: 16, says: 'who receives it, by name', example: 'cabinet Morel' },
      { key: 'targetNote', max: 18, says: 'who that is', example: 'comptable, org 17' },
      { key: 'proof', says: 'what the target received, counted', example: '1 export reçu' },
      { key: 'source', says: 'where the facts come from', example: invented('tâche planifiée', 'e') + ' (organisation, mois et destinataire fictifs)' },
    ],
    sequence: [
      ['steady', 'the job runs, the output reaches the target as it always does'],
      ['event', 'the second actor arrives'],
      ['spread', 'both race to the lock; one takes it, the other’s token turns'],
      ['effect', 'the loser does nothing and pales; the winner’s output rides to the target'],
      ['proof', 'the target received one'],
    ],
    guarantees: [
      'ILL_BEAT_OVERLAP · the two runs to the lock are one beat (with), not two at once',
      'ILL_NO_STEADY_STATE · the job runs before the second actor',
      'ILL_FINAL_INCOMPLETE · the taken lock, the pale loser and the proof stay',
    ],
    avoid: 'one actor sends the same thing twice (a link with flow="2" into a guard that lets one through) · a secret that leaks (lanes-gate)',
    neighbours: ['lanes-gate', 'filter-records'],
    pitfalls: [
      'speed="fast" for the winner, "slow" for the loser: who passes first is what the race says',
      'the key of the output is the idempotence: write the real one, it is the proof that a second would be refused',
    ],
    skeleton: `<deck-feature id="{{name}}" eyebrow="{{eyebrow}}">
  <h1 slot="title">{{claim}}</h1>
  <deck-diagram play="enter" layout="layers" direction="right">
    <dg-box name="old" icon="code" label="{{old}}" note="{{oldNote}}" paint="pale" swap="{{oldAfter}}" dim beat="effect" after="old-run"></dg-box>
    <dg-box name="new" icon="cloud" label="{{new}}" note="{{newNote}}" paint="pale" beat="event"></dg-box>
    <dg-box name="lock" icon="lock" label="{{lockFree}}" swap="{{lockTaken}}" note="{{lockNote}}" paint="gold" beat="spread" after="new-run"></dg-box>
    <dg-box name="output" icon="document" label="{{output}}" note="{{outputKey}}" paint="pale"></dg-box>
    <dg-box name="target" icon="user" label="{{target}}" note="{{targetNote}}" paint="ink" proof="{{proof}}" beat="proof"></dg-box>
    <dg-link name="new-run" from="new" to="lock" flow="1" speed="fast" beat="spread"></dg-link>
    <dg-link name="old-run" from="old" to="lock" steady="3s" flow="1" speed="slow" turn="danger" beat="spread" with="new-run"></dg-link>
    <dg-link name="send" from="lock" to="output" steady="3s" flow="1" beat="effect" after="old"></dg-link>
    <dg-link name="deliver" from="output" to="target" steady="3s" flow="1" beat="effect" after="send"></dg-link>
  </deck-diagram>
  <deck-source>{{source}}</deck-source>
</deck-feature>`,
  },
  {
    name: 'filter-records',
    model: 'M19',
    title: 'records through a filter',
    talk: '47',
    tempo: 'remedy',
    shows: 'real rows are taken, changed on the way, and the tests run on the copy find what the clean set never had',
    cues: [
      'anonymis',
      'pseudonymis',
      'donnees de test',
      'jeu de donnees',
      'jeu de test',
      'copie de production',
      'vrais cas',
      'golden dataset',
      'test data',
      'anonymi',
    ],
    brief: [
      { key: 'claim', max: 36, says: 'the title, the sentence the room leaves with', example: 'Les vrais cas, sans les vrais noms' },
      { key: 'eyebrow', says: 'the chapter, then the remedy', example: 'Remède · copie anonymisée' },
      { key: 'sourceLabel', says: 'where the rows come from', example: 'production · contacts' },
      { key: 'sourceRows', type: 'rows', says: 'the real rows, the hard cases among them', example: ['Ольга Петрова · CFO', 'José Ñúñez · Ventas', 'o.petrova@lumen.io', '(vide)'] },
      { key: 'take', says: 'the verb on the arrow out of production', example: 'prélever' },
      { key: 'filterLabel', says: 'what changes them', example: 'pseudonymiser' },
      { key: 'filteredRows', type: 'rows', says: 'the same rows once changed, the case kept, one per row', example: ['Ирина Соколова · CFO', 'Raúl Peña · Ventas', 'o.petrova@lumen.io', '(vide)'] },
      { key: 'strike', type: 'number', says: 'the row struck out on the way (1 is the first)', example: 3 },
      { key: 'replay', says: 'the verb on the arrow to the copy', example: 'rejouer' },
      { key: 'copyLabel', says: 'the copy the tests run on', example: 'base jetable' },
      { key: 'copyRows', type: 'rows', says: 'the rows the copy holds (the struck one gone)', example: ['Ирина Соколова · CFO', 'Raúl Peña · Ventas', '(vide)'] },
      { key: 'copyJudged', type: 'rows', says: 'the same rows, ✓ or ✗ once the tests ran', example: ['✗ Ирина Соколова · CFO', '✓ Raúl Peña · Ventas', '✓ (vide)'] },
      { key: 'found', says: 'what the tests found, counted', example: '1 bug de cyrillique' },
      { key: 'foundNote', says: 'when it was found', example: 'trouvé avant la mise en ligne' },
      { key: 'source', says: 'where the facts come from', example: invented('jeu de données') + ' (noms, fonctions et adresse fictifs)' },
    ],
    sequence: [
      ['steady', 'the rows are taken from production, the arrow carries them'],
      ['event', 'they ride into the filter one by one, change on the way, the address is struck'],
      ['effect', 'the copy receives them and the tests judge each row'],
      ['proof', 'what the tests found, before the release'],
    ],
    guarantees: [
      'DG_ROWS_MISMATCH · each swap has one row per row, a strike stays inside the rows',
      'DG_MARK_EMPTY · no table without rows',
      'ILL_FINAL_INCOMPLETE · the changed rows, the struck one and the status stay',
    ],
    avoid: 'the data does not change on the way (a chain of boxes) · you count rows rather than show them (a crowd of dots)',
    neighbours: ['wiring', 'data-replay'],
    pitfalls: [
      'the hard cases are the point: another alphabet, an empty field, an accent · a clean set shows nothing',
      'rows wider than a table holds are cut by the check (SCENE_TEXT_TOO_LONG): four to five rows of three words',
    ],
    skeleton: `<deck-feature id="{{name}}" eyebrow="{{eyebrow}}">
  <h1 slot="title">{{claim}}</h1>
  <deck-diagram play="enter" layout="row" gap="airy">
    <dg-table name="source" label="{{sourceLabel}}" icon="database" paint="ink" rows="{{sourceRows}}"></dg-table>
    <dg-table name="filter" label="{{filterLabel}}" icon="lock" paint="gold" from="source" beat="event" rows="{{sourceRows}}" swap="{{filteredRows}}" strike="{{strike}}"></dg-table>
    <dg-table name="copy" label="{{copyLabel}}" icon="refresh" paint="pale" from="filter" beat="effect" rows="{{copyRows}}" swap="{{copyJudged}}"></dg-table>
    <dg-link name="take" from="source" to="filter" label="{{take}}" steady="3s"></dg-link>
    <dg-link from="filter" to="copy" label="{{replay}}"></dg-link>
    <dg-status for="copy" state="fail" label="{{found}}" note="{{foundNote}}" side="bottom" beat="proof"></dg-status>
  </deck-diagram>
  <deck-source>{{source}}</deck-source>
</deck-feature>`,
  },
  {
    name: 'version-lanes',
    model: 'M20',
    title: 'lanes of versions',
    talk: '49',
    tempo: 'remedy',
    shows: 'the new version is announced, both run side by side, the users move one by one, the old one stops on its date',
    cues: [
      'migrer',
      'migration',
      'nouvelle version',
      'changer mon api',
      'contrat d\'api',
      'depreci',
      'v1',
      'v2',
      'deprecat',
      'sunset',
      'versions',
    ],
    brief: [
      { key: 'claim', max: 36, says: 'the title, the sentence the room leaves with', example: "/v1 s'arrête, personne n'est coupé" },
      { key: 'eyebrow', says: 'the chapter, then the remedy', example: "Remède · dépréciation d'une API" },
      { key: 'notice', says: 'the announcement, quoted', example: '« /v1 s’arrête le 31 mars »' },
      { key: 'noticeNote', says: 'how and when it was said', example: 'changelog et e-mail · 2 déc.' },
      { key: 'users', type: 'number', says: 'how many users move (2 to 5), one disc each', example: 4 },
      { key: 'onOld', says: 'the users still on the old version', example: 'partenaires sur /v1' },
      { key: 'onNew', says: 'the users on the new one', example: 'sur /v2' },
      { key: 'old', says: 'the old version, by its identifier', example: '/v1/commandes' },
      { key: 'new', says: 'the new version, by its identifier', example: '/v2/orders' },
      { key: 'oldFrom', type: 'number', says: 'when the old version starts on the axis', example: 0 },
      { key: 'newFrom', type: 'number', says: 'when the new one opens', example: 3 },
      { key: 'oldTo', type: 'number', says: 'the date the old one stops', example: 7 },
      { key: 'newTo', type: 'number', says: 'the end of the axis, past that date', example: 10 },
      { key: 'overlap', says: 'what the time both run is for', example: '4 mois pour migrer' },
      { key: 'sunset', says: 'the stop, dated', example: '31 mars · /v1 éteinte' },
      { key: 'source', says: 'where the facts come from', example: invented('calendrier') + ' (routes, dates et partenaires fictifs)' },
    ],
    sequence: [
      ['steady', 'the old version runs, its stretch grows on the axis, its users on it'],
      ['event', 'the announcement, dated'],
      ['spread', 'the new version opens beside it: both run, the time to migrate is said'],
      ['effect', 'the users move one by one from the old to the new'],
      ['proof', 'the old one stops on its date, nobody left on it'],
    ],
    guarantees: [
      'DG_MARK_PLACE · the versions are stretches of an axis, the stop a cursor on it',
      'DG_VALUE_RANGE · each user moves once: absent goes from 0 to the count on the old, back on the new',
      'ILL_FINAL_INCOMPLETE · the hollow old discs, the full new ones and the stop stay',
    ],
    avoid: 'the switch is instant for everybody (switch-over) · the versions are compared, nobody moves (a bar chart)',
    neighbours: ['switch-over', 'data-replay'],
    pitfalls: [
      'oldFrom < newFrom < oldTo < newTo: the versions overlap, or there is nothing to migrate in',
      'the two groups of people move together (with), so one leaves as one arrives',
    ],
    skeleton: `<deck-feature id="{{name}}" eyebrow="{{eyebrow}}">
  <h1 slot="title">{{claim}}</h1>
  <deck-diagram play="enter" layout="column" gap="airy">
    <dg-group layout="row" gap="airy">
      <dg-box name="notice" icon="flag" label="{{notice}}" note="{{noticeNote}}" paint="gold" beat="event"></dg-box>
      <dg-person name="on-old" label="{{onOld}}" count="{{users}}" absent="0 {{users}}" beat="effect"></dg-person>
      <dg-person name="on-new" label="{{onNew}}" count="{{users}}" absent="{{users}} 0" tone="accent" beat="effect" with="on-old"></dg-person>
    </dg-group>
    <dg-group name="time" layout="axis">
      <dg-bar name="old" label="{{old}}" from="{{oldFrom}}" to="{{oldTo}}" tone="muted" beat="steady" duration="2.4s"></dg-bar>
      <dg-bar name="new" label="{{new}}" from="{{newFrom}}" to="{{newTo}}" tone="ok" beat="spread"></dg-bar>
      <dg-cursor name="sunset" label="{{sunset}}" value="{{oldTo}}" beat="proof"></dg-cursor>
    </dg-group>
    <dg-text name="overlap" for="on-new" side="bottom" label="{{overlap}}" beat="spread" with="new"></dg-text>
  </deck-diagram>
  <deck-source>{{source}}</deck-source>
</deck-feature>`,
  },
  {
    name: 'escalation-runbook',
    model: 'M24',
    title: 'escalation and a runbook',
    talk: '65, 71, 72',
    tempo: 'remedy',
    shows: 'the alert reaches someone who does not answer, the delay runs, the backup takes it, the runbook is ticked step by step',
    cues: [
      'astreinte',
      'escalade',
      'runbook',
      'procedure',
      'qui repond',
      'remplacant',
      'relais',
      'du matin',
      'on-call',
      'escalat',
      'nobody answers',
    ],
    brief: [
      { key: 'claim', max: 36, says: 'the title, the sentence the room leaves with', example: '02:47, Sofia dort : qui répond ?' },
      { key: 'eyebrow', says: 'the chapter, then the remedy', example: 'Remède · astreinte et escalade' },
      { key: 'watched', says: 'what the alert watches', example: 'paiements' },
      { key: 'watchedRate', says: 'its normal pace, with its unit', example: '180 / h' },
      { key: 'watchedDown', says: 'the same, failing, with its code', example: 'paiements · 502' },
      { key: 'oncall', says: 'who is on call, by name', example: 'Sofia · astreinte' },
      { key: 'delayLabel', says: 'what the delay waits for', example: 'sans accusé de réception' },
      { key: 'delay', type: 'number', says: 'how long it waits', example: 10 },
      { key: 'delayUnit', says: 'the unit of that delay', example: 'min' },
      { key: 'backup', says: 'who takes over, by name', example: 'Malik · relais' },
      { key: 'backupNote', says: 'when they were called', example: 'appelé à 02:57' },
      { key: 'runbookLabel', says: 'the runbook, by its name', example: 'procédure paiements' },
      { key: 'steps', type: 'rows', says: 'its steps, in order, one per row', example: ['lire le tableau Stripe', 'passer en mode dégradé', 'relancer payments-api', 'écrire aux clients'] },
      { key: 'stepsDone', type: 'rows', says: 'the same steps, ticked', example: ['✓ lire le tableau Stripe', '✓ passer en mode dégradé', '✓ relancer payments-api', '✓ écrire aux clients'] },
      { key: 'source', says: 'where the facts come from', example: invented('nuit d’astreinte', 'e') + ' (heures, noms et délai fictifs)' },
    ],
    sequence: [
      ['steady', 'the watch pings the person on call, as every night'],
      ['event', 'what is watched fails, with its code'],
      ['spread', 'the person on call does not answer, the delay runs to its end'],
      ['effect', 'the backup is called'],
      ['proof', 'the runbook is ticked step by step'],
    ],
    guarantees: [
      'DG_TIMER_NO_VALUE · the delay has a length and a unit',
      'DG_ROWS_MISMATCH · each step is ticked once',
      'ILL_FINAL_INCOMPLETE · the hollow person, the full timer, the backup and the ticks stay',
    ],
    avoid: 'the alert is answered at once (probe-stations ends on the alert) · nobody is involved, a machine takes over (switch-over)',
    neighbours: ['probe-stations', 'pulse-threshold'],
    pitfalls: [
      'the timer waits for the person (after="oncall"), or the delay starts before anybody failed to answer',
      'the steps are verbs with their object: four of them, the real ones',
    ],
    skeleton: `<deck-feature id="{{name}}" eyebrow="{{eyebrow}}">
  <h1 slot="title">{{claim}}</h1>
  <deck-diagram play="enter" layout="column" gap="airy">
    <dg-group layout="row" gap="normal" link="arrow">
      <dg-box name="watched" icon="chart" label="{{watched}}" note="{{watchedRate}}" paint="pale" tone="normal danger" swap="{{watchedDown}}" beat="event"></dg-box>
      <dg-person name="oncall" label="{{oncall}}" count="1" absent="0 1" beat="spread"></dg-person>
      <dg-timer name="delay" label="{{delayLabel}}" value="{{delay}}" unit="{{delayUnit}}" tone="warn" beat="spread" after="oncall"></dg-timer>
      <dg-box name="backup" icon="user" label="{{backup}}" note="{{backupNote}}" paint="ink" beat="effect"></dg-box>
    </dg-group>
    <dg-table name="runbook" label="{{runbookLabel}}" icon="document" paint="pale" beat="proof" rows="{{steps}}" swap="{{stepsDone}}"></dg-table>
    <dg-link from="backup" to="runbook"></dg-link>
    <dg-link name="pings" from="watched" to="oncall" steady="3s"></dg-link>
  </deck-diagram>
  <deck-source>{{source}}</deck-source>
</deck-feature>`,
  },
  {
    name: 'pulse-threshold',
    model: 'M25',
    title: 'a pulse and its threshold',
    talk: '67, 70, 87',
    tempo: 'remedy',
    shows: 'beats arrive regularly, then stop or cross a line, the grace delay runs out and one alert rings before the client',
    cues: [
      'heartbeat',
      'battement',
      'pouls',
      'silence',
      'plus aucun',
      'budget d\'erreur',
      'une seule alerte',
      'avant que mon client',
      'dead man',
      'slo',
      'goes quiet',
    ],
    brief: [
      { key: 'claim', max: 36, says: 'the title, the sentence the room leaves with', example: 'La paie se tait, on le sait à 02:20' },
      { key: 'eyebrow', says: 'the chapter, then the remedy', example: 'Remède · battement de cœur' },
      { key: 'job', says: 'what beats, by its identifier', example: 'batch-paie' },
      { key: 'jobNote', says: 'what it does', example: 'bulletins de nuit' },
      { key: 'jobDown', says: 'the same, silent', example: 'batch-paie · muet' },
      { key: 'beatLabel', says: 'the beat on the arrow', example: 'ping /1 min' },
      { key: 'watcher', says: 'what listens to the beats', example: 'chien de garde' },
      { key: 'watcherNote', says: 'its rule', example: 'alerte après 5 min' },
      { key: 'pulse', says: 'the series, with its unit', example: 'pings par 5 min' },
      { key: 'values', says: 'the series, 4 to 12 values at equal steps, the silence at the end', example: '5 5 5 5 5 5 1 0' },
      { key: 'max', type: 'number', says: 'the top of its scale', example: 6 },
      { key: 'threshold', type: 'number', says: 'the line under which it is silent', example: 2 },
      { key: 'ticks', says: 'the first and the last time, or one per value', example: '01:40 02:15' },
      { key: 'graceLabel', says: 'what the grace delay waits for', example: 'délai de grâce' },
      { key: 'grace', type: 'number', says: 'its length, in minutes', example: 5 },
      { key: 'alert', says: 'the one alert, and where it rings', example: 'alerte #paie' },
      { key: 'alertNote', says: 'who it reaches', example: 'Slack et SMS' },
      { key: 'proof', says: 'when it was known, against the client', example: '02:20 · avant la RH' },
      { key: 'source', says: 'where the facts come from', example: invented('batch') + ' (heures, rythme et délai fictifs)' },
    ],
    sequence: [
      ['steady', 'the beats ride from the job to the watcher, one by one'],
      ['event', 'the job goes silent: the arrow is cut, the job turns'],
      ['spread', 'the series is traced and falls under its line, the crossing put forward'],
      ['effect', 'the grace delay runs to its end'],
      ['proof', 'one alert, dated, before the client'],
    ],
    guarantees: [
      'DG_CURVE_POINTS · 2 to 12 values, ticks one per value or two',
      'DG_VALUE_RANGE · every value under its max',
      'ILL_FINAL_INCOMPLETE · the cut arrow, the crossing, the full timer and the alert stay',
    ],
    avoid: 'the beats never stop, the point is how long they stopped for (incident-band) · a fake item is sent on purpose (probe-stations)',
    neighbours: ['incident-band', 'probe-stations'],
    pitfalls: [
      'values say the beats per period, so the silence is a fall under the line, not a missing value',
      'one alert: the recipe has one alert box, its proof is the time the team knew',
    ],
    skeleton: `<deck-feature id="{{name}}" eyebrow="{{eyebrow}}">
  <h1 slot="title">{{claim}}</h1>
  <deck-diagram play="enter" layout="row" gap="airy">
    <dg-group layout="column" gap="normal">
      <dg-box name="job" icon="refresh" label="{{job}}" note="{{jobNote}}" swap="{{jobDown}}" paint="pale" tone="normal danger" beat="event" with="beats"></dg-box>
      <dg-box name="watcher" icon="search" label="{{watcher}}" note="{{watcherNote}}" paint="gold"></dg-box>
      <dg-timer name="grace" label="{{graceLabel}}" value="{{grace}}" unit="min" tone="warn" beat="effect"></dg-timer>
      <dg-link name="beats" from="job" to="watcher" label="{{beatLabel}}" steady="3s" dim beat="event"></dg-link>
      <dg-link from="watcher" to="grace"></dg-link>
    </dg-group>
    <dg-group layout="column" gap="normal" align="end">
      <dg-curve name="pulse" label="{{pulse}}" values="{{values}}" max="{{max}}" threshold="{{threshold}}" ticks="{{ticks}}" beat="spread"></dg-curve>
      <dg-box name="alert" icon="alert" label="{{alert}}" note="{{alertNote}}" paint="bad" proof="{{proof}}" beat="proof"></dg-box>
    </dg-group>
    <dg-link from="grace" to="alert"></dg-link>
  </deck-diagram>
  <deck-source>{{source}}</deck-source>
</deck-feature>`,
  },
  {
    name: 'scope-rings',
    model: 'M14',
    title: 'rings of scope, a zoom out',
    talk: '40, 51, 63, 74',
    tempo: 'opener',
    shows: 'the camera opens on the part we trust, pulls back ring by ring, and each ring names what it adds',
    cues: [
      'et autour',
      'autour',
      'portee',
      'zoom arriere',
      'perimetre',
      'et en vrai',
      'au-dela du code',
      'scope',
      'zoom out',
      'bigger picture',
    ],
    brief: [
      { key: 'claim', max: 36, says: 'the title, the sentence the room leaves with', example: 'Ma requête est bonne. Et autour ?' },
      { key: 'eyebrow', says: 'the chapter that opens', example: "Ce que l'on ne voit pas · la portée" },
      { key: 'core', max: 18, says: 'the part we trust, at the centre', example: 'requête SQL' },
      { key: 'coreNote', says: 'why we trust it, with a figure', example: 'EXPLAIN · 4 ms' },
      { key: 'inner', says: 'the first ring around it', example: 'base' },
      { key: 'innerA', max: 13, says: 'what that ring adds, one of three', example: 'les index' },
      { key: 'innerB', max: 13, says: 'the second', example: 'la réplique' },
      { key: 'innerC', max: 13, says: 'the third', example: 'la sauvegarde' },
      { key: 'middle', says: 'the second ring', example: 'application' },
      { key: 'middleA', max: 13, says: 'what it adds, one of three', example: 'pool de 20' },
      { key: 'middleB', max: 13, says: 'the second', example: 'les verrous' },
      { key: 'middleC', max: 13, says: 'the third', example: 'les timeouts' },
      { key: 'outer', says: 'the outer ring', example: 'clients' },
      { key: 'outerA', max: 13, says: 'what it adds, one of three', example: 'lundi 9 h' },
      { key: 'outerB', max: 13, says: 'the second', example: 'les exports' },
      { key: 'outerC', max: 13, says: 'the third', example: 'la 4G' },
      { key: 'source', says: 'where the facts come from', example: invented('périmètre') + ' (durée et taille de pool fictives)' },
    ],
    sequence: [
      ['steady', 'the camera is close on the core: it is all we see'],
      ['spread', 'it pulls back to the first ring, whose three parts come in'],
      ['effect', 'back to the second ring, its parts'],
      ['proof', 'back to the whole picture, the outer ring and its parts'],
    ],
    guarantees: [
      'DG_CAMERA_TARGET · each camera frames a panel or a mark that has a place',
      'DG_CAMERA_ILLEGIBLE · no frame shows text under the scale',
      'ILL_FINAL_INCOMPLETE · the whole picture at rest: every ring and its parts',
    ],
    avoid: 'the parts are not nested, they are side by side (a row of boxes) · one zoom on a detail that matters (an inset composition with one camera)',
    neighbours: ['data-replay', 'switch-over'],
    pitfalls: [
      'rings are rectangles, nested panels: the circles of the model are not drawn',
      'an opener is short: three cameras, three parts per ring, no more',
    ],
    skeleton: `<deck-feature id="{{name}}" eyebrow="{{eyebrow}}">
  <h1 slot="title">{{claim}}</h1>
  <deck-diagram play="enter" compose="inset">
    <dg-panel name="outer" label="{{outer}}" paint="outline" layout="row" gap="normal">
      <dg-panel name="middle" label="{{middle}}" paint="pale" layout="row" gap="normal">
        <dg-group name="middle-parts" layout="column" gap="tight" align="start" beat="effect" after="to-middle">
          <dg-box icon="alert" label="{{middleA}}" paint="none"></dg-box>
          <dg-box icon="clock" label="{{middleB}}" paint="none"></dg-box>
          <dg-box icon="search" label="{{middleC}}" paint="none"></dg-box>
        </dg-group>
        <dg-panel name="inner" label="{{inner}}" paint="pale" layout="row" gap="normal">
          <dg-box name="core" icon="code" label="{{core}}" note="{{coreNote}}" paint="ink"></dg-box>
          <dg-group name="inner-parts" layout="column" gap="tight" align="start" beat="spread" after="to-inner">
            <dg-box icon="database" label="{{innerA}}" paint="none"></dg-box>
            <dg-box icon="refresh" label="{{innerB}}" paint="none"></dg-box>
            <dg-box icon="document" label="{{innerC}}" paint="none"></dg-box>
          </dg-group>
        </dg-panel>
      </dg-panel>
      <dg-group name="outer-parts" layout="column" gap="tight" align="start" beat="proof" after="to-all">
        <dg-box icon="user" label="{{outerA}}" paint="none"></dg-box>
        <dg-box icon="question" label="{{outerB}}" paint="none"></dg-box>
        <dg-box icon="team" label="{{outerC}}" paint="none"></dg-box>
      </dg-group>
    </dg-panel>
    <dg-camera name="to-inner" focus="inner.core" to="inner" beat="spread"></dg-camera>
    <dg-camera name="to-middle" to="middle" beat="effect"></dg-camera>
    <dg-camera name="to-all" to="all" beat="proof"></dg-camera>
  </deck-diagram>
  <deck-source>{{source}}</deck-source>
</deck-feature>`,
  },
  {
    name: 'data-replay',
    model: 'M3',
    title: 'a replay of data, without dg-replay',
    talk: '15, 16, 17',
    tempo: 'replay',
    shows: 'the clock runs from the first week to the last, the series is traced, the counters count, the milestones come in, the arrival stays',
    cues: [
      'dix mois',
      'six mois',
      'mois',
      'semaine par semaine',
      'historique',
      'rejeu',
      'timelapse',
      'a quoi ressemble',
      'evolution',
      'replay',
      'over time',
      'week by week',
    ],
    brief: [
      { key: 'claim', max: 36, says: 'the title, the sentence the room leaves with', example: 'Huit mois de support, rejoués' },
      { key: 'eyebrow', says: 'the chapter, then what is replayed', example: 'Le support · le rejeu' },
      { key: 'start', max: 18, says: 'the first period, dated', example: '3 févr. 2026' },
      { key: 'end', max: 22, says: 'the last period, dated, and what the arrival amounts to', example: '21 sept. · −72 %' },
      { key: 'totalFrom', type: 'number', says: 'the running total at the start', example: 12 },
      { key: 'total', type: 'number', says: 'the running total at the end', example: 4182 },
      { key: 'totalUnit', says: 'its unit', example: 'tickets' },
      { key: 'totalLabel', says: 'what it counts', example: 'depuis le lancement' },
      { key: 'series', says: 'the series per period, 4 to 12 values', example: '12 48 160 240 310 205 150 120 96 88' },
      { key: 'seriesLabel', says: 'what the series is', example: 'tickets par semaine' },
      { key: 'max', type: 'number', says: 'the top of its scale', example: 350 },
      { key: 'ticks', says: 'the first and last period', example: 'févr. sept.' },
      { key: 'milestonesLabel', says: 'the title of the milestones', example: 'jalons' },
      { key: 'milestones', type: 'rows', says: 'three to five dated milestones, in order', example: ['3 févr. · ouverture', '14 avr. · pic à 310', '2 juin · base de réponses'] },
      { key: 'source', says: 'where the facts come from', example: invented('historique') + ' (semaines et volumes fictifs)' },
    ],
    sequence: [
      ['steady', 'the clock shows the first period; the series is traced week by week while the total counts and the milestones come in'],
      ['proof', 'the clock lands on the last period, and the arrival stays'],
    ],
    guarantees: [
      'DG_PANEL_APART · the board and the milestones share the period (entity)',
      'DG_CURVE_POINTS · 2 to 12 values; a longer history is coarsened (a month a value)',
      'ILL_FINAL_INCOMPLETE · the last period, the full curve, the total and the milestones stay',
    ],
    avoid: 'one figure grows, nothing else (a counter) · a single incident in time (incident-band) · you have the frames as data: what this recipe misses is a dg-replay that reads them',
    neighbours: ['version-lanes', 'filter-records'],
    pitfalls: [
      'no clock that ticks each week: the period is swapped once, at the end · the frames of the model need a dg-replay that reads a JSON of periods',
      'no stacked bars, no bands of phase, no milestones on the curve: the milestones are a table beside it',
      'twelve values at most: a year of weeks is coarsened to months',
    ],
    skeleton: `<deck-feature id="{{name}}" eyebrow="{{eyebrow}}">
  <h1 slot="title">{{claim}}</h1>
  <deck-diagram play="enter" compose="split" gap="tight">
    <dg-panel name="board" layout="column" gap="normal">
      <dg-group layout="row" gap="airy">
        <dg-box name="period" entity="period" icon="clock" label="{{start}}" swap="{{end}}" paint="ink" beat="proof"></dg-box>
        <dg-counter name="count" from="{{totalFrom}}" value="{{total}}" unit="{{totalUnit}}" label="{{totalLabel}}" beat="steady" duration="4.5s"></dg-counter>
      </dg-group>
      <dg-curve name="series" label="{{seriesLabel}}" values="{{series}}" max="{{max}}" ticks="{{ticks}}" beat="steady" with="count" duration="4.5s"></dg-curve>
    </dg-panel>
    <dg-panel name="milestones" layout="column">
      <dg-table name="dates" entity="period" label="{{milestonesLabel}}" icon="flag" paint="pale" from="board.series" beat="steady" with="board.count" rows="{{milestones}}"></dg-table>
    </dg-panel>
  </deck-diagram>
  <deck-source>{{source}}</deck-source>
</deck-feature>`,
  },
]);

export const RECIPE_NAMES = Object.freeze(RECIPES.map((recipe) => recipe.name));
