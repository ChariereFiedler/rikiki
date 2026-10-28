// ════════════════════════════════════════════════════════════════
// RIKIKI · diagram, the intents of the grammar
//
// What each of the sixteen intents asks for and how it is told: its family, what
// the picture demonstrates, the words of a sentence that point at it, the parts it
// takes (`role`), the one it puts forward, the intents it takes as secondaries, a
// skeleton that demonstrates it with every part filled, and the mistakes it is
// known for, each with the markup that makes it when one diagram shows it.
//
// Data only · `intent.ts` compiles, `intent-prove.ts` reads the drawing back.
// ════════════════════════════════════════════════════════════════

export const INTENT_NAMES = [
  'cause',
  'barrier',
  'bottleneck',
  'accumulate',
  'transform',
  'feedback',
  'scale',
  'contain',
  'parallel',
  'propagate',
  'threshold',
  'tradeoff',
  'drift',
  'compare',
  'partition',
  'merge',
] as const;
export type IntentName = (typeof INTENT_NAMES)[number];

export type IntentFamily = 'flow' | 'structure' | 'quantity' | 'time' | 'decision';

/** Every code an intent finding carries · `rikiki check` lists, selects and
 *  configures them by this table (bin/lib/check-registry.mjs). */
export const INT_CODES = [
  'INT_INTENT_UNKNOWN',
  'INT_COMPOSE_MANY',
  'INT_COMPOSE_INVALID',
  'INT_COMPOSE_APART',
  'INT_ROLE_NO_INTENT',
  'INT_ROLE_NONE',
  'INT_ROLE_UNKNOWN',
  'INT_ROLE_KIND',
  'INT_ROLE_MISSING',
  'INT_ROLE_EXTRA',
  'INT_LAYOUT_FIXED',
  'INT_VALUE_MISSING',
  'INT_FOCAL_MULTIPLE',
  'INT_FOCAL_OFF_ROLE',
  'INT_CAUSE_NO_ARROW',
  'INT_CAUSE_EFFECT_FIRST',
  'INT_BARRIER_NOT_ACROSS',
  'INT_BARRIER_NEVER_CLOSES',
  'INT_BOTTLENECK_NOT_NARROWEST',
  'INT_BOTTLENECK_NO_QUEUE',
  'INT_ACCUMULATE_NOT_MONOTONE',
  'INT_TRANSFORM_NO_PAIR',
  'INT_TRANSFORM_NO_CHANGE',
  'INT_FEEDBACK_OPEN',
  'INT_SCALE_TOO_CLOSE',
  'INT_CONTAIN_NOT_NESTED',
  'INT_PARALLEL_NOT_TOGETHER',
  'INT_PARALLEL_JOIN_EARLY',
  'INT_PROPAGATE_NOT_REACHED',
  'INT_PROPAGATE_SKIPS',
  'INT_THRESHOLD_NEVER_CROSSED',
  'INT_THRESHOLD_EARLY',
  'INT_TRADEOFF_ONE_SIDED',
  'INT_DRIFT_NOT_WIDENING',
  'INT_COMPARE_LIE',
  'INT_PARTITION_NOT_WHOLE',
  'INT_MERGE_APART',
  'INT_MERGE_NOT_SUM',
] as const;
export type IntCode = (typeof INT_CODES)[number];

/** A part an intent asks for · which marks can play it, and how many of them. */
export interface RoleSpec {
  role: string;
  tags: readonly string[];
  min: number;
  max: number;
  says: string;
}

/** A mistake an intent is known for, and the code that names it · with the markup
 *  that makes it, when one diagram shows it. */
export interface Pitfall {
  code: IntCode;
  says: string;
  html?: string;
}

/** What the compiler knows of an intent it places. */
export interface CompiledIntent {
  roles: readonly RoleSpec[];
  /** The role put forward · the gate of a barrier is put forward by its colour. */
  focal: string;
  /** The intents it takes as secondaries (`also`). */
  composes: readonly IntentName[];
  /** A diagram that demonstrates it, with every role filled · `rikiki intent <name>`. */
  skeleton: string;
  pitfalls: readonly Pitfall[];
}

export interface IntentSpec {
  name: IntentName;
  family: IntentFamily;
  /** What the picture demonstrates, in one line. */
  shows: string;
  /** What the picture looks like, in a few words · no two intents look alike. */
  looks: string;
  /** Words of a sentence that point at it · folded: lower case, no accent. */
  cues: readonly string[];
  compiled: CompiledIntent;
}

/** The secondaries an intent may take · a region of its own above (a cause that
 *  drives it) or below (a stock, a line crossed). Every other intent is a whole
 *  picture: composed, it would read as two pictures, so it is a main only. */
export const SECONDARIES: readonly IntentName[] = ['cause', 'accumulate', 'threshold'];

/** Why a pair is refused · what the author is told to do instead. */
export const REFUSED_BECAUSE =
  'only cause (above), accumulate and threshold (below) are ever secondaries, and transform, scale, contain, parallel, tradeoff, drift, compare and partition take none · two shapes in one picture read as two pictures: split the slide';

const CAUSE: CompiledIntent = {
  roles: [
    { role: 'cause', tags: ['dg-box'], min: 1, max: 3, says: 'what starts it' },
    { role: 'via', tags: ['dg-box'], min: 0, max: 3, says: 'each link of the chain, in order' },
    {
      role: 'effect',
      tags: ['dg-box', 'dg-meter', 'dg-queue'],
      min: 1,
      max: 3,
      says: 'what it ends in · put forward',
    },
  ],
  focal: 'effect',
  composes: ['accumulate', 'threshold'],
  skeleton: `<deck-diagram intent="cause">
  <dg-box role="cause" name="cache" icon="database" label="Cache flushed"></dg-box>
  <dg-box role="via" name="db" icon="chart" label="Database saturated"></dg-box>
  <dg-box role="effect" name="pages" icon="alert" label="Pages fail"></dg-box>
</deck-diagram>`,
  pitfalls: [
    {
      code: 'INT_CAUSE_NO_ARROW',
      says: 'your own dg-link meet in the middle, so no chain of arrows leads from the cause to the effect',
      html: `<deck-diagram intent="cause">
  <dg-box role="cause" name="test" icon="flag" label="Live test"></dg-box>
  <dg-box role="via" name="flag" icon="database" label="Flag"></dg-box>
  <dg-box role="effect" name="reader" icon="code" label="is_active()"></dg-box>
  <dg-link from="test" to="flag" label="writes"></dg-link>
  <dg-link from="reader" to="flag" label="reads"></dg-link>
</deck-diagram>`,
    },
    {
      code: 'INT_CAUSE_EFFECT_FIRST',
      says: 'a step on the cause leaves the effect standing before what causes it',
      html: `<deck-diagram intent="barrier" also="cause">
  <dg-box role="cause" name="test" label="Live test" step="1"></dg-box>
  <dg-box role="effect" name="reader" label="is_active()"></dg-box>
  <dg-lane role="flow" name="api" label="API"></dg-lane>
  <dg-gate role="barrier" name="stop" label="STOP"></dg-gate>
</deck-diagram>`,
    },
    {
      code: 'INT_FOCAL_MULTIPLE',
      says: 'two marks put forward · the effect is put forward for you',
      html: `<deck-diagram intent="cause">
  <dg-box role="cause" name="cache" label="Cache flushed" emphasis></dg-box>
  <dg-box role="effect" name="pages" label="Pages fail" emphasis></dg-box>
</deck-diagram>`,
    },
  ],
};

const BARRIER: CompiledIntent = {
  roles: [
    { role: 'flow', tags: ['dg-lane'], min: 1, max: 5, says: 'what flows, a lane each' },
    {
      role: 'barrier',
      tags: ['dg-gate'],
      min: 1,
      max: 1,
      says: 'the gate across them · put forward',
    },
    {
      role: 'control',
      tags: ['dg-box'],
      min: 0,
      max: 1,
      says: 'what drives the gate · it stands under it',
    },
    { role: 'beyond', tags: ['dg-box'], min: 0, max: 1, says: 'where the flow was going' },
  ],
  focal: 'barrier',
  composes: ['cause', 'accumulate'],
  skeleton: `<deck-diagram intent="barrier">
  <dg-box role="control" name="switch" icon="lock" label="Kill switch"></dg-box>
  <dg-lane role="flow" name="api" icon="cloud" label="API"></dg-lane>
  <dg-lane role="flow" name="jobs" icon="clock" label="Jobs"></dg-lane>
  <dg-lane role="flow" name="sync" icon="refresh" label="Sync"></dg-lane>
  <dg-gate role="barrier" name="stop" label="STOP"></dg-gate>
  <dg-box role="beyond" name="vendor" icon="target" label="Vendor"></dg-box>
</deck-diagram>`,
  pitfalls: [
    {
      code: 'INT_BARRIER_NOT_ACROSS',
      says: "the gate's `over` leaves a lane out, and that lane still flows past it",
      html: `<deck-diagram intent="barrier">
  <dg-lane role="flow" name="api" icon="cloud" label="API"></dg-lane>
  <dg-lane role="flow" name="jobs" icon="clock" label="Jobs"></dg-lane>
  <dg-gate role="barrier" name="stop" label="STOP" over="api"></dg-gate>
  <dg-box role="beyond" name="vendor" icon="target" label="Vendor"></dg-box>
</deck-diagram>`,
    },
    {
      code: 'INT_BARRIER_NEVER_CLOSES',
      says: 'a `state` that stays open · nothing is ever stopped',
      html: `<deck-diagram intent="barrier">
  <dg-lane role="flow" name="api" icon="cloud" label="API"></dg-lane>
  <dg-gate role="barrier" name="stop" label="STOP" state="open"></dg-gate>
</deck-diagram>`,
    },
    {
      code: 'INT_FOCAL_OFF_ROLE',
      says: 'an `emphasis` on another mark · the gate is what the picture puts forward',
    },
  ],
};

const BOTTLENECK: CompiledIntent = {
  roles: [
    {
      role: 'source',
      tags: ['dg-box'],
      min: 1,
      max: 3,
      says: 'what arrives · its rate in `value`',
    },
    { role: 'queue', tags: ['dg-queue'], min: 1, max: 1, says: 'what waits in front of the neck' },
    {
      role: 'neck',
      tags: ['dg-box'],
      min: 1,
      max: 1,
      says: 'the narrow point · its rate in `value` · put forward',
    },
    { role: 'sink', tags: ['dg-box'], min: 1, max: 2, says: 'where it goes once through' },
  ],
  focal: 'neck',
  composes: ['accumulate'],
  skeleton: `<deck-diagram intent="bottleneck">
  <dg-box role="source" name="arrivals" icon="team" label="Arrivals" value="6 / h"></dg-box>
  <dg-queue role="queue" name="waiting" label="waiting"></dg-queue>
  <dg-box role="neck" name="review" icon="search" label="Review" value="2 / h"></dg-box>
  <dg-box role="sink" name="shipped" icon="check" label="Shipped"></dg-box>
</deck-diagram>`,
  pitfalls: [
    {
      code: 'INT_BOTTLENECK_NOT_NARROWEST',
      says: 'the neck takes as much as arrives, or a sink takes less than the neck',
      html: `<deck-diagram intent="bottleneck">
  <dg-box role="source" name="arrivals" label="Arrivals" value="6 / h"></dg-box>
  <dg-queue role="queue" name="waiting" label="waiting"></dg-queue>
  <dg-box role="neck" name="review" label="Review" value="8 / h"></dg-box>
  <dg-box role="sink" name="shipped" label="Shipped"></dg-box>
</deck-diagram>`,
    },
    {
      code: 'INT_BOTTLENECK_NO_QUEUE',
      says: 'a `fill` that never grows · nothing waits in front of the neck',
    },
    { code: 'INT_VALUE_MISSING', says: 'a source or the neck without a rate in `value`' },
  ],
};

const ACCUMULATE: CompiledIntent = {
  roles: [
    {
      role: 'stock',
      tags: ['dg-queue', 'dg-meter'],
      min: 1,
      max: 1,
      says: 'what piles up · one value per click · put forward',
    },
    { role: 'inflow', tags: ['dg-box'], min: 0, max: 2, says: 'what feeds it' },
    { role: 'outflow', tags: ['dg-box'], min: 0, max: 2, says: 'what drains it' },
  ],
  focal: 'stock',
  composes: ['cause', 'threshold'],
  skeleton: `<deck-diagram intent="accumulate">
  <dg-box role="inflow" name="tickets" icon="document" label="Tickets" note="12 a day"></dg-box>
  <dg-queue role="stock" name="backlog" label="backlog" count="10" fill="2 5 9"></dg-queue>
  <dg-box role="outflow" name="support" icon="team" label="Support" note="8 a day"></dg-box>
</deck-diagram>`,
  pitfalls: [
    {
      code: 'INT_ACCUMULATE_NOT_MONOTONE',
      says: 'a stock that goes up then down, or never moves · say it in two pictures',
      html: `<deck-diagram intent="accumulate">
  <dg-box role="inflow" name="tickets" label="Tickets"></dg-box>
  <dg-queue role="stock" name="backlog" label="backlog" count="10" fill="0 6 2"></dg-queue>
</deck-diagram>`,
    },
  ],
};

const TRANSFORM: CompiledIntent = {
  roles: [
    { role: 'before', tags: ['dg-state'], min: 1, max: 1, says: 'the picture before' },
    {
      role: 'after',
      tags: ['dg-state'],
      min: 1,
      max: 1,
      says: 'the picture after, on the click · the parts named alike move',
    },
  ],
  focal: 'after',
  composes: [],
  skeleton: `<deck-diagram intent="transform">
  <dg-state role="before">
    <dg-group name="form" label="Before" layout="column" paint="outline" gap="tight">
      <dg-box name="email" label="Email"></dg-box>
      <dg-box name="phone" label="Phone"></dg-box>
      <dg-box name="captcha" label="Captcha"></dg-box>
    </dg-group>
  </dg-state>
  <dg-state role="after">
    <dg-group name="form" label="After" layout="column" paint="inverse">
      <dg-box name="email" label="Email only" emphasis></dg-box>
    </dg-group>
  </dg-state>
</deck-diagram>`,
  pitfalls: [
    {
      code: 'INT_TRANSFORM_NO_PAIR',
      says: 'no mark named alike in both pictures · two drawings, not one that changes',
      html: `<deck-diagram intent="transform">
  <dg-state role="before"><dg-box name="old" label="12 fields"></dg-box></dg-state>
  <dg-state role="after"><dg-box name="new" label="Email only"></dg-box></dg-state>
</deck-diagram>`,
    },
    {
      code: 'INT_TRANSFORM_NO_CHANGE',
      says: 'both pictures are the same · nothing moves, nothing comes or goes',
    },
  ],
};

const FEEDBACK: CompiledIntent = {
  roles: [
    {
      role: 'stage',
      tags: ['dg-box'],
      min: 2,
      max: 5,
      says: 'each step round the loop, in order · the first is where it comes back in',
    },
    {
      role: 'output',
      tags: ['dg-box'],
      min: 1,
      max: 1,
      says: 'what comes out, and feeds the first stage again · put forward',
    },
  ],
  focal: 'output',
  composes: ['accumulate'],
  skeleton: `<deck-diagram intent="feedback">
  <dg-box role="stage" name="users" icon="team" label="More users"></dg-box>
  <dg-box role="stage" name="content" icon="document" label="More content"></dg-box>
  <dg-box role="stage" name="search" icon="search" label="Better search"></dg-box>
  <dg-box role="output" name="reach" icon="chart" label="More reach"></dg-box>
</deck-diagram>`,
  pitfalls: [
    {
      code: 'INT_FEEDBACK_OPEN',
      says: 'your own dg-link run one way round and never come back · a chain, not a loop',
      html: `<deck-diagram intent="feedback">
  <dg-box role="stage" name="users" label="More users"></dg-box>
  <dg-box role="stage" name="content" label="More content"></dg-box>
  <dg-box role="output" name="reach" label="More reach"></dg-box>
  <dg-link from="users" to="content"></dg-link>
  <dg-link from="content" to="reach"></dg-link>
</deck-diagram>`,
    },
  ],
};

const SCALE: CompiledIntent = {
  roles: [
    {
      role: 'unit',
      tags: ['dg-dot'],
      min: 1,
      max: 1,
      says: 'the one · a single cell, put forward',
    },
    {
      role: 'crowd',
      tags: ['dg-dot'],
      min: 1,
      max: 1,
      says: 'the many · `count` cells, ten times the unit at least',
    },
  ],
  focal: 'unit',
  composes: [],
  skeleton: `<deck-diagram intent="scale">
  <dg-dot role="unit" name="one"></dg-dot>
  <dg-dot role="crowd" name="all" count="199"></dg-dot>
  <dg-text for="one" side="left" label="1 server"></dg-text>
  <dg-text for="all" label="200 requests" note="every second"></dg-text>
</deck-diagram>`,
  pitfalls: [
    {
      code: 'INT_SCALE_TOO_CLOSE',
      says: 'a crowd under ten times the unit is not an order of magnitude · compare them instead',
      html: `<deck-diagram intent="scale">
  <dg-dot role="unit" name="one"></dg-dot>
  <dg-dot role="crowd" name="all" count="4"></dg-dot>
</deck-diagram>`,
    },
  ],
};

const CONTAIN: CompiledIntent = {
  roles: [
    {
      role: 'layer',
      tags: ['dg-box'],
      min: 2,
      max: 4,
      says: 'from the outside in · each one holds the next, the innermost is put forward',
    },
  ],
  focal: 'layer',
  composes: [],
  skeleton: `<deck-diagram intent="contain">
  <dg-box role="layer" name="cloud" label="Cloud account"></dg-box>
  <dg-box role="layer" name="network" label="Private network" note="no public address"></dg-box>
  <dg-box role="layer" name="data" icon="database" label="Customer data"></dg-box>
</deck-diagram>`,
  pitfalls: [
    {
      code: 'INT_CONTAIN_NOT_NESTED',
      says: 'a layer with `paint="none"` draws no edge · what it holds reads as beside it',
      html: `<deck-diagram intent="contain">
  <dg-box role="layer" name="cloud" label="Cloud account"></dg-box>
  <dg-box role="layer" name="network" label="Private network" paint="none"></dg-box>
  <dg-box role="layer" name="data" label="Customer data"></dg-box>
</deck-diagram>`,
    },
  ],
};

const PARALLEL: CompiledIntent = {
  roles: [
    {
      role: 'branch',
      tags: ['dg-group'],
      min: 2,
      max: 4,
      says: 'one line of work · its steps inside, in order',
    },
    {
      role: 'join',
      tags: ['dg-box'],
      min: 0,
      max: 1,
      says: 'where every branch meets, once the last steps are in · put forward',
    },
  ],
  focal: 'join',
  composes: [],
  skeleton: `<deck-diagram intent="parallel">
  <dg-group role="branch" name="front" label="Front">
    <dg-box label="Screens"></dg-box>
    <dg-box label="Forms"></dg-box>
  </dg-group>
  <dg-group role="branch" name="back" label="Back">
    <dg-box label="API"></dg-box>
    <dg-box label="Billing"></dg-box>
  </dg-group>
  <dg-group role="branch" name="data" label="Data">
    <dg-box label="Schema"></dg-box>
    <dg-box label="Migration"></dg-box>
  </dg-group>
  <dg-box role="join" name="release" icon="rocket" label="Release" note="the same day"></dg-box>
</deck-diagram>`,
  pitfalls: [
    {
      code: 'INT_PARALLEL_NOT_TOGETHER',
      says: 'a `step` or an `after` makes a branch wait · one after the other, not at once',
      html: `<deck-diagram intent="parallel">
  <dg-group role="branch" name="front" label="Front"><dg-box label="Screens"></dg-box></dg-group>
  <dg-group role="branch" name="back" label="Back" step="1"><dg-box label="API"></dg-box></dg-group>
</deck-diagram>`,
    },
    {
      code: 'INT_PARALLEL_JOIN_EARLY',
      says: 'the join stands before a branch has finished · nothing waits for it',
    },
  ],
};

const PROPAGATE: CompiledIntent = {
  roles: [
    {
      role: 'origin',
      tags: ['dg-box'],
      min: 1,
      max: 1,
      says: 'where the change starts · put forward',
    },
    {
      role: 'reached',
      tags: ['dg-box'],
      min: 2,
      max: 8,
      says: 'what it reaches · your dg-link say who reaches whom, rank by rank',
    },
  ],
  focal: 'origin',
  composes: ['cause'],
  skeleton: `<deck-diagram intent="propagate">
  <dg-box role="origin" name="lib" icon="code" label="Shared library"></dg-box>
  <dg-box role="reached" name="auth" label="Auth"></dg-box>
  <dg-box role="reached" name="api" label="API"></dg-box>
  <dg-box role="reached" name="web" label="Web"></dg-box>
  <dg-box role="reached" name="mobile" label="Mobile"></dg-box>
  <dg-link from="lib" to="auth api"></dg-link>
  <dg-link from="api" to="web mobile"></dg-link>
</deck-diagram>`,
  pitfalls: [
    {
      code: 'INT_PROPAGATE_SKIPS',
      says: 'a `tone` on a far mark lights it before the change has reached it',
      html: `<deck-diagram intent="propagate">
  <dg-box role="origin" name="lib" label="Shared library"></dg-box>
  <dg-box role="reached" name="api" label="API"></dg-box>
  <dg-box role="reached" name="web" label="Web" tone="danger"></dg-box>
  <dg-link from="lib" to="api"></dg-link>
  <dg-link from="api" to="web"></dg-link>
</deck-diagram>`,
    },
    {
      code: 'INT_PROPAGATE_NOT_REACHED',
      says: 'your dg-link leave a mark out · no arrow from the origin ever gets there',
      html: `<deck-diagram intent="propagate">
  <dg-box role="origin" name="lib" label="Shared library"></dg-box>
  <dg-box role="reached" name="api" label="API"></dg-box>
  <dg-box role="reached" name="web" label="Web"></dg-box>
  <dg-link from="lib" to="api"></dg-link>
  <dg-link from="web" to="api"></dg-link>
</deck-diagram>`,
    },
  ],
};

const THRESHOLD: CompiledIntent = {
  roles: [
    {
      role: 'measure',
      tags: ['dg-meter'],
      min: 1,
      max: 1,
      says: 'the value, one per click, and the line in `threshold` · put forward',
    },
    {
      role: 'consequence',
      tags: ['dg-box'],
      min: 0,
      max: 1,
      says: 'what tips over on the click the line is crossed',
    },
  ],
  focal: 'measure',
  composes: ['cause', 'accumulate'],
  skeleton: `<deck-diagram intent="threshold">
  <dg-meter role="measure" name="disk" label="Disk" value="55 70 88" unit="%" threshold="80"></dg-meter>
  <dg-box role="consequence" name="writes" icon="alert" label="Writes refused"></dg-box>
</deck-diagram>`,
  pitfalls: [
    {
      code: 'INT_THRESHOLD_NEVER_CROSSED',
      says: 'every value stays on one side of the line · nothing tips',
      html: `<deck-diagram intent="threshold">
  <dg-meter role="measure" name="disk" label="Disk" value="40 55 70" unit="%" threshold="80"></dg-meter>
  <dg-box role="consequence" name="writes" label="Writes refused"></dg-box>
</deck-diagram>`,
    },
    {
      code: 'INT_THRESHOLD_EARLY',
      says: 'a `tone` or a `step` on the consequence makes it tip before the line is crossed',
      html: `<deck-diagram intent="threshold">
  <dg-meter role="measure" name="disk" label="Disk" value="55 70 88" unit="%" threshold="80"></dg-meter>
  <dg-box role="consequence" name="writes" label="Writes refused" tone="danger"></dg-box>
</deck-diagram>`,
    },
    { code: 'INT_VALUE_MISSING', says: 'a measure without a `threshold`' },
  ],
};

const TRADEOFF: CompiledIntent = {
  roles: [
    {
      role: 'lever',
      tags: ['dg-box'],
      min: 1,
      max: 1,
      says: 'the choice that moves both · put forward',
    },
    {
      role: 'gain',
      tags: ['dg-meter'],
      min: 1,
      max: 1,
      says: 'what you win · its value rises on the click',
    },
    {
      role: 'cost',
      tags: ['dg-meter'],
      min: 1,
      max: 1,
      says: 'what you give up · its value falls on the same click',
    },
  ],
  focal: 'lever',
  composes: [],
  skeleton: `<deck-diagram intent="tradeoff">
  <dg-box role="lever" name="cache" icon="database" label="Cache for an hour"></dg-box>
  <dg-meter role="gain" name="speed" label="Speed" value="40 85" unit="%"></dg-meter>
  <dg-meter role="cost" name="fresh" label="Freshness" value="90 35" unit="%"></dg-meter>
</deck-diagram>`,
  pitfalls: [
    {
      code: 'INT_TRADEOFF_ONE_SIDED',
      says: 'both values go the same way, or one moves alone · nothing is paid for what is won',
      html: `<deck-diagram intent="tradeoff">
  <dg-box role="lever" name="cache" label="Cache for an hour"></dg-box>
  <dg-meter role="gain" name="speed" label="Speed" value="40 85" unit="%"></dg-meter>
  <dg-meter role="cost" name="fresh" label="Freshness" value="35 90" unit="%"></dg-meter>
</deck-diagram>`,
    },
  ],
};

const DRIFT: CompiledIntent = {
  roles: [
    {
      role: 'reference',
      tags: ['dg-cursor'],
      min: 1,
      max: 1,
      says: 'what was planned · a line that does not move, at its `value`',
    },
    {
      role: 'measure',
      tags: ['dg-bar'],
      min: 2,
      max: 5,
      says: 'one per period, in order · its `value` the measured, drawn as the gap · the last put forward',
    },
  ],
  focal: 'measure',
  composes: [],
  skeleton: `<deck-diagram intent="drift">
  <dg-cursor role="reference" name="plan" label="planned" value="10"></dg-cursor>
  <dg-bar role="measure" name="q1" label="Q1" value="11" tag="+1 day"></dg-bar>
  <dg-bar role="measure" name="q2" label="Q2" value="14" tag="+4 days"></dg-bar>
  <dg-bar role="measure" name="q3" label="Q3" value="19" tag="+9 days"></dg-bar>
</deck-diagram>`,
  pitfalls: [
    {
      code: 'INT_DRIFT_NOT_WIDENING',
      says: 'a gap that shrinks on the way, or ends under twice its start · no drift to see',
      html: `<deck-diagram intent="drift">
  <dg-cursor role="reference" name="plan" label="planned" value="10"></dg-cursor>
  <dg-bar role="measure" name="q1" label="Q1" value="12"></dg-bar>
  <dg-bar role="measure" name="q2" label="Q2" value="18"></dg-bar>
  <dg-bar role="measure" name="q3" label="Q3" value="14"></dg-bar>
</deck-diagram>`,
    },
  ],
};

const COMPARE: CompiledIntent = {
  roles: [
    {
      role: 'subject',
      tags: ['dg-bar'],
      min: 1,
      max: 1,
      says: 'the one the sentence is about · its `value` · grows last, put forward',
    },
    {
      role: 'other',
      tags: ['dg-bar'],
      min: 1,
      max: 5,
      says: 'what it is set against · its `value`, in the same unit',
    },
  ],
  focal: 'subject',
  composes: [],
  skeleton: `<deck-diagram intent="compare">
  <dg-bar role="other" name="web" label="Web" value="27" tag="27 %"></dg-bar>
  <dg-bar role="subject" name="mobile" label="Mobile" value="58" tag="58 %"></dg-bar>
</deck-diagram>`,
  pitfalls: [
    {
      code: 'INT_COMPARE_LIE',
      says: 'values too far apart for one scale · the small bar is drawn larger than it is (use scale)',
      html: `<deck-diagram intent="compare">
  <dg-bar role="other" name="web" label="Web" value="3"></dg-bar>
  <dg-bar role="subject" name="mobile" label="Mobile" value="1000"></dg-bar>
</deck-diagram>`,
    },
    { code: 'INT_VALUE_MISSING', says: 'a bar without a number in `value`' },
  ],
};

const PARTITION: CompiledIntent = {
  roles: [
    {
      role: 'whole',
      tags: ['dg-box'],
      min: 0,
      max: 1,
      says: 'the whole · its caption, and in `value` what the parts add up to',
    },
    {
      role: 'share',
      tags: ['dg-bar'],
      min: 1,
      max: 1,
      says: 'the part the sentence is about · its `value` · put forward',
    },
    {
      role: 'part',
      tags: ['dg-bar'],
      min: 1,
      max: 5,
      says: 'the other parts · their `value`, end to end on one band',
    },
  ],
  focal: 'share',
  composes: [],
  skeleton: `<deck-diagram intent="partition">
  <dg-box role="whole" name="budget" label="Budget" value="100 %"></dg-box>
  <dg-bar role="share" name="infra" label="Infra" value="45" tag="45 %"></dg-bar>
  <dg-bar role="part" name="people" label="People" value="35" tag="35 %"></dg-bar>
  <dg-bar role="part" name="tools" label="Tools" value="20" tag="20 %"></dg-bar>
</deck-diagram>`,
  pitfalls: [
    {
      code: 'INT_PARTITION_NOT_WHOLE',
      says: 'the parts do not add up to the whole · a share is missing, or counted twice',
      html: `<deck-diagram intent="partition">
  <dg-box role="whole" name="budget" label="Budget" value="100"></dg-box>
  <dg-bar role="share" name="infra" label="Infra" value="45"></dg-bar>
  <dg-bar role="part" name="people" label="People" value="35"></dg-bar>
  <dg-bar role="part" name="tools" label="Tools" value="10"></dg-bar>
</deck-diagram>`,
    },
    { code: 'INT_VALUE_MISSING', says: 'a part without a number in `value`' },
  ],
};

const MERGE: CompiledIntent = {
  roles: [
    {
      role: 'source',
      tags: ['dg-box'],
      min: 2,
      max: 4,
      says: 'what flows in · its amount in `value`, if you say one',
    },
    {
      role: 'into',
      tags: ['dg-box', 'dg-meter', 'dg-queue'],
      min: 1,
      max: 1,
      says: 'where they meet · in `value` their sum · put forward',
    },
  ],
  focal: 'into',
  composes: ['accumulate'],
  skeleton: `<deck-diagram intent="merge">
  <dg-box role="source" name="web" icon="user" label="Web" value="3 k"></dg-box>
  <dg-box role="source" name="shops" icon="target" label="Shops" value="2 k"></dg-box>
  <dg-box role="source" name="phone" icon="team" label="Phone" value="1 k"></dg-box>
  <dg-box role="into" name="orders" icon="document" label="Orders" value="6 k"></dg-box>
</deck-diagram>`,
  pitfalls: [
    {
      code: 'INT_MERGE_NOT_SUM',
      says: 'the sources do not add up to what they meet in · something leaks, or comes from nowhere',
      html: `<deck-diagram intent="merge">
  <dg-box role="source" name="web" label="Web" value="3"></dg-box>
  <dg-box role="source" name="shops" label="Shops" value="2"></dg-box>
  <dg-box role="into" name="orders" label="Orders" value="7"></dg-box>
</deck-diagram>`,
    },
    {
      code: 'INT_MERGE_APART',
      says: 'your dg-link leave a source out · it never reaches where the others meet',
      html: `<deck-diagram intent="merge">
  <dg-box role="source" name="web" label="Web"></dg-box>
  <dg-box role="source" name="shops" label="Shops"></dg-box>
  <dg-box role="into" name="orders" label="Orders"></dg-box>
  <dg-link from="web" to="orders"></dg-link>
  <dg-link from="orders" to="shops"></dg-link>
</deck-diagram>`,
    },
  ],
};

export const INTENTS: Readonly<Record<IntentName, IntentSpec>> = Object.freeze({
  cause: {
    name: 'cause',
    family: 'flow',
    shows: 'A brings about B, through a chain',
    looks: 'a chain of arrows traced in order',
    cues: [
      'parce que',
      'provoque',
      'entraine',
      'declenche',
      'a cause de',
      'mene a',
      'conduit a',
      'en chaine',
      'fait tomber',
      'because',
      'causes',
      'leads to',
      'triggers',
      'results in',
    ],
    compiled: CAUSE,
  },
  barrier: {
    name: 'barrier',
    family: 'flow',
    shows: 'a rule stops what flows',
    looks: 'lanes of tokens, a gate dropping across them',
    cues: [
      'coupe',
      'bloque',
      'arrete',
      'stop',
      'interrupteur',
      'kill switch',
      'barriere',
      'filtre',
      'refuse',
      'empeche',
      'plus rien ne passe',
      'blocks',
      'cuts',
      'gate',
      'filter',
    ],
    compiled: BARRIER,
  },
  bottleneck: {
    name: 'bottleneck',
    family: 'flow',
    shows: 'one narrow point limits all that passes',
    looks: 'many tokens in, few out, a queue filling before the neck',
    cues: [
      'goulot',
      'goulet',
      'attend',
      'attente',
      'limite le debit',
      "n'en traite que",
      'engorge',
      'embouteillage',
      'debit',
      'capacite',
      'bottleneck',
      'throughput',
      'capacity',
      'waits',
    ],
    compiled: BOTTLENECK,
  },
  accumulate: {
    name: 'accumulate',
    family: 'quantity',
    shows: 'a stock that rises (or drains) click after click',
    looks: 'a stock between what feeds it and what drains it',
    cues: [
      "s'accumul",
      'accumul',
      'se remplit',
      'remplit',
      'deborde',
      'stock',
      'dette',
      "s'empile",
      'empile',
      'backlog',
      'piles up',
      'fills up',
    ],
    compiled: ACCUMULATE,
  },
  transform: {
    name: 'transform',
    family: 'time',
    shows: 'the same parts, before and after',
    looks: 'one picture reorganised on the click',
    cues: [
      'avant',
      'apres',
      'on est passe de',
      'devient',
      'transforme',
      'migration',
      'before',
      'after',
      'becomes',
      'turns into',
    ],
    compiled: TRANSFORM,
  },
  feedback: {
    name: 'feedback',
    family: 'flow',
    shows: 'the output comes back as input',
    looks: 'a ring whose return arrow is traced on the click',
    cues: [
      'boucle',
      "s'emballe",
      'auto-entretient',
      "s'auto-alimente",
      'cercle vicieux',
      'cercle vertueux',
      'plus il y a',
      'qui ramenent',
      'feedback',
      'loop',
      'vicious circle',
      'flywheel',
    ],
    compiled: FEEDBACK,
  },
  scale: {
    name: 'scale',
    family: 'quantity',
    shows: 'one against many, an order of magnitude',
    looks: 'one lit cell, then a crowd unfolding from it',
    cues: [
      'ordre de grandeur',
      'fois plus',
      'un sur',
      'une sur',
      'sur deux cents',
      'sur mille',
      'pour un',
      'order of magnitude',
      'times more',
      'one in',
    ],
    compiled: SCALE,
  },
  contain: {
    name: 'contain',
    family: 'structure',
    shows: 'A holds B holds C',
    looks: 'frames inside frames, the core put forward',
    cues: [
      'contient',
      'au coeur de',
      'couche',
      'imbrique',
      "a l'interieur",
      'restent dans',
      'coffre',
      'contains',
      'nested',
      'layer',
      'inside',
    ],
    compiled: CONTAIN,
  },
  parallel: {
    name: 'parallel',
    family: 'structure',
    shows: 'several things at once',
    looks: 'side by side columns whose steps come in together',
    cues: [
      'en parallele',
      'en meme temps',
      'simultan',
      'a la fois',
      'parallel',
      'at the same time',
      'at once',
    ],
    compiled: PARALLEL,
  },
  propagate: {
    name: 'propagate',
    family: 'flow',
    shows: 'a change spreads, rank by rank',
    looks: 'a tree whose marks turn one rank per click',
    cues: [
      'se repand',
      'en cascade',
      'contamine',
      'domino',
      'propag',
      'spreads',
      'cascade',
      'ripple',
    ],
    compiled: PROPAGATE,
  },
  threshold: {
    name: 'threshold',
    family: 'time',
    shows: 'past a line, it tips over',
    looks: 'a gauge crossing its line, and what tips under it',
    cues: [
      'au-dela de',
      'seuil',
      'des que',
      'plafond',
      'bascule',
      'franchit',
      'depasse',
      'threshold',
      'once it passes',
      'tipping point',
    ],
    compiled: THRESHOLD,
  },
  tradeoff: {
    name: 'tradeoff',
    family: 'decision',
    shows: 'winning here costs there',
    looks: 'one choice forking into two gauges that move apart',
    cues: [
      'compromis',
      'au prix de',
      'on gagne',
      'on perd',
      'en echange',
      'coute de la',
      'se paie',
      'trade-off',
      'tradeoff',
      'at the cost of',
    ],
    compiled: TRADEOFF,
  },
  drift: {
    name: 'drift',
    family: 'time',
    shows: 'the gap widens with time',
    looks: 'a fixed line, and gaps from it widening period after period',
    cues: [
      'derive',
      "l'ecart se creuse",
      'se creuse',
      'glisse',
      'drift',
      'diverge',
      'gap widens',
      'slips',
    ],
    compiled: DRIFT,
  },
  compare: {
    name: 'compare',
    family: 'quantity',
    shows: 'this one is larger',
    looks: 'bars on one scale, the one in question growing last',
    cues: [
      'deux fois plus',
      'deux fois le',
      'plus grand',
      'compare',
      'versus',
      'larger than',
      'twice as',
    ],
    compiled: COMPARE,
  },
  partition: {
    name: 'partition',
    family: 'quantity',
    shows: 'a whole split into parts that add up',
    looks: 'one band cut end to end into its parts',
    cues: [
      'repartition',
      'se repartit',
      'part de',
      'la moitie du',
      'sur dix',
      'share of',
      'split into',
      'breakdown',
    ],
    compiled: PARTITION,
  },
  merge: {
    name: 'merge',
    family: 'flow',
    shows: 'several sources meet in one',
    looks: 'arrows converging down into one, tokens riding together',
    cues: [
      'convergent',
      'fusion',
      'se rejoignent',
      'rassemble',
      'remplissent',
      'merge',
      'converge',
      'come together',
    ],
    compiled: MERGE,
  },
});
