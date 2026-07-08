import { describe, expect, it } from 'vitest';
import { PLOTS } from '../src/sim/content/housing_plots';
import { Sim } from '../src/sim/sim';
import type { PlayerMeta } from '../src/sim/sim';
import { houseOrigin, normalizeConstructionSystem } from '../src/sim/professions/construction';

function makeSim(seed = 42) {
  return new Sim({ seed, playerClass: 'warrior', autoEquip: true });
}

function playerMeta(sim: Sim): PlayerMeta {
  return (sim as any).players.get(sim.playerId);
}

function giveCopper(sim: Sim, amount: number) {
  playerMeta(sim).copper += amount;
}

function setHouseTier(sim: Sim, tier: number) {
  playerMeta(sim).construction.houseTier = tier;
}

describe('construction determinism', () => {
  it('same seed + same construction actions => identical construction state', () => {
    const run = (): number[] => {
      const sim = makeSim(777);
      const trace: number[] = [];
      const plot = PLOTS[0];
      giveCopper(sim, plot.price * 10);
      sim.buyPlot(plot.id);
      sim.tick();
      trace.push(sim.myPlot ? 1 : 0, playerMeta(sim).construction.plotId ? 1 : 0);

      setHouseTier(sim, 1);
      sim.enterHouse();
      sim.tick();
      trace.push(isInsideHouse(sim) ? 1 : 0);

      sim.addItem('rustic_chair', 5);
      sim.addItem('rustic_table', 3);
      const origin = houseOrigin(0);
      sim.placeFurniture('rustic_chair', origin.x, origin.z, 0);
      sim.tick();
      sim.placeFurniture('rustic_table', origin.x + 2, origin.z + 2, 0);
      sim.tick();
      const fc = sim.placedFurniture.length;
      trace.push(fc);

      sim.leaveHouse();
      sim.tick();
      trace.push(isInsideHouse(sim) ? 0 : 1);

      const meta = playerMeta(sim);
      trace.push(meta.construction.skill);
      trace.push(meta.construction.houseTier);
      trace.push(meta.construction.furniture.length);
      trace.push(Object.keys(meta.construction.chests).length);
      return trace;
    };
    expect(run()).toEqual(run());
  });

  it('same seed + same actions produce deterministic furniture rotation', () => {
    const run = (): number[] => {
      const sim = makeSim(77);
      const plot = PLOTS[0];
      giveCopper(sim, plot.price * 10);
      sim.buyPlot(plot.id);
      setHouseTier(sim, 1);
      sim.addItem('rustic_chair', 2);
      sim.addItem('rustic_table', 1);
      sim.enterHouse();
      sim.tick();
      const origin = houseOrigin(0);
      sim.placeFurniture('rustic_chair', origin.x, origin.z, 1.57);
      sim.tick();
      sim.placeFurniture('rustic_table', origin.x + 2, origin.z + 2, 0.78);
      sim.tick();
      return sim.placedFurniture.map((f) => f.rotY * 100);
    };
    expect(run()).toEqual(run());
  });

  it('furniture id generation is deterministic per seed', () => {
    const run = (seed: number): string[] => {
      const sim = makeSim(seed);
      const plot = PLOTS[0];
      giveCopper(sim, plot.price * 10);
      sim.buyPlot(plot.id);
      sim.tick();
      setHouseTier(sim, 1);
      sim.addItem('rustic_chair', 2);
      sim.enterHouse();
      sim.tick();
      const origin = houseOrigin(0);
      sim.placeFurniture('rustic_chair', origin.x, origin.z, 0);
      sim.tick();
      sim.placeFurniture('rustic_chair', origin.x + 2, origin.z, 0);
      sim.tick();
      return sim.placedFurniture.map((f) => f.id);
    };
    const a = run(42);
    const b = run(42);
    expect(a).toEqual(b);
  });

  it('same seed + same build phases => identical skill progression', () => {
    const run = (): number[] => {
      const sim = makeSim(999);
      const trace: number[] = [];
      const plot = PLOTS[0];
      giveCopper(sim, plot.price * 99999);
      sim.buyPlot(plot.id);
      sim.tick();
      // learn the tier-1 blueprint (tent)
      sim.addItem('blueprint_tent', 1);
      sim.useItem('blueprint_tent');
      sim.tick();
      // add building materials for phase 0: rough_stone x5, raw_lumber x2
      sim.addItem('rough_stone', 100);
      sim.addItem('raw_lumber', 100);
      sim.addItem('sawed_plank', 100);
      sim.addItem('canvas_scrap', 100);
      sim.addItem('bedroll', 5);
      sim.addItem('candle', 5);
      // build phase 0 (foundation): rough_stone x5, raw_lumber x2
      sim.buildBlueprint('blueprint_tent');
      sim.tick();
      const meta = playerMeta(sim);
      trace.push(meta.construction.skill);
      trace.push(meta.construction.houseTier);
      trace.push(Object.keys(meta.construction.phasesBuilt).length);
      trace.push(meta.construction.knownBlueprints.length);
      return trace;
    };
    expect(run()).toEqual(run());
  });

  it('normalizeConstructionSystem is deterministic for null/undefined', () => {
    const a = normalizeConstructionSystem(null);
    const b = normalizeConstructionSystem(undefined);
    const c = normalizeConstructionSystem({});
    expect(a).toEqual(b);
    expect(b).toEqual(c);
    expect(a.plotId).toBe(null);
    expect(a.houseTier).toBe(0);
    expect(a.skill).toBe(0);
  });
});

function isInsideHouse(sim: Sim): boolean {
  return sim.player.pos.x >= 15000 && sim.player.pos.x < 16000;
}
