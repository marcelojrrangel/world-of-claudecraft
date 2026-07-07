import type { SimContext } from '../../sim_context';
import { isHousePos } from './housing';
import { stationKindFor } from './furniture';

const STATION_BUFF_DURATION = 1800; // 30 minutes

function stationBonusFor(tier: number): number {
  return 0.10 + (tier - 1) * 0.05;
}

export function useStation(ctx: SimContext, pid: number, placedId: string): boolean {
  const meta = ctx.players.get(pid);
  if (!meta) return false;

  const p = ctx.entities.get(meta.entityId);
  if (!p || p.dead) {
    ctx.error(pid, 'You cannot do that right now.');
    return false;
  }

  if (!isHousePos(p.pos.x)) {
    ctx.error(pid, 'You must be inside your house to use a crafting station.');
    return false;
  }

  if (!meta.construction.plotId || meta.construction.houseTier < 1) {
    ctx.error(pid, 'You do not have a house.');
    return false;
  }

  const furniture = meta.construction.furniture.find((f) => f.id === placedId);
  if (!furniture) {
    ctx.error(pid, 'That station was not found.');
    return false;
  }

  const kind = stationKindFor(furniture.itemId);
  if (!kind) {
    ctx.error(pid, 'That item is not a crafting station.');
    return false;
  }

  const tier = meta.construction.houseTier;
  const bonus = stationBonusFor(tier);

  ctx.applyAura(p, {
    id: `station_${kind}`,
    name: `Crafting Station (${kind})`,
    kind: 'crafting_boost',
    remaining: STATION_BUFF_DURATION,
    duration: STATION_BUFF_DURATION,
    value: bonus,
    sourceId: p.id,
    school: 'nature',
  });

  ctx.emit({
    type: 'log',
    text: `You use the ${kind} and gain a crafting bonus.`,
    color: '#5ff',
    pid,
  });
  return true;
}
