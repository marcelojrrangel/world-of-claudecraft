import { describe, it, expect } from 'vitest';
import { Sim } from '../src/sim/sim';
import type { SimEvent } from '../src/sim/types';
import { visitHouse as visitHouseImpl, setHousePermission as setPermImpl } from '../src/sim/professions/construction/housing';

function errorText(ev: SimEvent[]): string[] {
  return ev.filter((e): e is SimEvent & { text: string } => e.type === 'error' && 'text' in e).map((e) => e.text);
}

function entity(sim: Sim, pid: number) {
  const s = sim as any;
  const m = s.players.get(pid);
  return m ? s.entities.get(m.entityId) : null;
}

describe('visitHouse (Phase 6)', () => {
  it('rejects visiting a nonexistent player', () => {
    const sim = new Sim({ seed: 42, playerClass: 'warrior', autoEquip: true, noPlayer: true });
    const pid1 = sim.addPlayer('warrior', 'A');
    const s = sim as any;
    visitHouseImpl(s.buildSimContext(), pid1, 999);
    const ev = sim.drainEvents();
    expect(errorText(ev)).toContain('That player does not exist.');
  });

  it('rejects visiting a player without a house', () => {
    const sim = new Sim({ seed: 42, playerClass: 'warrior', autoEquip: true, noPlayer: true });
    const pidA = sim.addPlayer('warrior', 'A');
    const pidB = sim.addPlayer('warrior', 'B');
    const s = sim as any;

    // A has a house, B does not
    const mA = s.players.get(pidA);
    mA.construction.plotId = 'plot_a';
    mA.construction.houseTier = 1;
    mA.construction.permission = 'public';

    // B tries to visit A - should fail because A has no house (B is the target, A is the visitor)
    // No wait: B is the visitor, A is the target with a house
    // visitHouseImpl(ctx, visitorPid, targetPid)
    visitHouseImpl(s.buildSimContext(), pidB, pidA);
    const ev = sim.drainEvents();
    expect(errorText(ev)).toEqual([]);
    // It should succeed since pidA has a house with public permission

    // Now test: visitor visits a player with no house
    // pidB has no house, so pidA visiting pidB should fail
    visitHouseImpl(s.buildSimContext(), pidA, pidB);
    const ev2 = sim.drainEvents();
    expect(errorText(ev2)).toContain('That player does not have a house.');
  });

  it('works with public permission', () => {
    const sim = new Sim({ seed: 42, playerClass: 'warrior', autoEquip: true, noPlayer: true });
    const pidOwner = sim.addPlayer('warrior', 'Owner');
    const pidVisitor = sim.addPlayer('warrior', 'Visitor');
    const s = sim as any;

    const mOwner = s.players.get(pidOwner);
    mOwner.construction.plotId = 'plot_owner';
    mOwner.construction.houseTier = 1;
    mOwner.construction.permission = 'public';

    const eVisitor = entity(sim, pidVisitor);
    if (eVisitor) { eVisitor.pos.x = 100; eVisitor.pos.z = 100; }

    visitHouseImpl(s.buildSimContext(), pidVisitor, pidOwner);
    const ev = sim.drainEvents();
    expect(errorText(ev)).toEqual([]);
    expect(ev.some((e) => e.type === 'log' && 'text' in e && e.text === 'You visit the house.')).toBe(true);
    // Visitor should be teleported into the house zone
    if (eVisitor) {
      expect(eVisitor.pos.x).toBeGreaterThanOrEqual(15000);
    }
  });

  it('respects owner-only permission', () => {
    const sim = new Sim({ seed: 42, playerClass: 'warrior', autoEquip: true, noPlayer: true });
    const pidOwner = sim.addPlayer('warrior', 'Owner');
    const pidVisitor = sim.addPlayer('warrior', 'Visitor');
    const s = sim as any;

    const mOwner = s.players.get(pidOwner);
    mOwner.construction.plotId = 'plot_owner';
    mOwner.construction.houseTier = 1;
    mOwner.construction.permission = 'owner';

    visitHouseImpl(s.buildSimContext(), pidVisitor, pidOwner);
    const ev = sim.drainEvents();
    expect(errorText(ev)).toContain('You do not have permission to visit this house.');
  });

  it('owner can always visit their own house', () => {
    const sim = new Sim({ seed: 42, playerClass: 'warrior', autoEquip: true, noPlayer: true });
    const pid = sim.addPlayer('warrior', 'Owner');
    const s = sim as any;

    const m = s.players.get(pid);
    m.construction.plotId = 'plot_own';
    m.construction.houseTier = 1;
    m.construction.permission = 'owner';

    visitHouseImpl(s.buildSimContext(), pid, pid);
    const ev = sim.drainEvents();
    expect(errorText(ev)).toEqual([]);
    expect(ev.some((e) => e.type === 'log' && 'text' in e && e.text === 'You visit the house.')).toBe(true);
  });
});

describe('setHousePermission (Phase 6)', () => {
  it('rejects without a house', () => {
    const sim = new Sim({ seed: 42, playerClass: 'warrior', autoEquip: true, noPlayer: true });
    const pid = sim.addPlayer('warrior', 'A');
    const s = sim as any;
    setPermImpl(s.buildSimContext(), pid, 'public');
    const ev = sim.drainEvents();
    expect(errorText(ev)).toContain('You do not own a house.');
  });

  it('sets the permission level', () => {
    const sim = new Sim({ seed: 42, playerClass: 'warrior', autoEquip: true, noPlayer: true });
    const pid = sim.addPlayer('warrior', 'A');
    const s = sim as any;
    const m = s.players.get(pid);
    m.construction.plotId = 'plot_test';
    m.construction.houseTier = 1;

    expect(m.construction.permission).toBe('owner');

    setPermImpl(s.buildSimContext(), pid, 'public');
    sim.drainEvents();
    expect(m.construction.permission).toBe('public');

    setPermImpl(s.buildSimContext(), pid, 'friends');
    sim.drainEvents();
    expect(m.construction.permission).toBe('friends');

    setPermImpl(s.buildSimContext(), pid, 'owner');
    sim.drainEvents();
    expect(m.construction.permission).toBe('owner');
  });

  it('defaults to owner', () => {
    const sim = new Sim({ seed: 42, playerClass: 'warrior', autoEquip: true, noPlayer: true });
    const pid = sim.addPlayer('warrior', 'A');
    const s = sim as any;
    const m = s.players.get(pid);
    expect(m.construction.permission).toBe('owner');
  });
});
