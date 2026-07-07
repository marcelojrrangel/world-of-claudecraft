// Blueprint construction mechanics (Phase 4): learning blueprints from scroll
// items and building phases that consume materials and grant construction skill.
// All behavior is deterministic: skill gains are queued and drained on the tick
// path, never applied immediately.

import { BLUEPRINTS, BLUEPRINTS_BY_ID, blueprintByItemId } from '../../content/blueprints';
import { ITEMS } from '../../data';
import type { PlayerMeta } from '../../sim';
import type { SimContext } from '../../sim_context';
import type { BlueprintPhase } from '../../types';
import { canGatherTier, gatherToolTier } from '../tools';

const CONSTRUCTION_PROFESSION_ID = 'construction';
const MAX_SKILL = 300;

export function knownBlueprintsFor(meta: PlayerMeta): string[] {
  return meta.construction.knownBlueprints;
}

export function currentHouseProgressFor(meta: PlayerMeta): { blueprintId: string; currentPhase: number; totalPhases: number } | null {
  const { houseTier, phasesBuilt } = meta.construction;
  if (houseTier < 1) return null;
  const blueprint = BLUEPRINTS.find((b) => b.tier === houseTier);
  if (!blueprint) return null;
  const currentPhase = phasesBuilt[blueprint.id] ?? 0;
  return { blueprintId: blueprint.id, currentPhase, totalPhases: blueprint.phases.length };
}

export function nextBlueprintForTier(tier: number): string | undefined {
  return BLUEPRINTS.find((b) => b.tier === tier)?.id;
}

export function blueprintTierById(blueprintId: string): number {
  return BLUEPRINTS_BY_ID[blueprintId]?.tier ?? 0;
}

function playerToolTier(ctx: SimContext, pid: number): number {
  const meta = ctx.players.get(pid);
  if (!meta) return 0;
  let best = 0;
  for (const slot of Object.values(meta.equipment)) {
    if (!slot) continue;
    const item = ITEMS[slot];
    const tier = item ? gatherToolTier(item, CONSTRUCTION_PROFESSION_ID) : undefined;
    if (tier !== undefined && tier > best) best = tier;
  }
  for (const inv of meta.inventory) {
    const item = ITEMS[inv.itemId];
    const tier = item ? gatherToolTier(item, CONSTRUCTION_PROFESSION_ID) : undefined;
    if (tier !== undefined && tier > best) best = tier;
  }
  return best;
}

function hasMaterials(ctx: SimContext, meta: PlayerMeta, materials: { itemId: string; count: number }[]): boolean {
  for (const { itemId, count } of materials) {
    if (ctx.countItem(itemId, meta.entityId) < count) return false;
  }
  return true;
}

function consumeMaterials(ctx: SimContext, meta: PlayerMeta, materials: { itemId: string; count: number }[]): void {
  for (const { itemId, count } of materials) {
    ctx.removeItem(itemId, count, meta.entityId);
  }
}

export function canBuildBlueprint(
  ctx: SimContext,
  pid: number,
  blueprintId: string,
): { ok: true; blueprint: (typeof BLUEPRINTS)[number]; phase: BlueprintPhase } | { ok: false; reason: string } {
  const meta = ctx.players.get(pid);
  if (!meta) return { ok: false, reason: 'Player not found.' };
  if (!meta.construction.plotId) return { ok: false, reason: 'You do not own a building plot.' };

  const blueprint = BLUEPRINTS_BY_ID[blueprintId];
  if (!blueprint) return { ok: false, reason: 'That blueprint does not exist.' };

  const { houseTier, phasesBuilt, skill } = meta.construction;
  const currentTier = houseTier === 0 ? 1 : houseTier;
  const currentBlueprint = BLUEPRINTS.find((b) => b.tier === currentTier)!;
  const currentCompleted = (phasesBuilt[currentBlueprint.id] ?? 0) >= currentBlueprint.phases.length;

  // Determine the next tier we are allowed to work on.
  const nextAllowedTier = currentCompleted ? Math.min(6, currentTier + 1) : currentTier;

  if (blueprint.tier !== nextAllowedTier) {
    if (blueprint.tier <= houseTier && (phasesBuilt[blueprint.id] ?? 0) >= blueprint.phases.length) {
      return { ok: false, reason: 'That blueprint is already complete.' };
    }
    if (blueprint.tier > nextAllowedTier) {
      return { ok: false, reason: 'You must finish the previous tier before starting this one.' };
    }
  }

  const currentPhase = phasesBuilt[blueprint.id] ?? 0;
  if (currentPhase >= blueprint.phases.length) {
    if (houseTier < 6) {
      return { ok: false, reason: 'Your current house is complete. Start the next tier blueprint to continue.' };
    }
    return { ok: false, reason: 'Your estate is fully built.' };
  }

  if (!meta.construction.knownBlueprints.includes(blueprint.id)) {
    return { ok: false, reason: 'You have not learned the blueprint for this tier.' };
  }
  if (skill < blueprint.requiredSkill) {
    return { ok: false, reason: 'Your construction skill is too low for this blueprint.' };
  }

  const phase = blueprint.phases[currentPhase];
  const toolTier = playerToolTier(ctx, pid);
  if (!canGatherTier(toolTier, phase.toolTier)) {
    return { ok: false, reason: 'Your construction tool is not high enough tier for this phase.' };
  }
  if (!hasMaterials(ctx, meta, phase.materials)) {
    return { ok: false, reason: 'You do not have the required materials.' };
  }

  return { ok: true, blueprint, phase };
}

export function buildPhase(ctx: SimContext, pid: number, blueprintId: string): void {
  const meta = ctx.players.get(pid);
  if (!meta) return;
  const check = canBuildBlueprint(ctx, pid, blueprintId);
  if (!check.ok) {
    ctx.error(pid, check.reason);
    return;
  }
  const { blueprint, phase } = check;
  consumeMaterials(ctx, meta, phase.materials);

  const beforeTier = meta.construction.houseTier;
  meta.construction.phasesBuilt[blueprint.id] = phase.index + 1;
  if (blueprint.tier > beforeTier) {
    meta.construction.houseTier = blueprint.tier;
  }

  let gain = phase.skillGain;
  if (meta.construction.skill >= phase.trivialAt) gain = 0;
  if (gain > 0) {
    queueConstructionGrant(meta, gain);
  }

  ctx.emit({ type: 'log', text: `Phase built: ${phase.nameId}.`, color: '#5f5', pid });
  ctx.emit({ type: 'construction_progress', pid, blueprintId: blueprint.id, phase: phase.index + 1 });

  if (beforeTier === 0 && blueprint.tier === 1) {
    ctx.emit({ type: 'log', text: 'Your house is now ready to enter.', color: '#5f5', pid });
  }
}

export function learnBlueprint(ctx: SimContext, itemId: string, pid: number): void {
  const meta = ctx.players.get(pid);
  if (!meta) return;
  const blueprint = blueprintByItemId(itemId);
  if (!blueprint) {
    ctx.error(pid, 'That is not a construction blueprint.');
    return;
  }
  if (meta.construction.knownBlueprints.includes(blueprint.id)) {
    ctx.error(pid, 'You already know that blueprint.');
    return;
  }
  meta.construction.knownBlueprints.push(blueprint.id);
  ctx.emit({ type: 'log', text: `Learned blueprint: ${blueprint.name}.`, color: '#5f5', pid });
}

export interface PendingConstructionGrant {
  amount: number;
}

export function queueConstructionGrant(meta: PlayerMeta, amount: number): void {
  if (!Number.isFinite(amount) || amount <= 0) return;
  meta.pendingConstructionGrants.push({ amount });
}

export function drainConstructionGrants(meta: PlayerMeta): void {
  if (meta.pendingConstructionGrants.length === 0) return;
  let total = 0;
  for (const grant of meta.pendingConstructionGrants) total += grant.amount;
  meta.pendingConstructionGrants.length = 0;
  const next = Math.min(MAX_SKILL, meta.construction.skill + total);
  const prev = meta.construction.skill;
  meta.construction.skill = next;
  if (next > prev && (next === 25 || next === 75 || next === 150 || next === 200 || next === 250 || next === 300)) {
    // milestone event emitted separately by the caller if desired; we keep this
    // pure to skill application.
  }
}

export function constructionSkillFor(meta: PlayerMeta): { skill: number; maxSkill: number } {
  return { skill: meta.construction.skill, maxSkill: MAX_SKILL };
}
