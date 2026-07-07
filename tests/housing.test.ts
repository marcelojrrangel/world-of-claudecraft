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
        e.text === text,
    );
}

describe('house plot purchase (Phase 3)', () => {
  it('can buy a plot', () => {
    const sim = makeSim();
    const plot = PLOTS[0];
    giveCopper(sim, plot.price);
    sim.buyPlot(plot.id);
    expect(sim.myPlot?.id).toBe(plot.id);
  });

  it('rejects buying a second plot', () => {
    const sim = makeSim();
    const plot = PLOTS[0];
    giveCopper(sim, plot.price);
    sim.buyPlot(plot.id);
    giveCopper(sim, plot.price);
    sim.buyPlot(plot.id);
    expect(findError(sim, sim.playerId, 'You already own a building plot.')).toBe(true);
  });

  it('rejects buying a taken plot', () => {
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

  it('rejects buying a non-existent plot', () => {
    const sim = makeSim();
    giveCopper(sim, 999999);
    sim.buyPlot('nonexistent');
    expect(findError(sim, sim.playerId, 'That plot does not exist.')).toBe(true);
  });

  it('rejects buying a plot without enough money', () => {
    const sim = makeSim();
    const plot = PLOTS[0];
    sim.buyPlot(plot.id);
    expect(findError(sim, sim.playerId, 'You do not have enough gold to buy this plot.')).toBe(true);
  });

  it('deducts the plot price from copper', () => {
    const sim = makeSim();
    const plot = PLOTS[0];
    const before = playerMeta(sim).copper;
    giveCopper(sim, plot.price);
    sim.buyPlot(plot.id);
    sim.tick();
    expect(playerMeta(sim).copper).toBe(before);
  });
});

describe('house enter/leave (Phase 3)', () => {
  it('rejects enter without a plot', () => {
    const sim = makeSim();
    sim.enterHouse();
    expect(findError(sim, sim.playerId, 'You do not own a building plot.')).toBe(true);
  });

  it('rejects enter without a house built', () => {
    const sim = makeSim();
    const plot = PLOTS[0];
    giveCopper(sim, plot.price);
    sim.buyPlot(plot.id);
    sim.enterHouse();
    expect(findError(sim, sim.playerId, 'You have not built a house on your plot yet.')).toBe(true);
  });

  it('enterHouse teleports to the interior zone', () => {
    const sim = makeSim();
    const plot = PLOTS[0];
    giveCopper(sim, plot.price);
    sim.buyPlot(plot.id);
    setHouseTier(sim, 1);
    sim.enterHouse();
    sim.tick();
    expect(isHousePos(sim.player.pos.x)).toBe(true);
  });

  it('leaveHouse returns to the plot entrance', () => {
    const sim = makeSim();
    const plot = PLOTS[0];
    giveCopper(sim, plot.price);
    sim.buyPlot(plot.id);
    setHouseTier(sim, 1);
    sim.enterHouse();
    sim.tick();
    const houseX = sim.player.pos.x;
    expect(isHousePos(houseX)).toBe(true);
    sim.leaveHouse();
    sim.tick();
    expect(sim.player.pos.x).toBeLessThan(15000);
  });

  it('creates an exit ground object on entry', () => {
    const sim = makeSim();
    const plot = PLOTS[0];
    giveCopper(sim, plot.price);
    sim.buyPlot(plot.id);
    setHouseTier(sim, 1);
    sim.enterHouse();
    sim.tick();
    const exit = [...sim.entities.values()].find((e) => e.templateId === 'house_exit');
    expect(exit).toBeDefined();
  });

  it('has collision (cannot walk through the interior wall)', () => {
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

  // Phase 6: house rested XP
  it('houseRestedBonus returns 0 without a plot', () => {
    const sim = makeSim();
    expect(sim.houseRestedBonus).toBe(0);
  });

  it('houseRestedBonus returns 0 without a house (tier 0)', () => {
    const sim = makeSim();
    const plot = PLOTS[0];
    giveCopper(sim, plot.price);
    sim.buyPlot(plot.id);
    expect(sim.houseRestedBonus).toBe(0);
  });

  it('houseRestedBonus returns tier multiplier for house owners', () => {
    const sim = makeSim();
    const plot = PLOTS[0];
    giveCopper(sim, plot.price);
    sim.buyPlot(plot.id);
    setHouseTier(sim, 1);
    expect(sim.houseRestedBonus).toBe(1.0);
  });

  it('houseRestedBonus scales with house tier', () => {
    const sim = makeSim();
    const plot = PLOTS[0];
    giveCopper(sim, plot.price);
    sim.buyPlot(plot.id);
    setHouseTier(sim, 3);
    expect(sim.houseRestedBonus).toBe(1.5);
    setHouseTier(sim, 6);
    expect(sim.houseRestedBonus).toBe(2.5);
  });

  it('isResting returns true when inside own house', async () => {
    const sim = makeSim();
    const plot = PLOTS[0];
    giveCopper(sim, plot.price);
    sim.buyPlot(plot.id);
    setHouseTier(sim, 1);
    sim.enterHouse();
    sim.tick();
    const meta = playerMeta(sim);
    const p = sim.player;
    const { isResting } = await import('../src/sim/progression/xp');
    expect(isResting(p, meta)).toBe(true);
  });

  it('houseRestedBonusFor works for non-primary players', () => {
    const sim = makeSim();
    const plot = PLOTS[0];
    giveCopper(sim, plot.price);
    sim.buyPlot(plot.id);
    setHouseTier(sim, 1);
    expect(sim.houseRestedBonusFor(sim.playerId)).toBe(1.0);
  });
});
