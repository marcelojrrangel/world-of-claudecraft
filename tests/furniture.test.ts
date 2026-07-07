import { describe, expect, it } from 'vitest';
import { PLOTS } from '../src/sim/content/housing_plots';
import { houseOrigin } from '../src/sim/professions/construction';
import type { PlayerMeta } from '../src/sim/sim';
import { Sim } from '../src/sim/sim';
import type { CharacterState, PlacedFurniture, SimEvent } from '../src/sim/types';

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

function buyPlotAndBuildTent(sim: Sim): void {
  const plot = PLOTS[0];
  giveCopper(sim, plot.price);
  sim.buyPlot(plot.id);
  playerMeta(sim).construction.houseTier = 1;
  sim.addItem('rustic_chair', 1);
  sim.addItem('rustic_table', 1);
}

function enterHouse(sim: Sim): void {
  sim.enterHouse();
  sim.tick();
}

function placeChair(sim: Sim, x: number, z: number, rotY = 0): SimEvent[] {
  sim.placeFurniture('rustic_chair', x, z, rotY);
  return sim.tick();
}

function findError(ev: SimEvent[], text: string): boolean {
  return ev.some((e) => e.type === 'error' && 'text' in e && e.text === text);
}

describe('furniture placement (Phase 5)', () => {
  it('placeFurniture rejects without a plot', () => {
    const sim = makeSim();
    setHouseTier(sim, 1);
    const ev = placeChair(sim, 15000, 0);
    expect(findError(ev, 'You do not own a building plot.')).toBe(true);
  });

  it('placeFurniture rejects without a house built', () => {
    const sim = makeSim();
    const plot = PLOTS[0];
    giveCopper(sim, plot.price);
    sim.buyPlot(plot.id);
    const ev = placeChair(sim, 15000, 0);
    expect(findError(ev, 'You have not built a house yet.')).toBe(true);
  });

  it('placeFurniture rejects a non-furniture item', () => {
    const sim = makeSim();
    const plot = PLOTS[0];
    giveCopper(sim, plot.price);
    sim.buyPlot(plot.id);
    setHouseTier(sim, 1);
    enterHouse(sim);
    sim.placeFurniture('rough_stone', 15001, -8, 0);
    const ev = sim.tick();
    expect(findError(ev, 'That item is not placeable furniture.')).toBe(true);
  });

  it('placeFurniture rejects when outside the house', () => {
    const sim = makeSim();
    buyPlotAndBuildTent(sim);
    const ev = placeChair(sim, 15000, 0);
    expect(findError(ev, 'You must be inside your house to place furniture.')).toBe(true);
  });

  it('placeFurniture succeeds inside the house with a valid item', () => {
    const sim = makeSim();
    buyPlotAndBuildTent(sim);
    enterHouse(sim);
    const origin = houseOrigin(0);
    const x = origin.x;
    const z = origin.z;
    const ev = placeChair(sim, x, z);
    expect(findError(ev, 'You do not have that furniture item.')).toBe(false);
    expect(sim.placedFurniture.length).toBe(1);
    expect(sim.placedFurniture[0].itemId).toBe('rustic_chair');
  });

  it('placeFurniture consumes the item from inventory', () => {
    const sim = makeSim();
    buyPlotAndBuildTent(sim);
    enterHouse(sim);
    expect(sim.countItem('rustic_chair')).toBe(1);
    const origin = houseOrigin(0);
    sim.placeFurniture('rustic_chair', origin.x, origin.z, 0);
    sim.tick();
    expect(sim.countItem('rustic_chair')).toBe(0);
  });

  it('placeFurniture snaps coordinates to the 0.5yd grid', () => {
    const sim = makeSim();
    buyPlotAndBuildTent(sim);
    enterHouse(sim);
    const origin = houseOrigin(0);
    sim.placeFurniture('rustic_chair', origin.x + 0.73, origin.z + 1.28, 0);
    sim.tick();
    expect(sim.placedFurniture[0].x).toBe(origin.x + 0.5);
    expect(sim.placedFurniture[0].z).toBe(origin.z + 1.5);
  });

  it('placeFurniture rejects position outside interior bounds', () => {
    const sim = makeSim();
    buyPlotAndBuildTent(sim);
    enterHouse(sim);
    const origin = houseOrigin(0);
    const ev = placeChair(sim, origin.x + 20, origin.z);
    expect(findError(ev, 'That position is outside your house interior.')).toBe(true);
  });

  it('placeFurniture rejects overlapping furniture', () => {
    const sim = makeSim();
    buyPlotAndBuildTent(sim);
    enterHouse(sim);
    const origin = houseOrigin(0);
    sim.placeFurniture('rustic_chair', origin.x, origin.z, 0);
    sim.tick();
    // Place another chair at the same spot
    sim.addItem('rustic_chair', 1);
    sim.placeFurniture('rustic_chair', origin.x, origin.z, 0);
    const ev = sim.tick();
    expect(findError(ev, 'That position overlaps with existing furniture.')).toBe(true);
  });

  it('moveFurniture repositions furniture', () => {
    const sim = makeSim();
    buyPlotAndBuildTent(sim);
    enterHouse(sim);
    const origin = houseOrigin(0);
    sim.placeFurniture('rustic_chair', origin.x, origin.z, 0);
    sim.tick();
    const placed = sim.placedFurniture[0];
    const newX = origin.x + 2;
    const newZ = origin.z + 2;
    sim.moveFurniture(placed.id, newX, newZ, 0);
    sim.tick();
    expect(sim.placedFurniture[0].x).toBe(newX);
    expect(sim.placedFurniture[0].z).toBe(newZ);
  });

  it('removeFurniture returns the item to inventory', () => {
    const sim = makeSim();
    buyPlotAndBuildTent(sim);
    enterHouse(sim);
    const origin = houseOrigin(0);
    sim.placeFurniture('rustic_chair', origin.x, origin.z, 0);
    sim.tick();
    expect(sim.countItem('rustic_chair')).toBe(0);
    const placed = sim.placedFurniture[0];
    sim.removeFurniture(placed.id);
    sim.tick();
    expect(sim.placedFurniture.length).toBe(0);
    expect(sim.countItem('rustic_chair')).toBe(1);
  });

  it('removeFurniture rejects for a non-existent placed id', () => {
    const sim = makeSim();
    buyPlotAndBuildTent(sim);
    enterHouse(sim);
    sim.removeFurniture('nonexistent_id');
    const ev = sim.tick();
    expect(findError(ev, 'That furniture piece was not found.')).toBe(true);
  });

  it('moveFurniture rejects overlapping with another piece', () => {
    const sim = makeSim();
    buyPlotAndBuildTent(sim);
    enterHouse(sim);
    const origin = houseOrigin(0);
    // Place first chair
    sim.placeFurniture('rustic_chair', origin.x, origin.z, 0);
    sim.tick();
    // Place second chair offset
    sim.addItem('rustic_chair', 1);
    sim.placeFurniture('rustic_chair', origin.x + 2, origin.z, 0);
    sim.tick();
    const placed0 = sim.placedFurniture[0];
    // Try to move first chair onto the second chair's position
    sim.moveFurniture(placed0.id, origin.x + 2, origin.z, 0);
    const ev = sim.tick();
    expect(findError(ev, 'That position overlaps with existing furniture.')).toBe(true);
  });

  it('placedFurniture survives character serialization', () => {
    const sim = makeSim();
    buyPlotAndBuildTent(sim);
    enterHouse(sim);
    const origin = houseOrigin(0);
    sim.placeFurniture('rustic_chair', origin.x, origin.z, 0);
    sim.tick();
    const saved = sim.serializeCharacter(sim.playerId);
    expect(saved).not.toBeNull();
    expect(saved && saved.building && saved.building.furniture).toHaveLength(1);
    expect(saved && saved.building && saved.building.furniture[0].itemId).toBe('rustic_chair');
  });

  it('loading a character restores placed furniture', () => {
    const sim = makeSim();
    buyPlotAndBuildTent(sim);
    enterHouse(sim);
    const origin = houseOrigin(0);
    sim.placeFurniture('rustic_chair', origin.x, origin.z, 0);
    sim.tick();
    const saved = sim.serializeCharacter(sim.playerId) as CharacterState;
    const sim2 = makeSim(43);
    const pid2 = sim2.addPlayer('warrior', 'Loader', { state: saved });
    const meta2 = sim2.players.get(pid2);
    expect(meta2?.construction.furniture).toHaveLength(1);
    expect(meta2?.construction.furniture[0].itemId).toBe('rustic_chair');
  });

  it('placeFurniture can place multiple different furniture types', () => {
    const sim = makeSim();
    buyPlotAndBuildTent(sim);
    enterHouse(sim);
    sim.addItem('rustic_table', 1);
    const origin = houseOrigin(0);
    sim.placeFurniture('rustic_chair', origin.x, origin.z, 0);
    sim.tick();
    sim.placeFurniture('rustic_table', origin.x + 2, origin.z + 2, 0);
    sim.tick();
    expect(sim.placedFurniture.length).toBe(2);
    const itemIds = sim.placedFurniture.map((f: PlacedFurniture) => f.itemId).sort();
    expect(itemIds).toEqual(['rustic_chair', 'rustic_table']);
  });
});
