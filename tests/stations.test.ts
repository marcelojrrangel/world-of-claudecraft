import { describe, it, expect } from 'vitest';
import { Sim } from '../src/sim/sim';
import type { SimEvent } from '../src/sim/types';

function makeSim(cls: import('../src/sim/types').PlayerClass = 'warrior', seed = 42): Sim {
  return new Sim({ seed, playerClass: cls, autoEquip: true });
}

function errorText(ev: SimEvent[]): string[] {
  return ev.filter((e): e is SimEvent & { text: string } => e.type === 'error' && 'text' in e).map((e) => e.text);
}

function meta(sim: Sim) {
  return (sim as any).players.get(sim.playerId);
}

function entity(sim: Sim) {
  const m = meta(sim);
  return m ? (sim as any).entities.get(m.entityId) : null;
}

function housePos(sim: Sim) {
  const e = entity(sim);
  if (e) { e.pos.x = 15001; e.pos.z = -50000; }
}

describe('crafting station interaction (Phase 6)', () => {
  it('rejects useStation from outside the house', () => {
    const sim = makeSim();
    const result = sim.useStation('nonexistent');
    const ev = sim.drainEvents();
    expect(result).toBe(false);
    expect(errorText(ev)).toContain('You must be inside your house to use a crafting station.');
  });

  it('rejects useStation for a nonexistent placedId', () => {
    const sim = makeSim();
    housePos(sim);
    const m = meta(sim);
    if (m) {
      m.construction.plotId = 'plot_test';
      m.construction.houseTier = 1;
    }

    const result = sim.useStation('nonexistent');
    const ev = sim.drainEvents();
    expect(result).toBe(false);
    expect(errorText(ev)).toContain('That station was not found.');
  });

  it('rejects useStation for a non-station placedId', () => {
    const sim = makeSim();
    housePos(sim);
    const m = meta(sim);
    if (m) {
      m.construction.plotId = 'plot_test';
      m.construction.houseTier = 1;
      m.construction.furniture.push({
        id: 'furn_1', itemId: 'rustic_chair', x: 0, z: 0, rotY: 0,
      });
    }

    const result = sim.useStation('furn_1');
    const ev = sim.drainEvents();
    expect(result).toBe(false);
    expect(errorText(ev)).toContain('That item is not a crafting station.');
  });

  it('applies a crafting boost buff on valid station use', () => {
    const sim = makeSim();
    housePos(sim);
    const m = meta(sim);
    if (m) {
      m.construction.plotId = 'plot_test';
      m.construction.houseTier = 1;
      m.construction.furniture.push({
        id: 'furn_1', itemId: 'station_workbench', x: 0, z: 0, rotY: 0,
      });
    }

    const result = sim.useStation('furn_1');
    const ev = sim.drainEvents();
    expect(result).toBe(true);
    expect(errorText(ev)).toEqual([]);
    expect(ev.some((e) => e.type === 'log' && 'text' in e && e.text === 'You use the workbench and gain a crafting bonus.')).toBe(true);

    const p = entity(sim);
    const aura = p.auras.find((a: any) => a.id === 'station_workbench');
    expect(aura).toBeDefined();
    expect(aura.kind).toBe('crafting_boost');
    expect(aura.value).toBeCloseTo(0.1);
    expect(aura.duration).toBe(1800);
    expect(aura.remaining).toBe(1800);
  });

  it('scales bonus with house tier (tier 3 = 20%)', () => {
    const sim = makeSim();
    housePos(sim);
    const m = meta(sim);
    if (m) {
      m.construction.plotId = 'plot_test';
      m.construction.houseTier = 3;
      m.construction.furniture.push({
        id: 'furn_1', itemId: 'station_anvil', x: 0, z: 0, rotY: 0,
      });
    }

    sim.useStation('furn_1');
    sim.drainEvents();
    const p = entity(sim);
    const aura = p.auras.find((a: any) => a.id === 'station_anvil');
    expect(aura).toBeDefined();
    expect(aura.kind).toBe('crafting_boost');
    expect(aura.value).toBeCloseTo(0.2);
  });

  it('works with all station kinds', () => {
    const kinds = [
      { itemId: 'station_workbench', kind: 'workbench' },
      { itemId: 'station_anvil', kind: 'anvil' },
      { itemId: 'station_alchemy', kind: 'alchemy' },
      { itemId: 'station_cooking_fire', kind: 'cooking' },
      { itemId: 'station_loom', kind: 'loom' },
    ];
    for (const { itemId, kind } of kinds) {
      const sim = makeSim();
      housePos(sim);
      const m = meta(sim);
      if (m) {
        m.construction.plotId = 'plot_test';
        m.construction.houseTier = 1;
        m.construction.furniture.push({ id: `furn_${kind}`, itemId, x: 0, z: 0, rotY: 0 });
      }
      const result = sim.useStation(`furn_${kind}`);
      sim.drainEvents();
      expect(result).toBe(true);
      const p = entity(sim);
      const aura = p.auras.find((a: any) => a.id === `station_${kind}`);
      expect(aura).toBeDefined();
    }
  });

  it('rejects useStation without a house', () => {
    const sim = makeSim();
    housePos(sim);
    const m = meta(sim);
    if (m) {
      m.construction.plotId = null;
      m.construction.houseTier = 0;
      m.construction.furniture.push({
        id: 'furn_1', itemId: 'station_workbench', x: 0, z: 0, rotY: 0,
      });
    }

    const result = sim.useStation('furn_1');
    const ev = sim.drainEvents();
    expect(result).toBe(false);
    expect(errorText(ev)).toContain('You do not have a house.');
  });

  it('rejects useStation when dead', () => {
    const sim = makeSim();
    housePos(sim);
    const m = meta(sim);
    if (m) {
      m.construction.plotId = 'plot_test';
      m.construction.houseTier = 1;
      const p = entity(sim);
      if (p) { p.hp = 0; p.dead = true; }
    }

    const result = sim.useStation('furn_1');
    const ev = sim.drainEvents();
    expect(result).toBe(false);
    expect(errorText(ev)).toContain('You cannot do that right now.');
  });
});
