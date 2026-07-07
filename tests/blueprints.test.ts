import { describe, expect, it } from 'vitest';
import { PLOTS } from '../src/sim/content/housing_plots';
import { Sim } from '../src/sim/sim';

const makeSim = (seed = 42) => new Sim({ seed, playerClass: 'warrior', autoEquip: true });

function addMaterials(sim: Sim, itemId: string, count: number): void {
  sim.addItem(itemId, count);
}

function giveT1Kit(sim: Sim): void {
  addMaterials(sim, 'rough_stone', 20);
  addMaterials(sim, 'raw_lumber', 20);
  addMaterials(sim, 'sawed_plank', 10);
  addMaterials(sim, 'canvas_scrap', 10);
  addMaterials(sim, 'bedroll', 1);
  addMaterials(sim, 'candle', 1);
  sim.addItem('trowel_t1', 1);
}

function giveT2Kit(sim: Sim): void {
  addMaterials(sim, 'rough_stone', 30);
  addMaterials(sim, 'clay_lump', 20);
  addMaterials(sim, 'raw_lumber', 30);
  addMaterials(sim, 'sawed_plank', 40);
  addMaterials(sim, 'iron_nail', 50);
  addMaterials(sim, 'clay_tile', 30);
  addMaterials(sim, 'door_wooden', 1);
  addMaterials(sim, 'window_shutter', 1);
  sim.addItem('carpenter_hammer_t2', 1);
}

describe('blueprint construction', () => {
  it('learnBlueprint adds the blueprint id to knownBlueprints', () => {
    const sim = makeSim();
    sim.addItem('blueprint_tent', 1);
    sim.useItem('blueprint_tent');
    expect(sim.knownBlueprints).toContain('blueprint_tent');
  });

  it('learning a blueprint consumes the scroll', () => {
    const sim = makeSim();
    sim.addItem('blueprint_tent', 1);
    sim.useItem('blueprint_tent');
    expect(sim.inventory.find((s) => s.itemId === 'blueprint_tent')).toBeUndefined();
  });

  it('learnBlueprint errors if already known', () => {
    const sim = makeSim();
    sim.addItem('blueprint_tent', 2);
    sim.useItem('blueprint_tent');
    const ev = sim.useItem('blueprint_tent');
    expect(ev).toBeUndefined();
    expect(sim.knownBlueprints.filter((id) => id === 'blueprint_tent').length).toBe(1);
  });

  it('buildBlueprint errors without a plot', () => {
    const sim = makeSim();
    sim.addItem('blueprint_tent', 1);
    sim.useItem('blueprint_tent');
    sim.buildBlueprint('blueprint_tent');
    const err = sim.tick().find((e) => e.type === 'error');
    expect(err).toBeDefined();
    expect((err as any).text).toBe('You do not own a building plot.');
  });

  it('buildBlueprint errors if blueprint not learned', () => {
    const sim = makeSim();
    const plot = PLOTS[0];
    sim.addPlayer('warrior', 'Builder');
    const pid = (sim as any).primaryId;
    (sim as any).players.get(pid).copper = 1_000_000;
    sim.buyPlot(plot.id);
    sim.buildBlueprint('blueprint_tent');
    const err = sim.tick().find((e) => e.type === 'error');
    expect(err).toBeDefined();
    expect((err as any).text).toBe('You have not learned the blueprint for this tier.');
  });

  it('builds the first tier tent after buying a plot and learning', () => {
    const sim = makeSim();
    const plot = PLOTS[0];
    const pid = (sim as any).primaryId;
    (sim as any).players.get(pid).copper = 1_000_000;
    sim.addItem('blueprint_tent', 1);
    sim.useItem('blueprint_tent');
    giveT1Kit(sim);
    sim.buyPlot(plot.id);
    sim.buildBlueprint('blueprint_tent');
    sim.tick();
    expect(sim.houseState.houseTier).toBe(1);
    expect(sim.currentHouseProgress?.currentPhase).toBe(1);
  });

  it('consumes materials and grants skill on phase build', () => {
    const sim = makeSim();
    const plot = PLOTS[0];
    const pid = (sim as any).primaryId;
    (sim as any).players.get(pid).copper = 1_000_000;
    sim.addItem('blueprint_tent', 1);
    sim.useItem('blueprint_tent');
    giveT1Kit(sim);
    sim.buyPlot(plot.id);
    const beforeSkill = sim.constructionSkill.skill;
    sim.buildBlueprint('blueprint_tent');
    sim.tick();
    expect(sim.constructionSkill.skill).toBeGreaterThan(beforeSkill);
    expect(sim.countItem('rough_stone')).toBeLessThan(20);
  });

  it('trivial-at threshold stops skill gain', () => {
    const sim = makeSim();
    const plot = PLOTS[0];
    const pid = (sim as any).primaryId;
    (sim as any).players.get(pid).copper = 1_000_000;
    (sim as any).players.get(pid).construction.skill = 30;
    sim.addItem('blueprint_tent', 1);
    sim.useItem('blueprint_tent');
    giveT1Kit(sim);
    sim.buyPlot(plot.id);
    sim.buildBlueprint('blueprint_tent');
    sim.tick();
    expect(sim.constructionSkill.skill).toBe(30);
  });

  it('builds all 5 phases of the tent', () => {
    const sim = makeSim();
    const plot = PLOTS[0];
    const pid = (sim as any).primaryId;
    (sim as any).players.get(pid).copper = 1_000_000;
    sim.addItem('blueprint_tent', 1);
    sim.useItem('blueprint_tent');
    giveT1Kit(sim);
    addMaterials(sim, 'rough_stone', 100);
    addMaterials(sim, 'raw_lumber', 100);
    addMaterials(sim, 'sawed_plank', 100);
    addMaterials(sim, 'canvas_scrap', 100);
    addMaterials(sim, 'bedroll', 10);
    addMaterials(sim, 'candle', 10);
    sim.buyPlot(plot.id);
    for (let i = 0; i < 5; i++) {
      sim.buildBlueprint('blueprint_tent');
      sim.tick();
    }
    expect(sim.currentHouseProgress?.currentPhase).toBe(5);
    expect(sim.houseState.houseTier).toBe(1);
  });

  it('tool tier gating rejects low-tier tool', () => {
    const sim = makeSim();
    const plot = PLOTS[0];
    const pid = (sim as any).primaryId;
    (sim as any).players.get(pid).copper = 1_000_000;
    // Complete tier 1.
    sim.addItem('blueprint_tent', 1);
    sim.useItem('blueprint_tent');
    giveT1Kit(sim);
    addMaterials(sim, 'rough_stone', 100);
    addMaterials(sim, 'raw_lumber', 100);
    addMaterials(sim, 'sawed_plank', 100);
    addMaterials(sim, 'canvas_scrap', 100);
    addMaterials(sim, 'bedroll', 10);
    addMaterials(sim, 'candle', 10);
    sim.buyPlot(plot.id);
    for (let i = 0; i < 5; i++) {
      sim.buildBlueprint('blueprint_tent');
      sim.tick();
    }
    // Complete tier 2 using only the tier 1 tool (tier 2 phases require tool tier 1).
    (sim as any).players.get(pid).construction.skill = 25;
    sim.addItem('blueprint_wooden_shack', 1);
    sim.useItem('blueprint_wooden_shack');
    sim.addItem('trowel_t1', 1);
    addMaterials(sim, 'rough_stone', 100);
    addMaterials(sim, 'clay_lump', 100);
    addMaterials(sim, 'raw_lumber', 100);
    addMaterials(sim, 'sawed_plank', 100);
    addMaterials(sim, 'iron_nail', 200);
    addMaterials(sim, 'clay_tile', 100);
    addMaterials(sim, 'door_wooden', 10);
    addMaterials(sim, 'window_shutter', 10);
    for (let i = 0; i < 5; i++) {
      sim.buildBlueprint('blueprint_wooden_shack');
      sim.tick();
    }
    // Now attempt tier 3 with only the tier 1 tool. Tier 3 requires skill 75 and tool tier 2.
    (sim as any).players.get(pid).construction.skill = 75;
    sim.addItem('blueprint_timber_cottage', 1);
    sim.useItem('blueprint_timber_cottage');
    sim.addItem('trowel_t1', 1);
    addMaterials(sim, 'cut_stone', 100);
    addMaterials(sim, 'limestone_mortar', 100);
    addMaterials(sim, 'sawed_plank', 100);
    addMaterials(sim, 'iron_nail', 100);
    addMaterials(sim, 'iron_hinge', 100);
    addMaterials(sim, 'clay_tile', 100);
    addMaterials(sim, 'glass_pane', 10);
    addMaterials(sim, 'door_sturdy', 1);
    sim.buildBlueprint('blueprint_timber_cottage');
    const err = sim.tick().find((e) => e.type === 'error');
    expect(err).toBeDefined();
    expect((err as any).text).toBe('Your construction tool is not high enough tier for this phase.');
  });

  it('missing materials error does not consume or progress', () => {
    const sim = makeSim();
    const plot = PLOTS[0];
    const pid = (sim as any).primaryId;
    (sim as any).players.get(pid).copper = 1_000_000;
    sim.addItem('blueprint_tent', 1);
    sim.useItem('blueprint_tent');
    sim.addItem('trowel_t1', 1);
    sim.buyPlot(plot.id);
    sim.buildBlueprint('blueprint_tent');
    const err = sim.tick().find((e) => e.type === 'error');
    expect(err).toBeDefined();
    expect((err as any).text).toBe('You do not have the required materials.');
    expect(sim.currentHouseProgress).toBeNull();
  });

  it('progression advances house tier after completing lower tier', () => {
    const sim = makeSim();
    const plot = PLOTS[0];
    const pid = (sim as any).primaryId;
    (sim as any).players.get(pid).copper = 1_000_000;
    sim.addItem('blueprint_tent', 1);
    sim.useItem('blueprint_tent');
    giveT1Kit(sim);
    addMaterials(sim, 'rough_stone', 100);
    addMaterials(sim, 'raw_lumber', 100);
    addMaterials(sim, 'sawed_plank', 100);
    addMaterials(sim, 'canvas_scrap', 100);
    addMaterials(sim, 'bedroll', 10);
    addMaterials(sim, 'candle', 10);
    sim.buyPlot(plot.id);
    for (let i = 0; i < 5; i++) {
      sim.buildBlueprint('blueprint_tent');
      sim.tick();
    }
    (sim as any).players.get(pid).construction.skill = 25;
    sim.addItem('blueprint_wooden_shack', 1);
    sim.useItem('blueprint_wooden_shack');
    giveT2Kit(sim);
    addMaterials(sim, 'rough_stone', 100);
    addMaterials(sim, 'clay_lump', 100);
    addMaterials(sim, 'raw_lumber', 100);
    addMaterials(sim, 'sawed_plank', 100);
    addMaterials(sim, 'iron_nail', 200);
    addMaterials(sim, 'clay_tile', 100);
    addMaterials(sim, 'door_wooden', 10);
    addMaterials(sim, 'window_shutter', 10);
    sim.buildBlueprint('blueprint_wooden_shack');
    sim.tick();
    expect(sim.houseState.houseTier).toBe(2);
  });
});
