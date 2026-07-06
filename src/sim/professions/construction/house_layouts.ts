// House interior colliders per tier — simple rectangular rooms.
// Generated directly as Collider[] since house interiors don't need
// the full DungeonLayout machinery (no mobs, no ornate geometry).
import type { Collider } from '../../colliders';

// Wall half-thickness (matches DUNGEON_WALL_HW convention).
const WHW = 1;
// Room half-width (interior walkable space per side wall).
const HW = 10;
// End-wall half-width.
const EHW = HW + WHW;

function houseColliders(tier: number): Collider[] {
  const out: Collider[] = [];
  const zMin = -10;
  const zMax = -10 + tier * 10 + 6;
  const zMid = (zMin + zMax) / 2;
  const zSpan = (zMax - zMin) / 2;

  // Side walls
  for (const sx of [-HW - WHW, HW + WHW]) {
    out.push({ type: 'obb', x: sx, z: zMid, hw: WHW, hd: zSpan + 1, rot: 0 });
  }
  // Back wall, front wall
  out.push({ type: 'obb', x: 0, z: zMax, hw: EHW, hd: WHW, rot: 0 });
  out.push({ type: 'obb', x: 0, z: zMin, hw: EHW, hd: WHW, rot: 0 });

  // Room dividers (interior walls with a 3-yd centre gap for door)
  const roomSpan = (zMax - zMin) / tier;
  for (let i = 1; i < tier; i++) {
    const zDiv = zMin + i * roomSpan;
    // Left wall segment (from left wall to 1.5yd before centre)
    out.push({ type: 'obb', x: -(HW + WHW) / 2, z: zDiv, hw: HW / 2, hd: 0.5, rot: 0 });
    // Right wall segment (from centre + 1.5yd to right wall)
    out.push({ type: 'obb', x: (HW + WHW) / 2, z: zDiv, hw: HW / 2, hd: 0.5, rot: 0 });
  }

  return out;
}

// Pre-built set of colliders per tier (lazily computed).
let _houseCollidersCache: Record<string, Collider[]> | null = null;

export function getHouseColliders(): Record<string, Collider[]> {
  if (_houseCollidersCache) return _houseCollidersCache;
  _houseCollidersCache = {};
  for (let t = 1; t <= 6; t++) {
    _houseCollidersCache[`house_t${t}`] = houseColliders(t);
  }
  return _houseCollidersCache;
}
