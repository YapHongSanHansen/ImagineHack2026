// THE canonical scoreboard. Every surface (Dashboard tiles, Insights, Draft Lab
// before/after) reads from here so no two screens can ever disagree on stage.
// Headlines use demo-legible percentages; counts live in drill-downs.

export const SCOREBOARD = {
  waste: { key: 'waste', label: 'Manpower Waste', before: 57, after: 26, unit: '%', hero: true, betterWhenLow: true },
  idle: { key: 'idle', label: 'Idle Capacity', before: 31, after: 9, unit: '%', betterWhenLow: true },
  burnout: { key: 'burnout', label: 'Burnout Flags', before: 4, after: 1, unit: '', betterWhenLow: true },
  meta: { key: 'meta', label: 'Meta Balance', before: 54, after: 87, unit: '', betterWhenLow: false },
  spof: { key: 'spof', label: 'Single Points of Failure', before: 3, after: 1, unit: '', betterWhenLow: true },
};

// Illustrative business framing (clearly labelled in UI).
export const PROJECTED = {
  outputGain: 18, // %
  costAvoided: 'RM 240k',
  idleFteReclaimed: 3.4,
};

// Headline team that gets fixed in the demo.
export const HERO_TEAM_ID = 't01';
export const TITAN_HEALTH = { before: 38, after: 84 };

// Order of tiles on the dashboard (hero first).
export const TILE_ORDER = ['waste', 'idle', 'burnout', 'meta'];
