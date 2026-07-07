import { ITEMS } from '../../data';
import type { PlacedFurniture } from '../../types';
import type { SimContext } from '../../sim_context';
import { houseOrigin, houseSlotAt } from './housing';

const GRID_SNAP = 0.5;
const INTERIOR_X_MIN = -9.5;
const INTERIOR_X_MAX = 9.5;
const INTERIOR_Z_MIN = -9.5;

const FURNITURE_CATALOG: Record<string, { hw: number; hd: number }> = {
  rustic_chair: { hw: 0.5, hd: 0.5 },
  rustic_table: { hw: 1.0, hd: 1.0 },
  rustic_bed: { hw: 1.5, hd: 1.0 },
  rustic_shelf: { hw: 0.5, hd: 0.3 },
  rustic_rug: { hw: 1.0, hd: 0.7 },
  rustic_lamp: { hw: 0.3, hd: 0.3 },
  rustic_cabinet: { hw: 0.6, hd: 0.6 },
  sturdy_chair: { hw: 0.5, hd: 0.5 },
  sturdy_table: { hw: 1.0, hd: 1.0 },
  sturdy_bed: { hw: 1.5, hd: 1.0 },
  sturdy_shelf: { hw: 0.5, hd: 0.3 },
  sturdy_rug: { hw: 1.0, hd: 0.7 },
  sturdy_lamp: { hw: 0.3, hd: 0.3 },
  ornate_chair: { hw: 0.5, hd: 0.5 },
  ornate_table: { hw: 1.0, hd: 1.0 },
  ornate_bed: { hw: 1.5, hd: 1.0 },
  ornate_cabinet: { hw: 0.6, hd: 0.6 },
  ornate_lamp: { hw: 0.3, hd: 0.3 },
  ornate_rug: { hw: 1.0, hd: 0.7 },
  exquisite_chair: { hw: 0.5, hd: 0.5 },
  exquisite_table: { hw: 1.0, hd: 1.0 },
  exquisite_bed: { hw: 1.5, hd: 1.0 },
  exquisite_lamp: { hw: 0.3, hd: 0.3 },
  masterwork_chair: { hw: 0.5, hd: 0.5 },
  masterwork_table: { hw: 1.0, hd: 1.0 },
  masterwork_bed: { hw: 1.5, hd: 1.0 },
  masterwork_rug: { hw: 1.0, hd: 0.7 },
  station_workbench: { hw: 1.5, hd: 0.8 },
  station_anvil: { hw: 0.8, hd: 0.8 },
  station_alchemy: { hw: 1.0, hd: 0.8 },
  station_cooking_fire: { hw: 0.8, hd: 0.8 },
  station_loom: { hw: 1.2, hd: 0.6 },
  chest_small: { hw: 0.6, hd: 0.6 },
  chest_medium: { hw: 0.8, hd: 0.8 },
  chest_large: { hw: 1.0, hd: 1.0 },
};

function snap(v: number): number {
  return Math.round(v / GRID_SNAP) * GRID_SNAP;
}

function rotYToAxes(rotY: number): { cosA: number; sinA: number } {
  return { cosA: Math.cos(rotY), sinA: Math.sin(rotY) };
}

function obbOverlap(
  ax: number, az: number, ahw: number, ahd: number,
  acos: number, asin: number,
  bx: number, bz: number, bhw: number, bhd: number,
  bcos: number, bsin: number,
): boolean {
  const dx = bx - ax;
  const dz = bz - az;
  const axes = [
    { x: acos, z: asin },
    { x: -asin, z: acos },
    { x: bcos, z: bsin },
    { x: -bsin, z: bcos },
  ];
  for (const axis of axes) {
    const projA = ahw * Math.abs(axis.x * acos + axis.z * asin)
      + ahd * Math.abs(axis.x * -asin + axis.z * acos);
    const projB = bhw * Math.abs(axis.x * bcos + axis.z * bsin)
      + bhd * Math.abs(axis.x * -bsin + axis.z * bcos);
    const dist = Math.abs(dx * axis.x + dz * axis.z);
    if (dist > projA + projB) return false;
  }
  return true;
}

function furnitureOverlaps(
  existing: PlacedFurniture[],
  itemId: string,
  x: number,
  z: number,
  rotY: number,
  size: { hw: number; hd: number },
  excludeId?: string,
): boolean {
  const { cosA, sinA } = rotYToAxes(rotY);
  for (const placed of existing) {
    if (excludeId && placed.id === excludeId) continue;
    const otherSize = FURNITURE_CATALOG[placed.itemId];
    if (!otherSize) continue;
    const { cosA: oCos, sinA: oSin } = rotYToAxes(placed.rotY);
    if (obbOverlap(x, z, size.hw, size.hd, cosA, sinA,
      placed.x, placed.z, otherSize.hw, otherSize.hd, oCos, oSin)) {
      return true;
    }
  }
  return false;
}

export function isPlaceableFurniture(itemId: string): boolean {
  return itemId in FURNITURE_CATALOG;
}

export function furnitureSize(itemId: string): { hw: number; hd: number } | null {
  return FURNITURE_CATALOG[itemId] ?? null;
}

/** Returns the interior z max for the given house tier, in local coords. */
export function interiorZMax(tier: number): number {
  return INTERIOR_Z_MIN + tier * 10 + 6;
}

export function validateFurniturePlacement(
  ctx: SimContext,
  pid: number,
  itemId: string,
  x: number,
  z: number,
  rotY: number,
): { ok: true; size: { hw: number; hd: number } } | { ok: false; reason: string } {
  const meta = ctx.players.get(pid);
  if (!meta) return { ok: false, reason: 'Player not found.' };
  if (!meta.construction.plotId) return { ok: false, reason: 'You do not own a building plot.' };
  if (meta.construction.houseTier < 1) return { ok: false, reason: 'You have not built a house yet.' };

  const size = FURNITURE_CATALOG[itemId];
  if (!size) return { ok: false, reason: 'That item is not placeable furniture.' };

  const p = ctx.entities.get(meta.entityId);
  if (!p || p.dead) return { ok: false, reason: 'You cannot do that right now.' };

  if (p.pos.x < 15000) return { ok: false, reason: 'You must be inside your house to place furniture.' };

  const slotIdx = houseSlotAt(p.pos.z);
  const origin = houseOrigin(slotIdx);
  const lx = x - origin.x;
  const lz = z - origin.z;
  const maxZ = interiorZMax(meta.construction.houseTier);
  if (lx < INTERIOR_X_MIN || lx > INTERIOR_X_MAX || lz < INTERIOR_Z_MIN || lz > maxZ) {
    return { ok: false, reason: 'That position is outside your house interior.' };
  }

  if (furnitureOverlaps(meta.construction.furniture, itemId, x, z, rotY, size)) {
    return { ok: false, reason: 'That position overlaps with existing furniture.' };
  }

  return { ok: true, size };
}

export function placeFurniture(ctx: SimContext, pid: number, itemId: string, x: number, z: number, rotY: number): void {
  const meta = ctx.players.get(pid);
  if (!meta) return;

  const check = validateFurniturePlacement(ctx, pid, itemId, x, z, rotY);
  if (!check.ok) {
    ctx.error(pid, check.reason);
    return;
  }

  if (ctx.countItem(itemId, meta.entityId) < 1) {
    ctx.error(pid, 'You do not have that furniture item.');
    return;
  }
  ctx.removeItem(itemId, 1, meta.entityId);

  const sx = snap(x);
  const sz = snap(z);
  const srot = Math.round(rotY / (Math.PI / 4)) * (Math.PI / 4);
  const placed: PlacedFurniture = {
    id: `furn_${pid}_${ctx.tickCount}_${meta.construction.furniture.length}`,
    itemId,
    x: sx,
    z: sz,
    rotY: srot,
  };
  meta.construction.furniture.push(placed);
  ctx.emit({ type: 'log', text: `Placed ${ITEMS[itemId]?.name ?? itemId}.`, color: '#5f5', pid });
}

export function moveFurniture(ctx: SimContext, pid: number, placedId: string, x: number, z: number, rotY: number): void {
  const meta = ctx.players.get(pid);
  if (!meta) return;

  const idx = meta.construction.furniture.findIndex((f) => f.id === placedId);
  if (idx < 0) {
    ctx.error(pid, 'That furniture piece was not found.');
    return;
  }

  const existing = meta.construction.furniture[idx];
  const size = FURNITURE_CATALOG[existing.itemId];
  if (!size) {
    ctx.error(pid, 'That item is not placeable furniture.');
    return;
  }

  const p = ctx.entities.get(meta.entityId);
  if (!p || p.dead) {
    ctx.error(pid, 'You cannot do that right now.');
    return;
  }
  if (!meta.construction.plotId || meta.construction.houseTier < 1) {
    ctx.error(pid, 'You do not have a house.');
    return;
  }
  if (p.pos.x < 15000) {
    ctx.error(pid, 'You must be inside your house to move furniture.');
    return;
  }

  const slotIdx = houseSlotAt(p.pos.z);
  const origin = houseOrigin(slotIdx);
  const lx = x - origin.x;
  const lz = z - origin.z;
  const maxZ = interiorZMax(meta.construction.houseTier);
  if (lx < INTERIOR_X_MIN || lx > INTERIOR_X_MAX || lz < INTERIOR_Z_MIN || lz > maxZ) {
    ctx.error(pid, 'That position is outside your house interior.');
    return;
  }

  if (furnitureOverlaps(meta.construction.furniture, existing.itemId, x, z, rotY, size, placedId)) {
    ctx.error(pid, 'That position overlaps with existing furniture.');
    return;
  }

  const sx = snap(x);
  const sz = snap(z);
  const srot = Math.round(rotY / (Math.PI / 4)) * (Math.PI / 4);
  meta.construction.furniture[idx] = { ...existing, x: sx, z: sz, rotY: srot };
  ctx.emit({ type: 'log', text: 'Furniture moved.', color: '#5f5', pid });
}

export function removeFurniture(ctx: SimContext, pid: number, placedId: string): void {
  const meta = ctx.players.get(pid);
  if (!meta) return;

  const idx = meta.construction.furniture.findIndex((f) => f.id === placedId);
  if (idx < 0) {
    ctx.error(pid, 'That furniture piece was not found.');
    return;
  }

  const existing = meta.construction.furniture[idx];
  const p = ctx.entities.get(meta.entityId);
  if (!p || p.dead) {
    ctx.error(pid, 'You cannot do that right now.');
    return;
  }
  if (!meta.construction.plotId || meta.construction.houseTier < 1) {
    ctx.error(pid, 'You do not have a house.');
    return;
  }
  if (p.pos.x < 15000) {
    ctx.error(pid, 'You must be inside your house to remove furniture.');
    return;
  }

  // Block removal of non-empty chest (Phase 6).
  if (isChestItem(existing.itemId)) {
    const stored = meta.construction.chests[placedId];
    if (stored && stored.length > 0) {
      ctx.error(pid, 'You must empty the chest before removing it.');
      return;
    }
  }

  meta.construction.furniture.splice(idx, 1);
  delete meta.construction.chests[placedId];
  ctx.addItem(existing.itemId, 1, meta.entityId);
  ctx.emit({ type: 'log', text: 'Furniture removed.', color: '#5f5', pid });
}

export function placedFurnitureFor(meta: { construction: { furniture: PlacedFurniture[] } }): PlacedFurniture[] {
  return meta.construction.furniture;
}

// Phase 6 helpers: identify station and chest furniture by itemId.
const CHEST_ITEM_IDS = ['chest_small', 'chest_medium', 'chest_large'];

export function stationKindFor(itemId: string): string | null {
  if (itemId === 'station_workbench') return 'workbench';
  if (itemId === 'station_anvil') return 'anvil';
  if (itemId === 'station_alchemy') return 'alchemy';
  if (itemId === 'station_cooking_fire') return 'cooking';
  if (itemId === 'station_loom') return 'loom';
  return null;
}

export function isChestItem(itemId: string): boolean {
  return CHEST_ITEM_IDS.includes(itemId);
}

export function chestSlotCount(itemId: string): number {
  if (itemId === 'chest_small') return 6;
  if (itemId === 'chest_medium') return 12;
  if (itemId === 'chest_large') return 24;
  return 0;
}
