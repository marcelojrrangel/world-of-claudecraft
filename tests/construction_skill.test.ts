import { describe, expect, it } from 'vitest';
import { PLOTS } from '../src/sim/content/housing_plots';
import { Sim } from '../src/sim/sim';
import type { PlayerMeta } from '../src/sim/sim';
import {
  constructionSkillFor,
  drainConstructionGrants,
  queueConstructionGrant,
  canBuildBlueprint,
  normalizeConstructionSystem,
} from '../src/sim/professions/construction';

function makeSim(seed = 42) {
  return new Sim({ seed, playerClass: 'warrior', autoEquip: true });
}

function playerMeta(sim: Sim): PlayerMeta {
  return (sim as any).players.get(sim.playerId);
}

function giveCopper(sim: Sim, amount: number) {
  playerMeta(sim).copper += amount;
}

describe('construction skill (Phase 4)', () => {
  it('starts at skill 0', () => {
    const sim = makeSim();
    const meta = playerMeta(sim);
    const { skill } = constructionSkillFor(meta);
    expect(skill).toBe(0);
    expect(skill).toBe(meta.construction.skill);
  });

  it('queue + drain grants skill', () => {
    const meta = playerMeta(makeSim());
    expect(meta.construction.skill).toBe(0);
    queueConstructionGrant(meta, 5);
    drainConstructionGrants(meta);
    expect(meta.construction.skill).toBe(5);
  });

  it('accumulates multiple grants before drain', () => {
    const meta = playerMeta(makeSim());
    queueConstructionGrant(meta, 3);
    queueConstructionGrant(meta, 7);
    drainConstructionGrants(meta);
    expect(meta.construction.skill).toBe(10);
  });

  it('skill caps at 300', () => {
    const meta = playerMeta(makeSim());
    meta.construction.skill = 299;
    queueConstructionGrant(meta, 10);
    drainConstructionGrants(meta);
    expect(meta.construction.skill).toBe(300);
  });

  it('zero grants does nothing', () => {
    const meta = playerMeta(makeSim());
    meta.construction.skill = 50;
    drainConstructionGrants(meta);
    expect(meta.construction.skill).toBe(50);
  });

  it('constructionSkillFor returns correct maxSkill', () => {
    const meta = playerMeta(makeSim());
    meta.construction.skill = 150;
    const info = constructionSkillFor(meta);
    expect(info.skill).toBe(150);
    expect(info.maxSkill).toBe(300);
  });

  it('normalizeConstructionSystem clamps skill to valid range', () => {
    const a = normalizeConstructionSystem({ skill: -5 });
    expect(a.skill).toBe(0);
    const b = normalizeConstructionSystem({ skill: 500 });
    expect(b.skill).toBe(300);
    const c = normalizeConstructionSystem({ skill: 150 });
    expect(c.skill).toBe(150);
  });

  it('canBuildBlueprint preconditions with a real Sim', () => {
    const sim = makeSim(555);
    const ctx = (sim as any).ctx;
    const pid = sim.playerId;
    const plot = PLOTS[0];
    giveCopper(sim, plot.price * 10);
    sim.buyPlot(plot.id);
    sim.tick();
    const meta = playerMeta(sim);
    meta.construction.houseTier = 1;
    meta.construction.knownBlueprints = ['blueprint_tent'];
    sim.addItem('rough_stone', 10);
    sim.addItem('raw_lumber', 10);
    sim.addItem('trowel_t1', 1); // tier 1 construction tool
    const check = canBuildBlueprint(ctx, pid, 'blueprint_tent');
    expect(check.ok).toBe(true);
  });

  it('buildBlueprint via sim facade grants skill', () => {
    const sim = makeSim(556);
    const pid = sim.playerId;
    const plot = PLOTS[0];
    giveCopper(sim, plot.price * 10);
    sim.buyPlot(plot.id);
    sim.tick();
    const meta = playerMeta(sim);
    meta.construction.houseTier = 1;
    meta.construction.knownBlueprints = ['blueprint_tent'];
    sim.addItem('rough_stone', 10);
    sim.addItem('raw_lumber', 10);
    sim.addItem('trowel_t1', 1);
    const before = meta.construction.skill;
    sim.buildBlueprint('blueprint_tent');
    sim.tick();
    expect(meta.construction.skill).toBeGreaterThan(before);
  });
});
