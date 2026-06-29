import { describe, expect, it } from 'vitest';
import { Sim } from '../src/sim/sim';
import type { Entity, SimEvent } from '../src/sim/types';
import {
  isWorldBossLootEligible,
  markWorldBossLooted,
  refreshWorldBossDaily,
  WORLD_BOSS_INTERVAL_SECONDS,
  WORLD_BOSSES,
} from '../src/sim/world_boss';

const BOSS_ID = 'thunzharr_waking_peak';
const DAY = '2026-06-28';

// Minimal PlayerMeta stand-in for the pure daily-gate helpers (they touch only
// .worldBossDaily). Cast through unknown to satisfy the full PlayerMeta type.
function fakeMeta() {
  return { worldBossDaily: { date: '', looted: new Set<string>() } } as unknown as Parameters<
    typeof isWorldBossLootEligible
  >[0];
}

function makeSim(seed = 7) {
  return new Sim({ seed, playerClass: 'warrior', autoEquip: true, noPlayer: true });
}

function findBoss(sim: Sim): Entity | undefined {
  return [...(sim as any).entities.values()].find(
    (e: Entity) => e.templateId === BOSS_ID && !e.dead,
  );
}

// Force the world-boss scheduler to fire on the next tick instead of waiting the
// full 3h interval, then tick once to spawn it. Returns the spawn-tick events.
function spawnBossNow(sim: Sim): { boss: Entity; events: SimEvent[] } {
  (sim as any).worldBossNextAt[0] = (sim as any).time;
  const events = sim.tick();
  const boss = findBoss(sim);
  if (!boss) throw new Error('world boss did not spawn');
  return { boss, events };
}

describe('world boss daily-loot gate (pure helpers)', () => {
  it('is eligible until looted, then blocked for the same day', () => {
    const meta = fakeMeta();
    expect(isWorldBossLootEligible(meta, BOSS_ID, DAY)).toBe(true);
    markWorldBossLooted(meta, BOSS_ID, DAY);
    expect(isWorldBossLootEligible(meta, BOSS_ID, DAY)).toBe(false);
  });

  it('resets at the UTC day boundary', () => {
    const meta = fakeMeta();
    markWorldBossLooted(meta, BOSS_ID, DAY);
    expect(isWorldBossLootEligible(meta, BOSS_ID, DAY)).toBe(false);
    refreshWorldBossDaily(meta, '2026-06-29');
    expect(isWorldBossLootEligible(meta, BOSS_ID, '2026-06-29')).toBe(true);
  });

  it('never gates when the calendar day is unknown (headless/replay)', () => {
    const meta = fakeMeta();
    markWorldBossLooted(meta, BOSS_ID, '');
    expect(isWorldBossLootEligible(meta, BOSS_ID, '')).toBe(true);
  });
});

describe('world boss scheduler', () => {
  it('spawns on the interval and announces server-wide', () => {
    const sim = makeSim();
    expect(findBoss(sim)).toBeUndefined();
    const { boss, events } = spawnBossNow(sim);
    expect(boss.level).toBe(20);
    const announce = events.find(
      (e) => e.type === 'log' && /rises over Thornpeak Heights!$/.test((e as any).text),
    );
    expect(announce).toBeDefined();
    // Server-wide => no pid (personal) and no entityId (proximity) anchor.
    expect((announce as any).pid).toBeUndefined();
    expect((announce as any).entityId).toBeUndefined();
  });

  it('does not spawn a second boss while one is alive', () => {
    const sim = makeSim();
    spawnBossNow(sim);
    // Due again immediately, but the live boss blocks a duplicate spawn.
    (sim as any).worldBossNextAt[0] = (sim as any).time;
    sim.tick();
    const bosses = [...(sim as any).entities.values()].filter(
      (e: Entity) => e.templateId === BOSS_ID,
    );
    expect(bosses).toHaveLength(1);
  });

  it('schedules the next spawn one interval out', () => {
    const sim = makeSim();
    const before = (sim as any).worldBossNextAt[0] as number;
    expect(before).toBe(WORLD_BOSSES[0].intervalSeconds);
    (sim as any).worldBossNextAt[0] = (sim as any).time;
    sim.tick();
    expect((sim as any).worldBossNextAt[0]).toBeCloseTo(
      (sim as any).time + WORLD_BOSS_INTERVAL_SECONDS - 1 / 20,
      4,
    );
  });
});

describe('world boss personal loot', () => {
  function killWith(sim: Sim, boss: Entity, pids: number[]) {
    // Register each contributor's threat with a chip, then have the first land the
    // killing blow.
    for (const pid of pids) {
      const e = (sim as any).entities.get(pid) as Entity;
      (sim as any).dealDamage(e, boss, 10, false, 'physical', 'Chip', 'hit', true);
    }
    const killer = (sim as any).entities.get(pids[0]) as Entity;
    (sim as any).dealDamage(killer, boss, 999_999, false, 'physical', 'Finisher', 'hit', true);
    expect(boss.dead).toBe(true);
  }

  it('drops an independent personal slot for every contributor', () => {
    const sim = makeSim();
    sim.utcDay = DAY;
    const p1 = sim.addPlayer('warrior', 'Ada');
    const p2 = sim.addPlayer('mage', 'Bru');
    const { boss } = spawnBossNow(sim);
    killWith(sim, boss, [p1, p2]);

    const items = boss.loot?.items ?? [];
    // The guaranteed Inert Storm Shard (chance 1) must land for both contributors,
    // each as a self-only personal slot.
    const shardOwners = items
      .filter((s) => s.itemId === 'inert_storm_shard')
      .flatMap((s) => s.personalFor ?? []);
    expect(shardOwners).toContain(p1);
    expect(shardOwners).toContain(p2);
    // Every world-boss slot is personal (never a shared/open slot).
    for (const slot of items) {
      expect(slot.personalFor && slot.personalFor.length === 1).toBe(true);
      expect(slot.openToAll).toBeFalsy();
    }
    // Both contributors are now locked out for the day.
    expect((sim as any).players.get(p1).worldBossDaily.looted.has(BOSS_ID)).toBe(true);
    expect((sim as any).players.get(p2).worldBossDaily.looted.has(BOSS_ID)).toBe(true);
  });

  it('gives a contributor no loot from a second boss the same day', () => {
    const sim = makeSim();
    sim.utcDay = DAY;
    const p1 = sim.addPlayer('warrior', 'Ada');
    const first = spawnBossNow(sim);
    killWith(sim, first.boss, [p1]);
    expect((first.boss.loot?.items ?? []).length).toBeGreaterThan(0);

    // Remove the first corpse, then spawn + kill a second boss the same UTC day.
    (sim as any).worldBossEntityIds[0] = null;
    const second = spawnBossNow(sim);
    killWith(sim, second.boss, [p1]);
    const ownedBySecond = (second.boss.loot?.items ?? []).flatMap((s) => s.personalFor ?? []);
    expect(ownedBySecond).not.toContain(p1);
  });

  it('produces identical personal loot for the same seed (determinism)', () => {
    const run = () => {
      const sim = makeSim(99);
      sim.utcDay = DAY;
      const p1 = sim.addPlayer('warrior', 'Ada');
      const p2 = sim.addPlayer('rogue', 'Bru');
      const { boss } = spawnBossNow(sim);
      killWith(sim, boss, [p1, p2]);
      return JSON.stringify(boss.loot?.items ?? []);
    };
    expect(run()).toBe(run());
  });
});
