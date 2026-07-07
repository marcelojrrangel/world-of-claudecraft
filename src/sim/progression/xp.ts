// XP / progression slice (G1b): the residual XP-shaping surface C1 deliberately
// left on Sim. C1 owns the grantXp core (src/sim/combat/damage.ts); this module
// holds the cosmetic `prestige` command and the rested-XP accrual
// (`updateRested` / `isResting`), MOVED verbatim out of sim.ts behind SimContext
// (move + import, not a rewrite). The XP curve formulas (xpForLevel / canPrestige)
// stay pure in ../types and are imported here.
import { isHousePos } from '../professions/construction';
import { PROPS } from '../data';
import type { PlayerMeta } from '../sim';
import type { SimContext } from '../sim_context';
import { canPrestige, DT, type Entity, MAX_LEVEL, xpForLevel } from '../types';

// Rested-XP tuning. Consumed only by updateRested / isResting below.
const RESTED_SECONDS_PER_GAME_HOUR = 60; // 1 in-game hour = 60 sim seconds
const RESTED_FILL_FRACTION = 0.05; // a full "bubble" = 5% of the level's XP-to-level
const RESTED_FILL_HOURS = 8; // accrued per this many in-game hours of resting
const RESTED_CAP_LEVELS = 1.5; // pool clamps to 1.5 levels of XP, the classic-era cap
const RESTED_INN_PADDING = 2; // yards of slack around the inn footprint that still counts as resting

// House-rested XP bonus multiplier per tier (Phase 6).
export const HOUSE_RESTED_TIER_MULT = [0, 1.0, 1.25, 1.5, 1.75, 2.0, 2.5];

// True while the player is out of combat AND either (a) standing in/next to an
// inn, or (b) inside their own house interior (Phase 6). `meta` is optional so
// existing callers (inn-only check) don't need it.
export function isResting(p: Entity, meta?: PlayerMeta): boolean {
  if (p.inCombat) return false;
  // Check inn footprints (existing behavior).
  for (const b of PROPS.buildings) {
    if (b.kind !== 'inn') continue;
    const dx = p.pos.x - b.x;
    const dz = p.pos.z - b.z;
    const cos = Math.cos(-b.rot);
    const sin = Math.sin(-b.rot);
    const lx = dx * cos - dz * sin;
    const lz = dz * cos + dz * sin;
    if (
      Math.abs(lx) <= b.w / 2 + RESTED_INN_PADDING &&
      Math.abs(lz) <= b.d / 2 + RESTED_INN_PADDING
    )
      return true;
  }
  // Check if player is inside their own house (Phase 6).
  if (!meta || !isHousePos(p.pos.x)) return false;
  if (!meta.construction.plotId || meta.construction.houseTier < 1) return false;
  return true;
}

// Rested XP bonus rate for house ownership (0 = no house / tier 0).
export function houseRestedTierMultiplier(meta: PlayerMeta): number {
  if (!meta.construction.plotId || meta.construction.houseTier < 1) return 0;
  const tier = Math.min(meta.construction.houseTier, HOUSE_RESTED_TIER_MULT.length - 1);
  return HOUSE_RESTED_TIER_MULT[tier];
}

// Accrue rested XP while resting in an inn. Classic-era rate: 5% of the level's
// XP-to-level per 8 in-game hours, clamped to 1.5 levels. Deterministic —
// paced off DT, never wall-clock. No accrual at the cap (no level bar).
export function updateRested(p: Entity, meta: PlayerMeta): void {
  if (p.level >= MAX_LEVEL) return;
  const cap = RESTED_CAP_LEVELS * xpForLevel(p.level);
  if (meta.restedXp >= cap) {
    meta.restedXp = cap;
    return;
  }
  if (!isResting(p, meta)) return;
  const fillSeconds = RESTED_FILL_HOURS * RESTED_SECONDS_PER_GAME_HOUR;
  let perSecond = (RESTED_FILL_FRACTION * xpForLevel(p.level)) / fillSeconds;
  // House rested XP bonus (Phase 6): scales accrual by house tier multiplier.
  if (isHousePos(p.pos.x)) {
    perSecond *= houseRestedTierMultiplier(meta);
  }
  meta.restedXp = Math.min(cap, meta.restedXp + perSecond * DT);
}

// Opt-in cosmetic prestige: only at the cap. Resets the level XP
// bar, bumps the prestige rank for a badge by the name + on the leaderboard,
// and deliberately leaves lifetimeXp, level, gear, talents, and learned
// abilities untouched — strictly cosmetic, zero power change (FR-6.1/6.3).
export function prestige(ctx: SimContext, pid?: number): boolean {
  const r = ctx.resolve(pid);
  if (!r) return false;
  // Authoritative anti-abuse gate: must be at the cap AND have earned a full
  // prestige bar of post-cap XP since the last rank. This caps prestigeRank at
  // what lifetimeXp supports, so spamming the `prestige` command (e.g. from a
  // hacked client) can never inflate the rank beyond XP actually earned.
  if (!canPrestige(r.e.level, r.meta.lifetimeXp, r.meta.prestigeRank)) return false;
  r.meta.xp = 0;
  r.meta.prestigeRank += 1;
  ctx.emit({
    type: 'log',
    pid: r.e.id,
    text: `You have prestiged! Prestige Rank ${r.meta.prestigeRank}.`,
    color: '#ffd100',
  });
  return true;
}
