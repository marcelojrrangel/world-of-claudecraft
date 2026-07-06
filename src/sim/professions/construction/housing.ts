// House instance logic (Phase 3): buyPlot, enterHouse, leaveHouse.
// Reuses the dungeon instance pattern: house interiors live at a far x-band
// (HOUSE_X, z per slot), use INTERIOR_COLLIDERS for collision, and despawn
// when empty. Unlike dungeons, houses are personal (one per player) and have
// no mobs.
import { PLOTS } from '../../content/housing_plots';
import {
  HOUSE_SLOT_COUNT,
  HOUSE_SLOT_SPACING,
  HOUSE_X,
  HOUSE_Z0,
  type HouseSlot,
} from '../../types';
import type { SimContext } from '../../sim_context';
import { createGroundObject } from '../../entity';

const HOUSE_EMPTY_TIMEOUT = 20;

export function houseOrigin(slot: number): { x: number; z: number } {
  return { x: HOUSE_X, z: HOUSE_Z0 + slot * HOUSE_SLOT_SPACING };
}

export function houseSlotAt(z: number): number {
  let best = 0;
  let bestD = Infinity;
  for (let i = 0; i < HOUSE_SLOT_COUNT; i++) {
    const d = Math.abs(z - houseOrigin(i).z);
    if (d < bestD) {
      bestD = d;
      best = i;
    }
  }
  return best;
}

export function isHousePos(x: number): boolean {
  return x >= HOUSE_X;
}

export function buyPlot(ctx: SimContext, plotId: string, pid: number): void {
  const meta = ctx.players.get(pid);
  if (!meta) return;
  if (meta.construction.plotId) {
    ctx.error(pid, 'You already own a building plot.');
    return;
  }
  const plot = PLOTS.find((p) => p.id === plotId);
  if (!plot) {
    ctx.error(pid, 'That plot does not exist.');
    return;
  }
  // Check availability in plot registry
  const existing = ctx.plotRegistry.find((e) => e.plotId === plotId);
  if (existing && existing.ownerPid !== pid) {
    ctx.error(pid, 'This plot is already taken.');
    return;
  }
  // Deduct gold
  if (meta.copper < plot.price) {
    ctx.error(pid, 'You do not have enough gold to buy this plot.');
    return;
  }
  meta.copper -= plot.price;
  meta.construction.plotId = plotId;
  ctx.plotRegistry.push({ plotId, ownerPid: pid });
  ctx.emit({ type: 'log', text: `You purchased ${plotId}!`, color: '#5f5', pid });
}

export function enterHouse(ctx: SimContext, pid: number): void {
  const meta = ctx.players.get(pid);
  if (!meta) return;
  const plotId = meta.construction.plotId;
  if (!plotId) {
    ctx.error(pid, 'You do not own a building plot.');
    return;
  }
  const tier = meta.construction.houseTier;
  if (tier < 1) {
    ctx.error(pid, 'You have not built a house on your plot yet.');
    return;
  }
  let slot = ctx.houseInstances.find((h) => h.partyKey === `house:${pid}`);
  if (!slot) {
    const free = ctx.houseInstances.find((h) => h.partyKey === null);
    if (!free) {
      ctx.error(pid, 'All house instances are busy. Try again soon.');
      return;
    }
    claimHouseInstance(ctx, free, pid, plotId, tier);
    slot = free;
  }
  const origin = houseOrigin(slot.slot);
  const p = ctx.entities.get(meta.entityId);
  if (!p || p.dead) return;
  p.pos = ctx.groundPos(origin.x, origin.z + 2);
  p.prevPos = { ...p.pos };
  ctx.rebucket(p);
  p.facing = 0;
  p.targetId = null;
  p.autoAttack = false;
  slot.emptyFor = 0;
  ctx.emit({ type: 'log', text: 'You enter your house.', color: '#b9f', pid });
}

export function leaveHouse(ctx: SimContext, pid: number): void {
  const meta = ctx.players.get(pid);
  if (!meta) return;
  const plotId = meta.construction.plotId;
  if (!plotId) {
    ctx.error(pid, 'You are not inside a house.');
    return;
  }
  const plot = PLOTS.find((p) => p.id === plotId);
  if (!plot) {
    ctx.error(pid, 'Your plot could not be found.');
    return;
  }
  const p = ctx.entities.get(meta.entityId);
  if (!p || p.dead) return;
  p.pos = ctx.groundPos(plot.x + 4, plot.z + 4);
  p.prevPos = { ...p.pos };
  ctx.rebucket(p);
  p.targetId = null;
  p.autoAttack = false;
  const slot = ctx.houseInstances.find((h) => h.partyKey === `house:${pid}`);
  if (slot) freeHouseInstance(ctx, slot);
  ctx.emit({ type: 'log', text: 'You leave your house.', color: '#b9f', pid });
}

export function updateHouseInstances(ctx: SimContext): void {
  if (ctx.tickCount % 20 !== 0) return;
  for (const slot of ctx.houseInstances) {
    if (slot.partyKey === null) continue;
    const origin = houseOrigin(slot.slot);
    let occupied = false;
    for (const meta of ctx.players.values()) {
      const e = ctx.entities.get(meta.entityId);
      if (e && Math.abs(e.pos.x - origin.x) < 120 && Math.abs(e.pos.z - origin.z) < 250) {
        occupied = true;
        break;
      }
    }
    if (occupied) {
      slot.emptyFor = 0;
    } else {
      slot.emptyFor += 1;
      if (slot.emptyFor >= HOUSE_EMPTY_TIMEOUT) freeHouseInstance(ctx, slot);
    }
  }
}

function claimHouseInstance(
  ctx: SimContext,
  slot: HouseSlot,
  pid: number,
  plotId: string,
  tier: number,
): void {
  slot.partyKey = `house:${pid}`;
  slot.ownerPid = pid;
  slot.plotId = plotId;
  slot.tier = tier;
  slot.emptyFor = 0;
  const origin = houseOrigin(slot.slot);
  const exit = createGroundObject(
    ctx.nextId++,
    '',
    'House Exit',
    ctx.groundPos(origin.x, origin.z - 4),
  );
  exit.templateId = 'house_exit';
  exit.objectItemId = null;
  exit.lootable = true;
  ctx.addEntity(exit);
  slot.exitId = exit.id;
}

function freeHouseInstance(ctx: SimContext, slot: HouseSlot): void {
  if (slot.exitId !== null) {
    if (ctx.entities.has(slot.exitId)) ctx.dropEntity(slot.exitId);
  }
  slot.partyKey = null;
  slot.exitId = null;
  slot.ownerPid = 0;
  slot.plotId = '';
  slot.tier = 0;
  slot.emptyFor = 0;
}
