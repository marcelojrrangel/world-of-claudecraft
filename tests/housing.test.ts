import { describe, expect, it } from 'vitest';
import { PLOTS } from '../src/sim/content/housing_plots';
import { Sim } from '../src/sim/sim';
import { houseOrigin, isHousePos } from '../src/sim/professions/construction';
import type { PlayerMeta } from '../src/sim/sim';
import type { SimEvent } from '../src/sim/types';

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

function findError(sim: Sim, pid: number, text: string): boolean {
  return sim
    .tick()
    .some(
      (e: SimEvent) =>
        (e.type === 'error' || e.type === 'log') &&
        'text' in e &&
        e.text === text &&
        e.pid === pid,
    );
}

describe('housing system (Phase 3)', () => {
  it('buyPlot rejects when the player already owns a plot', () => {
    const sim = makeSim();
    const plot = PLOTS[0];
    giveCopper(sim, plot.price);
    sim.buyPlot(plot.id);
    expect(playerMeta(sim).construction.plotId).toBe(plot.id);
    sim.buyPlot(PLOTS[1].id);
    expect(findError(sim, sim.playerId, 'You already own a building plot.')).toBe(true);
  });

  it('buyPlot rejects when the plot is already taken by another player', () => {
    const sim = makeSim(1);
    const pid2 = sim.addPlayer('mage', 'BuyerTwo');
    const plot = PLOTS[0];
    giveCopper(sim, plot.price * 2);
    sim.buyPlot(plot.id);
    (sim as any).primaryId = pid2;
    sim.buyPlot(plot.id);
    (sim as any).primaryId = sim.playerId;
    expect(findError(sim, pid2, 'This plot is already taken.')).toBe(true);
  });

  it('buyPlot rejects insufficient funds', () => {
    const sim = makeSim();
    const plot = PLOTS[0];
    playerMeta(sim).copper = plot.price - 1;
    sim.buyPlot(plot.id);
    expect(findError(sim, sim.playerId, 'You do not have enough gold to buy this plot.')).toBe(
      true,
    );
  });

  it('buyPlot deducts gold and records ownership', () => {
    const sim = makeSim();
    const plot = PLOTS[0];
    giveCopper(sim, plot.price);
    const before = playerMeta(sim).copper;
    sim.buyPlot(plot.id);
    expect(playerMeta(sim).copper).toBe(before - plot.price);
    expect(playerMeta(sim).construction.plotId).toBe(plot.id);
    expect(sim.plotRegistry).toContainEqual({ plotId: plot.id, ownerPid: sim.playerId });
    expect(sim.myPlot?.id).toBe(plot.id);
  });

  it('enterHouse rejects without a plot', () => {
    const sim = makeSim();
    setHouseTier(sim, 1);
    sim.enterHouse();
    expect(findError(sim, sim.playerId, 'You do not own a building plot.')).toBe(true);
  });

  it('enterHouse rejects before a house is built', () => {
    const sim = makeSim();
    const plot = PLOTS[0];
    giveCopper(sim, plot.price);
    sim.buyPlot(plot.id);
    sim.enterHouse();
    expect(findError(sim, sim.playerId, 'You have not built a house on your plot yet.')).toBe(true);
  });

  it('enterHouse teleports the player to their house instance', () => {
    const sim = makeSim();
    const plot = PLOTS[0];
    giveCopper(sim, plot.price);
    sim.buyPlot(plot.id);
    setHouseTier(sim, 1);
    sim.enterHouse();
    expect(isHousePos(sim.player.pos.x)).toBe(true);
    const slot = sim.houseInstances.find((h) => h.partyKey === `house:${sim.playerId}`);
    expect(slot).toBeTruthy();
    const origin = houseOrigin(slot!.slot);
    expect(sim.player.pos.x).toBe(origin.x);
  });

  it('leaveHouse returns the player to their plot entrance', () => {
    const sim = makeSim();
    const plot = PLOTS[0];
    giveCopper(sim, plot.price);
    sim.buyPlot(plot.id);
    setHouseTier(sim, 1);
    sim.enterHouse();
    const slot = sim.houseInstances.find((h) => h.partyKey === `house:${sim.playerId}`);
    expect(slot).toBeTruthy();
    sim.leaveHouse();
    expect(sim.player.pos.x).toBe(plot.x + 4);
    expect(sim.player.pos.z).toBe(plot.z + 4);
    expect(slot!.partyKey).toBeNull();
  });

  it('house instance slot can be re-entered after leaving', () => {
    const sim = makeSim();
    const plot = PLOTS[0];
    giveCopper(sim, plot.price);
    sim.buyPlot(plot.id);
    setHouseTier(sim, 1);
    sim.enterHouse();
    const firstSlot = sim.houseInstances.find((h) => h.partyKey === `house:${sim.playerId}`)?.slot;
    expect(firstSlot).toBeGreaterThanOrEqual(0);
    sim.leaveHouse();
    sim.enterHouse();
    const secondSlot = sim.houseInstances.find((h) => h.partyKey === `house:${sim.playerId}`)?.slot;
    expect(secondSlot).toBe(firstSlot);
  });

  it('character serialization persists construction house state', () => {
    const sim = makeSim();
    const plot = PLOTS[0];
    giveCopper(sim, plot.price);
    sim.buyPlot(plot.id);
    setHouseTier(sim, 2);
    const saved = sim.serializeCharacter(sim.playerId);
    expect(saved).not.toBeNull();
    expect(saved!.building?.plotId).toBe(plot.id);
    expect(saved!.building?.houseTier).toBe(2);
  });

  it('loading a character restores plot and house tier', () => {
    const sim = makeSim();
    const plot = PLOTS[0];
    giveCopper(sim, plot.price);
    sim.buyPlot(plot.id);
    setHouseTier(sim, 3);
    const saved = sim.serializeCharacter(sim.playerId);
    expect(saved).not.toBeNull();
    const sim2 = makeSim(43);
    const pid2 = sim2.addPlayer('warrior', 'Loader', { state: saved! });
    sim2.loadPlotRegistry([...sim.plotRegistry]);
    const meta2 = sim2.players.get(pid2);
    expect(meta2?.construction.plotId).toBe(plot.id);
    expect(meta2?.construction.houseTier).toBe(3);
  });

  it('house interior colliders prevent walking through walls', () => {
    const sim = makeSim();
    const plot = PLOTS[0];
    giveCopper(sim, plot.price);
    sim.buyPlot(plot.id);
    setHouseTier(sim, 1);
    sim.enterHouse();
    const start = { ...sim.player.pos };
    sim.moveInput.forward = true;
    for (let i = 0; i < 20 * 2; i++) sim.tick();
    sim.moveInput.forward = false;
    expect(sim.player.pos.z).toBeLessThan(start.z + 8);
  });
});
